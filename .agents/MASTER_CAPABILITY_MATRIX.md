# 🌐 Antigravity: Matriz Maestra de Capacidades e Intenciones

> **Directorio y mapa de orquestación automática para todos los activos de Antigravity.**

**Total de Activos Indexados:** 1059 especialistas, habilidades, reglas y síntesis especializadas.

---

## 📊 Censo General de Infraestructura

| Componente | Cantidad | Ubicación | Función |
| :--- | :---: | :--- | :--- |
| **The Agency Agents** | 279 | `.agents/agency/` | Especialistas de rol con personalidades y procesos (On-Demand) |
| **Project Skills (Biblioteca On-Demand)** | 365 | `.agents/catalogs/skills/` | Conocimiento técnico, arquitecturas y metodologías cargadas dinámicamente |
| **Meta-Orquestadores Activos** | 2 | `.agents/skills/` | Auto-orquestador e indexador persistentes del IDE |
| **Reviewers & Resolvers (ECC)** | 68 | `.agents/agents/` | Agentes evaluadores, de compilación y PR review |
| **Reglas de Codificación** | 122 | `.agents/rules/` | Guías de estilo, seguridad y patrones por lenguaje |
| **Workflows Automatizados** | 99 | `.agents/workflows/` | Comandos slash y flujos interactivos de alto nivel |
| **Módulos y Catálogos Especializados** | 91 | `.agents/catalogs/` | Síntesis densa de biomecánica, ortopedia y protocolos MCP |
| **Skills Globales Cloud** | 33 | `~/.gemini/config/skills/` | Capacidades GCP, BigQuery y Telemetría |

---

## 🧭 Dominios Técnicos y Triadas de Auto-Despacho

Cada vez que se procesa una petición, el sistema identifica el dominio y conforma automáticamente la **Tríada Óptima**: (1) Agente Especialista + (2) Habilidades y Patrones + (3) Reglas y Compuertas de Calidad.

### 🎯 Dominio: Frontend, UI & Design Systems (`frontend_ui`)

* **Palabras clave / Triggers:** `react, vue, angular, css, html, ui, ux, component, frontend, tailwind`...
* **Agentes Lead:** `agency-frontend-developer`, `agency-ui-designer`, `design-ux-architect`
* **Skills de Soporte:** `react-patterns`, `vue-patterns`, `frontend-a11y`, `make-interfaces-feel-better`, `motion-ui`, `frontend-patterns`
* **Reglas de Calidad:** `react-coding-style`, `react-hooks`, `react-patterns`, `web-coding-style`, `web-design-quality`
* **Reviewers:** `react-reviewer`, `agency-code-reviewer`, `a11y-architect`

### 🎯 Dominio: Backend, APIs & Distributed Services (`backend_api`)

* **Palabras clave / Triggers:** `api, backend, fastapi, django, endpoint, rest, graphql, microservices, service, node`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`, `engineering-api-platform-engineer`
* **Skills de Soporte:** `api-design`, `contract-first`, `fastapi-patterns`, `django-patterns`, `golang-patterns`, `python-patterns`
* **Reglas de Calidad:** `python-coding-style`, `python-fastapi`, `python-patterns`, `golang-coding-style`, `golang-patterns`
* **Reviewers:** `fastapi-reviewer`, `django-reviewer`, `go-reviewer`

### 🎯 Dominio: Databases, Migrations & Data Engineering (`database_data`)

* **Palabras clave / Triggers:** `sql, database, postgres, mysql, clickhouse, query, index, migration, schema, db`...
* **Agentes Lead:** `agency-database-optimizer`, `engineering-database-reliability-engineer`, `engineering-data-engineer`
* **Skills de Soporte:** `postgres-patterns`, `mysql-patterns`, `database-migrations`, `clickhouse-io`, `redis-patterns`, `data-throughput-accelerator`
* **Reglas de Calidad:** `common-performance`, `common-security`, `web-security`
* **Reviewers:** `database-reviewer`, `agency-code-reviewer`

### 🎯 Dominio: Security, Authentication & Compliance (`security_auth`)

* **Palabras clave / Triggers:** `security, auth, oauth, jwt, token, vulnerability, audit, sanitization, csrf, xss`...
* **Agentes Lead:** `engineering-identity-access-engineer`, `specialized-security-bounty-hunter`, `engineering-privacy-engineer`
* **Skills de Soporte:** `security-review`, `shannon-pentest`, `gateguard`, `safety-guard`, `hipaa-compliance`, `quarkus-security`
* **Reglas de Calidad:** `common-security`, `web-security`, `python-security`, `react-security`, `typescript-security`
* **Reviewers:** `security-reviewer`, `incident-response-commander`, `agency-code-reviewer`

### 🎯 Dominio: DevOps, SRE, Cloud & Observability (`devops_sre_cloud`)

* **Palabras clave / Triggers:** `devops, ci/cd, pipeline, docker, kubernetes, cloud, aws, gcp, sre, slo, dependencies, centinela, rendimiento, latencia, escalabilidad`...
* **Agentes Lead:** `engineering-devops-automator`, `engineering-sre`, `engineering-finops-engineer`, `engineering-platform-engineer`
* **Skills de Soporte:** `docker-patterns`, `kubernetes-patterns`, `dashboard-builder`, `deployment-patterns`, `cost-tracking`, `canary-watch`, `dependency-doctor`
* **Reglas de Calidad:** `common-performance`, `common-development-workflow`, `performance-sentinel-governance`
* **Reviewers:** `build-error-resolver`, `performance-optimizer`

### 🎯 Dominio: Testing, QA & Validation Verification (`testing_qa`)

* **Palabras clave / Triggers:** `test, testing, tdd, unit test, e2e, playwright, vitest, jest, pytest, mock`...
* **Agentes Lead:** `testing-qa-lead`, `testing-test-automator`, `testing-load-testing-specialist`
* **Skills de Soporte:** `tdd-workflow`, `verification-loop`, `python-testing`, `react-testing`, `e2e-testing`, `django-tdd`
* **Reglas de Calidad:** `common-testing`, `react-testing`, `python-testing`, `web-testing`
* **Reviewers:** `e2e-runner`, `pr-test-analyzer`, `tdd-guide`

### 🎯 Dominio: System Architecture, Planning & Refactoring (`architecture_planning`)

* **Palabras clave / Triggers:** `architecture, plan, design system, refactor, ddd, hexagonal, monolith, clean code, adr, structure, diff, legacy`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`, `engineering-minimal-change-engineer`
* **Skills de Soporte:** `hexagonal-architecture`, `intent-driven-development`, `architecture-decision-records`, `refactor-clean`, `scope-creep-detector`, `commit-archaeologist`
* **Reglas de Calidad:** `common-development-workflow`, `common-coding-style`, `common-patterns`
* **Reviewers:** `architect`, `code-architect`, `refactor-cleaner`

### 🎯 Dominio: Smart Contracts, Web3 & Cryptography (`smart_contracts_web3`)

