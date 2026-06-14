

from __future__ import annotations

import io
import json
import logging
import math
import os
import re
import sqlite3
import tempfile
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import httpx
from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

# ── Optional heavy deps ───────────────────────────────────────────────────────
try:
    import pdfplumber;      _PDF   = True
except ImportError:         _PDF   = False
try:
    import psycopg2, psycopg2.extras; _PG   = True
except ImportError:         _PG    = False
try:
    import pymysql, pymysql.cursors;  _MY   = True
except ImportError:         _MY    = False
try:
    import pymongo;         _MONGO = True
except ImportError:         _MONGO = False
try:
    from google.cloud import bigquery as _bq; _BQ = True
except ImportError:         _BQ    = False
try:
    from sklearn.metrics.pairwise import cosine_similarity; _SK = True
except ImportError:         _SK    = False

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s")
log = logging.getLogger("dataquery")
import os
from dotenv import load_dotenv
load_dotenv()  # take environment variables from .env file if present

# ── Config ────────────────────────────────────────────────────────────────────
OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL      = os.getenv("OPENAI_MODEL",   "gpt-4o-mini")
EMBED_MODEL       = os.getenv("EMBED_MODEL",    "text-embedding-3-small")
LLM_PROVIDER      = os.getenv("LLM_PROVIDER",  "openai")   # openai|anthropic|stub
ANTHROPIC_KEY     = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL   = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
QUERY_TIMEOUT     = int(os.getenv("QUERY_TIMEOUT", "30"))
CHUNK_SIZE        = int(os.getenv("CHUNK_SIZE",    "400"))   # words per chunk
CHUNK_OVERLAP     = int(os.getenv("CHUNK_OVERLAP", "80"))
TOP_K_CHUNKS      = int(os.getenv("TOP_K_CHUNKS",  "6"))
MAX_DF_ROWS_AI    = int(os.getenv("MAX_DF_ROWS_AI","200"))   # rows sent to LLM

# ═════════════════════════════════════════════════════════════════════════════
#  IN-MEMORY STORES
# ═════════════════════════════════════════════════════════════════════════════
SOURCES:  Dict[str, dict] = {}
HISTORY:  List[dict]      = []
MAX_HIST  = 200

# ═════════════════════════════════════════════════════════════════════════════
#  APP
# ═════════════════════════════════════════════════════════════════════════════
@asynccontextmanager
async def lifespan(app):
    log.info("DataQuery Universal AI Engine starting …")
    yield
    log.info("Shutting down …")

app = FastAPI(
    title="DataQuery Universal AI Engine",
    description="Ask questions in plain English. No SQL. No pipelines. Just answers.",
    version="3.0.0",
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ═════════════════════════════════════════════════════════════════════════════
#  PYDANTIC MODELS
# ═════════════════════════════════════════════════════════════════════════════

class AskRequest(BaseModel):
    """The one and only query endpoint — user sends a plain-English question."""
    source_id:  str
    question:   str
    limit:      int = 1000

class ConnectPostgres(BaseModel):
    name: str; host: str; port: int = 5432
    database: str; username: str; password: str; ssl: bool = False

class ConnectMySQL(BaseModel):
    name: str; host: str; port: int = 3306
    database: str; username: str; password: str

class ConnectMongo(BaseModel):
    name: str; uri: str; database: str; collection: Optional[str] = None

class ConnectAPI(BaseModel):
    name: str; url: str; method: str = "GET"
    headers: Dict[str, str] = {}; params: Dict[str, str] = {}

class ConnectBigQuery(BaseModel):
    name: str; project_id: str; dataset_id: str
    credentials: Optional[str] = None

class ExportRequest(BaseModel):
    rows: List[Dict[str, Any]]; columns: List[str]; filename: str = "export"

class HistoryEntry(BaseModel):
    source_id: str; question: str; answer: str
    rows_used: int = 0; execution_time: float = 0; success: bool = True
    error: Optional[str] = None

# ═════════════════════════════════════════════════════════════════════════════
#  LLM LAYER  —  provider-agnostic, swappable
# ═════════════════════════════════════════════════════════════════════════════

async def llm_chat(system: str, user: str, max_tokens: int = 1500) -> str:
    """Call the configured LLM and return the assistant reply."""
    if LLM_PROVIDER == "stub" or not OPENAI_API_KEY:
        return "I don't have an API key configured yet. Please set OPENAI_API_KEY."

    if LLM_PROVIDER == "anthropic":
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post("https://api.anthropic.com/v1/messages",
                headers={"x-api-key": ANTHROPIC_KEY,
                         "anthropic-version": "2023-06-01",
                         "content-type": "application/json"},
                json={"model": ANTHROPIC_MODEL, "max_tokens": max_tokens,
                      "system": system,
                      "messages": [{"role": "user", "content": user}]})
        r.raise_for_status()
        return r.json()["content"][0]["text"].strip()

    # default: OpenAI
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post("https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={"model": OPENAI_MODEL, "max_tokens": max_tokens,
                  "temperature": 0,
                  "messages": [{"role": "system", "content": system},
                                {"role": "user",   "content": user}]})
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()

