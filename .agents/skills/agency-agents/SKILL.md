---
name: agency-agents
description: Consult and adopt any of the 279 specialized AI agency agents across 18 divisions (Engineering, Software Architecture, Design, Security, Marketing, Sales, GIS, Game Dev, Testing, etc.) on demand from the local agency catalog.
---

# 🎭 The Agency Router (On-Demand Specialist Skill)

This skill provides on-demand access to the complete roster of **279 specialized agents** from **The Agency** stored in [`.agents/agency/`](file:///c:/Users/ferna/Documents/Antigravity%20Project/.agents/agency).

It enables Antigravity to act as any world-class specialist on demand without consuming system context tokens until needed.

---

## 🚀 When to Use

Activate this workflow whenever:
1. The user explicitly requests an Agency specialist or invokes `/agency <slug>` (e.g., `/agency sre`, `/agency database-optimizer`, `/agency security-auditor`).
2. A task involves deep domain specialization where adopting a tailored expert persona, methodology, and deliverable checklist produces superior results, such as:
   - **Architecture & System Design:** Microservices, event-driven systems, domain-driven design (`engineering-software-architect`).
   - **Database & Query Performance:** Slow SQL queries, index strategies, migrations (`engineering-database-optimizer`, `engineering-database-reliability-engineer`).
   - **Reliability & Cloud Operations:** SLOs, error budgets, post-mortems, FinOps (`engineering-sre`, `engineering-finops-engineer`).
   - **UI/UX & Design Systems:** Component design, accessibility audits, CRO walkthroughs (`design-ui-designer`, `design-section-508-specialist`, `design-persona-walkthrough`).
   - **Security Audits:** Smart contract reviews, penetration testing, threat modeling (`security-code-auditor`, `engineering-solidity-smart-contract-engineer`).
   - **Specialized Domains:** GIS/cartography, game mechanics, voice AI pipelines, internationalization, compliance.

---

## 🔍 Discovery & Lookup Workflow

To find and adopt a specialist:

1. **Check the Index:**
   Read [`.agents/agency/INDEX.md`](file:///c:/Users/ferna/Documents/Antigravity%20Project/.agents/agency/INDEX.md) or query [`.agents/agency/catalog.json`](file:///c:/Users/ferna/Documents/Antigravity%20Project/.agents/agency/catalog.json) to locate the relevant agent file.
   
2. **Load the Specialist Profile:**
   Use `view_file` on the corresponding file under `c:/Users/ferna/Documents/Antigravity Project/.agents/agency/<division>/<filename>.md`.

3. **Adopt Personality & Deliverables:**
   - **Identity & Memory:** Adopt the role, mindset, and technical precision specified in the file.
   - **Core Mission & Workflows:** Follow the agent's explicit operational steps and deliverable templates.
   - **Success Metrics:** Verify deliverables against the agent's built-in quality gates and acceptance criteria.

---

## 📂 Roster Map by Division

| Division | Count | Focus Areas | Key Examples |
| :--- | :---: | :--- | :--- |
| **`engineering`** | 64 | Frontend, Backend, Systems, Cloud, DB, AI/ML, Embedded | `software-architect`, `database-optimizer`, `sre`, `finops-engineer` |
| **`specialized`** | 59 | Niche tools, enterprise integrations, custom automation | `voice-ai-integration`, `email-intelligence`, `rag-pipeline` |
| **`marketing`** | 36 | Growth, content, social platforms, global markets | `growth-hacker`, `content-creator`, `seo-specialist` |
| **`game-development`** | 21 | Gameplay mechanics, engines, level design, game economy | `game-mechanics-designer`, `unity-developer`, `unreal-architect` |
| **`security`** | 12 | AppSec, infrastructure, smart contracts, compliance | `incident-response-commander`, `security-auditor` |
| **`design`** | 10 | UI, UX research, brand guidelines, visual storytelling | `ui-designer`, `ux-researcher`, `persona-walkthrough` |
| **`sales`** | 9 | Outbound, deal strategy, pipeline analysis, demos | `deal-strategist`, `outbound-strategist`, `discovery-coach` |
| **`testing`** | 9 | QA, automated E2E, performance testing, test harnesses | `qa-lead`, `test-automator`, `load-testing-specialist` |
| **`gis`** | 13 | Spatial analysis, GIS pipelines, remote sensing | `geospatial-analyst`, `cartographer`, `qgis-specialist` |
| **`project-management`**| 7 | Agile, scrum, roadmap execution, delivery gates | `scrum-master`, `technical-program-manager` |
| **`spatial-computing`** | 6 | AR/VR, Apple Vision Pro, spatial UX | `visionos-developer`, `spatial-audio-designer` |
| **`finance`** | 5 | Financial modeling, DeFi economics, accounting | `financial-analyst`, `defi-tokenomics-architect` |
| **`product`** | 5 | Product strategy, PRDs, discovery, analytics | `product-manager`, `feature-prioritizer` |
| **`academic`** | 6 | Ethnography, geography, history, statistics | `academic-statistician`, `academic-historian` |
| **`support`** | 6 | Customer support, ticket triage, knowledge base | `customer-support-lead`, `kb-curator` |
| **`healthcare`** | 3 | Clinical workflows, HIPAA, health informatics | `clinical-workflow-specialist`, `hipaa-analyst` |
| **`paid-media`** | 7 | PPC, Paid Social, tracking & measurement | `ppc-campaign-strategist`, `tracking-specialist` |
| **`research`** | 1 | Deep literature and domain investigations | `deep-researcher` |

---

## ⚡ Quick Invocation Examples

* **Database Optimization:**
  * File: `.agents/agency/engineering/engineering-database-optimizer.md`
  * Action: Analyzes slow queries, designs normalized/denormalized schemas, configures composite indexes, and plans zero-downtime migrations.
* **FinOps & Cloud Cost Reduction:**
  * File: `.agents/agency/engineering/engineering-finops-engineer.md`
  * Action: Audits unit economics, rightsizes cluster allocations, identifies zombie resources, and establishes cost anomaly alerts.
* **Smart Contract Security:**
  * File: `.agents/agency/engineering/engineering-solidity-smart-contract-engineer.md`
  * Action: Audits EVM reentrancy, integer overflows, gas consumption patterns, and CEI (Checks-Effects-Interactions) compliance.
