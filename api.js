// src/services/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all backend communication.
// Backend: http://localhost:8000
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function _json(res) {
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { detail: text }; }
  if (!res.ok) {
    const msg = data?.detail ?? data?.message ?? `HTTP ${res.status}`;
    const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
}

async function _get(path) {
  const res = await fetch(`${API_URL}${path}`);
  return _json(res);
}

async function _post(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return _json(res);
}

async function _postForm(path, formData) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body:   formData,          // no Content-Type header — browser sets boundary
  });
  return _json(res);
}

async function _delete(path) {
  const res = await fetch(`${API_URL}${path}`, { method: "DELETE" });
  return _json(res);
}

/** Downloads a file from a POST endpoint that returns a binary stream. */
async function _download(path, body, fallbackFilename) {
  const res = await fetch(`${API_URL}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err  = new Error(data?.detail ?? `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const cd       = res.headers.get("Content-Disposition") ?? "";
  const match    = cd.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? fallbackFilename;
  const blob     = await res.blob();
  const url      = URL.createObjectURL(blob);
  const a        = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Health ───────────────────────────────────────────────────────────────────

/** GET /health → { status, active_sources, openai_configured, … } */
export const healthCheck = () => _get("/health");

// ─── Sources — CRUD ───────────────────────────────────────────────────────────

/** GET /sources → [{ id, name, type, status, created_at }, …] */
export const getSources = () => _get("/sources");

/** GET /sources/{id} → { id, name, type, status, created_at, schema, tables } */
export const getSource = (id) => _get(`/sources/${id}`);

/** DELETE /sources/{id} → { deleted: id } */
export const deleteSource = (id) => _delete(`/sources/${id}`);

// ─── Sources — File uploads ───────────────────────────────────────────────────

/**
 * POST /sources/excel/upload
 * @param {string}  name  display name
 * @param {File}    file  .xls / .xlsx / .csv
 * @returns {{ source_id, name, type, rows, columns, sheets, schema }}
 */
export async function uploadExcel(name, file) {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("file", file);
  return _postForm("/sources/excel/upload", fd);
}

/**
 * POST /sources/pdf/upload
 * @param {string} name
 * @param {File}   file  .pdf
 * @returns {{ source_id, name, type, page_count, table_count, schema }}
 */
export async function uploadPDF(name, file) {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("file", file);
  return _postForm("/sources/pdf/upload", fd);
}

/**
 * POST /sources/sqlite/upload
 * @param {string} name
 * @param {File}   file  .db / .sqlite / .sqlite3
 * @returns {{ source_id, name, type, tables, schema }}
 */
export async function uploadSQLite(name, file) {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("file", file);
  return _postForm("/sources/sqlite/upload", fd);
}

// ─── Sources — Database connections ──────────────────────────────────────────

/**
 * POST /sources/postgres/connect
 * @param {{ name, host, port, database, username, password, ssl }} cfg
 */
export const connectPostgres = (cfg) => _post("/sources/postgres/connect", cfg);

/**
 * POST /sources/mysql/connect
 * @param {{ name, host, port, database, username, password }} cfg
 */
export const connectMySQL = (cfg) => _post("/sources/mysql/connect", cfg);

/**
 * POST /sources/mongodb/connect
 * @param {{ name, uri, database, collection }} cfg
 */
export const connectMongoDB = (cfg) => _post("/sources/mongodb/connect", cfg);

/**
 * POST /sources/api/connect
 * @param {{ name, url, method, headers, params, body }} cfg
 */
export const connectAPI = (cfg) => _post("/sources/api/connect", cfg);

/**
 * POST /sources/bigquery/connect
 * @param {{ name, project_id, dataset_id, credentials }} cfg
 */
export const connectBigQuery = (cfg) => _post("/sources/bigquery/connect", cfg);

// ─── Schema ───────────────────────────────────────────────────────────────────

/** GET /schema/{source_id} → { source_id, type, schema: { table: [col, …] } } */
export const getSchema = (sourceId) => _get(`/schema/${sourceId}`);

/** GET /tables/{source_id} → { source_id, type, tables: [string, …] } */
export const getTables = (sourceId) => _get(`/tables/${sourceId}`);

/** GET /columns/{source_id}/{table} → { source_id, table, columns: [{column, dtype}, …] } */
export const getColumns = (sourceId, table) => _get(`/columns/${sourceId}/${table}`);

// ─── Query ────────────────────────────────────────────────────────────────────

/**
 * POST /query/run
 * @param {{ source_id, query, query_type, limit }} payload
 *   query_type: "sql" | "natural_language" | "mongodb" | "api"
 * @returns {{ success, columns, rows, row_count, execution_time }}
 */
export const runQuery = (payload) =>
  _post("/query/run", { limit: 1000, ...payload });

// ─── AI ───────────────────────────────────────────────────────────────────────

/**
 * POST /ai/generate-query
 * @param {{ source_id, prompt }} payload
 * @returns {{ generated_query: string }}
 */
export const generateAIQuery = (payload) =>
  _post("/ai/generate-query", payload);

// ─── History ──────────────────────────────────────────────────────────────────

/** GET /history?limit=50 → { history: [], total } */
export const getHistory = (limit = 50) => _get(`/history?limit=${limit}`);

/** DELETE /history → { cleared: true } */
export const clearHistory = () => _delete("/history");

// ─── Export ───────────────────────────────────────────────────────────────────

const _exportBody = (rows, columns, filename) => ({ rows, columns, filename });

/** POST /export/csv — triggers file download */
export const exportCSV = (rows, columns, filename = "results") =>
  _download("/export/csv",   _exportBody(rows, columns, filename), `${filename}.csv`);

/** POST /export/excel — triggers file download */
export const exportExcel = (rows, columns, filename = "results") =>
  _download("/export/excel", _exportBody(rows, columns, filename), `${filename}.xlsx`);

/** POST /export/json — triggers file download */
export const exportJSON = (rows, columns, filename = "results") =>
  _download("/export/json",  _exportBody(rows, columns, filename), `${filename}.json`);

/** POST /export/pdf — triggers file download */
export const exportPDF = (rows, columns, filename = "results") =>
  _download("/export/pdf",   _exportBody(rows, columns, filename), `${filename}.pdf`);