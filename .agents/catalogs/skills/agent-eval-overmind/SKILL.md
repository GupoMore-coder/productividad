---
name: agent-eval-overmind
description: Continuous agent evaluation, trace analysis, and regression benchmarking based on Overmind architecture. Captures multi-step execution traces (tool inputs, intermediate observations, errors), converts production failures into gold-standard eval datasets, and scores agent performance to prevent regressions. Activate when designing agent evaluation loops, curating regression test suites, or tuning specialized agent models.
metadata:
  origin: Antigravity-Core
---

# 📈 Agent Eval Overmind

This skill defines the **continuous agent optimization and regression evaluation standard** (Mohamed Kande data-driven auditing / Demis Hassabis scientific rigor / Janet Truncale quality of earnings) for tracking and elevating AI agent performance.

---

## 🎯 When to Use

* **Production Failure Triage:** Converting real-world agent mistakes into permanent regression tests.
* **Prompt & Model Version Benchmarking:** Scoring new prompt versions or model releases against historical baselines before deployment.
* **Tool Calling Accuracy Audits:** Measuring hallucination rates, parameter formatting errors, and unnecessary tool invocations.
* **Cost vs Quality Optimization:** Finding the optimal frontier where smaller, cheaper models achieve parity with larger models on specialized tasks.

---

## 🧭 The 4-Stage Optimization Flywheel

```
1. Trace Capture ──► 2. Dataset Synthesis ──► 3. Benchmark Scoring ──► 4. Prompt / Policy Patch
```

### Stage 1: Trace Capture & Step Logging
- Log every tool invocation, input payload, returned output, and final task outcome.
- Record human corrections as explicit negative feedback signals.

### Stage 2: Eval Dataset Synthesis
- Filter traces for edge cases, failures, and high-difficulty tasks.
- Format inputs and ground-truth assertions into a repeatable evaluation suite.

### Stage 3: Automated Benchmark Scoring
- Run candidate agents or prompts across the eval dataset in parallel.
- Compute key metrics:
  - Task completion rate (%)
  - Average tool calls per task
  - Total token consumption and cost per success
  - Latency distribution (p50, p95)

### Stage 4: Surgical Prompt & Policy Patching
- Apply targeted fixes to system prompts, tool descriptions, or few-shot examples.
- Re-run benchmark to verify regression-free improvement.

---

## 🛡️ Evaluation Quality Safeguards

- [ ] **No Overfitting:** Evaluation datasets must contain varied test inputs, not identical prompt copies.
- [ ] **Ground Truth Integrity:** Success assertions verified by deterministic unit tests or human review.
- [ ] **Cost Tracking:** Every benchmark run records exact token spending.
