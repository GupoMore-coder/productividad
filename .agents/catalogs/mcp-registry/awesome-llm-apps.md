# 🌐 Awesome LLM Apps Registry & Multi-Agent Architecture Index

> **Source:** [shubhamsaboo/awesome-llm-apps](https://github.com/shubhamsaboo/awesome-llm-apps) | [Unwind AI](https://www.theunwindai.com)  
> **License:** Apache-2.0  
> **Domain:** 100+ Production AI Agents, Agent Skills, Multimodal Workflows, and Domain-Specific RAG Blueprints.

---

## 🎯 Visión Arquitectónica

Awesome LLM Apps es una biblioteca de referencia de grado industrial que cataloga aplicaciones y agentes de inteligencia artificial construidos de extremo a extremo. Proporciona arquitecturas validadas para interoperar con **Google Gemini, Anthropic Claude, OpenAI, DeepSeek y modelos de código abierto**:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / LLM Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Invocación On-Demand
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Awesome LLM Apps Registry                   │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Agent Skills Suite  │       │ Starter & Advanced    │  │
│  │  (SDLC & Code Intel)  │       │ Production Agents     │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Domain Blueprints: Financial Due Diligence, Fraud     │  │
│  │ Investigation, Deep Research, Voice Agents & Vision   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Clasificación de Capacidades Principales

### 1. Habilidades de Ingeniería de Software (`agent_skills/`)
Módulos diseñados para elevar la precisión, disciplina y economía de tokens en el ciclo de vida del desarrollo:
* **`scope-creep-detector`:** Auditoría de `git diff` contra el objetivo inicial para prevenir inflado de cambios.
* **`commit-archaeologist`:** Reconstrucción de la intención y contexto histórico detrás de código legado.
* **`dependency-doctor`:** Análisis de dependencias, detección de paquetes deprecados y descontinuados.
* **`first-reader`:** Simulación de audiencia humana sobre documentación, PRDs y propuestas comerciales.

### 2. Agentes de Investigación y Auditoría Avanzada (`advanced_ai_agents/`)
* **AI VC Due Diligence Team:** Equipo multi-agente que audita modelos de negocio, métricas financieras y cap tables.
* **AI Fraud Investigation Agent:** Cruce forense de registros públicos, patrones de transacciones y discrepancias contables.
* **AI Deep Research Agent:** Investigación web profunda con orquestación paralela y citación de fuentes.

### 3. Agentes Multimodales y de Voz (`voice_ai_agents/` & `starter_ai_agents/`)
* **Medical Imaging Agent:** Análisis y soporte diagnóstico de imágenes y radiografías con modelos de visión.
* **Voice Claim & Customer Service Agents:** Manejo de llamadas, audio conversacional y transcripción de voz en tiempo real.

---

## 🔒 Estándares de Seguridad y Ejecución

* **Aislamiento Seguro:** Los agentes y habilidades operan bajo el principio de menor privilegio, sin acceso libre a internet a menos que sea explícitamente requerido.
* **Cero Filtración de Credenciales:** Toda integración con APIs externas debe nutrirse de variables de entorno seguras (`.env`), nunca con claves embebidas en el código.
