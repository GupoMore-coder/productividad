---
name: stealth-browser-obscura
description: High-performance headless browser navigation and anti-detection web scraping for AI agents using Obscura. Evades Cloudflare/Akamai bot-detection, renders complex JavaScript Single Page Applications (SPAs), executes user interaction sequences (clicking, scrolling, typing), and distills DOM trees into token-dense markdown. Activate when scraping dynamic web pages, bypassing aggressive bot blockers, or automating browser sessions.
metadata:
  origin: Antigravity-Core
---

# 🕵️ Stealth Browser Obscura

This skill defines the **stealth web automation protocol** (George Kurtz / Matthew Prince defensive security standard) for extracting content from JavaScript-heavy web applications and platforms with strict anti-bot barriers without triggering 403/429 blocks.

---

## 🎯 When to Use

* **Scraping Protected Web Pages:** When standard `curl` or `fetch` returns Cloudflare Turnstile, 403 Forbidden, or blank JS-rendered HTML.
* **Complex Multi-Step Browser Automations:** Interacting with pages requiring login, button clicks, infinite scroll, or waiting for dynamically populated DOM nodes.
* **Token-Dense DOM Extraction:** Converting bloated, multi-megabyte HTML documents into clean, semantic Markdown stripped of script tags, ads, and navigational noise.

---

## 🧭 The 4-Stage Stealth Scraping Workflow

```
1. Stealth Fingerprint Synthesis ──► 2. Dynamic Rendering ──► 3. Semantic Distillation ──► 4. Session Teardown
```

### Stage 1: Stealth Fingerprint Synthesis
Configure the browser session with realistic human hardware profiles:
- Spoofed WebGL vendor and renderer strings.
- Authentic TLS client hello fingerprints (JA3/JA4 matching standard desktop browsers).
- Correct user-agent, accept-language headers, and viewport dimensions.

### Stage 2: Dynamic Rendering
Wait for critical DOM elements to render before attempting extraction:
```javascript
// Example Obscura interaction pattern
await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('.main-content-container', { timeout: 10000 });
```

### Stage 3: Semantic Distillation
Transform the live DOM into structured Markdown:
- Strip `<script>`, `<style>`, `<iframe>`, `<noscript>`, and SVG decorative tags.
- Convert `<table>` structures into clean Markdown tables.
- Retain image URLs and contextual hyperlinks with descriptive anchor text.

### Stage 4: Session Teardown & Privacy Defense
- Immediately close the browser page and terminate the CDP session.
- Clear ephemeral cookies and local storage to prevent session leakage.

---

## 🛡️ Anti-Abuse and Operational Guardrails

- [ ] **Rate Limiting:** Enforce a minimum delay between subsequent page visits to respect server capacity.
- [ ] **Robots.txt & Terms Compliance:** Inspect target site indexing directives before bulk gathering.
- [ ] **No Credential Leakage:** Sensitive session tokens must be loaded from `.env` and never logged to stdout.
