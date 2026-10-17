# 🧠 OpenHuman Rust Local Memory & TokenJuice MCP Spec

> **Source:** [tinyhumansai/openhuman](https://github.com/tinyhumansai/openhuman)  
> **License:** GPL-3.0  
> **Domain:** Rust/Tauri Local-First AI Agent Harness, Compressed SQLite & Obsidian-Compatible Vault Memory, TokenJuice Algorithmic Token Compression (up to 80% Cost Reduction), Multi-Model Routing, 118+ Integration Connectors.

---

## 🎯 Visión Arquitectónica

OpenHuman es una plataforma de arnés agéntico de alto rendimiento escrita en Rust que gestiona la memoria de largo plazo del usuario directamente en una base de datos local SQLite y una bóveda compatible con Obsidian. Integra la tecnología **TokenJuice**, un algoritmo de destilación y compresión de contexto que recorta redundancias sintácticas antes del despacho a modelos frontera, logrando una reducción de costos de hasta el 80%:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Rust Local FFI / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      OpenHuman Core                         │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ TokenJuice Compressor │       │ Local SQLite & Vault  │  │
│  │ (Up to 80% Token Cut) │◄─────►│ (Obsidian Markdown)   │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Multi-Agent Fleet Harness: 118+ One-Click Connectors  │  │
│  │ Zero External Exfiltration: Encrypted Local Store     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `openhuman_compress_context`
Comprime un contexto masivo o historial de conversación utilizando el motor TokenJuice sin pérdida de hechos clave:

```json
{
  "name": "openhuman_compress_context",
  "description": "Applies TokenJuice algorithmic pruning to reduce conversation tokens by 50-80% while strictly preserving core entities, numbers, and operational constraints.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "raw_text": { "type": "string" },
      "target_reduction_ratio": { "type": "number", "default": 0.6 }
    },
    "required": ["raw_text"]
  }
}
```

### 2. `openhuman_sync_vault`
Sincroniza y almacena memorias episódicas estructuradas en la bóveda local compatible con Obsidian:

```json
{
  "name": "openhuman_sync_vault",
  "description": "Appends an atomic factual entry or decision record to the local SQLite and Obsidian markdown memory vault.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "category": { "type": "string", "enum": ["system_rule", "preference", "fact", "code_snippet"] },
      "title": { "type": "string" },
      "markdown_body": { "type": "string" }
    },
    "required": ["title", "markdown_body"]
  }
}
```

---

## 🏛️ Gobernanza y Eficiencia de Tokens

1. **Frugalidad Radical y Eficiencia por Token (Andy Jassy / Warren Buffett):** TokenJuice debe utilizarse en prompts largos con historiales densos para evitar desperdicio de capital en llamadas a modelos de razonamiento profundo.
2. **Soberanía y Formato Abierto (Larry Fink):** Toda la información retenida se almacena en SQLite estándar y archivos Markdown legibles por humanos, evitando formatos propietarios cerrados.
