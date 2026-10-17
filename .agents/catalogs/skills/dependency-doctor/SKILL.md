---
name: dependency-doctor
description: Deep health check and forensic audit of project dependency manifests (package.json, requirements.txt, pyproject.toml, Cargo.toml, go.mod). Detects obsolete polyfills/backports, unpinned versions, duplicate constraints, yanked packages, and security advisories. Activate when updating dependencies, auditing security, or troubleshooting dependency conflicts.
metadata:
  origin: Antigravity-Core
---

# 🩺 Dependency Doctor

This skill acts as an auditor for third-party dependencies (Jensen Huang / Lisa Su operational efficiency standard). It prevents **dependency rot, supply-chain vulnerabilities, and runtime bloat** by inspecting package manifests with forensic rigor.

---

## 🎯 When to Use

* Auditing a project before release: ensuring no vulnerable, yanked, or deprecated libraries are bundled.
* Diagnosing version conflicts or peer dependency errors during `npm install`, `pip install`, or `cargo build`.
* Modernizing a legacy codebase: removing obsolete polyfills and backports that are now natively supported in modern runtimes (e.g. Node 20+, Python 3.11+).

---

## 🧭 The 4-Pillar Health Inspection

```
1. Manifest Ingestion ──► 2. Deprecation & Polyfill Scan ──► 3. CVE / Security Triage ──► 4. Prescription Report
```

### Pillar 1: Obsolete Polyfills & Backports
Identifies packages that duplicate native standard library capabilities:
* **JavaScript / Node.js:** `is-promise`, `object-assign`, `node-fetch` (native in Node 18+), `mkdirp` (native via `fs.mkdirSync(..., { recursive: true })`), `rimraf` (native via `fs.rmSync(..., { recursive: true, force: true })`).
* **Python:** `six`, `mock` (native `unittest.mock`), `typing_extensions` (when running Python 3.12+ for standard types).

### Pillar 2: Unpinned & Risky Version Ranges
* Detects dangerous wildcards (`*`) or overly permissive ranges that leave builds vulnerable to breaking upstream releases.
* Recommends semantic lockfile discipline (`package-lock.json`, `poetry.lock`, `Cargo.lock`).

### Pillar 3: Duplicate & Conflicting Constraints
* Identifies libraries requested multiple times with mismatched semantic versions, causing bloated bundle sizes or multiple runtime instances.

### Pillar 4: Security & Supply Chain Vulnerabilities
* Cross-checks dependencies against known CVE databases and yanked registries.

---

## 📊 The Dependency Prescription Report

Deliver an actionable prescription before altering package files:

```markdown
### 🩺 Dependency Health Report: [Project Name]
* **Manifests Analyzed:** `package.json`, `package-lock.json`
* **Total Dependencies:** 34 direct (12 production, 22 dev)

| Package | Status | Issue | Recommended Action |
| :--- | :---: | :--- | :--- |
| `node-fetch` | ⚠️ Obsolete | Native `fetch` supported in Node 18+. | Remove package; migrate calls to global `fetch()`. |
| `lodash` | 💡 Bloat | Only `lodash.get` is used in 1 file. | Replace with native optional chaining `?.`. |
| `semver` | 🚨 Vulnerability | Version `<7.5.2` has ReDoS CVE. | Upgrade to `^7.6.0`. |

**Expected Savings:** -4.8 MB in `node_modules`, elimination of 1 low-severity security advisory.
```

---

## 🔒 Safe Execution Rule

* **Lockfile Integrity:** Always verify that automated tests pass after pruning or updating dependencies. Never modify lockfiles manually.
