# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  DataQuery — Production FastAPI Backend                                      ║
# ║  Single-file · All sources · AI query generation · Export · History          ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
#  Run:  uvicorn app:app --host 0.0.0.0 --port 8000 --reload
#  Docs: http://localhost:8000/docs
# ──────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

import io
import json
import logging
import re
import sqlite3
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dotenv import load_dotenv

# ── FastAPI ───────────────────────────────────────────────────────────────────
from fastapi import (
    BackgroundTasks,
    FastAPI,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

# ── Pydantic ──────────────────────────────────────────────────────────────────
from pydantic import BaseModel, Field, validator

# ── Data / DB ─────────────────────────────────────────────────────────────────
import pandas as pd
import httpx

# Optional heavy deps — imported lazily so the app starts even if not installed
try:
    import pdfplumber
    _PDF_OK = True
except ImportError:
    _PDF_OK = False

try:
    import psycopg2
    import psycopg2.extras
    _PG_OK = True
except ImportError:
    _PG_OK = False

try:
    import pymysql
    import pymysql.cursors
    _MYSQL_OK = True
except ImportError:
    _MYSQL_OK = False

try:
    import pymongo
    from bson import ObjectId
    _MONGO_OK = True
except ImportError:
    _MONGO_OK = False

try:
    from google.cloud import bigquery as bq
    _BQ_OK = True
except ImportError:
    _BQ_OK = False

# ── Export ────────────────────────────────────────────────────────────────────
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
log = logging.getLogger("dataquery")

# ══════════════════════════════════════════════════════════════════════════════
#  GLOBAL IN-MEMORY STORES
# ══════════════════════════════════════════════════════════════════════════════

SOURCES:   Dict[str, dict] = {}   # source_id → source meta + data
HISTORY:   List[dict]      = []   # query history (newest first)
MAX_HIST   = 200                  # cap history to 200 entries
QUERY_TIMEOUT = 30                # seconds – SQL / HTTP timeout

# ══════════════════════════════════════════════════════════════════════════════
#  LIFESPAN
# ══════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("DataQuery API starting up …")
    yield
    log.info("DataQuery API shutting down …")

# ══════════════════════════════════════════════════════════════════════════════
#  APP
# ══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="DataQuery API",
    description=(
        "Universal AI-powered data query backend.\n\n"
        "Supports PostgreSQL, MySQL, MongoDB, SQLite, BigQuery, "
        "Excel/CSV, PDF, and REST APIs."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # ← restrict to your frontend URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ══════════════════════════════════════════════════════════════════════════════
#  PYDANTIC MODELS
# ══════════════════════════════════════════════════════════════════════════════

# ─── Source connection request models ────────────────────────────────────────

class PostgresConnect(BaseModel):
    name:     str
    host:     str
    port:     int   = 5432
    database: str
    username: str
    password: str
    ssl:      bool  = False

class MySQLConnect(BaseModel):
    name:     str
    host:     str
    port:     int   = 3306
    database: str
    username: str
    password: str

class MongoConnect(BaseModel):
    name:       str
    uri:        str = Field(..., example="mongodb://localhost:27017")
    database:   str
    collection: Optional[str] = None

class APIConnect(BaseModel):
    name:    str
    url:     str
    method:  str              = "GET"
    headers: Dict[str, str]   = {}
    params:  Dict[str, str]   = {}
    body:    Optional[str]    = None

class BigQueryConnect(BaseModel):
    name:        str
    project_id:  str
    dataset_id:  str
    credentials: Optional[str] = None   # JSON string of service-account key

# ─── Query models ─────────────────────────────────────────────────────────────

class RunQueryRequest(BaseModel):
    source_id:  str
    query:      str
    query_type: str = "natural_language"   # sql | mongodb | api | natural_language
    limit:      int = 1000

class AIGenerateRequest(BaseModel):
    source_id: str
    prompt:    str

# ─── History model ────────────────────────────────────────────────────────────

class HistoryEntry(BaseModel):
    source_id:      str
    query:          str
    query_type:     str
    rows_returned:  int
    execution_time: float
    success:        bool
    error:          Optional[str] = None

# ─── Export model ─────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    rows:    List[Dict[str, Any]]
    columns: List[str]
    filename: Optional[str] = "export"

# ══════════════════════════════════════════════════════════════════════════════
#  HELPER UTILITIES
# ══════════════════════════════════════════════════════════════════════════════

def new_id() -> str:
    return str(uuid.uuid4())

def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"

def pandas_dtype_label(dtype) -> str:
    n = str(dtype)
    if "int"      in n: return "integer"
    if "float"    in n: return "float"
    if "datetime" in n: return "datetime"
    if "bool"     in n: return "boolean"
    return "text"

def safe_source(source_id: str) -> dict:
    if source_id not in SOURCES:
        raise HTTPException(404, f"Source '{source_id}' not found.")
    return SOURCES[source_id]

def push_history(entry: dict):
    HISTORY.insert(0, entry)
    if len(HISTORY) > MAX_HIST:
        HISTORY.pop()

def df_to_response(df: pd.DataFrame, t0: float) -> dict:
    df = df.fillna("")
    return {
        "success":        True,
        "columns":        df.columns.tolist(),
        "rows":           df.to_dict(orient="records"),
        "row_count":      len(df),
        "execution_time": round(time.time() - t0, 4),
    }

# ── SQL injection guard ───────────────────────────────────────────────────────
_BANNED_SQL = re.compile(
    r"\b(drop|delete|truncate|insert|update|alter|create|replace|"
    r"exec|execute|xp_|sp_|attach|detach|pragma\s+(?!table_info|foreign_key))\b",
    re.IGNORECASE,
)

def assert_safe_sql(sql: str):
    if _BANNED_SQL.search(sql):
        raise HTTPException(400, "Query contains disallowed SQL keywords.")
    if ";" in sql:
        raise HTTPException(400, "Multiple statements (;) are not allowed.")

# ─── flatten nested JSON to dataframe rows ───────────────────────────────────
def flatten_json(obj: Any, prefix: str = "") -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            full = f"{prefix}.{k}" if prefix else k
            out.update(flatten_json(v, full))
    elif isinstance(obj, list):
        out[prefix] = json.dumps(obj)
    else:
        out[prefix] = obj
    return out

def json_to_df(data: Any) -> pd.DataFrame:
    if isinstance(data, list):
        rows = [flatten_json(r) for r in data]
        return pd.DataFrame(rows)
    if isinstance(data, dict):
        # try common envelope keys
        for key in ("data", "results", "items", "records", "rows"):
            if isinstance(data.get(key), list):
                return json_to_df(data[key])
        return pd.DataFrame([flatten_json(data)])
    return pd.DataFrame()

# ── describe a dataframe schema ───────────────────────────────────────────────
def df_schema(df: pd.DataFrame, table_name: str = "df") -> List[dict]:
    return [
        {
            "table":    table_name,
            "column":   col,
            "dtype":    pandas_dtype_label(df[col].dtype),
            "nullable": bool(df[col].isnull().any()),
            "sample":   str(df[col].dropna().iloc[0]) if not df[col].dropna().empty else None,
        }
        for col in df.columns
    ]

# ══════════════════════════════════════════════════════════════════════════════
#  AI / LLM ABSTRACTION LAYER
#
#  Drop-in any LLM: set OPENAI_API_KEY for OpenAI, or swap call_llm()
#  with your provider.  The rest of the code stays the same.
# ══════════════════════════════════════════════════════════════════════════════

import os
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL   = os.getenv("OPENAI_MODEL",   "gpt-4o-mini")
LLM_PROVIDER   = os.getenv("LLM_PROVIDER",   "openai")   # openai | anthropic | stub

def _schema_text(source: dict) -> str:
    """Convert source schema to a compact text description for the prompt."""
    src_type = source["type"]
    lines    = [f"Source type: {src_type}"]

    if src_type in ("excel", "csv", "sqlite", "pdf"):
        for tbl, cols in source.get("schema", {}).items():
            lines.append(f"\nTable: {tbl}")
            for c in cols:
                lines.append(f"  - {c['column']} ({c['dtype']})")

    elif src_type in ("postgres", "mysql"):
        for tbl, cols in source.get("schema", {}).items():
            lines.append(f"\nTable: {tbl}")
            for c in cols:
                lines.append(f"  - {c['column']} {c['dtype']}")

    elif src_type == "mongodb":
        for col_name, fields in source.get("schema", {}).items():
            lines.append(f"\nCollection: {col_name}")
            for f in fields:
                lines.append(f"  - {f}")

    elif src_type == "api":
        for col in source.get("columns", []):
            lines.append(f"  - {col}")

    return "\n".join(lines)

def _build_system_prompt(source: dict) -> str:
    src_type  = source["type"]
    schema_tx = _schema_text(source)

    if src_type in ("postgres", "mysql", "sqlite"):
        dialect = {"postgres": "PostgreSQL", "mysql": "MySQL", "sqlite": "SQLite"}[src_type]
        return (
            f"You are a {dialect} SQL expert. "
            "Convert the user's natural-language request into a single valid SELECT statement. "
            "Output ONLY the SQL — no markdown, no explanation, no semicolons.\n\n"
            f"Schema:\n{schema_tx}"
        )
    if src_type in ("excel", "csv"):
        return (
            "You convert natural language to SQL for pandasql (SQLite dialect). "
            "The table name is always `df`. "
            "Output ONLY the SQL SELECT — no markdown, no explanation, no semicolons.\n\n"
            f"Schema:\n{schema_tx}"
        )
    if src_type == "mongodb":
        return (
            "You convert natural language to a MongoDB query in JSON format. "
            "Output ONLY valid JSON with keys 'filter' and optionally 'projection', "
            "'sort', 'limit'. No explanation.\n\n"
            f"Schema:\n{schema_tx}"
        )
    if src_type == "bigquery":
        return (
            "You are a BigQuery (Standard SQL) expert. "
            "Convert the user request to a valid SELECT. "
            "Output ONLY the SQL.\n\n"
            f"Schema:\n{schema_tx}"
        )
    # api / pdf / generic
    return (
        "Convert the user's request into a filter description or SQL for pandasql. "
        "Table name is `df`. Output ONLY the query.\n\n"
        f"Schema:\n{schema_tx}"
    )

async def call_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Pluggable LLM call.  Currently supports:
      - openai   (set OPENAI_API_KEY)
      - anthropic (set ANTHROPIC_API_KEY)
      - stub      (returns a canned response for local testing)
    """
    if LLM_PROVIDER == "stub" or not OPENAI_API_KEY:
        log.warning("LLM_PROVIDER=stub — returning placeholder query.")
        return "SELECT * FROM df LIMIT 10"

    if LLM_PROVIDER == "anthropic":
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": anthropic_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307"),
                    "max_tokens": 512,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
            )
        resp.raise_for_status()
        return resp.json()["content"][0]["text"].strip()

    # default: openai
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": OPENAI_MODEL,
                "temperature": 0,
                "max_tokens": 512,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
            },
        )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()

def extract_sql_from_llm(text: str) -> str:
    """Strip markdown fences and normalise the SQL returned by the LLM."""
    text = re.sub(r"```(?:sql|SQL)?\n?", "", text).replace("```", "").strip()
    m = re.search(r"(?si)\bselect\b", text)
    if m:
        candidate = text[m.start():]
        candidate = re.split(r"\n\s*\n", candidate)[0].strip().rstrip(";")
        return candidate
    return text.rstrip(";")

async def generate_query_from_nl(source: dict, prompt: str) -> str:
    """
    Main AI entrypoint.  Builds a dynamic prompt from the source schema,
    calls the configured LLM, and returns the generated query string.
    """
    system  = _build_system_prompt(source)
    raw     = await call_llm(system, prompt)
    src_type = source["type"]
    if src_type in ("postgres", "mysql", "sqlite", "excel", "csv", "bigquery"):
        return extract_sql_from_llm(raw)
    return raw   # mongodb JSON / generic — return as-is

# ══════════════════════════════════════════════════════════════════════════════
#  FILE PROCESSING
# ══════════════════════════════════════════════════════════════════════════════

# ── Excel ─────────────────────────────────────────────────────────────────────
def process_excel(content: bytes, filename: str) -> dict:
    xls    = pd.read_excel(io.BytesIO(content), sheet_name=None)
    frames = {}
    schema = {}
    for sheet, df in xls.items():
        df           = df.copy()
        df["_sheet"] = sheet
        frames[sheet] = df
        schema[sheet] = df_schema(df, sheet)
    all_df = pd.concat(list(frames.values()), ignore_index=True, sort=False)
    return {
        "frames":   frames,
        "active":   all_df,
        "schema":   schema,
        "sheets":   list(xls.keys()),
        "filename": filename,
    }

# ── CSV ───────────────────────────────────────────────────────────────────────
def process_csv(content: bytes, filename: str) -> dict:
    df             = pd.read_csv(io.BytesIO(content))
    df["_sheet"]   = "Sheet1"
    return {
        "frames":   {"Sheet1": df},
        "active":   df,
        "schema":   {"Sheet1": df_schema(df, "Sheet1")},
        "sheets":   ["Sheet1"],
        "filename": filename,
    }

# ── SQLite ────────────────────────────────────────────────────────────────────
def process_sqlite(content: bytes, filename: str) -> dict:
    # write to a tmp in-memory bytes so sqlite3 can open it
    tmp_path = f"/tmp/dq_{uuid.uuid4().hex}.db"
    with open(tmp_path, "wb") as f:
        f.write(content)
    con    = sqlite3.connect(tmp_path)
    tables = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    frames = {}
    schema = {}
    for tbl in tables:
        df           = pd.read_sql_query(f"SELECT * FROM \"{tbl}\"", con)
        frames[tbl]  = df
        schema[tbl]  = df_schema(df, tbl)
    con.close()
    return {
        "frames":   frames,
        "active":   frames[tables[0]] if tables else pd.DataFrame(),
        "schema":   schema,
        "tables":   tables,
        "db_path":  tmp_path,
        "filename": filename,
    }

# ── PDF ───────────────────────────────────────────────────────────────────────
def process_pdf(content: bytes, filename: str) -> dict:
    if not _PDF_OK:
        raise HTTPException(500, "pdfplumber not installed. Run: pip install pdfplumber")

    pages_text  = []
    all_tables  = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            pages_text.append({"page": i, "text": page.extract_text() or ""})
            for tbl in (page.extract_tables() or []):
                if not tbl: continue
                headers = [str(h or f"col_{j}") for j, h in enumerate(tbl[0])]
                rows    = [dict(zip(headers, [str(c or "") for c in row])) for row in tbl[1:]]
                all_tables.append({"page": i, "headers": headers, "rows": rows})

    # build a combined dataframe for querying
    if all_tables:
        df = pd.DataFrame(all_tables[0]["rows"])
    else:
        df = pd.DataFrame(pages_text)

    return {
        "pages":    pages_text,
        "tables":   all_tables,
        "active":   df,
        "schema":   {"pdf": df_schema(df, "pdf")},
        "filename": filename,
    }

# ══════════════════════════════════════════════════════════════════════════════
#  DATABASE CONNECTORS
# ══════════════════════════════════════════════════════════════════════════════

# ── PostgreSQL ────────────────────────────────────────────────────────────────
def pg_connect(cfg: PostgresConnect):
    if not _PG_OK:
        raise HTTPException(500, "psycopg2 not installed.")
    conn = psycopg2.connect(
        host=cfg.host, port=cfg.port, dbname=cfg.database,
        user=cfg.username, password=cfg.password,
        connect_timeout=10,
        sslmode="require" if cfg.ssl else "prefer",
    )
    return conn

def pg_list_tables(conn) -> List[str]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' ORDER BY table_name"
        )
        return [r[0] for r in cur.fetchall()]

def pg_table_schema(conn, table: str) -> List[dict]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT column_name, data_type FROM information_schema.columns "
            "WHERE table_name = %s ORDER BY ordinal_position",
            (table,),
        )
        return [{"column": r[0], "dtype": r[1]} for r in cur.fetchall()]

def pg_run_sql(conn, sql: str, limit: int = 1000) -> pd.DataFrame:
    assert_safe_sql(sql)
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SET statement_timeout = {QUERY_TIMEOUT * 1000}")
        cur.execute(sql)
        rows = cur.fetchmany(limit)
    return pd.DataFrame(rows)

# ── MySQL ─────────────────────────────────────────────────────────────────────
def my_connect(cfg: MySQLConnect):
    if not _MYSQL_OK:
        raise HTTPException(500, "pymysql not installed.")
    conn = pymysql.connect(
        host=cfg.host, port=cfg.port, db=cfg.database,
        user=cfg.username, password=cfg.password,
        charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=10,
    )
    return conn

def my_list_tables(conn) -> List[str]:
    with conn.cursor() as cur:
        cur.execute("SHOW TABLES")
        return [list(r.values())[0] for r in cur.fetchall()]

def my_table_schema(conn, table: str) -> List[dict]:
    with conn.cursor() as cur:
        cur.execute(f"DESCRIBE `{table}`")
        return [{"column": r["Field"], "dtype": r["Type"]} for r in cur.fetchall()]

def my_run_sql(conn, sql: str, limit: int = 1000) -> pd.DataFrame:
    assert_safe_sql(sql)
    with conn.cursor() as cur:
        cur.execute(f"SET SESSION MAX_EXECUTION_TIME={QUERY_TIMEOUT * 1000}")
        cur.execute(sql)
        rows = cur.fetchmany(limit)
    return pd.DataFrame(rows)

# ── MongoDB ───────────────────────────────────────────────────────────────────
def mongo_connect(cfg: MongoConnect):
    if not _MONGO_OK:
        raise HTTPException(500, "pymongo not installed.")
    client = pymongo.MongoClient(cfg.uri, serverSelectionTimeoutMS=10_000)
    client.admin.command("ping")
    return client

def mongo_list_collections(client, database: str) -> List[str]:
    return client[database].list_collection_names()

def mongo_collection_sample_schema(client, database: str, collection: str) -> List[str]:
    sample = client[database][collection].find_one()
    if not sample:
        return []
    sample.pop("_id", None)
    return list(flatten_json(sample).keys())

def mongo_run_query(client, database: str, collection: str, query_json: str, limit: int = 1000) -> pd.DataFrame:
    try:
        q = json.loads(query_json)
    except json.JSONDecodeError:
        q = {}
    filt       = q.get("filter", q) if isinstance(q, dict) else {}
    projection = q.get("projection", None)
    sort       = q.get("sort", None)
    limit_val  = min(q.get("limit", limit), limit)
    cursor     = client[database][collection].find(filt, projection)
    if sort:
        cursor = cursor.sort(list(sort.items()))
    docs = list(cursor.limit(limit_val))
    for d in docs:
        d.pop("_id", None)
    return pd.DataFrame([flatten_json(d) for d in docs])

# ── BigQuery ──────────────────────────────────────────────────────────────────
def bq_run_sql(project_id: str, sql: str, credentials_json: Optional[str] = None) -> pd.DataFrame:
    if not _BQ_OK:
        raise HTTPException(500, "google-cloud-bigquery not installed.")
    assert_safe_sql(sql)
    if credentials_json:
        import json as _json
        from google.oauth2 import service_account
        info   = _json.loads(credentials_json)
        creds  = service_account.Credentials.from_service_account_info(info)
        client = bq.Client(project=project_id, credentials=creds)
    else:
        client = bq.Client(project=project_id)
    job    = client.query(sql)
    result = job.result(timeout=QUERY_TIMEOUT)
    return result.to_dataframe()

# ── REST API ──────────────────────────────────────────────────────────────────
async def api_fetch(cfg_dict: dict) -> pd.DataFrame:
    url     = cfg_dict["url"]
    method  = cfg_dict.get("method", "GET").upper()
    headers = cfg_dict.get("headers", {})
    params  = cfg_dict.get("params", {})
    body    = cfg_dict.get("body")
    async with httpx.AsyncClient(timeout=QUERY_TIMEOUT) as client:
        resp = await client.request(method, url, headers=headers, params=params,
                                    content=body.encode() if body else None)
    resp.raise_for_status()
    return json_to_df(resp.json())

# ── pandasql helper (for excel/csv/sqlite/pdf/api) ────────────────────────────
from pandasql import sqldf as _pdsql

def run_pandasql(df: pd.DataFrame, sql: str) -> pd.DataFrame:
    assert_safe_sql(sql)
    env = {"df": df}
    try:
        return _pdsql(sql, env)
    except Exception as e:
        raise HTTPException(400, f"Query execution failed: {e}")

# ══════════════════════════════════════════════════════════════════════════════
#  EXPORT HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def rows_to_df(rows: List[dict], columns: List[str]) -> pd.DataFrame:
    return pd.DataFrame(rows, columns=columns) if rows else pd.DataFrame(columns=columns)

def make_xlsx(df: pd.DataFrame) -> bytes:
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Results")
    return buf.getvalue()

def make_csv(df: pd.DataFrame) -> bytes:
    return df.to_csv(index=False).encode("utf-8")

def make_json_bytes(df: pd.DataFrame) -> bytes:
    return json.dumps(df.to_dict(orient="records"), default=str, indent=2).encode("utf-8")

def make_pdf(df: pd.DataFrame) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                            leftMargin=18, rightMargin=18, topMargin=18, bottomMargin=18)
    data = [df.columns.tolist()] + [
        [str(v) if v is not None else "" for v in row]
        for _, row in df.iterrows()
    ]
    pw  = landscape(A4)[0] - 36
    cw  = [pw / max(1, len(df.columns))] * max(1, len(df.columns))
    tbl = Table(data, colWidths=cw, repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  colors.HexColor("#1e293b")),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.HexColor("#f1f5f9")),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 8),
        ("ALIGN",         (0, 0), (-1, -1), "LEFT"),
        ("GRID",          (0, 0), (-1, -1), 0.25, colors.HexColor("#334155")),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1),
         [colors.HexColor("#0f172a"), colors.HexColor("#1e293b")]),
        ("TEXTCOLOR",     (0, 1), (-1, -1), colors.HexColor("#cbd5e1")),
    ]))
    doc.build([tbl])
    return buf.getvalue()

def streaming_file(data: bytes, media_type: str, filename: str) -> StreamingResponse:
    return StreamingResponse(
        io.BytesIO(data),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

# ══════════════════════════════════════════════════════════════════════════════
#  ── ROUTES ──
# ══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
#  HEALTH
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health():
    return {
        "status":            "healthy",
        "active_sources":    len(SOURCES),
        "history_entries":   len(HISTORY),
        "openai_configured": bool(OPENAI_API_KEY),
        "llm_provider":      LLM_PROVIDER,
        "optional_deps": {
            "pdfplumber": _PDF_OK,
            "psycopg2":   _PG_OK,
            "pymysql":    _MYSQL_OK,
            "pymongo":    _MONGO_OK,
            "bigquery":   _BQ_OK,
        },
    }

# ─────────────────────────────────────────────────────────────────────────────
#  DATA SOURCE — FILE UPLOADS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/sources/excel/upload", tags=["Sources"])
async def upload_excel(
    name: str        = Form(...),
    file: UploadFile = File(...),
):
    """Upload an Excel (.xls / .xlsx) or CSV file."""
    fn      = file.filename or ""
    content = await file.read()

    if fn.lower().endswith(".csv"):
        data = process_csv(content, fn)
    elif fn.lower().endswith((".xls", ".xlsx")):
        data = process_excel(content, fn)
    else:
        raise HTTPException(400, "Only .xls, .xlsx, .csv files are accepted.")

    sid = new_id()
    SOURCES[sid] = {
        "id":         sid,
        "name":       name or fn,
        "type":       "excel" if not fn.endswith(".csv") else "csv",
        "filename":   fn,
        "created_at": now_iso(),
        "status":     "connected",
        **data,
    }
    log.info("Excel/CSV source added: %s (%d rows)", sid, len(SOURCES[sid]["active"]))
    return {
        "source_id": sid,
        "name":      SOURCES[sid]["name"],
        "type":      SOURCES[sid]["type"],
        "rows":      len(SOURCES[sid]["active"]),
        "columns":   SOURCES[sid]["active"].columns.tolist(),
        "sheets":    SOURCES[sid].get("sheets", ["Sheet1"]),
        "schema":    SOURCES[sid]["schema"],
    }


@app.post("/sources/pdf/upload", tags=["Sources"])
async def upload_pdf(
    name: str        = Form(...),
    file: UploadFile = File(...),
):
    """Upload and parse a PDF — extracts text + tables."""
    fn      = file.filename or ""
    if not fn.lower().endswith(".pdf"):
        raise HTTPException(400, "Only .pdf files are accepted.")
    content = await file.read()
    data    = process_pdf(content, fn)
    sid     = new_id()
    SOURCES[sid] = {
        "id":         sid,
        "name":       name or fn,
        "type":       "pdf",
        "filename":   fn,
        "created_at": now_iso(),
        "status":     "connected",
        **data,
    }
    log.info("PDF source added: %s (%d pages)", sid, len(data["pages"]))
    return {
        "source_id":   sid,
        "name":        SOURCES[sid]["name"],
        "type":        "pdf",
        "page_count":  len(data["pages"]),
        "table_count": len(data["tables"]),
        "tables":      data["tables"],
        "text_pages":  data["pages"],
        "schema":      data["schema"],
    }


@app.post("/sources/sqlite/upload", tags=["Sources"])
async def upload_sqlite(
    name: str        = Form(...),
    file: UploadFile = File(...),
):
    """Upload a SQLite database file."""
    fn      = file.filename or ""
    if not fn.lower().endswith((".db", ".sqlite", ".sqlite3")):
        raise HTTPException(400, "Only .db / .sqlite / .sqlite3 files are accepted.")
    content = await file.read()
    data    = process_sqlite(content, fn)
    sid     = new_id()
    SOURCES[sid] = {
        "id":         sid,
        "name":       name or fn,
        "type":       "sqlite",
        "filename":   fn,
        "created_at": now_iso(),
        "status":     "connected",
        **data,
    }
    log.info("SQLite source added: %s, tables: %s", sid, data["tables"])
    return {
        "source_id": sid,
        "name":      SOURCES[sid]["name"],
        "type":      "sqlite",
        "tables":    data["tables"],
        "schema":    data["schema"],
    }

# ─────────────────────────────────────────────────────────────────────────────
#  DATA SOURCE — DATABASE CONNECTIONS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/sources/postgres/connect", tags=["Sources"])
async def connect_postgres(cfg: PostgresConnect):
    """Connect to a PostgreSQL database."""
    try:
        conn   = pg_connect(cfg)
        tables = pg_list_tables(conn)
        schema = {t: pg_table_schema(conn, t) for t in tables}
        conn.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"PostgreSQL connection failed: {e}")

    sid = new_id()
    SOURCES[sid] = {
        "id":         sid,
        "name":       cfg.name,
        "type":       "postgres",
        "config":     cfg.dict(exclude={"password"}),
        "_password":  cfg.password,  # kept for re-connection; never returned in API
        "tables":     tables,
        "schema":     schema,
        "created_at": now_iso(),
        "status":     "connected",
    }
    log.info("Postgres source added: %s, tables: %s", sid, tables)
    return {"source_id": sid, "name": cfg.name, "type": "postgres",
            "tables": tables, "schema": schema}


@app.post("/sources/mysql/connect", tags=["Sources"])
async def connect_mysql(cfg: MySQLConnect):
    """Connect to a MySQL / MariaDB database."""
    try:
        conn   = my_connect(cfg)
        tables = my_list_tables(conn)
        schema = {t: my_table_schema(conn, t) for t in tables}
        conn.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"MySQL connection failed: {e}")

    sid = new_id()
    SOURCES[sid] = {
        "id":         sid,
        "name":       cfg.name,
        "type":       "mysql",
        "config":     cfg.dict(exclude={"password"}),
        "_password":  cfg.password,
        "tables":     tables,
        "schema":     schema,
        "created_at": now_iso(),
        "status":     "connected",
    }
    return {"source_id": sid, "name": cfg.name, "type": "mysql",
            "tables": tables, "schema": schema}


@app.post("/sources/mongodb/connect", tags=["Sources"])
async def connect_mongodb(cfg: MongoConnect):
    """Connect to a MongoDB instance."""
    try:
        client      = mongo_connect(cfg)
        collections = mongo_list_collections(client, cfg.database)
        schema      = {
            c: mongo_collection_sample_schema(client, cfg.database, c)
            for c in collections
        }
        client.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"MongoDB connection failed: {e}")

    sid = new_id()
    SOURCES[sid] = {
        "id":         sid,
        "name":       cfg.name,
        "type":       "mongodb",
        "config":     cfg.dict(),
        "collections":collections,
        "schema":     schema,
        "created_at": now_iso(),
        "status":     "connected",
    }
    return {"source_id": sid, "name": cfg.name, "type": "mongodb",
            "collections": collections, "schema": schema}


@app.post("/sources/api/connect", tags=["Sources"])
async def connect_api(cfg: APIConnect):
    """Fetch a REST API endpoint and register it as a queryable source."""
    try:
        df = await api_fetch(cfg.dict())
    except Exception as e:
        raise HTTPException(400, f"API fetch failed: {e}")

    sid = new_id()
    SOURCES[sid] = {
        "id":         sid,
        "name":       cfg.name,
        "type":       "api",
        "config":     cfg.dict(),
        "active":     df,
        "columns":    df.columns.tolist(),
        "schema":     {"api": df_schema(df, "api")},
        "created_at": now_iso(),
        "status":     "connected",
    }
    return {"source_id": sid, "name": cfg.name, "type": "api",
            "columns": df.columns.tolist(), "row_count": len(df),
            "schema": SOURCES[sid]["schema"]}


@app.post("/sources/bigquery/connect", tags=["Sources"])
async def connect_bigquery(cfg: BigQueryConnect):
    """Register a BigQuery project / dataset."""
    if not _BQ_OK:
        raise HTTPException(500, "google-cloud-bigquery not installed.")
    # test the connection with a lightweight query
    try:
        test_sql = f"SELECT 1 FROM `{cfg.project_id}.{cfg.dataset_id}.__TABLES_SUMMARY__` LIMIT 1"
        bq_run_sql(cfg.project_id, test_sql, cfg.credentials)
    except Exception as e:
        log.warning("BigQuery test query failed (may be fine): %s", e)

    sid = new_id()
    SOURCES[sid] = {
        "id":          sid,
        "name":        cfg.name,
        "type":        "bigquery",
        "config":      cfg.dict(exclude={"credentials"}),
        "_credentials":cfg.credentials,
        "created_at":  now_iso(),
        "status":      "connected",
        "schema":      {},
    }
    return {"source_id": sid, "name": cfg.name, "type": "bigquery",
            "project_id": cfg.project_id, "dataset_id": cfg.dataset_id}

# ─────────────────────────────────────────────────────────────────────────────
#  DATA SOURCE — CRUD
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/sources", tags=["Sources"])
def list_sources():
    """List all registered data sources."""
    return [
        {
            "id":         s["id"],
            "name":       s["name"],
            "type":       s["type"],
            "status":     s["status"],
            "created_at": s["created_at"],
        }
        for s in SOURCES.values()
    ]


@app.get("/sources/{source_id}", tags=["Sources"])
def get_source(source_id: str):
    """Get metadata for a single source."""
    s = safe_source(source_id)
    return {
        "id":         s["id"],
        "name":       s["name"],
        "type":       s["type"],
        "status":     s["status"],
        "created_at": s["created_at"],
        "schema":     s.get("schema", {}),
        "tables":     s.get("tables") or s.get("collections") or s.get("sheets", []),
    }


@app.delete("/sources/{source_id}", tags=["Sources"])
def delete_source(source_id: str):
    """Remove a source and free its memory."""
    safe_source(source_id)
    # close live DB connections if present
    conn = SOURCES[source_id].get("_conn")
    if conn:
        try: conn.close()
        except Exception: pass
    del SOURCES[source_id]
    return {"deleted": source_id}

# ─────────────────────────────────────────────────────────────────────────────
#  SCHEMA
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/schema/{source_id}", tags=["Schema"])
def get_schema(source_id: str):
    """Return full schema for all tables / collections / sheets."""
    s = safe_source(source_id)
    return {"source_id": source_id, "type": s["type"], "schema": s.get("schema", {})}


@app.get("/tables/{source_id}", tags=["Schema"])
def get_tables(source_id: str):
    """Return list of tables / collections / sheets."""
    s = safe_source(source_id)
    tables = (
        s.get("tables")
        or s.get("collections")
        or s.get("sheets")
        or list(s.get("schema", {}).keys())
    )
    return {"source_id": source_id, "type": s["type"], "tables": tables}


@app.get("/columns/{source_id}/{table_name}", tags=["Schema"])
def get_columns(source_id: str, table_name: str):
    """Return column metadata for a specific table."""
    s      = safe_source(source_id)
    schema = s.get("schema", {})
    if table_name not in schema:
        raise HTTPException(404, f"Table '{table_name}' not found in schema.")
    return {"source_id": source_id, "table": table_name, "columns": schema[table_name]}

# ─────────────────────────────────────────────────────────────────────────────
#  QUERY ENGINE
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/query/run", tags=["Query"])
async def run_query(req: RunQueryRequest):
    """
    Universal query endpoint.

    `query_type`:
    - **natural_language** → calls AI to generate a query then runs it
    - **sql**              → runs raw SQL (pandasql for file sources, native for DBs)
    - **mongodb**          → runs a JSON filter against a MongoDB collection
    - **api**              → re-fetches the API and applies an optional SQL filter
    """
    s     = safe_source(req.source_id)
    t0    = time.time()
    qtype = req.query_type.lower()

    # ── 1. Natural Language → generate query first ────────────────────────────
    if qtype == "natural_language":
        try:
            req.query = await generate_query_from_nl(s, req.query)
        except Exception as e:
            raise HTTPException(502, f"AI query generation failed: {e}")
        # now treat it as SQL (or mongodb json)
        qtype = "mongodb" if s["type"] == "mongodb" else "sql"

    # ── 2. Route by source type ───────────────────────────────────────────────
    try:
        if s["type"] in ("excel", "csv", "pdf", "api"):
            df = run_pandasql(s["active"], req.query)

        elif s["type"] == "sqlite":
            con = sqlite3.connect(s["db_path"])
            df  = pd.read_sql_query(req.query, con)
            con.close()

        elif s["type"] == "postgres":
            cfg  = s["config"]
            pswd = s["_password"]
            conn = psycopg2.connect(
                host=cfg["host"], port=cfg["port"], dbname=cfg["database"],
                user=cfg["username"], password=pswd,
            )
            df   = pg_run_sql(conn, req.query, req.limit)
            conn.close()

        elif s["type"] == "mysql":
            cfg  = s["config"]
            pswd = s["_password"]
            conn = pymysql.connect(
                host=cfg["host"], port=cfg["port"], db=cfg["database"],
                user=cfg["username"], password=pswd,
                charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor,
            )
            df   = my_run_sql(conn, req.query, req.limit)
            conn.close()

        elif s["type"] == "mongodb":
            cfg = s["config"]
            cli = pymongo.MongoClient(cfg["uri"])
            col = cfg.get("collection", "")
            df  = mongo_run_query(cli, cfg["database"], col, req.query, req.limit)
            cli.close()

        elif s["type"] == "bigquery":
            cfg = s["config"]
            df  = bq_run_sql(cfg["project_id"], req.query, s.get("_credentials"))

        else:
            raise HTTPException(400, f"Unsupported source type: {s['type']}")

    except HTTPException:
        raise
    except Exception as e:
        push_history({
            "id": new_id(), "source_id": req.source_id, "source_name": s["name"],
            "query": req.query, "query_type": req.query_type,
            "rows_returned": 0, "execution_time": round(time.time()-t0, 4),
            "success": False, "error": str(e), "timestamp": now_iso(),
        })
        raise HTTPException(400, f"Query failed: {e}")

    result = df_to_response(df, t0)
    push_history({
        "id": new_id(), "source_id": req.source_id, "source_name": s["name"],
        "query": req.query, "query_type": req.query_type,
        "rows_returned": result["row_count"],
        "execution_time": result["execution_time"],
        "success": True, "error": None, "timestamp": now_iso(),
    })
    return result

# ─────────────────────────────────────────────────────────────────────────────
#  AI QUERY GENERATION
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/ai/generate-query", tags=["AI"])
async def ai_generate_query(req: AIGenerateRequest):
    """
    Generate a query from natural language without executing it.
    The frontend can display the generated query for the user to review/edit.
    """
    s = safe_source(req.source_id)
    try:
        generated = await generate_query_from_nl(s, req.prompt)
    except Exception as e:
        raise HTTPException(502, f"AI generation failed: {e}")
    return {
        "source_id":       req.source_id,
        "source_type":     s["type"],
        "prompt":          req.prompt,
        "generated_query": generated,
    }

# ─────────────────────────────────────────────────────────────────────────────
#  EXPORT
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/export/csv", tags=["Export"])
async def export_csv(req: ExportRequest):
    """Export result rows as a CSV file."""
    df   = rows_to_df(req.rows, req.columns)
    data = make_csv(df)
    return streaming_file(data, "text/csv", f"{req.filename}.csv")


@app.post("/export/excel", tags=["Export"])
async def export_excel(req: ExportRequest):
    """Export result rows as an Excel (.xlsx) file."""
    df   = rows_to_df(req.rows, req.columns)
    data = make_xlsx(df)
    mt   = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return streaming_file(data, mt, f"{req.filename}.xlsx")


@app.post("/export/json", tags=["Export"])
async def export_json_file(req: ExportRequest):
    """Export result rows as a JSON file."""
    df   = rows_to_df(req.rows, req.columns)
    data = make_json_bytes(df)
    return streaming_file(data, "application/json", f"{req.filename}.json")


@app.post("/export/pdf", tags=["Export"])
async def export_pdf(req: ExportRequest):
    """Export result rows as a styled PDF file."""
    df   = rows_to_df(req.rows, req.columns)
    data = make_pdf(df)
    return streaming_file(data, "application/pdf", f"{req.filename}.pdf")

# ─────────────────────────────────────────────────────────────────────────────
#  QUERY HISTORY
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/history", tags=["History"])
def get_history(
    limit:     int           = Query(50, ge=1, le=200),
    source_id: Optional[str] = Query(None),
):
    """Return query history, newest first. Filter by source_id optionally."""
    hist = HISTORY
    if source_id:
        hist = [h for h in hist if h["source_id"] == source_id]
    return {"history": hist[:limit], "total": len(hist)}


@app.post("/history", tags=["History"])
def add_history(entry: HistoryEntry):
    """Manually add a history entry (e.g. client-side queries)."""
    record = entry.dict()
    record["id"]        = new_id()
    record["timestamp"] = now_iso()
    push_history(record)
    return record


@app.delete("/history", tags=["History"])
def clear_history(source_id: Optional[str] = Query(None)):
    """Clear all history, or only for a specific source."""
    global HISTORY
    if source_id:
        HISTORY = [h for h in HISTORY if h["source_id"] != source_id]
    else:
        HISTORY = []
    return {"cleared": True, "remaining": len(HISTORY)}

# ─────────────────────────────────────────────────────────────────────────────
#  GLOBAL ERROR HANDLER
# ─────────────────────────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled error: %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}: {exc}"},
    )

# ─────────────────────────────────────────────────────────────────────────────
#  DEV ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)