---
name: self-host-openship
description: Self-hosted deployment, continuous integration, and reverse-proxy TLS orchestration based on Openship architecture. Deploys web applications and microservices directly from git repositories onto bare-metal or cloud VPS infrastructure with automated SSL certificates, domain routing, and health checks. Activate when configuring self-hosted PaaS solutions, automating server deployments, or eliminating recurring third-party cloud hosting fees.
metadata:
  origin: Antigravity-Core
---

# 🚢 Self-Host Openship

This skill defines the **self-hosted deployment, CI/CD, and TLS routing standard** (Andy Jassy cost-per-unit discipline / Nikesh Arora perimeter security / Larry Fink sustainable capital infrastructure) for hosting applications without vendor lock-in.

---

## 🎯 When to Use

* **Internal Tool Hosting:** Deploying internal administrative dashboards, CRM portals, or medical databases to private VPS instances.
* **Cost Elimination:** Replacing paid hosting tiers (Vercel, Render, Heroku) with bare-metal or affordable cloud VPS servers.
* **Automated TLS & Routing:** Provisioning automatic Let's Encrypt certificates and reverse-proxy routing for custom domains.
* **Instant Rollbacks:** Rolling back to previous stable application builds with zero downtime.

---

## 🧭 The 4-Stage Deployment Workflow

```
1. Repo & Build Hook ──► 2. Container Compilation ──► 3. TLS Routing ──► 4. Health Audit
```

### Stage 1: Repo Configuration & Build Hook
- Define service manifest (`openship.json` or Dockerfile).
- Declare environment variables securely and attach webhook triggers.

### Stage 2: Container Compilation & Asset Optimization
- Build application bundle in isolated container builder.
- Prune devDependencies to minimize image footprint and attack surface.

### Stage 3: TLS Routing & Reverse Proxy Binding
- Bind application port to reverse proxy.
- Auto-renew SSL/TLS certificates with Let's Encrypt.
- Enforce HTTP to HTTPS redirection and modern TLS 1.3 ciphers.

### Stage 4: Health Audit & Verification
- Execute HTTP health probe (`/healthz` or `/api/status`).
- Verify sub-100ms response time before completing traffic cutover.

---

## 🛡️ Infrastructure Quality Gates

- [ ] **Hardened Headers:** Enforce HSTS, CSP, and X-Content-Type-Options.
- [ ] **Zero Public Plaintext:** Never expose HTTP endpoints without immediate HTTPS redirect.
- [ ] **Resource Limits:** Enforce memory and CPU caps per service container.
