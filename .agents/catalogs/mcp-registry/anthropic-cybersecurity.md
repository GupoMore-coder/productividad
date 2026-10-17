# 🛡️ Anthropic Cybersecurity Skills & MITRE Framework MCP Registry Spec

> **Source:** [mukul975/Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills)  
> **License:** Apache-2.0 / Open Source Standard (`agentskills.io`)  
> **Domain:** 817 Structured Cybersecurity Playbooks, Threat Modeling, MITRE ATT&CK Mapping, NIST CSF 2.0 Compliance, MITRE D3FEND Countermeasures, NIST AI RMF, Vulnerability Assessment & Incident Response.

---

## 🎯 Visión Arquitectónica

Anthropic Cybersecurity Skills dota a los agentes de ingeniería de seguridad con playbooks estructurados validados por analistas senior de ciberseguridad. Proporciona trazabilidad completa contra las matrices tácticas globales y permite auditar código, infraestructuras y modelos frente a vectores de ataque contemporáneos:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Security Gate                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Threat Audit / Security MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Anthropic Cybersecurity Engine                  │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ MITRE ATT&CK / ATLAS  │       │ NIST CSF 2.0 / D3FEND │  │
│  │ (Tactics & Techniques)│◄─────►│ (Defensive Controls)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Shannon Pentest / OWASP Top 10 Vulnerability Scanner  │  │
│  │ Forensics, Incident Containment & Hardening Runbooks  │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `cybersec_lookup_mitre_technique`
Consulta tácticas, técnicas y contramedidas defensivas asociadas a un identificador MITRE:

```json
{
  "name": "cybersec_lookup_mitre_technique",
  "description": "Retrieves detection indicators and D3FEND countermeasures for MITRE ATT&CK or ATLAS technique IDs.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "technique_id": { "type": "string" },
      "framework": { "type": "string", "enum": ["MITRE_ATTCK", "MITRE_ATLAS", "MITRE_D3FEND", "NIST_CSF"], "default": "MITRE_ATTCK" }
    },
    "required": ["technique_id"]
  }
}
```

### 2. `cybersec_audit_code_vulnerabilities`
Realiza una auditoría estática exhaustiva contra las 5 clases críticas de vulnerabilidad (Shannon Security Gate):

```json
{
  "name": "cybersec_audit_code_vulnerabilities",
  "description": "Audits source files against BOLA/IDOR, session flaws, injection, sensitive data exposure, and SSRF vulnerabilities.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_path": { "type": "string" },
      "audit_scope": { "type": "array", "items": { "type": "string" }, "default": ["BOLA", "AUTH", "INJECTION", "DATA_EXPOSURE", "SSRF"] }
    },
    "required": ["target_path"]
  }
}
```

### 3. `cybersec_generate_incident_response_playbook`
Genera un plan de acción determinista para la contención, mitigación y recuperación forense ante incidentes:

```json
{
  "name": "cybersec_generate_incident_response_playbook",
  "description": "Creates an auditable incident response and containment playbook for a detected breach scenario.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "incident_type": { "type": "string" },
      "severity": { "type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
      "affected_assets": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["incident_type", "severity"]
  }
}
```

---

## 🏛️ Doctrina del Consejo de Ciberseguridad

1. **Cero Confianza y Detección Proactiva (George Kurtz / CrowdStrike):** Asumir la brecha. Ningún perímetro es infalible; la seguridad debe validarse a nivel de código, runtime y telemetría de comportamiento.
2. **Plataformización y Visibilidad Total (Nikesh Arora / Palo Alto Networks):** Consolidar silos de seguridad en un arnés unificado con trazabilidad end-to-end.
3. **Compuerta Shannon Inviolable:** Ningún commit ni despliegue puede declararse completado sin pasar la verificación de las 5 clases de vulnerabilidad.