async def llm_embed(texts: List[str]) -> List[List[float]]:
    """Get embeddings for a list of strings (OpenAI only; fallback = TF-IDF)."""
    if not OPENAI_API_KEY or LLM_PROVIDER != "openai":
        return _tfidf_embed(texts)
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post("https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={"model": EMBED_MODEL, "input": texts})
    r.raise_for_status()
    return [item["embedding"] for item in r.json()["data"]]

# ── TF-IDF fallback embedder (no external deps beyond numpy) ─────────────────
_TFIDF_VOCAB: Dict[str, int] = {}

def _tfidf_embed(texts: List[str]) -> List[List[float]]:
    """Deterministic TF-IDF vectors used when no OpenAI key is present."""
    global _TFIDF_VOCAB
    tokenised = [re.findall(r"[a-z0-9]+", t.lower()) for t in texts]
    all_words  = {w for toks in tokenised for w in toks}
    _TFIDF_VOCAB.update({w: i for i, w in enumerate(all_words) if w not in _TFIDF_VOCAB})
    V = len(_TFIDF_VOCAB)
    result = []
    for toks in tokenised:
        vec = np.zeros(V)
        for w in toks:
            if w in _TFIDF_VOCAB:
                vec[_TFIDF_VOCAB[w]] += 1
        norm = np.linalg.norm(vec)
        result.append((vec / norm if norm else vec).tolist())
    return result

def _cosine(a: List[float], b: List[float]) -> float:
    a, b = np.array(a), np.array(b)
    n = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / n) if n else 0.0

# ═════════════════════════════════════════════════════════════════════════════
#  RAG ENGINE  —  used for PDF (and any chunk-based source)
# ═════════════════════════════════════════════════════════════════════════════

def _chunk_text(text: str, size: int = CHUNK_SIZE,
                overlap: int = CHUNK_OVERLAP) -> List[str]:
    words  = text.split()
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i: i + size]))
        i += size - overlap
    return chunks

async def _build_vector_store(chunks: List[str]) -> Tuple[List[str], List[List[float]]]:
    embeddings = await llm_embed(chunks)
    return chunks, embeddings

async def _retrieve(question: str,
                    chunks: List[str],
                    embeddings: List[List[float]],
                    k: int = TOP_K_CHUNKS) -> List[str]:
    q_emb = (await llm_embed([question]))[0]
    scored = [(i, _cosine(q_emb, e)) for i, e in enumerate(embeddings)]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [chunks[i] for i, _ in scored[:k]]

async def answer_pdf(source: dict, question: str) -> dict:
    """RAG pipeline for PDF sources."""
    t0     = time.time()
    chunks = source.get("chunks", [])
    embeds = source.get("embeddings", [])

    if not chunks:
        # first call — build the store and cache it
        full_text = source.get("full_text", "")
        if not full_text:
            return _err("PDF has no extracted text.")
        chunks = _chunk_text(full_text)
        chunks, embeds = await _build_vector_store(chunks)
        source["chunks"]     = chunks
        source["embeddings"] = embeds
        log.info("Built vector store: %d chunks", len(chunks))

    top_chunks = await _retrieve(question, chunks, embeds)
    context    = "\n\n---\n\n".join(top_chunks)

    system = (
        "You are an expert document analyst. "
        "Answer the user's question using ONLY the document excerpts below. "
        "Be concise, accurate, and factual. "
        "If the answer is not in the excerpts, say 'Not found in document'.\n\n"
        f"DOCUMENT EXCERPTS:\n{context}"
    )
    answer = await llm_chat(system, question)
    return {
        "success":        True,
        "answer":         answer,
        "source_type":    "pdf",
        "rows_used":      len(top_chunks),
        "execution_time": round(time.time() - t0, 4),
        "metadata":       {"chunks_searched": len(chunks), "chunks_used": len(top_chunks)},
    }

# ═════════════════════════════════════════════════════════════════════════════
#  DATAFRAME AGENT  —  Excel / CSV / API / SQLite flat results
# ═════════════════════════════════════════════════════════════════════════════

def _df_summary(df: pd.DataFrame, max_rows: int = MAX_DF_ROWS_AI) -> str:
    """Compact text representation of a dataframe sent to the LLM."""
    schema = "\n".join(
        f"  {col} ({str(df[col].dtype)}) — sample: {df[col].dropna().iloc[0] if not df[col].dropna().empty else 'N/A'}"
        for col in df.columns
    )
    sample = df.head(max_rows).fillna("").to_csv(index=False)
    return (
        f"Shape: {df.shape[0]} rows × {df.shape[1]} columns\n"
        f"Columns:\n{schema}\n\n"
        f"Data (first {min(max_rows, len(df))} rows):\n{sample}"
    )

async def answer_dataframe(source: dict, question: str, source_type: str) -> dict:
    """LLM reasons directly over a pandas dataframe."""
    t0 = time.time()
    df = source.get("active")
    if df is None or df.empty:
        return _err("No data available in this source.")

    summary = _df_summary(df)
    system  = (
        f"You are a data analyst working with a {source_type.upper()} dataset. "
        "Answer the user's question directly and clearly based on the data provided. "
        "Perform any needed calculations mentally. "
        "Return a human-readable answer — numbers, lists, summaries — whatever fits best. "
        "Do NOT output code or SQL."
    )
    user   = f"DATA:\n{summary}\n\nQUESTION: {question}"
    answer = await llm_chat(system, user, max_tokens=2000)

    return {
        "success":        True,
        "answer":         answer,
        "source_type":    source_type,
        "rows_used":      len(df),
        "execution_time": round(time.time() - t0, 4),
        "metadata":       {"columns": df.columns.tolist(), "total_rows": len(df)},
    }