* **Palabras clave / Triggers:** `solidity, smart contract, evm, ethereum, web3, defi, gas, token, erc20, crypto`...
* **Agentes Lead:** `engineering-solidity-smart-contract-engineer`, `finance-defi-tokenomics-architect`
* **Skills de Soporte:** `defi-amm-security`, `evm-token-decimals`, `nodejs-keccak256`, `llm-trading-agent-security`
* **Reglas de Calidad:** `common-security`
* **Reviewers:** `security-reviewer`, `agency-code-reviewer`

### 🎯 Dominio: Marketing, Growth, Product & Sales (`marketing_growth_product`)

* **Palabras clave / Triggers:** `marketing, seo, growth, copywriting, social, campaign, funnel, product, sales, outreach, proposal, brief`...
* **Agentes Lead:** `marketing-growth-hacker`, `marketing-seo-specialist`, `marketing-content-creator`, `sales-deal-strategist`, `product-product-manager`
* **Skills de Soporte:** `market-research`, `marketing-campaign`, `lead-intelligence`, `product-lens`, `seo`, `social-publisher`, `first-reader`
* **Reglas de Calidad:** `web-design-quality`
* **Reviewers:** `seo-specialist`, `marketing-agent`

### 🎯 Dominio: Medical, Orthopedics, Biomechanics & Clinical AI (`medical_ortho_biomechanics`)

* **Palabras clave / Triggers:** `medical, ortho, orthopedic, biomechanics, bone, fracture, pelvic, femur, opensim, slicer`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`, `engineering-backend-architect`
* **Skills de Soporte:** `hipaa-compliance`, `surgical-slicer-planning`, `biomechanics-opensim`, `fracture-detection-atlas`, `anatomy-cad-modeling`, `monai-imaging-pipeline`
* **Reglas de Calidad:** `hipaa-compliance`, `common-security-gate`, `common-security`, `web-security`
* **Reviewers:** `agency-code-reviewer`, `security-reviewer`

### 🎯 Dominio: Document Intelligence, Multimodal Extraction & Filesystem Operations (`document_filesystem_ai`)

* **Palabras clave / Triggers:** `docling, pdf, docx, parse, ocr, extract table, organize files, deduplicate, rename files, document, file organizer, clean folder, lancedb, document indexer`...
* **Agentes Lead:** `engineering-backend-architect`, `agency-software-architect`, `engineering-data-engineer`
* **Skills de Soporte:** `docling-document-intelligence`, `atomic-file-organizer`, `accidental-data-loss-prevention`
* **Reglas de Calidad:** `common-security`, `common-development-workflow`, `accidental-data-loss-prevention`
* **Reviewers:** `agency-code-reviewer`, `security-reviewer`
* **MCPs de Soporte (Bajo Demanda):** `docling-mcp`, `file-organizer-mcp`, `document-indexer-mcp`

### 🎯 Dominio: Agentic Memory, Social Research & Swarm Prediction (`agentic_memory_swarm_ai`)

* **Palabras clave / Triggers:** `engram, memanto, memory, remember, persist context, social research, twitter, reddit, agent reach, mirofish, swarm intelligence, simulation, predict, what-if, handoff`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`, `marketing-growth-hacker`
* **Skills de Soporte:** `persistent-agentic-memory`, `social-web-reach`, `swarm-simulation-prediction`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`, `web-security`
* **Reviewers:** `agency-code-reviewer`, `security-reviewer`
* **MCPs de Soporte (Bajo Demanda):** `engram-mcp`, `agent-reach-mcp`

### 🎯 Dominio: Workflow Automation, Conversational Agents & Agentic CRM (`workflow_automation_and_conversational_crm`)

* **Palabras clave / Triggers:** `n8n, workflow, automation, whatsapp, conversational agent, crm, compai, grill-me, context.md, adr, align, lead, customer, webhook, meta api`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`, `engineering-api-platform-engineer`
* **Skills de Soporte:** `engineering-alignment-grill`, `agentic-crm-ledger`, `whatsapp-conversational-agent`
* **Reglas de Calidad:** `common-security`, `web-security`, `common-development-workflow`
* **Reviewers:** `agency-code-reviewer`, `security-reviewer`
* **MCPs de Soporte (Bajo Demanda):** `n8n-mcp`, `hermes-agent`

### 🎯 Dominio: Multi-Agent Blueprints & SDLC Intelligence (`awesome_llm_apps_and_sdlc`)

* **Palabras clave / Triggers:** `awesome llm apps, agent blueprints, multi-agent patterns, due diligence agent, fraud agent, voice agent, vision rag, scope creep, commit archaeology, dependency audit`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`, `specialized-planner`
* **Skills de Soporte:** `scope-creep-detector`, `commit-archaeologist`, `dependency-doctor`, `first-reader`
* **Reglas de Calidad:** `common-security`, `web-security`, `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `awesome-llm-apps.md` (`.agents/catalogs/mcp-registry/awesome-llm-apps.md`)

### 🎯 Dominio: Omnichannel Agent Mesh & Continual Learning (`hermes_agent_and_mesh`)

* **Palabras clave / Triggers:** `hermes agent, messaging gateway, telegram bot, whatsapp gateway, slack agent, subagent delegation, autonomous skill, honcho, self-created skills, rpc sandbox`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`, `specialized-planner`
* **Skills de Soporte:** `agent-messaging-gateway`, `autonomous-skill-synthesis`, `persistent-agentic-memory`
* **Reglas de Calidad:** `common-security`, `web-security`, `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `hermes-agent.md` (`.agents/catalogs/mcp-registry/hermes-agent.md`)

### 🎯 Dominio: Mobile Automation & Android E2E (`mobile_android_automation`)

* **Palabras clave / Triggers:** `android, mobile, artemis, adb, logcat, apk, mobile test, pwa mobile, ui hierarchy, touch interaction`...
* **Agentes Lead:** `agency-software-architect`, `testing-qa-lead`, `agency-frontend-developer`
* **Skills de Soporte:** `android-agent-artemis`, `e2e-testing`, `verification-loop`
* **Reglas de Calidad:** `common-testing`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `artemis-android.md` (`.agents/catalogs/mcp-registry/artemis-android.md`)

### 🎯 Dominio: Executive Engineering Leadership & YC Roles (`executive_gstack_leadership`)

