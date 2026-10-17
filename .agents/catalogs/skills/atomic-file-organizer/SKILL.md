---
name: atomic-file-organizer
description: Intelligent, atomic, and rollback-safe filesystem organization. Combines preview-and-approval workflows with single-call atomic batch moves, cryptographic SHA-256 deduplication, and instant undo capability. Activate when organizing directories, sorting downloads/documents, cleaning workspaces, or deduplicating project assets.
metadata:
  origin: Antigravity-Core
---

# 🗂️ Atomic File Organizer

This skill establishes a safe, non-destructive protocol for organizing file trees, eliminating token waste and mitigating partial failure states through atomic transactions, cryptographic deduplication, and rollback journals.

---

## 🎯 When to Use

* Reorganizing cluttered folders (e.g., `Downloads`, `Documents`, uncurated asset directories).
* Grouping mixed files by business logic (e.g., date, domain, file type, project tags).
* Identifying and safely isolating identical duplicate files using content hashing (SHA-256).
* Renaming large batches of files systematically according to standard naming conventions.
* Any filesystem restructuring that requires **100% undoability** and zero risk of accidental data loss.

---

## 🛡️ Inviolable 3-Phase Execution Protocol

```
Phase 1: Scan & Inspect ──► Phase 2: Plan & Dry-Run ──► [USER GATE] ──► Phase 3: Atomic Move & Journal
                                                                              │
                                                                   (Optional: Undo / Rollback)
```

### Phase 1: Inspection & Deduplication
1. **Directory Tree Scan:** Inspect the target path without altering any file state.
2. **Cryptographic Deduplication:** Compute content SHA-256 hashes to group exact duplicates regardless of differing filenames.
3. **Classification Strategy:** Formulate the proposed taxonomy (e.g., `docs/finance/`, `media/raw/`, `code/modules/`).

### Phase 2: Plan Proposal & Dry-Run Preview (Mandatory)
* **Never move a single file without explicit confirmation.**
* Run `file_organizer_organize` with `dry_run: true` or generate a clear markdown table preview:
  ```markdown
  | Original File | Proposed Destination | Size | SHA-256 Hash |
  | :--- | :--- | :---: | :--- |
  | `invoice_march.pdf` | `docs/invoices/2026-03_invoice.pdf` | 142 KB | `e3b0c44...` |
  | `screenshot_12.png` | `media/screenshots/screenshot_12.png` | 1.2 MB | `a4f891b...` |
  ```
* Present the plan to the user and halt execution until explicit authorization is granted.

### Phase 3: Atomic Execution & Rollback Readiness
1. **Atomic Move:** Execute the moves in a single transaction (via `file-organizer-mcp` or localized atomic shell operations).
2. **State Journaling:** Retain the path mapping journal so that the entire tree can be reverted to its pristine state with a single instruction (`file_organizer_undo_last_operation` or journal reversal).

---

## ⚡ Tool Execution Options

### Option A: Using `File-Organizer-MCP` (Recommended)
```json
// Step 1: Scan
call_tool("file_organizer_scan_directory", { "directory": "C:\\Ruta\\Target" })

// Step 2: Dry-run simulation
call_tool("file_organizer_organize", { "directory": "C:\\Ruta\\Target", "strategy": "smart_custom", "dry_run": true })

// Step 3 (After User Gate): Commit
call_tool("file_organizer_organize", { "directory": "C:\\Ruta\\Target", "strategy": "smart_custom", "dry_run": false })

// Step 4 (If requested): Rollback
call_tool("file_organizer_undo_last_operation", {})
```

### Option B: Local PowerShell Fallback (Native)
When MCP server is offline, use PowerShell transactional scripts with manifest logging:
```powershell
# Generate manifest before move
$manifest = @()
Get-ChildItem -Path $targetDir -File | ForEach-Object {
    $hash = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
    $manifest += [PSCustomObject]@{
        OriginalPath = $_.FullName
        FileName = $_.Name
        Hash = $hash
    }
}
$manifest | Export-Clixml -Path "$targetDir\.organize_manifest.xml"
```

---

## 🔒 Safety & Boundary Constraints

* **Strict Boundary Enforcement:** Operations are strictly constrained to the user-specified target directory. Path traversal (`../`) and following symlinks outside the root is prohibited.
* **Non-Destructive Principle:** Files are moved, never deleted. Duplicate files are isolated into a `_duplicates/` staging folder rather than unlinked.
* **Compliance Gate:** Adheres strictly to the `accidental-data-loss-prevention` rule.
