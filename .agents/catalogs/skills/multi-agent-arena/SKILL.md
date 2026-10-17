---
name: multi-agent-arena
description: Multi-agent competition and tournament-style evolutionary evaluation protocol based on Jakeschincariol/arena-skill. Resolves complex coding, design, and architecture challenges by spawning multiple parallel agent hypotheses with distinct strategies, orchestrating blind adversarial cross-critique rounds, scoring bracket eliminations (LLM-as-a-Judge), and synthesizing the verified champion solution. Activate when breaking deadlocks on hard problems, optimizing suboptimal AI responses, evaluating conflicting architectural trade-offs, or demanding battle-tested code quality.
metadata:
  origin: Antigravity-Core
---

# 🏆 Multi-Agent Arena Protocol

This skill codifies the **multi-agent competitive tournament and evolutionary evaluation standard** (Charlie Munger / Warren Buffett ruthless error elimination / Jensen Huang massive parallel exploration) using Arena.

---

## 🎯 When to Use

* **Resolving Suboptimal AI Outputs:** When an initial answer lacks depth, misses subtle edge cases, or feels generic, run `/arena` to force competition.
* **Complex Architectural Decisions:** Pitting distinct design patterns against one another (e.g. Event-Driven vs CQRS vs Modular Monolith) to assess real-world trade-offs.
* **Algorithm & Performance Optimization:** Spawning parallel candidates prioritizing minimal memory footprint, maximal throughput, or mathematical elegance.
* **High-Stakes Code Refactoring:** Vetting mission-critical refactors through adversarial peer review before touching production files.

---

## 🧭 The 4-Stage Arena Tournament Workflow

```
1. Strategy Diversification ──► 2. Parallel Generation ──► 3. Adversarial Cross-Critique ──► 4. Champion Synthesis
```

### Stage 1: Strategy Diversification
- Define the core problem statement and evaluation criteria (accuracy, edge-case resilience, performance, readability).
- Formulate distinct strategy personas (e.g. Candidate A: Defensive & Safe; Candidate B: High-Throughput & Async; Candidate C: Minimalist & Lean).

### Stage 2: Parallel Generation
- Dispatch generation prompts concurrently across configured candidate instances.
- Collect independent solution drafts without cross-contamination.

### Stage 3: Adversarial Cross-Critique & Bracket Scoring
- Blindly pass candidate solutions to peer evaluator agents.
- Each evaluator stress-tests rival solutions against edge cases, concurrency hazards, and complexity bloat.
- Tabulate scores using bracket ranking (Elo or Swiss-system).

### Stage 4: Champion Synthesis & Validation
- Crown the top-ranked solution as champion.
- Integrate validated improvements identified by runner-up critiques.
- Execute unit tests or type checks (`tsc --noEmit`) to verify correctness.

---

## 🛡️ Operational Guardrails

- [ ] **Bounded Competitor Pool:** Limit parallel instances (typically 3 to 6) to balance cognitive diversity against token expenditure.
- [ ] **Objective Evaluation Criteria:** Ensure judges evaluate against deterministic functional requirements rather than stylistic preference.
- [ ] **Zero Unverified Commits:** The champion solution must pass all automated tests before being merged.
