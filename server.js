// ===========================================================================
// Narrow Path Camp — backend broker
// ---------------------------------------------------------------------------
// This tiny server is the ONLY thing that holds your Softr API token.
// The camp app (in the browser) talks to THIS server; this server talks to
// Softr. That way the secret token never lives in the public HTML.
//
// It exposes a few simple, safe endpoints the app uses:
//   GET  /api/table/:name             -> all records in a table (paginated for you)
//   POST /api/table/:name             -> create a record  { fields: {...} }
//   PATCH/api/table/:name/:recordId   -> update a record  { fields: {...} }
//   DELETE /api/table/:name/:recordId -> delete a record
//
// You do NOT need to understand the code to run it. Follow SETUP.md.
// ===========================================================================

const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json({ limit: "2mb" }));

// --- Configuration (these come from environment variables, NOT hardcoded) ---
const SOFTR_TOKEN   = process.env.SOFTR_API_KEY;        // your secret token
const DATABASE_ID   = process.env.SOFTR_DATABASE_ID || "a868e883-c095-487b-9673-8839e60266ba";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*"; // your app's URL once hosted
const API_BASE = "https://tables-api.softr.io/api/v1";

if (!SOFTR_TOKEN) {
  console.error("FATAL: SOFTR_API_KEY environment variable is not set.");
  process.exit(1);
}

// Only allow your app's domain to use this server (set ALLOWED_ORIGIN in prod)
app.use(cors({ origin: ALLOWED_ORIGIN }));

// ---------------------------------------------------------------------------
// Table name -> Softr table ID map. (Friendly names so the app stays readable.)
// ---------------------------------------------------------------------------
const TABLES = {
  campers:       "aUUpAlqAOu0Ojy",
  volunteers:    "Hoet5BBALcxLd6",
  games:         "txntobFNqMi9tU",
  conditioning:  "fqf7PJKSryrJoR",
  skills:        "gKiJrf8BTQD0pm",
  teams:         "Eelj4B3x7fGoga",
  settings:      "2WqAOuIVMTPb88",
  years:         "tij9DsWN7PYd2q",
  survey2025:    "WwFjTnKzenUiF0",
  teams2025:     "vA2J6b1gcEKQLv",
  details2025:   "dZK8ZXglZbli9B",
};

function tableId(name) {
  const id = TABLES[name];
  if (!id) throw { status: 404, message: `Unknown table: ${name}` };
  return id;
}

// Helper to call Softr with the secret token attached server-side.
async function softr(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Softr-Api-Key": SOFTR_TOKEN,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!res.ok) throw { status: res.status, message: body.message || "Softr error", body };
  return body;
}

// --- GET all records in a table (handles pagination, returns readable fields) -
app.get("/api/table/:name", async (req, res) => {
  try {
    const tid = tableId(req.params.name);
    let offset = 0, limit = 200, all = [];
    while (true) {
      const r = await softr(
        `/databases/${DATABASE_ID}/tables/${tid}/records?fieldNames=true&offset=${offset}&limit=${limit}`
      );
      all = all.concat(r.data || []);
      const total = r.metadata?.total ?? all.length;
      offset += limit;
      if (offset >= total || (r.data || []).length === 0) break;
    }
    res.json({ data: all });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, details: e.body });
  }
});

// --- CREATE a record ---------------------------------------------------------
app.post("/api/table/:name", async (req, res) => {
  try {
    const tid = tableId(req.params.name);
    const r = await softr(
      `/databases/${DATABASE_ID}/tables/${tid}/records?fieldNames=true`,
      { method: "POST", body: JSON.stringify({ fields: req.body.fields || {} }) }
    );
    res.json(r);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, details: e.body });
  }
});

// --- UPDATE a record (partial; this is what makes editing-and-saving work) ----
app.patch("/api/table/:name/:recordId", async (req, res) => {
  try {
    const tid = tableId(req.params.name);
    const r = await softr(
      `/databases/${DATABASE_ID}/tables/${tid}/records/${req.params.recordId}?fieldNames=true`,
      { method: "PATCH", body: JSON.stringify({ fields: req.body.fields || {} }) }
    );
    res.json(r);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, details: e.body });
  }
});

// --- DELETE a record ---------------------------------------------------------
app.delete("/api/table/:name/:recordId", async (req, res) => {
  try {
    const tid = tableId(req.params.name);
    const r = await softr(
      `/databases/${DATABASE_ID}/tables/${tid}/records/${req.params.recordId}`,
      { method: "DELETE" }
    );
    res.json(r);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, details: e.body });
  }
});

// --- Health check ------------------------------------------------------------
app.get("/", (_req, res) => res.send("Narrow Path backend is running."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Narrow Path backend listening on :${PORT}`));
