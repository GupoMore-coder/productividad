---
name: browser-use-agent
description: Autonomous web browser interaction and navigation engine using browser-use and Chromium DevTools Protocol (CDP). Translates high-level natural language goals into multimodal browser actions (clicking, typing, scrolling, extracting structured data, solving interactive web workflows, taking DOM snapshots). Activate when interacting with complex web pages, automating SaaS portals, scraping dynamic single-page applications, or running browser validation workflows.
metadata:
  origin: Antigravity-Core
---

# 🌐 Browser-Use Autonomous Web Agent

This skill defines the **multimodal autonomous browser automation protocol** based on the `browser-use` architecture. It enables Antigravity agents to control live Chromium sessions, parse interactive DOM elements, and execute end-to-end web workflows using natural language directives.

---

## 🎯 When to Use

* **Interactive Web Workflows:** Navigating authenticated SaaS dashboards, submitting multi-step forms, or managing cloud consoles.
* **Dynamic Single-Page Applications (SPAs):** Interacting with client-rendered applications (React, Vue, Next.js) where static HTTP scrapers fail.
* **Visual Web Verification:** Taking full-page or element-level screenshots to audit UI state and visual responsiveness.
* **Complex Data Extraction:** Extracting structured tables, paginated records, and dynamic content trees without brittle manual locators.

---

## 🧭 The 4-Step Browser-Use Interaction Loop

```
1. Observe DOM & Viewport ──► 2. Plan Atomic Action ──► 3. Execute CDP Step ──► 4. Verify State Transition
```

### Step 1: Observe (Index Elements)
- Navigate to the target URL and wait for DOM stabilization (`networkidle` or `domcontentloaded`).
- Extract the filtered interactive element tree, assigning numeric identifiers to interactive nodes (buttons, inputs, links).

### Step 2: Plan Atomic Action
- Map the agent's goal to a specific element index or semantic locator.
- Choose the atomic primitive: `click`, `type`, `scroll`, `hover`, or `select`.

### Step 3: Execute CDP Step
- Dispatch the action through the Chrome DevTools Protocol.
- Handle dynamic overlays, modal dialogs, and cookie consent banners cleanly.

### Step 4: Verify State Transition
- Inspect post-action DOM changes or capture a verification screenshot.
- Ensure the requested mutation completed successfully before proceeding to the next step.

---

## 🛡️ Shannon Security & Operational Guardrails

- [ ] **SSRF & Private Network Isolation:** Never navigate to cloud metadata endpoints (`169.254.169.254`) or unauthorized internal IP ranges.
- [ ] **Credential Protection:** Never log plain-text passwords or secret tokens into browser history or console outputs.
- [ ] **Rate Limiting & Politeness:** Throttle rapid successive clicks to prevent tripping web application firewalls or causing denial-of-service conditions.
