---
name: local-interpreter-sandbox
description: Safe, state-isolated local code execution across Python, JavaScript, Bash, and PowerShell (Open Interpreter standard). Manages subshell processes, captures stdout/stderr, intercepts errors for dynamic self-correction, enforces strict execution timeouts, and purges transient scratch state. Activate when running data analysis scripts, executing multi-step computational tasks, generating visual artifacts, or debugging code locally.
metadata:
  origin: Antigravity-Core
---

# 💻 Local Interpreter Sandbox (Open Interpreter)

This skill formalizes the **local code execution and interpreter runtime protocol** (Jeff Dean / Arthur Mensch engineering standard). It enables Antigravity to run multi-language code snippets safely in isolated subshells with structured output interception and automatic error recovery.

---

## 🎯 When to Use

* **Computational Data Analysis:** Running Python/pandas/scikit-learn or Node.js scripts over local CSV, JSON, or Excel files.
* **Prototyping & Dynamic Verification:** Validating algorithms, regular expressions, or cryptographic hashing before committing changes.
* **Visual Artifact Generation:** Generating charts, graphs, or diagram outputs to temporary artifact folders.
* **Forensic Shell Diagnostics:** Inspecting system metrics, hardware capability, or installed CLI utilities safely.

---

## 🧭 The 4-Stage Execution Sandbox Protocol

```
1. Language & Environment Isolation ──► 2. Subshell Dispatch ──► 3. Output Interception ──► 4. State & Scratch Teardown
```

### Stage 1: Isolation & Dependency Check
Before running any generated code:
- Confirm that the interpreter runtime exists (e.g. `node -v` or `py -3 --version`).
- Write temporary scripts exclusively to designated scratch directories (e.g. `scratch/` or `<appDataDir>/brain/<conversation-id>/scratch/`).
- Never write transient scripts into root source directories (`src/`, `components/`).

### Stage 2: Subshell Dispatch
- Launch the script as an isolated child process with a hard timeout (maximum 60 seconds unless explicitly declared as a batch task).
- Pass parameters via command-line arguments or environment variables rather than string concatenation.

### Stage 3: Output Interception & Self-Correction
- Stream stdout and stderr separately.
- If the exit code is non-zero, capture the exact stack trace, parse the failing line, formulate a surgical fix, and re-execute.

### Stage 4: State & Scratch Teardown
- Terminate any dangling child processes.
- Purge temporary binary artifacts or intermediate scratch files once the final report is compiled.

---

## 🛡️ Sandbox Safety Checklist

- [ ] **Dedicated Scratch Path:** No temporary files written to production source directories.
- [ ] **Hard Process Timeout:** No script allowed to hang indefinitely without a timeout kill switch.
- [ ] **No Unsanitized Shell Injections:** User inputs sanitized before passing to subshells.