# ═════════════════════════════════════════════════════════════════════════════
#  DATABASE AGENT  —  PostgreSQL / MySQL / SQLite / BigQuery
#  The LLM generates SQL internally, we execute it, then LLM narrates result.
#  The user NEVER sees the SQL.
# ═════════════════════════════════════════════════════════════════════════════

_SQL_BANNED = re.compile(
    r"\b(drop|delete|truncate|insert|update|alter|create|replace|"
    r"exec|execute|xp_|sp_|attach|detach)\b", re.IGNORECASE)

def _guard_sql(sql: str):
    if _SQL_BANNED.search(sql):
        raise HTTPException(400, "Generated query contains disallowed operations.")
    if sql.count(";") > 1:
        raise HTTPException(400, "Multiple statements not allowed.")

async def _generate_internal_sql(schema_text: str, question: str,
                                  dialect: str) -> str:
    """Ask LLM to produce SQL. This SQL is NEVER returned to the frontend."""
    system = (
        f"You are an expert {dialect} SQL generator. "
        "Given the database schema below, write a single valid SELECT statement "
        "that answers the user's question. "
        "Output ONLY the SQL — no markdown, no explanation, no trailing semicolon.\n\n"
        f"SCHEMA:\n{schema_text}"
    )
    sql = await llm_chat(system, question, max_tokens=512)
    sql = re.sub(r"```sql|```", "", sql, flags=re.IGNORECASE).strip().rstrip(";")
    return sql

async def _narrate_result(question: str, df: pd.DataFrame,
                           source_type: str) -> str:
    """Ask LLM to produce a human answer from the raw query result."""
    if df.empty:
        return "No matching records found."
    sample = df.head(50).fillna("").to_csv(index=False)
    system = (
        "You are a helpful data analyst. "
        "Given the question and the query result below, "
        "write a clear, concise, human-readable answer. "
        "Include relevant numbers and key insights. "
        "Do NOT mention SQL, databases, or technical details."
    )
    user = f"QUESTION: {question}\n\nQUERY RESULT ({len(df)} rows):\n{sample}"
    return await llm_chat(system, user, max_tokens=800)

def _schema_to_text(schema: Dict[str, List[dict]]) -> str:
    lines = []
    for table, cols in schema.items():
        lines.append(f"Table: {table}")
        for c in cols:
            lines.append(f"  {c.get('column','?')} ({c.get('dtype','?')})")
    return "\n".join(lines)

async def answer_postgres(source: dict, question: str) -> dict:
    if not _PG:
        return _err("psycopg2 not installed.")
    t0  = time.time()
    cfg = source["config"]; pwd = source["_password"]
    schema_text = _schema_to_text(source.get("schema", {}))
    sql = await _generate_internal_sql(schema_text, question, "PostgreSQL")
    _guard_sql(sql)
    try:
        conn = psycopg2.connect(
            host=cfg["host"], port=cfg["port"], dbname=cfg["database"],
            user=cfg["username"], password=pwd)
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(f"SET statement_timeout={QUERY_TIMEOUT*1000}")
            cur.execute(sql)
            rows = cur.fetchmany(1000)
        conn.close()
        df = pd.DataFrame(rows)
    except Exception as e:
        return _err(f"Database error: {e}")

    answer = await _narrate_result(question, df, "postgres")
    return _ok(answer, "postgres", df, time.time() - t0)

async def answer_mysql(source: dict, question: str) -> dict:
    if not _MY:
        return _err("pymysql not installed.")
    t0  = time.time()
    cfg = source["config"]; pwd = source["_password"]
    schema_text = _schema_to_text(source.get("schema", {}))
    sql = await _generate_internal_sql(schema_text, question, "MySQL")
    _guard_sql(sql)
    try:
        conn = pymysql.connect(
            host=cfg["host"], port=cfg["port"], db=cfg["database"],
            user=cfg["username"], password=pwd,
            charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor)
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchmany(1000)
        conn.close()
        df = pd.DataFrame(rows)
    except Exception as e:
        return _err(f"Database error: {e}")

    answer = await _narrate_result(question, df, "mysql")
    return _ok(answer, "mysql", df, time.time() - t0)

async def answer_sqlite(source: dict, question: str) -> dict:
    t0 = time.time()
    db_path     = source.get("db_path")
    schema_text = _schema_to_text(source.get("schema", {}))
    sql = await _generate_internal_sql(schema_text, question, "SQLite")
    _guard_sql(sql)
    try:
        con = sqlite3.connect(db_path)
        df  = pd.read_sql_query(sql, con)
        con.close()
    except Exception as e:
        return _err(f"SQLite error: {e}")

    answer = await _narrate_result(question, df, "sqlite")
    return _ok(answer, "sqlite", df, time.time() - t0)