* **Palabras clave / Triggers:** `gstack, ceo lens, eng manager, release manager, doc engineer, blast radius, technical debt, rollback readiness, y combinator`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`, `product-product-manager`
* **Skills de Soporte:** `executive-gstack-roles`, `scope-creep-detector`, `architecture-decision-records`
* **Reglas de Calidad:** `common-development-workflow`, `web-design-quality`
* **Registros & MCPs (Bajo Demanda):** `gstack-tools.md` (`.agents/catalogs/mcp-registry/gstack-tools.md`)

### 🎯 Dominio: Stealth Web Scraping & Headless Engine (`stealth_web_scraping`)

* **Palabras clave / Triggers:** `obscura, stealth browser, headless, anti-bot, cloudflare bypass, dynamic rendering, dom to markdown, web scraper`...
* **Agentes Lead:** `engineering-backend-architect`, `engineering-data-engineer`, `specialized-security-bounty-hunter`
* **Skills de Soporte:** `stealth-browser-obscura`, `social-web-reach`, `atomic-file-organizer`
* **Reglas de Calidad:** `web-security`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `obscura-browser.md` (`.agents/catalogs/mcp-registry/obscura-browser.md`)

### 🎯 Dominio: Open Model Reasoning & Plugin Harness (`deepseek_reasoning_harness`)

* **Palabras clave / Triggers:** `deepseek, harness, cot, reasoning trace, plugin schema, tool calling benchmark, reasoning loop`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `autonomous-skill-synthesis`, `tdd-workflow`, `verification-loop`
* **Reglas de Calidad:** `common-development-workflow`, `common-performance`
* **Registros & MCPs (Bajo Demanda):** `deepseek-harness.md` (`.agents/catalogs/mcp-registry/deepseek-harness.md`)

### 🎯 Dominio: Workplace Agent Governance & Cost Capping (`agent_workplace_governance`)

* **Palabras clave / Triggers:** `paperclip, agent governance, budget cap, token spending, human-in-the-loop, approval gate, multi-agent fleet, swarm management`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`, `engineering-finops-engineer`
* **Skills de Soporte:** `agent-workplace-governance`, `cost-tracking`, `token-budget-advisor`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `paperclip-orchestrator.md` (`.agents/catalogs/mcp-registry/paperclip-orchestrator.md`)

### 🎯 Dominio: Zero-Trust Infrastructure Bastion & Terminal Ops (`zero_trust_infrastructure`)

* **Palabras clave / Triggers:** `oneterm, bastion, ssh, kubernetes access, db proxy, zero trust terminal, audited shell, infrastructure gateway`...
* **Agentes Lead:** `engineering-devops-automator`, `engineering-sre`, `engineering-identity-access-engineer`
* **Skills de Soporte:** `zero-trust-terminal-ops`, `terminal-ops`, `security-review`
* **Reglas de Calidad:** `common-security`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `oneterm-bastion.md` (`.agents/catalogs/mcp-registry/oneterm-bastion.md`)

### 🎯 Dominio: Local Interpreter Sandbox & Interactive Code Execution (`local_interpreter_sandbox`)

* **Palabras clave / Triggers:** `open interpreter, code execution, local sandbox, python runner, interactive subshell, system metrics, output interception`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`, `specialized-planner`
* **Skills de Soporte:** `local-interpreter-sandbox`, `python-patterns`, `verification-loop`
* **Reglas de Calidad:** `common-development-workflow`, `python-coding-style`
* **Registros & MCPs (Bajo Demanda):** `open-interpreter.md` (`.agents/catalogs/mcp-registry/open-interpreter.md`)

### 🎯 Dominio: AI-Native Knowledge Base & Semantic Notes (`edgeever_knowledge_base`)

* **Palabras clave / Triggers:** `edgeever, knowledge base, notes, evernote alternative, mcp notes, hybrid vector search, d1 storage, personal wiki`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`, `specialized-planner`
* **Skills de Soporte:** `mcp-edgeever-knowledge`, `docling-document-intelligence`, `atomic-file-organizer`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `edgeever-kb.md` (`.agents/catalogs/mcp-registry/edgeever-kb.md`)

### 🎯 Dominio: Conversational RPA & Group Chat Automation (`conversational_rpa_wechaty`)

* **Palabras clave / Triggers:** `wechaty, conversational rpa, chat bot, wechat bot, group chat moderation, puppet bridge, customer service bot`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `conversational-rpa-wechaty`, `agent-messaging-gateway`, `whatsapp-conversational-agent`
* **Reglas de Calidad:** `common-security`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `wechaty-rpa.md` (`.agents/catalogs/mcp-registry/wechaty-rpa.md`)

### 🎯 Dominio: Lean Engineering Project Tracking (`lean_project_kaneo`)

* **Palabras clave / Triggers:** `kaneo, lean project, task tracker, issue management, sprint burndown, blocker triage, agile velocity`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`, `product-product-manager`
* **Skills de Soporte:** `lean-project-kaneo`, `scope-creep-detector`, `architecture-decision-records`
* **Reglas de Calidad:** `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `kaneo-pm.md` (`.agents/catalogs/mcp-registry/kaneo-pm.md`)

### 🎯 Dominio: Calibrated Content Experimentation & Growth (`viral_content_growth`)

* **Palabras clave / Triggers:** `cheat on content, viral hooks, blind predict, post retrospective, content evolution, brand positioning, audience growth`...
* **Agentes Lead:** `marketing-growth-hacker`, `marketing-content-creator`, `specialized-planner`
* **Skills de Soporte:** `viral-content-experimentation`, `first-reader`, `marketing-campaign`
* **Reglas de Calidad:** `web-design-quality`
* **Registros & MCPs (Bajo Demanda):** `content-cheat-growth.md` (`.agents/catalogs/mcp-registry/content-cheat-growth.md`)

### 🎯 Dominio: Autonomous Software Engineering & Sandbox Execution (`autonomous_swe_openhands`)

* **Palabras clave / Triggers:** `openhands, opendevin, autonomous swe, issue to pr, sandbox exec, docker microvm, code patch, auto refactor`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`, `specialized-planner`
* **Skills de Soporte:** `autonomous-swe-openhands`, `tdd-workflow`, `verification-loop`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `openhands-engineer.md` (`.agents/catalogs/mcp-registry/openhands-engineer.md`)

### 🎯 Dominio: Enterprise Agentic Workflows & Multi-Stage RAG (`agentic_rag_dify`)

* **Palabras clave / Triggers:** `dify, agentic workflow, dag engine, enterprise rag, hybrid search, bm25, rerank, dataset sync, prompt studio`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `agentic-rag-dify`, `contract-first`, `docling-document-intelligence`
* **Reglas de Calidad:** `common-development-workflow`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `dify-workflow.md` (`.agents/catalogs/mcp-registry/dify-workflow.md`)

### 🎯 Dominio: Universal AI Chat UI & Multimodal MCP Client (`multimodal_mcp_librechat`)

* **Palabras clave / Triggers:** `librechat, universal chat, multi-model hub, mcp client, code artifacts, react panel, preset manager, rbac auth`...
* **Agentes Lead:** `agency-frontend-developer`, `agency-ui-designer`, `agency-software-architect`
* **Skills de Soporte:** `multimodal-mcp-librechat`, `react-patterns`, `motion-ui`
* **Reglas de Calidad:** `react-coding-style`, `web-design-quality`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `librechat-interface.md` (`.agents/catalogs/mcp-registry/librechat-interface.md`)

### 🎯 Dominio: AI Telephony, Voice Assistants & SIP/WebRTC (`ai_telephony_voice_agent`)

* **Palabras clave / Triggers:** `tel-agent, telephony, sip, webrtc, asterisk, twilio, vad, barge-in, voice agent, phone call, hotline, speech to speech`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `ai-telephony-voice-agent`, `whatsapp-conversational-agent`, `agent-messaging-gateway`
* **Reglas de Calidad:** `common-security`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `tel-agent-telephony.md` (`.agents/catalogs/mcp-registry/tel-agent-telephony.md`)

### 🎯 Dominio: Long-Term Adaptive Cognitive Agent Memory (`adaptive_memory_hindsight`)

* **Palabras clave / Triggers:** `hindsight, long-term memory, episodic memory, retain recall reflect, memory decay, contradiction resolution, longmemeval`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`
* **Skills de Soporte:** `adaptive-memory-hindsight`, `persistent-agentic-memory`, `mcp-edgeever-knowledge`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `hindsight-memory.md` (`.agents/catalogs/mcp-registry/hindsight-memory.md`)

