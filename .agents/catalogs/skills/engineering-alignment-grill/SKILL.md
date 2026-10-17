---
name: engineering-alignment-grill
description: Pre-implementation alignment interview, ubiquitous domain language modeling, and architectural decision records (ADR) based on Matt Pocock's engineering practices. Activate before writing code for complex features, when requirements are underspecified, or to establish project-wide terminology in CONTEXT.md.
metadata:
  origin: Antigravity-Core
---

# 🎯 Engineering Alignment & Grilling Protocol

This skill establishes the engineering discipline popularized by **Matt Pocock** (*Total TypeScript*). Its core mission is to eradicate the #1 failure mode in agentic software development: **misalignment between what the user envisioned and what the agent built**.

---

## 🎯 When to Use

* **Before implementing any non-trivial feature or refactor:** When a prompt leaves room for assumptions about edge cases, UX, or data models.
* **When the agent detects underspecified requirements:** Rather than guessing or generating speculative boilerplate, initiate a grilling session.
* **When entering a new domain with specialized terminology:** Build a shared ubiquitous language in `CONTEXT.md` to keep conversations and code concise.
* **When making irreversible architectural decisions:** Document the rationale and trade-offs in an ADR (*Architectural Decision Record*).

---

## 🧭 The 3-Phase Alignment Workflow

```
1. The Grilling Interview (/grill-me) ──► 2. Ubiquitous Language (CONTEXT.md) ──► 3. Architectural Decision (ADR)
```

### Phase 1: The Grilling Session (`/grill-me`)

Before touching the codebase, conduct a structured, high-signal interview:

1. **Clarify Boundary Conditions:**
   * "What should happen if the external API is offline or returns a 500 error?"
   * "Is this change expected to be backward-compatible with existing client databases?"
   * "What is the acceptable latency and payload budget for this endpoint?"
2. **Expose Hidden Assumptions:**
   * Do not ask generic questions ("Do you want tests?"). Ask specific, opinionated engineering questions:
   * *"I can implement this using an optimistic UI update with rollback on failure, or a blocking spinner until the database commits. Given your UX priorities, which do you prefer?"*
3. **Pacing:** Ask one or two focused questions at a time. Never dump 15 questions in a wall of text.

---

### Phase 2: Ubiquitous Language & `CONTEXT.md`

Avoid circumlocution. When domain experts and agents speak different dialects, agents use 25 words where 1 concise domain term suffices.

* **Pattern:** Whenever a domain concept is defined (e.g. *Materialization Cascade*, *Fortress Balance Sheet*, *Evidentiary Ledger*), record it in `CONTEXT.md` at the project root:

```markdown
# 📖 Project Context & Ubiquitous Language

### Core Domain Terminology
* **Evidentiary Ledger:** The immutable audit log of verified customer facts.
* **Materialization Cascade:** The automated sequence where a file record is synchronized to physical cloud storage.
* **Rollback Journal:** The local log that enables one-click reversal of batch file operations.
```

---

### Phase 3: Architectural Decision Records (ADRs)

For decisions that are hard or costly to reverse (Type 1 decisions per Jeff Bezos), generate an ADR in `.agents/adr/`:

```markdown
# ADR 0003: Adoption of JWT Bearer Tokens over Stateful Sessions

## Status
Accepted (2026-09-29)

## Context
Our mobile application and WhatsApp conversational agent require unified authentication without shared cookie domains.

## Decision
Migrate authentication from express-session cookies to cryptographically signed JWT bearer tokens stored in secure device storage.

## Consequences
* **Positive:** Stateless scaling; zero database lookups per authenticated request.
* **Negative:** Token revocation requires maintaining a short TTL (15 min) and an in-memory Redis denylist for logout.
```

---

## 🔒 Verification Gate

* **No Code Without Alignment:** If the user’s request contains ambiguous architectural branches, Antigravity **MUST** invoke this skill and confirm the design before modifying production files.