async def answer_bigquery(source: dict, question: str) -> dict:
    if not _BQ:
        return _err("google-cloud-bigquery not installed.")
    t0  = time.time()
    cfg = source["config"]
    schema_text = _schema_to_text(source.get("schema", {}))
    sql = await _generate_internal_sql(schema_text, question, "BigQuery Standard SQL")
    _guard_sql(sql)
    try:
        creds_json = source.get("_credentials")
        if creds_json:
            from google.oauth2 import service_account
            info  = json.loads(creds_json)
            creds = service_account.Credentials.from_service_account_info(info)
            client = _bq.Client(project=cfg["project_id"], credentials=creds)
        else:
            client = _bq.Client(project=cfg["project_id"])
        df = client.query(sql).result(timeout=QUERY_TIMEOUT).to_dataframe()
    except Exception as e:
        return _err(f"BigQuery error: {e}")

    answer = await _narrate_result(question, df, "bigquery")
    return _ok(answer, "bigquery", df, time.time() - t0)

# ═════════════════════════════════════════════════════════════════════════════
#  MONGODB AGENT
# ═════════════════════════════════════════════════════════════════════════════

async def _generate_mongo_pipeline(schema_fields: List[str], question: str) -> list:
    """Ask LLM to produce a MongoDB aggregation pipeline (never shown to user)."""
    fields_text = ", ".join(schema_fields)
    system = (
        "You are a MongoDB expert. Given the collection fields below, "
        "produce a MongoDB aggregation pipeline as a JSON array that answers "
        "the user's question. Output ONLY the JSON array — no markdown, "
        "no explanation.\n\n"
        f"FIELDS: {fields_text}"
    )
    raw = await llm_chat(system, question, max_tokens=600)
    raw = re.sub(r"```json|```", "", raw, flags=re.IGNORECASE).strip()
    try:
        return json.loads(raw)
    except Exception:
        return [{"$limit": 20}]   # safe fallback

async def answer_mongodb(source: dict, question: str) -> dict:
    if not _MONGO:
        return _err("pymongo not installed.")
    t0  = time.time()
    cfg = source["config"]
    col_name    = cfg.get("collection", "")
    all_fields  = []
    for fields in source.get("schema", {}).values():
        all_fields.extend(fields if isinstance(fields[0], str) else [f["column"] for f in fields])

    pipeline = await _generate_mongo_pipeline(all_fields, question)
    try:
        client = pymongo.MongoClient(cfg["uri"])
        cursor = client[cfg["database"]][col_name].aggregate(pipeline)
        docs   = list(cursor)
        client.close()
        for d in docs:
            d.pop("_id", None)
        df = pd.DataFrame(docs) if docs else pd.DataFrame()
    except Exception as e:
        return _err(f"MongoDB error: {e}")

    answer = await _narrate_result(question, df, "mongodb")
    return _ok(answer, "mongodb", df, time.time() - t0)

# ═════════════════════════════════════════════════════════════════════════════
#  REST API AGENT
# ═════════════════════════════════════════════════════════════════════════════

async def answer_api(source: dict, question: str) -> dict:
    t0  = time.time()
    cfg = source["config"]
    try:
        async with httpx.AsyncClient(timeout=QUERY_TIMEOUT) as c:
            resp = await c.request(cfg.get("method","GET"), cfg["url"],
                                   headers=cfg.get("headers",{}),
                                   params=cfg.get("params",{}))
        resp.raise_for_status()
        raw = resp.json()
    except Exception as e:
        return _err(f"API fetch failed: {e}")

    df = _json_to_df(raw)
    source["active"] = df   # cache refreshed data
    return await answer_dataframe(source, question, "api")

# ═════════════════════════════════════════════════════════════════════════════
#  UNIVERSAL QUERY ROUTER  —  the single entry point
# ═════════════════════════════════════════════════════════════════════════════

async def answer_question(source_id: str, question: str, limit: int = 1000) -> dict:
    """
    Route the question to the correct AI strategy based on source type.
    Returns a unified response dict — caller never sees SQL / pipelines.
    """
    if source_id not in SOURCES:
        return _err("Source not found.")

    source = SOURCES[source_id]
    stype  = source["type"]
    log.info("Routing question to [%s] source: %s", stype, question[:80])

    if stype == "pdf":
        return await answer_pdf(source, question)
    elif stype in ("excel", "csv"):
        return await answer_dataframe(source, question, stype)
    elif stype == "postgres":
        return await answer_postgres(source, question)
    elif stype == "mysql":
        return await answer_mysql(source, question)
    elif stype == "sqlite":
        return await answer_sqlite(source, question)
    elif stype == "bigquery":
        return await answer_bigquery(source, question)
    elif stype == "mongodb":
        return await answer_mongodb(source, question)
    elif stype == "api":
        return await answer_api(source, question)
    else:
        return _err(f"Unsupported source type: {stype}")

# ─── Result helpers ───────────────────────────────────────────────────────────

def _ok(answer: str, stype: str, df: pd.DataFrame, elapsed: float,
        extra_meta: dict | None = None) -> dict:
    meta = {"total_rows": len(df), "columns": df.columns.tolist()}
    if extra_meta:
        meta.update(extra_meta)
    return {
        "success":        True,
        "answer":         answer,
        "source_type":    stype,
        "rows_used":      len(df),
        "execution_time": round(elapsed, 4),
        "metadata":       meta,
        # also expose rows/columns so the frontend table still works
        "columns":        df.columns.tolist(),
        "rows":           df.head(1000).fillna("").to_dict(orient="records"),
        "row_count":      len(df),
    }

def _err(msg: str) -> dict:
    return {"success": False, "answer": msg, "source_type": "unknown",
            "rows_used": 0, "execution_time": 0, "metadata": {},
            "columns": [], "rows": [], "row_count": 0}

