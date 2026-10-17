---
name: selfhosted-paas-coolify
description: Self-hosted Platform-as-a-Service (PaaS) orchestration and application deployment based on Coolify. Manages bare-metal and VPS infrastructure via SSH, automates Git push-to-deploy workflows with auto-renewing Let's Encrypt TLS, provisions production databases with automated backup policies, and controls container lifecycles without vendor lock-in or recurring PaaS markups under Andy Jassy frugality principles. Activate when deploying web applications, configuring multi-server production infrastructure, provisioning isolated database instances, or automating CI/CD pipelines on private servers.
metadata:
  origin: Antigravity-Core
---

# 🚀 Self-Hosted PaaS Coolify

This skill defines the **sovereign platform-as-a-service orchestration standard** (Andy Jassy extreme operational frugality / George Kurtz private infrastructure control) using Coolify.

---

## 🎯 When to Use

* **Sovereign Application Deployment:** Shipping full-stack apps (Next.js, Node, Python, Go, PHP) to private VPSs without Heroku/Vercel platform markups.
* **Multi-Server Fleet Operations:** Managing separate staging, production, and database servers through a single control plane.
* **Automated TLS & Routing:** Configuring reverse proxy routing and auto-renewing SSL certificates via Traefik.
* **Turnkey Managed Databases:** Bootstrapping persistent database instances (PostgreSQL, Redis, ClickHouse) with automated offsite backups.

---

## 🧭 The 4-Step Coolify Deployment Protocol

```
1. Server Health & Target Selection ──► 2. Build Config & Secrets ──► 3. Atomic Deployment ──► 4. Live Health Verification
```

### Step 1: Server Health & Target Selection
- Verify target host connectivity, disk headroom, and memory availability.
- Select target cluster or standalone VPS node.

### Step 2: Build Config & Secrets
- Determine buildpack type (Nixpacks auto-detection, Dockerfile, or Docker Compose).
- Inject required environment variables safely through encrypted secret stores.

### Step 3: Atomic Deployment
- Trigger Git-based deployment with zero-downtime container swapping.
- Map domain name and verify that Let's Encrypt SSL certificates issue successfully.

### Step 4: Live Health Verification
- Poll HTTP health endpoints and inspect Traefik routing logs.
- Verify database connectivity and seed migrations if applicable.

---

## 🛡️ Infrastructure Guardrails

- [ ] **No Plain-Text Credentials:** Never commit `.env` files or master database passwords into git history.
- [ ] **Backup Verification:** Ensure automated database backup targets (e.g., S3/MinIO) are reachable before declaring production readiness.
- [ ] **Resource Limits:** Enforce container CPU and RAM quotas to prevent rogue tasks from starving the host OS.