### 🎯 Dominio: Ultra-Fast Document Parsing & Markdown Extraction (`fast_doc_parsing_anydoc`)

* **Palabras clave / Triggers:** `anydoc, parse docx, parse xlsx, parse pptx, office to markdown, fast document parser, rust parser`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `rust-doc-parser-anydoc`, `docling-document-intelligence`, `atomic-file-organizer`
* **Reglas de Calidad:** `common-performance`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `anydoc-parser.md` (`.agents/catalogs/mcp-registry/anydoc-parser.md`)

### 🎯 Dominio: Component-Driven React PDF Generation (`modular_react_pdf_pdfcn`)

* **Palabras clave / Triggers:** `pdfcn, react pdf, invoice pdf, print template, forme engine, takumi, shadcn pdf, export pdf`...
* **Agentes Lead:** `agency-frontend-developer`, `agency-software-architect`
* **Skills de Soporte:** `react-pdf-generator-pdfcn`, `react-patterns`, `motion-ui`
* **Reglas de Calidad:** `react-coding-style`, `web-design-quality`
* **Registros & MCPs (Bajo Demanda):** `pdfcn-generator.md` (`.agents/catalogs/mcp-registry/pdfcn-generator.md`)

### 🎯 Dominio: Technical Corpus to Agent Skill Compiler (`corpus_synthesis_book_to_skill`)

* **Palabras clave / Triggers:** `book to skill, corpus synthesis, manual to skill, extract decision tree, booklin, distill textbook, skill compiler`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`
* **Skills de Soporte:** `corpus-to-agent-skill`, `autonomous-skill-synthesis`, `persistent-agentic-memory`
* **Reglas de Calidad:** `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `book-to-skill.md` (`.agents/catalogs/mcp-registry/book-to-skill.md`)

### 🎯 Dominio: Anti-Slop Design, Copy & Code Craftsmanship (`craftsmanship_guard_anti_slop`)

* **Palabras clave / Triggers:** `anti-slop, antislop, design guardrail, purge generic ai, luxury ui, bespoke palette, ban purple gradient, authentic copy`...
* **Agentes Lead:** `agency-ui-designer`, `agency-frontend-developer`, `marketing-content-creator`
* **Skills de Soporte:** `anti-slop-design-guard`, `make-interfaces-feel-better`, `first-reader`
* **Reglas de Calidad:** `web-design-quality`, `react-coding-style`
* **Registros & MCPs (Bajo Demanda):** `anti-slop-guard.md` (`.agents/catalogs/mcp-registry/anti-slop-guard.md`)

### 🎯 Dominio: High-Fidelity Voice Cloning & Media Dubbing (`voice_studio_cloning`)

* **Palabras clave / Triggers:** `voicestudio, voice cloning, clone voice, dub video, speech synthesis, timed dubbing, local tts, kokoro, omnivoice`...
* **Agentes Lead:** `agency-software-architect`, `marketing-content-creator`
* **Skills de Soporte:** `voice-studio-cloning`, `ai-telephony-voice-agent`, `whatsapp-conversational-agent`
* **Reglas de Calidad:** `common-security`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `voicestudio-synthesis.md` (`.agents/catalogs/mcp-registry/voicestudio-synthesis.md`)

### 🎯 Dominio: Local Real-Time Multimodal Voice & Vision Layer (`multimodal_realtime_openlive`)

* **Palabras clave / Triggers:** `openlive, screen vision, realtime audio, ears mouth eyes, live screen capture, audio loop, multimodal copilot, barge-in`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`
* **Skills de Soporte:** `multimodal-realtime-openlive`, `ai-telephony-voice-agent`, `verification-loop`
* **Reglas de Calidad:** `common-security`, `common-performance`
* **Registros & MCPs (Bajo Demanda):** `openlive-realtime.md` (`.agents/catalogs/mcp-registry/openlive-realtime.md`)

### 🎯 Dominio: Universal Multi-Channel Push Notifications (`unified_push_apprise`)

* **Palabras clave / Triggers:** `apprise, push notification, telegram alert, discord alert, slack alert, sms notification, multi-channel webhook, alert dispatcher`...
* **Agentes Lead:** `engineering-devops-automator`, `engineering-sre`, `agency-software-architect`
* **Skills de Soporte:** `unified-push-apprise`, `agent-messaging-gateway`, `security-review`
* **Reglas de Calidad:** `common-security`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `apprise-notifications.md` (`.agents/catalogs/mcp-registry/apprise-notifications.md`)

### 🎯 Dominio: Computer-Use 2.0 & Background Desktop Automation (`computer_use_cua`)

* **Palabras clave / Triggers:** `cua, computer use, background desktop, accessibility tree, lume, cua spaces, dual cursor, desktop automation`...
* **Agentes Lead:** `agency-software-architect`, `engineering-devops-automator`
* **Skills de Soporte:** `computer-use-cua`, `stealth-browser-obscura`, `local-interpreter-sandbox`
* **Reglas de Calidad:** `common-security`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `cua-computer-use.md` (`.agents/catalogs/mcp-registry/cua-computer-use.md`)

### 🎯 Dominio: Parallel Agent Fleets & Git Worktree Isolation (`parallel_ade_orca`)

* **Palabras clave / Triggers:** `orca, agent fleet, worktree, parallel agents, ade, git worktree isolation, multi-agent development, linear sync`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`, `engineering-devops-automator`
* **Skills de Soporte:** `parallel-ade-orca`, `agent-workplace-governance`, `tdd-workflow`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `orca-agent-fleet.md` (`.agents/catalogs/mcp-registry/orca-agent-fleet.md`)

### 🎯 Dominio: Local-First Agent OS & Multi-Surface Messaging (`local_agent_os_avibe`)

* **Palabras clave / Triggers:** `avibe, agent os, local first agent, workbench, durable harness, file watcher, persistent state, omni-surface`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `local-agent-os-avibe`, `agent-messaging-gateway`, `conversational-rpa-wechaty`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `avibe-agent-os.md` (`.agents/catalogs/mcp-registry/avibe-agent-os.md`)

### 🎯 Dominio: Ambient Agent Telemetry & Out-of-Window Approvals (`ambient_telemetry_coucou`)