# ═════════════════════════════════════════════════════════════════════════════
#  FILE PROCESSING
# ═════════════════════════════════════════════════════════════════════════════

def _pandas_dtype(dtype) -> str:
    n = str(dtype)
    if "int"      in n: return "integer"
    if "float"    in n: return "float"
    if "datetime" in n: return "datetime"
    if "bool"     in n: return "boolean"
    return "text"

def _df_schema(df: pd.DataFrame, table: str = "df") -> List[dict]:
    return [{"column": c, "dtype": _pandas_dtype(df[c].dtype),
             "nullable": bool(df[c].isnull().any())} for c in df.columns]

def _json_to_df(data: Any) -> pd.DataFrame:
    if isinstance(data, list):
        return pd.DataFrame([_flatten(r) for r in data])
    if isinstance(data, dict):
        for k in ("data","results","items","records","rows"):
            if isinstance(data.get(k), list):
                return _json_to_df(data[k])
        return pd.DataFrame([_flatten(data)])
    return pd.DataFrame()

def _flatten(obj: Any, prefix: str = "") -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            full = f"{prefix}.{k}" if prefix else k
            out.update(_flatten(v, full))
    elif isinstance(obj, list):
        out[prefix] = json.dumps(obj)
    else:
        out[prefix] = obj
    return out

# ── PDF ───────────────────────────────────────────────────────────────────────

def process_pdf(content: bytes, filename: str) -> dict:
    if not _PDF:
        raise HTTPException(500, "pdfplumber not installed: pip install pdfplumber")

    pages_text = []
    all_tables = []
    full_text_parts = []

    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ""
            pages_text.append({"page": i, "text": text})
            full_text_parts.append(f"[Page {i}]\n{text}")

            for tbl in (page.extract_tables() or []):
                if not tbl: continue
                headers = [str(h or f"col_{j}") for j, h in enumerate(tbl[0])]
                rows    = [dict(zip(headers, [str(c or "") for c in row]))
                           for row in tbl[1:]]
                all_tables.append({"page": i, "headers": headers, "rows": rows})

    full_text = "\n\n".join(full_text_parts)

    # Build a flat dataframe for any table-based preview
    if all_tables:
        df = pd.DataFrame(all_tables[0]["rows"])
    else:
        df = pd.DataFrame(pages_text)

    return {
        "full_text":  full_text,
        "pages":      pages_text,
        "tables":     all_tables,
        "active":     df,
        "schema":     {"pdf": _df_schema(df, "pdf")},
        "chunks":     [],       # will be built lazily on first question
        "embeddings": [],
        "filename":   filename,
    }

# ── Excel / CSV ───────────────────────────────────────────────────────────────

def process_excel(content: bytes, filename: str) -> dict:
    xls    = pd.read_excel(io.BytesIO(content), sheet_name=None)
    frames, schema = {}, {}
    for name, df in xls.items():
        df = df.copy(); df["_sheet"] = name
        frames[name] = df
        schema[name] = _df_schema(df, name)
    combined = pd.concat(list(frames.values()), ignore_index=True, sort=False)
    return {"frames": frames, "active": combined, "schema": schema,
            "sheets": list(xls.keys()), "filename": filename}

def process_csv(content: bytes, filename: str) -> dict:
    df = pd.read_csv(io.BytesIO(content))
    df["_sheet"] = "Sheet1"
    return {"frames": {"Sheet1": df}, "active": df,
            "schema": {"Sheet1": _df_schema(df, "Sheet1")},
            "sheets": ["Sheet1"], "filename": filename}

# ── SQLite ────────────────────────────────────────────────────────────────────

def process_sqlite(content: bytes, filename: str) -> dict:
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.write(content); tmp.close()
    con    = sqlite3.connect(tmp.name)
    tables = [r[0] for r in con.execute(
        "SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    frames, schema = {}, {}
    for tbl in tables:
        df = pd.read_sql_query(f'SELECT * FROM "{tbl}"', con)
        frames[tbl] = df; schema[tbl] = _df_schema(df, tbl)
    con.close()
    combined = pd.concat(list(frames.values()), ignore_index=True, sort=False) if frames else pd.DataFrame()
    return {"frames": frames, "active": combined, "schema": schema,
            "tables": tables, "db_path": tmp.name, "filename": filename}

# ═════════════════════════════════════════════════════════════════════════════
#  DB SCHEMA HELPERS
# ═════════════════════════════════════════════════════════════════════════════

def _pg_schema(conn) -> Dict[str, List[dict]]:
    tables = [r[0] for r in conn.cursor().execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    ).fetchall()] if False else []   # psycopg2 uses different cursor
    with conn.cursor() as cur:
        cur.execute("SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema='public' ORDER BY table_name")
        tables = [r[0] for r in cur.fetchall()]
    schema = {}
    for tbl in tables:
        with conn.cursor() as cur:
            cur.execute("SELECT column_name, data_type FROM information_schema.columns "
                        "WHERE table_name=%s ORDER BY ordinal_position", (tbl,))
            schema[tbl] = [{"column": r[0], "dtype": r[1]} for r in cur.fetchall()]
    return schema

def _my_schema(conn) -> Dict[str, List[dict]]:
    with conn.cursor() as cur:
        cur.execute("SHOW TABLES")
        tables = [list(r.values())[0] for r in cur.fetchall()]
    schema = {}
    for tbl in tables:
        with conn.cursor() as cur:
            cur.execute(f"DESCRIBE `{tbl}`")
            schema[tbl] = [{"column": r["Field"], "dtype": r["Type"]}
                           for r in cur.fetchall()]
    return schema

# ═════════════════════════════════════════════════════════════════════════════
#  EXPORT
# ═════════════════════════════════════════════════════════════════════════════

def _rows_to_df(rows, cols): return pd.DataFrame(rows, columns=cols) if rows else pd.DataFrame(columns=cols)

def _make_xlsx(df):
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w: df.to_excel(w, index=False)
    return buf.getvalue()

def _make_csv(df):  return df.to_csv(index=False).encode("utf-8")
def _make_json(df): return json.dumps(df.to_dict(orient="records"), default=str, indent=2).encode()

def _make_pdf_file(df):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                            leftMargin=18, rightMargin=18, topMargin=18, bottomMargin=18)
    data = [df.columns.tolist()] + [[str(v or "") for v in row] for _, row in df.iterrows()]
    pw   = landscape(A4)[0] - 36
    cw   = [pw / max(1, len(df.columns))] * max(1, len(df.columns))
    tbl  = Table(data, colWidths=cw, repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0,0),(-1,0),colors.HexColor("#f1f5f9")),
        ("FONTNAME",  (0,0),(-1,0),"Helvetica-Bold"),
        ("FONTSIZE",  (0,0),(-1,-1),8),
        ("GRID",      (0,0),(-1,-1),.25,colors.HexColor("#334155")),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.HexColor("#0f172a"),colors.HexColor("#1e293b")]),
        ("TEXTCOLOR", (0,1),(-1,-1),colors.HexColor("#cbd5e1")),
    ]))
    doc.build([tbl]); return buf.getvalue()

