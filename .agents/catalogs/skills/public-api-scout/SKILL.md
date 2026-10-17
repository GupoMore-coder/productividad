---
name: public-api-scout
description: Universal public API discovery, authentication verification, and typed client scaffolding protocol based on cporter202/API-mega-list. Analyzes project integration needs across industry verticals (finance, geolocation, AI, weather, data scraping, social), matches optimal public APIs, validates auth schemes (OAuth2, ApiKey, CORS), and scaffolds production-ready TypeScript/Python client SDKs with schema validation (Zod/Pydantic). Activate when discovering external APIs, evaluating third-party services, generating API client boilerplate, or designing multi-API data aggregation pipelines.
metadata:
  origin: Antigravity-Core
---

# 🌐 Public API Scout Protocol

This skill operationalizes the **universal public API integration and scouting standard** (Andy Jassy composable primitive architecture / Satya Nadella developer ecosystem interoperability) using the API-mega-list taxonomy.

---

## 🎯 When to Use

* **External Data Ingestion:** Finding authoritative public data providers (currency exchange rates, geopolitical data, real-time weather, stock tickers).
* **Third-Party Service Evaluation:** Comparing authentication friction, rate limits, and CORS policies across candidate APIs for a new feature.
* **Rapid Client SDK Generation:** Scaffolding type-safe API clients in TypeScript (Zod) or Python (Pydantic + httpx) with built-in retry and backoff.
* **Prototyping & Hackathons:** Sourcing free or keyless APIs to build proof-of-concept features without payment card onboarding friction.

---

## 🧭 The 4-Stage API Integration Workflow

```
1. Capability Requirement ──► 2. Directory Matching ──► 3. Auth & CORS Audit ──► 4. Typed Client Scaffolding
```

### Stage 1: Capability Requirement Mapping
- Identify required data points, expected request frequency, and acceptable latency.
- Determine if public/free tier suffices or if enterprise SLA is needed.

### Stage 2: Directory Matching & Screening
- Search API-mega-list catalog by domain vertical (e.g. `finance`, `geolocation`, `nlp`).
- Filter candidate APIs by active maintenance, HTTPS support, and response format (JSON/gRPC).

### Stage 3: Auth & CORS Audit
- Verify credentials requirement (No-Auth, Query Param Key, Header Bearer Token, OAuth2).
- Check browser CORS support if client-side browser fetch is intended.

### Stage 4: Typed Client Scaffolding
- Generate typed interfaces representing API request parameters and response schemas.
- Implement client wrapper with exponential backoff and environment variable secret injection (`process.env.API_KEY`).

---

## 🛡️ Operational Guardrails

- [ ] **Secret Isolation:** Never commit plaintext API keys into version control; inject via environment variables (`.env`).
- [ ] **Rate-Limit Awareness:** Implement client-side throttling to avoid hitting upstream provider HTTP 429 limits.
- [ ] **Schema Validation:** Always parse external responses through validation schemas (Zod/Pydantic) to guard against unexpected upstream payload changes.