* **Palabras clave / Triggers:** `coucou, ambient monitor, screen notch, permission approval, human in the loop gate, glanceable telemetry, mobile companion`...
* **Agentes Lead:** `agency-ui-designer`, `agency-software-architect`
* **Skills de Soporte:** `ambient-telemetry-coucou`, `make-interfaces-feel-better`, `security-review`
* **Reglas de Calidad:** `web-design-quality`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `coucou-ambient-monitor.md` (`.agents/catalogs/mcp-registry/coucou-ambient-monitor.md`)

### 🎯 Dominio: High-Performance Rust Agent Memory & TokenJuice (`rust_agent_openhuman`)

* **Palabras clave / Triggers:** `openhuman, tokenjuice, token compression, rust agent, sqlite vault, obsidian memory, context reduction`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `rust-agent-openhuman`, `adaptive-memory-hindsight`, `cost-tracking`
* **Reglas de Calidad:** `common-development-workflow`, `common-performance`
* **Registros & MCPs (Bajo Demanda):** `openhuman-memory.md` (`.agents/catalogs/mcp-registry/openhuman-memory.md`)

### 🎯 Dominio: Microsoft Phi SLM Edge Deployment & ONNX GenAI (`edge_slm_phi`)

* **Palabras clave / Triggers:** `phi, phi-3, phi-4, slm, small language model, onnx runtime genai, microsoft olive, edge inference, directml`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `edge-slm-phi`, `python-patterns`, `verification-loop`
* **Reglas de Calidad:** `common-performance`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `phi-slm-cookbook.md` (`.agents/catalogs/mcp-registry/phi-slm-cookbook.md`)

### 🎯 Dominio: Universal LLM Provider Proxy & Quota Pooling (`llm_pool_opencodex`)

* **Palabras clave / Triggers:** `opencodex, codex proxy, provider pool, multi-account quota, load balance llm, claude code proxy, deepseek bridge`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `llm-pool-opencodex`, `token-budget-advisor`, `cost-tracking`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `opencodex-proxy.md` (`.agents/catalogs/mcp-registry/opencodex-proxy.md`)

### 🎯 Dominio: Continuous AI Agent Optimization & Evaluation (`agent_eval_overmind`)

* **Palabras clave / Triggers:** `overmind, agent evaluation, eval dataset, regression benchmark, trace capture, agent fine-tuning, gold standard`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`, `testing-qa-lead`
* **Skills de Soporte:** `agent-eval-overmind`, `tdd-workflow`, `verification-loop`
* **Reglas de Calidad:** `common-testing`, `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `overmind-eval.md` (`.agents/catalogs/mcp-registry/overmind-eval.md`)

### 🎯 Dominio: Self-Hosted Application Deployment & TLS CI/CD (`self_host_openship`)

* **Palabras clave / Triggers:** `openship, self hosted deploy, ci cd, reverse proxy, lets encrypt tls, vps deployment, docker shipping`...
* **Agentes Lead:** `engineering-devops-automator`, `engineering-sre`
* **Skills de Soporte:** `self-host-openship`, `docker-patterns`, `canary-watch`
* **Reglas de Calidad:** `common-security`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `openship-deploy.md` (`.agents/catalogs/mcp-registry/openship-deploy.md`)

### 🎯 Dominio: E-Commerce Storefront UI & Accessible Components (`ecommerce_storefront_ui`)

* **Palabras clave / Triggers:** `storefront ui, ecommerce components, product card, shopping cart, checkout flow, filter sidebar, alokai, vue storefront`...
* **Agentes Lead:** `agency-frontend-developer`, `agency-ui-designer`
* **Skills de Soporte:** `ecommerce-storefront-ui`, `react-patterns`, `frontend-a11y`
* **Reglas de Calidad:** `web-design-quality`, `react-coding-style`
* **Registros & MCPs (Bajo Demanda):** `storefront-ui-components.md` (`.agents/catalogs/mcp-registry/storefront-ui-components.md`)

### 🎯 Dominio: Interactive CLI Cheatsheets & Command Runners (`terminal_cheatsheet_navi`)

* **Palabras clave / Triggers:** `navi, cheat, cheatsheet, interactive terminal, fzf runner, command recipe, shell auto complete`...
* **Agentes Lead:** `agency-software-architect`, `engineering-devops-automator`
* **Skills de Soporte:** `terminal-cheatsheet-navi`, `terminal-ops`, `zero-trust-terminal-ops`
* **Reglas de Calidad:** `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `navi-cheatsheet.md` (`.agents/catalogs/mcp-registry/navi-cheatsheet.md`)

### 🎯 Dominio: Modern Multi-Pane Terminal File Manager (TUI) (`tui_file_manager_superfile`)

* **Palabras clave / Triggers:** `superfile, tui file manager, bubble tea, terminal file explorer, vim navigation, directory tree`...
* **Agentes Lead:** `agency-software-architect`, `engineering-devops-automator`
* **Skills de Soporte:** `tui-file-manager-superfile`, `atomic-file-organizer`
* **Reglas de Calidad:** `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `superfile-tui.md` (`.agents/catalogs/mcp-registry/superfile-tui.md`)

### 🎯 Dominio: Autonomous Web Browser Interaction & Navigation (`browser_use_automation`)

* **Palabras clave / Triggers:** `browser-use, browser automation, cdp agent, chromium control, web interaction, dom accessibility tree, form filler agent`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `browser-use-agent`, `stealth-browser-obscura`, `computer-use-cua`
* **Reglas de Calidad:** `web-security`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `browser-use.md` (`.agents/catalogs/mcp-registry/browser-use.md`)

### 🎯 Dominio: Hybrid AI Agent & Playwright E2E Testing (`ai_e2e_hybrid_testing`)

* **Palabras clave / Triggers:** `tester army, e2e testing, hybrid test, agent test scenario, playwright locator, self healing test, test codification`...
* **Agentes Lead:** `testing-qa-lead`, `testing-test-automator`
* **Skills de Soporte:** `ai-e2e-testing`, `e2e-testing`, `verification-loop`
* **Reglas de Calidad:** `common-testing`, `web-testing`
* **Registros & MCPs (Bajo Demanda):** `tester-army-e2e.md` (`.agents/catalogs/mcp-registry/tester-army-e2e.md`)

### 🎯 Dominio: Semantic Intent Code Search & Context Pruning (`semantic_grep_jevgrep`)

* **Palabras clave / Triggers:** `jevgrep, jg, semantic grep, semantic code search, ast retrieval, token reduction, declaration lead, jev decision`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `semantic-grep-jevgrep`, `token-budget-advisor`, `cost-tracking`
* **Reglas de Calidad:** `common-development-workflow`, `common-performance`
* **Registros & MCPs (Bajo Demanda):** `jevgrep-retrieval.md` (`.agents/catalogs/mcp-registry/jevgrep-retrieval.md`)

### 🎯 Dominio: Multi-Agent Financial Trading & Market Simulation (`agentic_trading_floor`)