def _stream(data, mime, fname):
    return StreamingResponse(io.BytesIO(data), media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{fname}"'})

# ═════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═════════════════════════════════════════════════════════════════════════════

def _now(): return datetime.utcnow().isoformat() + "Z"
def _sid(): return str(uuid.uuid4())

def _safe_src(sid):
    if sid not in SOURCES:
        raise HTTPException(404, f"Source '{sid}' not found.")
    return SOURCES[sid]

def _push_hist(entry):
    HISTORY.insert(0, entry)
    if len(HISTORY) > MAX_HIST: HISTORY.pop()

# ═════════════════════════════════════════════════════════════════════════════
#  ── ROUTES ──
# ═════════════════════════════════════════════════════════════════════════════

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health():
    return {
        "status": "healthy",
        "engine": "Universal AI Query Engine v3",
        "llm_provider":      LLM_PROVIDER,
        "openai_configured": bool(OPENAI_API_KEY),
        "active_sources":    len(SOURCES),
        "optional_deps":     {"pdfplumber":_PDF,"psycopg2":_PG,
                               "pymysql":_MY,"pymongo":_MONGO,"bigquery":_BQ},
    }

# ── THE MAIN QUERY ENDPOINT ───────────────────────────────────────────────────

@app.post("/query/ask", tags=["Query"])
async def ask(req: AskRequest):
    """
    Universal natural-language query endpoint.
    Internally routes to the right AI strategy (RAG / DF agent / DB agent / etc.).
    The user only ever sees a plain-English answer + optional data rows.
    """
    result = await answer_question(req.source_id, req.question.strip(), req.limit)
    _push_hist({
        "id":             _sid(),
        "source_id":      req.source_id,
        "source_name":    SOURCES.get(req.source_id, {}).get("name", ""),
        "question":       req.question,
        "answer":         result.get("answer", ""),
        "source_type":    result.get("source_type", ""),
        "rows_used":      result.get("rows_used", 0),
        "execution_time": result.get("execution_time", 0),
        "success":        result.get("success", False),
        "timestamp":      _now(),
    })
    return result

# Keep backward-compat alias — old frontend posts to /query/run
@app.post("/query/run", tags=["Query"])
async def query_run_compat(req: AskRequest):
    """Backward-compatible alias for /query/ask."""
    return await ask(req)

# ── AI generate (preview only — does NOT execute) ─────────────────────────────

@app.post("/ai/generate-query", tags=["AI"])
async def ai_generate(body: dict):
    """
    Preview what the AI would do — returns the reasoning plan (not raw SQL).
    For transparency / debug only. The answer is not executed here.
    """
    source_id = body.get("source_id","")
    prompt    = body.get("prompt","")
    if source_id not in SOURCES:
        raise HTTPException(404, "Source not found.")
    stype = SOURCES[source_id]["type"]
    plan  = {
        "pdf":      "Will use RAG: extract relevant chunks → LLM answers from context",
        "excel":    "Will analyse the dataframe: send schema + sample rows to LLM",
        "csv":      "Will analyse the dataframe: send schema + sample rows to LLM",
        "postgres": "Will query database internally: schema → SQL → execute → narrate",
        "mysql":    "Will query database internally: schema → SQL → execute → narrate",
        "sqlite":   "Will query database internally: schema → SQL → execute → narrate",
        "bigquery": "Will query BigQuery internally: schema → SQL → execute → narrate",
        "mongodb":  "Will use aggregation pipeline internally → narrate result",
        "api":      "Will fetch API → convert to dataframe → LLM answers",
    }.get(stype, "Will use universal AI reasoning")
    return {"generated_query": f"[{stype.upper()} ENGINE] {plan}", "strategy": plan}

# ── Sources — file uploads ─────────────────────────────────────────────────────

@app.post("/sources/excel/upload", tags=["Sources"])
async def upload_excel(name: str = Form(...), file: UploadFile = File(...)):
    fn = file.filename or ""
    if not fn.lower().endswith((".xls",".xlsx",".csv")):
        raise HTTPException(400, "Only .xls, .xlsx, .csv accepted.")
    content = await file.read()
    data    = process_csv(content, fn) if fn.endswith(".csv") else process_excel(content, fn)
    sid     = _sid()
    SOURCES[sid] = {"id":sid,"name":name or fn,"type":"excel" if not fn.endswith(".csv") else "csv",
                    "created_at":_now(),"status":"connected",**data}
    return {"source_id":sid,"name":SOURCES[sid]["name"],"type":SOURCES[sid]["type"],
            "rows":len(SOURCES[sid]["active"]),"columns":SOURCES[sid]["active"].columns.tolist(),
            "sheets":SOURCES[sid].get("sheets",[]),"schema":SOURCES[sid]["schema"]}

@app.post("/sources/pdf/upload", tags=["Sources"])
async def upload_pdf(name: str = Form(...), file: UploadFile = File(...)):
    fn = file.filename or ""
    if not fn.lower().endswith(".pdf"):
        raise HTTPException(400, "Only .pdf accepted.")
    content = await file.read()
    data    = process_pdf(content, fn)
    sid     = _sid()
    SOURCES[sid] = {"id":sid,"name":name or fn,"type":"pdf",
                    "created_at":_now(),"status":"connected",**data}
    log.info("PDF loaded: %d pages, full_text=%d chars",
             len(data["pages"]), len(data["full_text"]))
    return {"source_id":sid,"name":SOURCES[sid]["name"],"type":"pdf",
            "page_count":len(data["pages"]),"table_count":len(data["tables"]),
            "char_count":len(data["full_text"]),"schema":data["schema"]}

@app.post("/sources/sqlite/upload", tags=["Sources"])
async def upload_sqlite(name: str = Form(...), file: UploadFile = File(...)):
    fn = file.filename or ""
    if not fn.lower().endswith((".db",".sqlite",".sqlite3")):
        raise HTTPException(400, "Only .db/.sqlite/.sqlite3 accepted.")
    content = await file.read()
    data    = process_sqlite(content, fn)
    sid     = _sid()
    SOURCES[sid] = {"id":sid,"name":name or fn,"type":"sqlite",
                    "created_at":_now(),"status":"connected",**data}
    return {"source_id":sid,"name":SOURCES[sid]["name"],"type":"sqlite",
            "tables":data["tables"],"schema":data["schema"]}

# ── Sources — DB connections ──────────────────────────────────────────────────

@app.post("/sources/postgres/connect", tags=["Sources"])
async def connect_postgres(cfg: ConnectPostgres):
    if not _PG: raise HTTPException(500,"psycopg2 not installed.")
    try:
        conn   = psycopg2.connect(host=cfg.host,port=cfg.port,dbname=cfg.database,
                                   user=cfg.username,password=cfg.password,connect_timeout=10)
        schema = _pg_schema(conn); conn.close()
    except Exception as e:
        raise HTTPException(400, f"PostgreSQL error: {e}")
    sid = _sid()
    SOURCES[sid] = {"id":sid,"name":cfg.name,"type":"postgres",
                    "config":cfg.dict(exclude={"password"}),"_password":cfg.password,
                    "schema":schema,"created_at":_now(),"status":"connected"}
    return {"source_id":sid,"name":cfg.name,"type":"postgres",
            "tables":list(schema),"schema":schema}

@app.post("/sources/mysql/connect", tags=["Sources"])
async def connect_mysql(cfg: ConnectMySQL):
    if not _MY: raise HTTPException(500,"pymysql not installed.")
    try:
        conn   = pymysql.connect(host=cfg.host,port=cfg.port,db=cfg.database,
                                  user=cfg.username,password=cfg.password,
                                  charset="utf8mb4",cursorclass=pymysql.cursors.DictCursor,
                                  connect_timeout=10)
        schema = _my_schema(conn); conn.close()
    except Exception as e:
        raise HTTPException(400, f"MySQL error: {e}")
    sid = _sid()
    SOURCES[sid] = {"id":sid,"name":cfg.name,"type":"mysql",
                    "config":cfg.dict(exclude={"password"}),"_password":cfg.password,
                    "schema":schema,"created_at":_now(),"status":"connected"}
    return {"source_id":sid,"name":cfg.name,"type":"mysql",
            "tables":list(schema),"schema":schema}

@app.post("/sources/mongodb/connect", tags=["Sources"])
async def connect_mongodb(cfg: ConnectMongo):
    if not _MONGO: raise HTTPException(500,"pymongo not installed.")
    try:
        client = pymongo.MongoClient(cfg.uri, serverSelectionTimeoutMS=10_000)
        client.admin.command("ping")
        cols   = client[cfg.database].list_collection_names()
        schema = {}
        for col in cols:
            sample = client[cfg.database][col].find_one()
            if sample:
                sample.pop("_id",None)
                schema[col] = list(_flatten(sample).keys())
            else:
                schema[col] = []
        client.close()
    except Exception as e:
        raise HTTPException(400, f"MongoDB error: {e}")
    sid = _sid()
    SOURCES[sid] = {"id":sid,"name":cfg.name,"type":"mongodb",
                    "config":cfg.dict(),"schema":schema,
                    "created_at":_now(),"status":"connected"}
    return {"source_id":sid,"name":cfg.name,"type":"mongodb",
            "collections":cols,"schema":schema}

@app.post("/sources/api/connect", tags=["Sources"])
async def connect_api(cfg: ConnectAPI):
    try:
        async with httpx.AsyncClient(timeout=QUERY_TIMEOUT) as c:
            resp = await c.request(cfg.method,cfg.url,
                                   headers=cfg.headers,params=cfg.params)
        resp.raise_for_status()
        df = _json_to_df(resp.json())
    except Exception as e:
        raise HTTPException(400, f"API error: {e}")
    sid = _sid()
    SOURCES[sid] = {"id":sid,"name":cfg.name,"type":"api",
                    "config":cfg.dict(),"active":df,
                    "schema":{"api":_df_schema(df,"api")},
                    "created_at":_now(),"status":"connected"}
    return {"source_id":sid,"name":cfg.name,"type":"api",
            "columns":df.columns.tolist(),"row_count":len(df),
            "schema":SOURCES[sid]["schema"]}

@app.post("/sources/bigquery/connect", tags=["Sources"])
async def connect_bigquery(cfg: ConnectBigQuery):
    if not _BQ: raise HTTPException(500,"google-cloud-bigquery not installed.")
    sid = _sid()
    SOURCES[sid] = {"id":sid,"name":cfg.name,"type":"bigquery",
                    "config":cfg.dict(exclude={"credentials"}),
                    "_credentials":cfg.credentials,
                    "schema":{},"created_at":_now(),"status":"connected"}
    return {"source_id":sid,"name":cfg.name,"type":"bigquery",
            "project_id":cfg.project_id,"dataset_id":cfg.dataset_id}

# ── Source CRUD ───────────────────────────────────────────────────────────────

@app.get("/sources", tags=["Sources"])
def list_sources():
    return [{"id":s["id"],"name":s["name"],"type":s["type"],
             "status":s["status"],"created_at":s["created_at"]}
            for s in SOURCES.values()]

@app.get("/sources/{sid}", tags=["Sources"])
def get_source(sid: str):
    s = _safe_src(sid)
    return {"id":s["id"],"name":s["name"],"type":s["type"],"status":s["status"],
            "created_at":s["created_at"],"schema":s.get("schema",{}),
            "tables":s.get("tables") or s.get("sheets") or list(s.get("schema",{}))}

@app.delete("/sources/{sid}", tags=["Sources"])
def delete_source(sid: str):
    _safe_src(sid)
    del SOURCES[sid]
    return {"deleted": sid}

# ── Schema ────────────────────────────────────────────────────────────────────

@app.get("/schema/{sid}", tags=["Schema"])
def get_schema(sid: str):
    s = _safe_src(sid)
    return {"source_id":sid,"type":s["type"],"schema":s.get("schema",{})}

@app.get("/tables/{sid}", tags=["Schema"])
def get_tables(sid: str):
    s = _safe_src(sid)
    tables = s.get("tables") or s.get("collections") or s.get("sheets") or list(s.get("schema",{}))
    return {"source_id":sid,"type":s["type"],"tables":tables}

@app.get("/columns/{sid}/{table}", tags=["Schema"])
def get_columns(sid: str, table: str):
    s = _safe_src(sid)
    schema = s.get("schema",{})
    if table not in schema:
        raise HTTPException(404, f"Table '{table}' not found.")
    return {"source_id":sid,"table":table,"columns":schema[table]}

# ── History ───────────────────────────────────────────────────────────────────

@app.get("/history", tags=["History"])
def get_history(limit: int = Query(50, ge=1, le=200)):
    return {"history": HISTORY[:limit], "total": len(HISTORY)}

@app.delete("/history", tags=["History"])
def clear_history():
    global HISTORY; HISTORY = []
    return {"cleared": True}

# ── Export ────────────────────────────────────────────────────────────────────

@app.post("/export/csv",   tags=["Export"])
def export_csv(req: ExportRequest):
    return _stream(_make_csv(_rows_to_df(req.rows,req.columns)),
                   "text/csv", f"{req.filename}.csv")

@app.post("/export/excel", tags=["Export"])
def export_excel(req: ExportRequest):
    return _stream(_make_xlsx(_rows_to_df(req.rows,req.columns)),
                   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                   f"{req.filename}.xlsx")

@app.post("/export/json",  tags=["Export"])
def export_json(req: ExportRequest):
    return _stream(_make_json(_rows_to_df(req.rows,req.columns)),
                   "application/json", f"{req.filename}.json")

@app.post("/export/pdf",   tags=["Export"])
def export_pdf_file(req: ExportRequest):
    return _stream(_make_pdf_file(_rows_to_df(req.rows,req.columns)),
                   "application/pdf", f"{req.filename}.pdf")

# ── Catch-all error handler ───────────────────────────────────────────────────

@app.exception_handler(Exception)
async def _global_err(req: Request, exc: Exception):
    log.exception("Unhandled: %s %s", req.method, req.url)
    return JSONResponse(500, {"detail": f"{type(exc).__name__}: {exc}"})

# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
