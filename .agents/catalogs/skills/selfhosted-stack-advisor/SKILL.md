---
name: selfhosted-stack-advisor
description: Sovereign self-hosted software advisor and SaaS migration architecture protocol based on awesome-selfhosted/awesome-selfhosted. Analyzes proprietary cloud subscriptions (Jira, Slack, Zapier, Notion, Google Workspace), identifies mature open-source alternatives, evaluates license and maintenance health, and generates production Docker Compose manifests with TLS reverse proxies and automated backup pipelines. Activate when reducing cloud SaaS expenses, migrating to self-hosted infrastructure, or architecting private on-premise business tooling.
metadata:
  origin: Antigravity-Core
---

# 🌐 Self-Hosted Stack Advisor Protocol

This skill operationalizes the **sovereign self-hosted infrastructure and SaaS migration standard** (Warren Buffett operational cost elimination / Satya Nadella infrastructure portability) using the awesome-selfhosted catalog.

---

## 🎯 When to Use

* **SaaS Subscription Optimization:** Auditing recurrent software expenses and identifying drop-in open-source replacements (e.g. Jira ➔ TaskView/Plane, Zapier ➔ n8n, Slack ➔ Mattermost).
* **On-Premise Enterprise Scaffolding:** Generating containerized deployments with automated HTTPS (Caddy/Traefik) and PostgreSQL/MySQL storage.
* **License & Compliance Audits:** Ensuring candidate open-source software aligns with corporate IP policies (MIT/Apache vs AGPL vs SSPL).
* **High-Availability Self-Hosting:** Designing automated volume backup strategies, health checks, and zero-downtime updates.

---

## 🧭 The 4-Stage Migration Workflow

```
1. SaaS TCO Audit ──► 2. Candidate Taxonomy Matching ──► 3. Compose Scaffolding ──► 4. Backup & Health Gate
```

### Stage 1: SaaS TCO & Feature Audit
- Catalog proprietary service features used by the organization.
- Calculate annualized subscription cost across total seats.

### Stage 2: Candidate Taxonomy Matching
- Search the awesome-selfhosted directory for matching functional categories.
- Screen candidates by commit frequency, documentation quality, Docker availability, and license permissiveness.

### Stage 3: Compose Scaffolding & Proxy Wiring
- Generate `docker-compose.yml` with:
  - Application container + explicit non-root user.
  - Dedicated network isolation.
  - Reverse proxy container (Caddy / Traefik) handling automatic Let's Encrypt TLS.
  - Environment variable secrets externalized via `.env`.

### Stage 4: Backup & Health Gate
- Add automated database dump cron jobs (e.g., `pg_dump` to local encrypted storage or S3-compatible bucket).
- Configure container health checks and restart policies (`unless-stopped`).

---

## 🛡️ Operational Guardrails

- [ ] **Hardened Secret Management:** Never hardcode passwords or encryption keys directly in Compose files.
- [ ] **Automated Backup Verification:** Every deployed self-hosted service must include a tested database backup and restore script.
- [ ] **Resource Sizing:** Audit host CPU/RAM requirements before deployment to ensure adequate headroom.