* **Palabras clave / Triggers:** `tradingagents, trading floor, fundamental analyst, technical analyst, bull bear debate, risk manager, portfolio var, sharpe ratio, owner earnings`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`
* **Skills de Soporte:** `agentic-trading-floor`, `swarm-simulation-prediction`, `cost-tracking`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `tradingagents-simulation.md` (`.agents/catalogs/mcp-registry/tradingagents-simulation.md`)

### 🎯 Dominio: Conversational Tabular Analytics & DataFrames (`conversational_pandas_ai`)

* **Palabras clave / Triggers:** `pandas-ai, pandasai, dataframe chat, conversational data, csv analysis, dynamic chart generator, data profiling`...
* **Agentes Lead:** `agency-database-optimizer`, `engineering-backend-architect`
* **Skills de Soporte:** `conversational-pandas-ai`, `data-autocleaning`, `python-patterns`
* **Reglas de Calidad:** `python-coding-style`, `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `pandas-ai-engine.md` (`.agents/catalogs/mcp-registry/pandas-ai-engine.md`)

### 🎯 Dominio: Automated Software Engineering Assessment & Code Grading (`swe_automated_assessment`)

* **Palabras clave / Triggers:** `tum artemis, swe assessment, code grading, pedagogical feedback, automated grading, programming exercise, code clone detection`...
* **Agentes Lead:** `testing-qa-lead`, `testing-test-automator`
* **Skills de Soporte:** `swe-automated-assessment`, `tdd-workflow`, `verification-loop`
* **Reglas de Calidad:** `common-testing`, `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `artemis-evaluator.md` (`.agents/catalogs/mcp-registry/artemis-evaluator.md`)

### 🎯 Dominio: Enterprise Cybersecurity Playbooks & MITRE Mapping (`mitre_cybersecurity_playbooks`)

* **Palabras clave / Triggers:** `anthropic security, mitre att&ck, mitre atlas, d3fend, nist csf, threat modeling, vulnerability audit, incident response playbook`...
* **Agentes Lead:** `engineering-identity-access-engineer`, `specialized-security-bounty-hunter`
* **Skills de Soporte:** `mitre-cybersecurity-playbooks`, `security-review`, `shannon-pentest`
* **Reglas de Calidad:** `common-security`, `web-security`, `common-security-gate`
* **Registros & MCPs (Bajo Demanda):** `anthropic-cybersecurity.md` (`.agents/catalogs/mcp-registry/anthropic-cybersecurity.md`)

### 🎯 Dominio: Editorial-Quality Architecture & Diagram Design (`editorial_diagram_design`)

* **Palabras clave / Triggers:** `diagram design, technical diagram, editorial svg, architecture blueprint, state machine diagram, anti-slop visuals, responsive html diagram`...
* **Agentes Lead:** `agency-ui-designer`, `agency-software-architect`
* **Skills de Soporte:** `editorial-diagram-design`, `anti-slop-design-guard`, `make-interfaces-feel-better`
* **Reglas de Calidad:** `web-design-quality`, `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `diagram-design.md` (`.agents/catalogs/mcp-registry/diagram-design.md`)

### 🎯 Dominio: Self-Hosted Project & Sprint Task Management (`selfhosted_taskview_pm`)

* **Palabras clave / Triggers:** `taskview, self hosted task manager, docker mcp kanban, git commit sync, sprint velocity, private backlog tracker`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`
* **Skills de Soporte:** `selfhosted-taskview-pm`, `lean-project-kaneo`, `scope-creep-detector`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `taskview-community.md` (`.agents/catalogs/mcp-registry/taskview-community.md`)

### 🎯 Dominio: Self-Evolving Context Database & Virtual Filesystem (`agent_filesystem_openviking`)

* **Palabras clave / Triggers:** `openviking, viking uri, agent filesystem, context database, hierarchical memory, session distillation, vectorless context`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`
* **Skills de Soporte:** `agent-filesystem-openviking`, `adaptive-memory-hindsight`, `persistent-agentic-memory`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `openviking-context.md` (`.agents/catalogs/mcp-registry/openviking-context.md`)

### 🎯 Dominio: Multi-Agent Swarm Orchestration & Hive-Mind (`ruflo_swarm_orchestrator`)

* **Palabras clave / Triggers:** `ruflo, swarm orchestrator, claude flow, hive mind, ruvector, federated agent, multi agent parallel, swarm delegation`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`
* **Skills de Soporte:** `ruflo-swarm-orchestrator`, `parallel-ade-orca`, `swarm-simulation-prediction`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `ruflo-swarm.md` (`.agents/catalogs/mcp-registry/ruflo-swarm.md`)

### 🎯 Dominio: Turnkey Private AI Server Deployment (`turnkey_private_ai_ods`)

* **Palabras clave / Triggers:** `osmantic, ods, private ai server, dreamserver, turnkey docker ai, local litellm, air gapped rag, local comfyui whisper`...
* **Agentes Lead:** `engineering-devops-automator`, `engineering-sre`
* **Skills de Soporte:** `turnkey-private-ai-ods`, `self-host-openship`, `docker-patterns`
* **Reglas de Calidad:** `common-security`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `osmantic-ods.md` (`.agents/catalogs/mcp-registry/osmantic-ods.md`)

### 🎯 Dominio: Deep Scientific Research & Literature Synthesis (`scientific_research_agent`)

* **Palabras clave / Triggers:** `scientific skills, pubmed search, evidence synthesis, grade rating, bioinformatics, clinical literature review, uspto patent search`...
* **Agentes Lead:** `specialized-medical-ortho-specialist`, `agency-software-architect`
* **Skills de Soporte:** `scientific-research-agent`, `hipaa-compliance`, `verification-loop`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `scientific-agent-skills.md` (`.agents/catalogs/mcp-registry/scientific-agent-skills.md`)

### 🎯 Dominio: High-Performance LLM Web Crawling & Scraping (`llm_crawler_crawl4ai`)

* **Palabras clave / Triggers:** `crawl4ai, llm crawler, async scraping, markdown extractor, rag chunking, playwright crawler, clean web content`...
* **Agentes Lead:** `engineering-backend-architect`, `specialized-planner`
* **Skills de Soporte:** `llm-crawler-crawl4ai`, `stealth-browser-obscura`, `browser-use-agent`
* **Reglas de Calidad:** `web-security`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `crawl4ai-extractor.md` (`.agents/catalogs/mcp-registry/crawl4ai-extractor.md`)

### 🎯 Dominio: No-Code Web-to-API Scraping & Robotic Automation (`nocode_scraper_maxun`)

* **Palabras clave / Triggers:** `maxun, nocode scraper, web to api, robotic scraping, byop proxy, paginated crawler, catalog extraction`...
* **Agentes Lead:** `marketing-growth-hacker`, `engineering-backend-architect`
* **Skills de Soporte:** `nocode-scraper-maxun`, `social-web-reach`, `atomic-file-organizer`
* **Reglas de Calidad:** `web-security`, `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `maxun-scraping.md` (`.agents/catalogs/mcp-registry/maxun-scraping.md`)

### 🎯 Dominio: Sovereign On-Premises PDF Document Manipulation (`sovereign_pdf_stirling`)

