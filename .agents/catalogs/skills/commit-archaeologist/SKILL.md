---
name: commit-archaeologist
description: Forensic code archaeology and historical intent reconstruction. Investigates why complex, legacy, or counter-intuitive code exists by analyzing introducing commits, PR discussions, git blame, and co-evolving files before refactoring, modifying, or deleting. Activate when encountering confusing code, reviewing legacy modules, or planning refactors.
metadata:
  origin: Antigravity-Core
---

# 🏺 Commit Archaeologist

This skill embodies **Chesterton's Fence** in software engineering: *Do not remove or alter a fence until you understand why it was put there in the first place*. It performs forensic archaeology on legacy code to uncover the original constraints, bug fixes, or edge cases that shaped its design.

---

## 🎯 When to Use

* Encountering bizarre, convoluted, or seemingly redundant logic: before "cleaning it up", discover which obscure production bug created it.
* Refactoring legacy modules: understanding all implicit assumptions and dependencies that tests might not cover.
* Investigating regressions: discovering when and why a behavior was altered in the past.

---

## 🧭 The Forensic Archaeology Workflow

```
1. Target Region Isolation ──► 2. Git Blame & Commit Discovery ──► 3. Context & PR Correlation ──► 4. Archaeological Synthesis
```

### Step 1: Pinpoint the Lines & File
Identify the exact range of lines in question (e.g. `src/payment/processor.ts#L42-L68`).

### Step 2: Git Blame & Commit Log Query
Execute targeted Git commands to inspect the historical lineage:
```bash
# Trace line modifications over time
git log -L 42,68:src/payment/processor.ts

# Inspect the exact commit that introduced the logic
git blame -L 42,68 src/payment/processor.ts
git show <commit-hash> --stat
```

### Step 3: Intent & Context Extraction
Read the introducing commit message, author notes, and linked issue/PR references:
* Was this introduced as a quick hotfix for a specific payment gateway timeout?
* Did a specific browser (e.g., Safari iOS) require this specific CSS hack?
* What other files were committed alongside it? (Co-evolution reveals hidden couplings).

---

## 📊 The Archaeological Dossier

Synthesize the findings into an executive report before proposing code changes:

```markdown
### 🏺 Archaeological Dossier: [Function / Block Name]
* **Target:** `src/auth/session.ts` lines 88-104 (Conditional retry loop).
* **Birth Commit:** `a7f9c2d` (2025-11-14) by @lead-dev.
* **Original Commit Message:** *"Fix race condition in Redis session token invalidation during rapid token refresh"*.

#### 🔍 Intent & Rationale
The nested retry loop was not careless coding; it was deliberately introduced to handle Redis cluster replication lag during simultaneous websocket reconnects.

#### 🛡️ Refactoring Recommendation
* **Proceed with Caution:** If replacing this with a modern async lock, a stress test simulating 50 concurrent reconnects must be written to verify that the original race condition does not resurface.
```

---

## 🔒 Safety Boundary

* Never discard or simplify legacy code without first identifying its birth commit and verifying that the original edge case is covered by modern automated tests.
