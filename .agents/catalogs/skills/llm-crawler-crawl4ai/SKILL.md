---
name: llm-crawler-crawl4ai
description: High-speed asynchronous web crawling and LLM-friendly content extraction using Crawl4AI. Converts complex JavaScript-rendered web pages into clean Markdown, structured JSON, and cosine-chunked text for RAG pipelines and coding agents without bloated HTML. Activate when crawling modern single-page apps, preparing web data for RAG ingestion, extracting structured tables, or running batch domain scraping.
metadata:
  origin: Antigravity-Core
---

# 🕷️ LLM Crawler Crawl4AI

This skill formalizes the **asynchronous web extraction standard for language models** (Andy Jassy frugal context optimization / Jeff Bezos customer intelligence acquisition) using Crawl4AI.

---

## 🎯 When to Use

* **RAG Pipeline Ingestion:** Extracting documentation, technical manuals, and whitepapers into clean Markdown without HTML tags.
* **Dynamic JavaScript Scraping:** Capturing content on SPAs rendered via React, Vue, or Angular with full client hydration.
* **Structured Data Extraction:** Pulling repeating rows (pricing tiers, product catalogues, financial releases) directly into JSON.
* **Batch Domain Exploration:** Crawling multi-page sites concurrently with polite rate-limiting.

---

## 🧭 The 4-Step Crawl4AI Extraction Flow

```
1. Target URL Analysis ──► 2. Headless Render & Scroll ──► 3. Semantic Cleaning ──► 4. Structured Output Delivery
```

### Step 1: Target URL Analysis
- Verify destination safety, domain accessibility, and robots directives.
- Determine if dynamic scrolling or wait selectors are required.

### Step 2: Headless Render & Scroll
- Spin up an async Playwright browser instance.
- Execute page interaction scripts, scroll to bottom to trigger lazy-loaded sections, and wait for network stability.

### Step 3: Semantic Cleaning & Chunking
- Strip non-content nodes (`<script>`, `<style>`, `<iframe>`, navigation menus, cookie banners).
- Generate clean Markdown with preserved headers, code fences, and tables.

### Step 4: Structured Output Delivery
- Format payload as Markdown or validate against the target JSON schema.
- Feed output directly into agent context or vector index.

---

## 🛡️ Operational Guardrails

- [ ] **SSRF Isolation:** Strictly prevent requests to internal infrastructure endpoints or cloud metadata services.
- [ ] **Polite Throttling:** Enforce request delays to respect target server limits.
- [ ] **Token Cap:** Enforce max character caps on crawled outputs to prevent context window saturation.