* **Palabras clave / Triggers:** `stirling pdf, local ocr, sovereign document, redact pdf, pdf split merge, air gapped pdf, pdfa archival`...
* **Agentes Lead:** `specialized-medical-ortho-specialist`, `agency-software-architect`
* **Skills de Soporte:** `sovereign-pdf-stirling`, `docling-document-intelligence`, `hipaa-compliance`
* **Reglas de Calidad:** `common-security`, `common-security-gate`, `hipaa-compliance`
* **Registros & MCPs (Bajo Demanda):** `stirling-pdf-suite.md` (`.agents/catalogs/mcp-registry/stirling-pdf-suite.md`)

### 🎯 Dominio: Self-Hosted PaaS & Multi-Server Fleet Orchestration (`selfhosted_paas_coolify`)

* **Palabras clave / Triggers:** `coolify, self hosted paas, heroku alternative, vercel alternative, push to deploy, traefik tls, managed postgres redis, vps deployment`...
* **Agentes Lead:** `engineering-devops-automator`, `engineering-sre`
* **Skills de Soporte:** `selfhosted-paas-coolify`, `self-host-openship`, `docker-patterns`
* **Reglas de Calidad:** `common-security`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `coolify-paas.md` (`.agents/catalogs/mcp-registry/coolify-paas.md`)

### 🎯 Dominio: Visual Low-Code AI Workflow & DAG Composition (`visual_flow_langflow`)

* **Palabras clave / Triggers:** `langflow, visual workflow, ai dag, node based ai, python flow, modular rag, visual agent builder, langflow api`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `visual-flow-langflow`, `agentic-rag-dify`, `contract-first`
* **Reglas de Calidad:** `common-development-workflow`, `python-coding-style`
* **Registros & MCPs (Bajo Demanda):** `langflow-visual.md` (`.agents/catalogs/mcp-registry/langflow-visual.md`)

### 🎯 Dominio: Self-Hosted Multi-Model AI Hub & Private Chat (`local_chat_openwebui`)

* **Palabras clave / Triggers:** `open webui, openwebui, local chat, ollama ui, private rag collection, webui rbac, air gapped ai portal`...
* **Agentes Lead:** `agency-frontend-developer`, `agency-software-architect`
* **Skills de Soporte:** `local-chat-openwebui`, `multimodal-mcp-librechat`, `turnkey-private-ai-ods`
* **Reglas de Calidad:** `web-design-quality`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `open-webui-hub.md` (`.agents/catalogs/mcp-registry/open-webui-hub.md`)

### 🎯 Dominio: Agent-Assisted Reverse Engineering & Application Inspection (`agentic_reverse_engineering_rea`)

* **Palabras clave / Triggers:** `rea, reverse engineer, decompile apk, asar unpack, jadx, ghidra bridge, binary disassembly, deobfuscate js`...
* **Agentes Lead:** `engineering-backend-architect`, `specialized-security-bounty-hunter`
* **Skills de Soporte:** `agentic-reverse-engineering-rea`, `security-review`, `terminal-ops`
* **Reglas de Calidad:** `common-security`, `common-security-gate`
* **Registros & MCPs (Bajo Demanda):** `rea-reverse-engineering.md` (`.agents/catalogs/mcp-registry/rea-reverse-engineering.md`)

### 🎯 Dominio: Autonomous Penetration Testing & Red-Teaming (`autonomous_pentest_agent`)

* **Palabras clave / Triggers:** `pentestagent, red team agent, black box audit, docker nmap, sqlmap agent, sarif report, playwright pentest`...
* **Agentes Lead:** `specialized-security-bounty-hunter`, `engineering-identity-access-engineer`
* **Skills de Soporte:** `autonomous-pentest-agent`, `shannon-pentest`, `mitre-cybersecurity-playbooks`
* **Reglas de Calidad:** `common-security`, `web-security`, `common-security-gate`
* **Registros & MCPs (Bajo Demanda):** `pentestagent-redteam.md` (`.agents/catalogs/mcp-registry/pentestagent-redteam.md`)

### 🎯 Dominio: AI-Powered Ethical Reconnaissance & Attack Surface Management (`ai_recon_nebula`)

