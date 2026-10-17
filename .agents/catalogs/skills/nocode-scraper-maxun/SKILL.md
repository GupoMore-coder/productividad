---
name: nocode-scraper-maxun
description: No-code web data extraction and robotic web-to-API automation based on Maxun architecture. Builds autonomous extraction robots for paginated catalogs, competitor pricing, and dynamic portals with proxy routing (BYOP) to turn uncooperative websites into clean structured APIs. Activate when automating recurrent web monitoring, scraping multi-page directories, extracting e-commerce catalogs, or building live web data pipelines.
metadata:
  origin: Antigravity-Core
---

# 🤖 No-Code Web Scraper Maxun

This skill operationalizes the **robotic web-to-API data extraction standard** (Philip Kotler strategic market analysis / Ngozi Okonjo-Iweala supply-chain monitoring) using Maxun.

---

## 🎯 When to Use

* **Competitor & Price Intelligence:** Scraping e-commerce catalogs, product prices, and stock levels across competitors.
* **Directory & Lead Harvesting:** Extracting paginated supplier registries, public tenders, and partner directories.
* **No-Code Web-to-API Pipelines:** Transforming legacy static websites into fresh, queryable JSON endpoints.
* **Scheduled Change Detection:** Monitoring dynamic portals for policy updates, tariff modifications, or inventory shifts.

---

## 🧭 The 4-Step Robotic Scraping Cycle

```
1. Target Inspection ──► 2. Robot Specification ──► 3. Execution & Pagination ──► 4. Dataset Reconciliation
```

### Step 1: Target Inspection
- Inspect target DOM for repeating container cards and list structures.
- Identify the pagination mechanism (numeric links, "Next" button, or infinite scroll).

### Step 2: Robot Specification
- Define mapped field targets (title, price, description, image, link).
- Configure BYOP proxies if rate-limits or anti-bot obstacles are present.

### Step 3: Execution & Pagination
- Trigger robot run with bounded depth to prevent runaways.
- Handle dynamic loading states and lazy DOM updates gracefully.

### Step 4: Dataset Reconciliation
- Validate extracted data for schema completeness and null ratios.
- Export to structured JSON or CSV for business intelligence ingestion.

---

## 🛡️ Guardrails

- [ ] **Polite Scraping:** Never overload target servers; set appropriate delays between paginated requests.
- [ ] **Proxy Safety:** Keep private proxy credentials securely masked in environment variables.
- [ ] **Data Validation:** Flag records with missing required fields before committing to database ledgers.
