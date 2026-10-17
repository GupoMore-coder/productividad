---
name: ai-e2e-testing
description: End-to-end testing orchestration combining natural language AI agent execution steps with deterministic Playwright assertions. Creates, runs, and auto-heals robust E2E test suites for modern web and mobile apps, minimizing flaky tests while ensuring comprehensive regression coverage. Activate when authoring E2E tests, verifying user journeys, automating cross-browser test suites, or validating web application behavior against specs.
metadata:
  origin: Antigravity-Core
---

# 🧪 AI E2E Testing (Tester-Army Architecture)

This skill formalizes the **hybrid end-to-end testing methodology** combining autonomous agent navigation with deterministic Playwright assertions (Janet Truncale forensic auditability / Demis Hassabis scientific verification).

---

## 🎯 When to Use

* **Critical User Journeys:** Validating end-to-end user flows (signup, checkout, account configuration, reporting dashboards).
* **Cross-Browser & Multi-Viewport Regression:** Running test suites across Chromium, WebKit, and mobile viewport simulations.
* **Auto-Healing Locator Resilience:** Testing modern dynamic UIs with ephemeral IDs or obfuscated classnames.
* **Continuous Integration Gating:** Preventing broken releases by verifying core business workflows prior to merge.

---

## 🧭 The 4-Step Hybrid E2E Testing Workflow

```
1. Journey Specification ──► 2. Agent Exploration ──► 3. Deterministic Assertions ──► 4. Playwright Codification
```

### Step 1: Journey Specification
- Define user persona, initial state, and ultimate business goal (e.g., "Complete a cart purchase with coupon applied").
- Establish pre-conditions (database seed state, authenticated session).

### Step 2: Agent Exploration & Interaction
- Execute exploratory navigation using semantic steps.
- Handle unexpected toasts, animations, and async hydration smoothly.

### Step 3: Deterministic Assertions
- Anchor key checkpoints with strict Playwright locators (`getByRole`, `getByTestId`).
- Validate network payloads (HTTP 200/201 status, response JSON schema) and DOM states.

### Step 4: Playwright Codification
- Export the verified flow into a permanent, version-controlled TypeScript Playwright spec (`*.spec.ts`).
- Ensure hermetic cleanup so tests can execute repeatedly without side effects.

---

## 🛡️ Forensic & Flake Guardrails

- [ ] **No Flaky Sleep Calls:** Never use hardcoded timeouts (`sleep(5000)`); rely exclusively on web-first assertions (`toBeVisible()`, `toHaveURL()`).
- [ ] **Isolated Test State:** Ensure each test run utilizes isolated browser contexts or synthetic user accounts.
- [ ] **Trace & Video Capture:** Enable video and trace recording on failure for instant diagnostic triage.
