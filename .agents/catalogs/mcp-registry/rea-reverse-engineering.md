# 🔍 REA Agentic Reverse Engineering MCP Registry Spec

> **Source:** [morluto/rea](https://github.com/morluto/rea)  
> **License:** MIT / Open Source  
> **Domain:** Agent-Assisted Reverse Engineering, Static & Dynamic Application Inspection, Electron ASAR Archive Analysis, JavaScript Bundle De-obfuscation, Android APK Bytecode Decompilation (JADX), Native Binary Disassembly Bridge (Ghidra, Hopper, IDA), Local Workstation Sandboxing.

---

## 🎯 Visión Arquitectónica

REA (Reverse Engineer Anything) dota a los agentes de codificación de la capacidad de analizar aplicaciones complejas a cualquier nivel de abstracción: desde el código empaquetado en Electron y JavaScript minificado hasta paquetes APK y binarios compilados de máquina. Opera estrictamente de forma local en la estación de trabajo para evitar la fuga de binarios propietarios o muestras analizadas:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Security Lead                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Reverse Engineering MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      REA Toolkit Core                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ JS / ASAR Unpacker    │       │ Android APK / JADX    │  │
│  │ (Bundle Deobfuscator) ◄─────►│ Decompilation Engine  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Native Disassembly Bridge (Ghidra / Hopper / IDA Pro) │  │
│  │ Control Flow Graphs, Function Signatures, Symbol Tree │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `rea_inspect_javascript_bundle`
Desempaqueta y analiza archivos ASAR de Electron o bundles minificados en busca de rutas internas, configuraciones y dependencias:

```json
{
  "name": "rea_inspect_javascript_bundle",
  "description": "Unpacks Electron ASAR archives or minified JavaScript bundles for structural analysis and secret auditing.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_path": { "type": "string" },
      "extract_output_dir": { "type": "string" },
      "deobfuscate": { "type": "boolean", "default": true }
    },
    "required": ["target_path"]
  }
}
```

### 2. `rea_decompile_android_apk`
Extrae manifiestos, permisos, actividades exportadas y descompila código bytecode Java/smali de aplicaciones Android:

```json
{
  "name": "rea_decompile_android_apk",
  "description": "Decompiles an Android APK using JADX to extract manifests, components, and reconstructed Java sources.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "apk_path": { "type": "string" },
      "output_dir": { "type": "string" },
      "extract_resources": { "type": "boolean", "default": true }
    },
    "required": ["apk_path", "output_dir"]
  }
}
```

### 3. `rea_query_native_symbols`
Consulta exportaciones de desensamblado nativo (Ghidra/Hopper) para inspeccionar llamadas a funciones y grafos de control:

```json
{
  "name": "rea_query_native_symbols",
  "description": "Queries disassembled native binary symbol tables, strings, and cross-references via Ghidra/Hopper bridge.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "binary_path": { "type": "string" },
      "query_type": { "type": "string", "enum": ["symbols", "strings", "xrefs", "control_flow"] },
      "target_symbol": { "type": "string" }
    },
    "required": ["binary_path", "query_type"]
  }
}
```

---

## 🏛️ Gobernanza y Rigor Forense (Kurtz & Ucuzoglu)

1. **Inteligencia Forense y Análisis Local (George Kurtz):** Ningún binario sospechoso o ejecutable propietario debe enviarse a nubes externas; todo el procesamiento ocurre localmente en memoria acotada.
2. **Verificación de Cumplimiento y Licencias (Joe Ucuzoglu):** Asegurar que la ingeniería inversa se aplique con fines legítimos de auditoría de seguridad, interoperabilidad o verificación de dependencias de terceros.
