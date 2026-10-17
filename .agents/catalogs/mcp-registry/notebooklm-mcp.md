# 📓 Google NotebookLM MCP Server & Grounded Document Intelligence

> **Source:** [PleasePrompto/notebooklm-mcp](https://github.com/PleasePrompto/notebooklm-mcp) | [Google NotebookLM](https://notebooklm.google.com)
> **Domain:** Model Context Protocol (MCP) server for document-grounded research, multi-turn citations, and audio overview generation; alongside native enterprise equivalents via Google Gemini File API.

---

## 🎯 Architectural Overview

The NotebookLM MCP server connects LLM clients (Claude Code, Cursor, Codex, Antigravity) to Google NotebookLM notebooks, enabling citation-backed answers with low hallucination:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / LLM Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC (stdio / Streamable-HTTP)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   notebooklm-mcp Server                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Session Manager     │       │   Library Manager     │  │
│  │  (Multi-turn context) │       │   (notebook URLs/tags)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
└──────────────┼───────────────────────────────┼──────────────┘
               │ Stealth Automation Protocol   │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Patchright Chromium Engine (Stealth)            │
│                 notebooklm.google.com                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ MCP Tool Interface Specification

### 1. `ask_question`
Executes a grounded query against a notebook with citation retrieval:

```json
{
  "name": "ask_question",
  "description": "Asks a question against the active or specified NotebookLM notebook, returning grounded answers with citations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "question": { "type": "string", "description": "The research or technical question to ask" },
      "session_id": { "type": "string", "description": "Optional ID to retain multi-turn conversational context" },
      "source_format": {
        "type": "string",
        "enum": ["none", "inline", "structured"],
        "default": "structured",
        "description": "Format for source document citations"
      },
      "notebook_url": { "type": "string", "description": "Optional URL of a specific notebook to query" }
    },
    "required": ["question"]
  }
}
```

### 2. `add_notebook`
Registers a shared Google NotebookLM link into the agent's catalog:

```json
{
  "name": "add_notebook",
  "description": "Registers a NotebookLM notebook URL into the local library.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "description": "NotebookLM share URL (https://notebooklm.google.com/notebook/...)" },
      "name": { "type": "string", "description": "Descriptive title for the notebook" },
      "description": { "type": "string", "description": "Summary of topics and source documents contained" },
      "topics": { "type": "array", "items": { "type": "string" } },
      "tags": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["url", "name"]
  }
}
```

### 3. Session & Auth Lifecycle Tools
* `setup_auth`: Launches a visible Chrome window to complete Google OAuth login once. Cookies persist in `%APPDATA%\notebooklm-mcp\chrome_profile\`.
* `reset_session`: Clears conversational context while keeping the browser page open.
* `close_session`: Shuts down the browser tab and terminates the session.
* `cleanup_data`: Deletes browser caches and local session state.

---

## ⚠️ Technical Caveats & Deprecation Analysis

1. **Archived Repository Status:**
   * Marked as **Archived / Discontinued** as of September 2026. No security patches or bug fixes are issued.
2. **Web Scraping Fragility:**
   * NotebookLM has no public REST API. The MCP server scrapes the web frontend using **Patchright**. Any DOM refactor or antibot challenge from Google will break the connection.
3. **Resource Footprint:**
   * Requires maintaining an active Chromium instance consuming **300 MB - 600 MB RAM** per session, violating the lightweight zero-bloat principle if run permanently.

---

## 🚀 Native Enterprise Alternative: Google Gemini File API

To achieve identical or superior grounded document intelligence without browser automation, use the **official Google Gemini API** with Large Context & File Upload:

```python
import google.generativeai as genai

# 1. Upload massive PDFs / clinical manuals (up to 2GB per file)
sample_doc = genai.upload_file(path="path/to/clinical_protocol.pdf")

# 2. Query with strict citation grounding (2M token window)
model = genai.GenerativeModel(model_name="gemini-2.5-pro")
response = model.generate_content([
    sample_doc,
    "Summarize the post-operative rehabilitation protocol for pelvic ring fractures. "
    "Provide exact page and section citations for every recommendation."
])

print(response.text)
```

### Advantages of Native Gemini over NotebookLM MCP:
* **100% Programmatic:** Zero browsers, zero DOM scraping, zero crashes from frontend redesigns.
* **Low Latency:** Millisecond API responses instead of headless browser navigation.
* **Deterministic & Scriptable:** Easy to integrate into automated CI/CD and production backend pipelines.

---

## 🔒 Security & Privacy Protocol

* **No PHI in Consumer Tools:** Never upload protected health information (PHI) or personal financial records to personal Google NotebookLM instances without an enterprise Google Cloud BAA (Business Associate Agreement).
* **Credential Safety:** Do not commit or sync `%APPDATA%\notebooklm-mcp\chrome_profile\` to version control, as it contains active session cookies.