* **Palabras clave / Triggers:** `nebula, ethical hacking, attack surface, port fingerprint, cve correlation, recon assistant, security workpaper`...
* **Agentes Lead:** `engineering-identity-access-engineer`, `specialized-security-bounty-hunter`
* **Skills de Soporte:** `ai-recon-nebula`, `security-review`, `mitre-cybersecurity-playbooks`
* **Reglas de Calidad:** `common-security`, `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `nebula-ethical-pentest.md` (`.agents/catalogs/mcp-registry/nebula-ethical-pentest.md`)

### 🎯 Dominio: LLM-Maintained Knowledge Bases & Vectorless Wikis (`llm_wiki_karpathy`)

* **Palabras clave / Triggers:** `karpathy wiki, llm wiki, vectorless rag, markdown wiki, concept graph, entity indexing, verifiable knowledge`...
* **Agentes Lead:** `agency-software-architect`, `specialized-planner`
* **Skills de Soporte:** `llm-wiki-karpathy`, `mcp-edgeever-knowledge`, `docling-document-intelligence`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `karpathy-llm-wiki.md` (`.agents/catalogs/mcp-registry/karpathy-llm-wiki.md`)

### 🎯 Dominio: Claude Code Configuration & Agent Persona Scaffolding (`claude_templates_davila`)

* **Palabras clave / Triggers:** `claude templates, claude code templates, clauderc, slash commands scaffold, davila templates, agent persona template`...
* **Agentes Lead:** `agency-software-architect`, `engineering-devops-automator`
* **Skills de Soporte:** `claude-templates-davila`, `agency-auto-orchestrator`, `agy-customizations`
* **Reglas de Calidad:** `common-development-workflow`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `claude-code-templates.md` (`.agents/catalogs/mcp-registry/claude-code-templates.md`)

### 🎯 Dominio: Test-Driven Autonomous Agent Harness & AST Validation (`agent_harness_lazycodex`)

* **Palabras clave / Triggers:** `lazycodex, agent harness, tdd harness, sisyphus omo, ast guard, planning gate, state snapshot rollback, test driven agent`...
* **Agentes Lead:** `agency-software-architect`, `testing-qa-lead`
* **Skills de Soporte:** `agent-harness-lazycodex`, `tdd-workflow`, `verification-loop`
* **Reglas de Calidad:** `common-testing`, `common-development-workflow`
* **Registros & MCPs (Bajo Demanda):** `lazycodex-harness.md` (`.agents/catalogs/mcp-registry/lazycodex-harness.md`)

### 🎯 Dominio: 100% Offline Air-Gapped Local Inference & Private Vaults (`offline_inference_freedomgpt`)

* **Palabras clave / Triggers:** `freedomgpt, offline llm, air gapped inference, zero telemetry, private ai vault, local weights, uncensored inference`...
* **Agentes Lead:** `engineering-backend-architect`, `specialized-medical-ortho-specialist`
* **Skills de Soporte:** `offline-inference-freedomgpt`, `turnkey-private-ai-ods`, `edge-slm-phi`
* **Reglas de Calidad:** `common-security`, `hipaa-compliance`
* **Registros & MCPs (Bajo Demanda):** `freedomgpt-offline.md` (`.agents/catalogs/mcp-registry/freedomgpt-offline.md`)

### 🎯 Dominio: Adversarial AI Red-Teaming & Prompt Injection Assessment (`adversarial_eval_neurosploit`)

* **Palabras clave / Triggers:** `neurosploit, adversarial ai, prompt injection test, jailbreak assessment, tool hijacking, prompt leakage, red team llm`...
* **Agentes Lead:** `specialized-security-bounty-hunter`, `engineering-identity-access-engineer`
* **Skills de Soporte:** `adversarial-eval-neurosploit`, `autonomous-pentest-agent`, `shannon-pentest`
* **Reglas de Calidad:** `common-security`, `web-security`, `common-security-gate`
* **Registros & MCPs (Bajo Demanda):** `neurosploit-redteam.md` (`.agents/catalogs/mcp-registry/neurosploit-redteam.md`)

### 🎯 Dominio: Defensive Authentication Resilience & Rate-Limit Auditing (`auth_resilience_bruteforceai`)

* **Palabras clave / Triggers:** `bruteforceai, auth resilience, rate limit audit, lockout verification, credential stuffing test, form selector discovery, asvs v2`...
* **Agentes Lead:** `specialized-security-bounty-hunter`, `engineering-identity-access-engineer`
* **Skills de Soporte:** `auth-resilience-bruteforceai`, `security-review`, `shannon-pentest`
* **Reglas de Calidad:** `common-security`, `web-security`, `common-security-gate`
* **Registros & MCPs (Bajo Demanda):** `bruteforceai-auth-audit.md` (`.agents/catalogs/mcp-registry/bruteforceai-auth-audit.md`)

### 🎯 Dominio: Local-First Constraint-Aware Personal AI Framework (`local_agent_openjarvis`)

* **Palabras clave / Triggers:** `openjarvis, local agent, personal ai, constraint evaluation, flops energy budget, on device agent, local memory`...
* **Agentes Lead:** `agency-software-architect`, `engineering-backend-architect`
* **Skills de Soporte:** `local-agent-openjarvis`, `offline-inference-freedomgpt`, `local-interpreter-sandbox`
* **Reglas de Calidad:** `common-development-workflow`, `common-performance`
* **Registros & MCPs (Bajo Demanda):** `openjarvis-local-agent.md` (`.agents/catalogs/mcp-registry/openjarvis-local-agent.md`)

### 🎯 Dominio: Sovereign WhatsApp Multi-Device Gateway & Native MCP (`sovereign_whatsapp_gowa`)

* **Palabras clave / Triggers:** `gowa, go whatsapp, whatsmeow, sovereign whatsapp, whatsapp mcp, multi device qr, zero cost whatsapp, whatsapp rest api`...
* **Agentes Lead:** `engineering-backend-architect`, `agency-software-architect`
* **Skills de Soporte:** `sovereign-whatsapp-gowa`, `whatsapp-conversational-agent`, `agent-messaging-gateway`
* **Reglas de Calidad:** `common-security`, `golang-coding-style`
* **Registros & MCPs (Bajo Demanda):** `gowa-whatsapp-gateway.md` (`.agents/catalogs/mcp-registry/gowa-whatsapp-gateway.md`)

### 🎯 Dominio: Self-Hosted Software Discovery & SaaS Migration (`selfhosted_stack_advisor`)

* **Palabras clave / Triggers:** `awesome selfhosted, selfhosted stack, saas alternative, cloud cost reduction, replace jira, replace zapier, docker compose scaffold`...
* **Agentes Lead:** `engineering-devops-automator`, `engineering-finops-engineer`
* **Skills de Soporte:** `selfhosted-stack-advisor`, `selfhosted-paas-coolify`, `docker-patterns`
* **Reglas de Calidad:** `common-development-workflow`, `common-security`
* **Registros & MCPs (Bajo Demanda):** `awesome-selfhosted-catalog.md` (`.agents/catalogs/mcp-registry/awesome-selfhosted-catalog.md`)

### 🎯 Dominio: Universal Public API Directory & Integration Scouting (`public_api_scout`)

* **Palabras clave / Triggers:** `api mega list, public api directory, api scout, typed api client, discover apis, third party integration, api catalog`...
* **Agentes Lead:** `agency-software-architect`, `engineering-api-platform-engineer`
* **Skills de Soporte:** `public-api-scout`, `contract-first`, `atomic-file-organizer`
* **Reglas de Calidad:** `common-development-workflow`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `public-api-mega-directory.md` (`.agents/catalogs/mcp-registry/public-api-mega-directory.md`)

### 🎯 Dominio: Permanent Free LLM API Registry & Zero-Cost Routing (`free_tier_llm_router`)

* **Palabras clave / Triggers:** `free llm apis, awesome free llm, zero cost llm, free tier inference, groq free, cerebras free, gemini free tier, free openai endpoint`...
* **Agentes Lead:** `engineering-backend-architect`, `engineering-finops-engineer`
* **Skills de Soporte:** `free-tier-llm-router`, `llm-pool-opencodex`, `token-budget-advisor`
* **Reglas de Calidad:** `common-development-workflow`, `common-performance`
* **Registros & MCPs (Bajo Demanda):** `free-llm-apis-registry.md` (`.agents/catalogs/mcp-registry/free-llm-apis-registry.md`)

### 🎯 Dominio: Multi-Agent Tournament & Evolutionary Solution Selection (`multi_agent_arena`)

* **Palabras clave / Triggers:** `arena, arena skill, multi agent tournament, bracket evaluation, evolutionary selection, parallel strategies, cross critique, llm as judge`...
* **Agentes Lead:** `agency-software-architect`, `testing-qa-lead`
* **Skills de Soporte:** `multi-agent-arena`, `ruflo-swarm-orchestrator`, `santa-loop`
* **Reglas de Calidad:** `common-development-workflow`, `common-testing`
* **Registros & MCPs (Bajo Demanda):** `arena-tournament-eval.md` (`.agents/catalogs/mcp-registry/arena-tournament-eval.md`)

### 🎯 Dominio: OSINT Identity Footprint & Brand Impersonation Auditing (`osint_identity_aliens_eye`)

* **Palabras clave / Triggers:** `aliens eye, osint identity, username reconnaissance, footprint scan, brand impersonation, handle search, profile verification, digital footprint`...
* **Agentes Lead:** `specialized-security-bounty-hunter`, `marketing-growth-hacker`
* **Skills de Soporte:** `osint-identity-footprint`, `social-web-reach`, `ai-recon-nebula`
* **Reglas de Calidad:** `common-security`, `web-security`
* **Registros & MCPs (Bajo Demanda):** `aliens-eye-osint.md` (`.agents/catalogs/mcp-registry/aliens-eye-osint.md`)










