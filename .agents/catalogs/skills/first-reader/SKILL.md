---
name: first-reader
description: Simulates real human reader personas reviewing technical documents, PRDs, client proposals, architectural specs, or executive memos. Identifies attention drop-offs, confusion points, jargon friction, and core takeaway retention without rewriting the author's prose. Activate when reviewing documentation, preparing client proposals, or refining executive communications.
metadata:
  origin: Antigravity-Core
---

# 👁️ First Reader

This skill simulates a diverse panel of human readers reviewing drafts of documents, PRDs, technical proposals, or client memos (Philip Kotler / Sam Altman communication standard). It answers the vital question: **"What will a real person actually experience and remember when reading this?"** without altering the author's voice.

---

## 🎯 When to Use

* Reviewing a newly written PRD or Architecture Decision Record before circulating it to the team.
* Auditing client-facing proposals, quotations, or pitch decks for More Paper or More Design.
* Verifying whether complex technical documentation is clear to junior developers or non-technical stakeholders.

---

## 🧭 The 3-Phase First Reader Protocol

```
1. Instantiate Reader Persona ──► 2. Progressive Reading Simulation ──► 3. Friction & Retention Audit
```

### Phase 1: Reader Persona Instantiation
Select or configure the target reader archetype:
* **The Busy Executive (Dimon / Bezos Persona):** Reads in 90 seconds between meetings. Looks for: bottom-line numbers, cash-flow impact, risk mitigations.
* **The Skeptical Engineer (Cherny / Dean Persona):** Scrutinizes: missing failure modes, unstated assumptions, vague scaling claims.
* **The Premium Commercial Client (Arnault / More Paper Persona):** Sensitive to: tone of voice, bespoke craft, brand prestige, clarity of pricing.

---

### Phase 2: Progressive Reading Simulation
The skill traces the reader’s cognitive journey paragraph by paragraph:
* **Initial Hook (0–30s):** Does the reader grasp what this document is about immediately?
* **Attention Curve:** Where does the prose drag, become repetitive, or lose momentum?
* **Cognitive Speedbumps:** Where does the reader pause, re-read a sentence, or get confused by unexplained acronyms?

---

### Phase 3: The First Reader Audit Report

The skill produces a diagnostic breakdown **without rewriting the author's text**:

```markdown
### 👁️ First Reader Diagnostic: [Document Title]
* **Target Audience Evaluated:** Non-technical corporate client (Procurement Director).

#### 🛑 Cognitive Friction Points
1. **Paragraph 3 (Section: Pricing Terms):** The phrase *"30% upfront amortization with pro-rated milestone netting"* caused confusion. A reader will wonder when invoices are actually due.
2. **Paragraph 7 (Section: Specifications):** Mentions *"GSM 350 debossed cotton"* without clarifying if envelopes are included in the unit price.

#### 📉 Attention Drop-Off
* Engagement is strong through Section 2, but dips severely in Section 4 due to three consecutive bullet points exceeding 60 words each.

#### 🧠 Takeaway Retention (What Stood Out After Reading)
* The client will remember: Premium handcrafted quality, delivery timeline of 15 days.
* The client will miss: The payment schedule and warranty policy (buried in dense footnotes).

#### 💡 Diagnostic Recommendation
Clarify the pricing table with explicit dates and shorten Section 4 into concise bullet points.
```

---

## 🔒 Non-Intrusive Principle

* First Reader never rewrites the text unless explicitly requested by the user. Its duty is to deliver an objective, unvarnished mirror of reader psychology.
