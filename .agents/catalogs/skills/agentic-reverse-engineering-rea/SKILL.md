---
name: agentic-reverse-engineering-rea
description: Agent-assisted reverse engineering and application inspection protocol based on REA. Delegates deep static analysis of Electron ASAR bundles, minified JavaScript, Android APK packages, and native binary control flows (Ghidra/IDA bridge) to coding agents locally on the workstation with zero cloud egress. Activate when auditing compiled desktop applications, inspecting third-party APK security, unpacking bundled assets, or performing software interoperability analysis.
metadata:
  origin: Antigravity-Core
---

# 🔍 Agentic Reverse Engineering REA

This skill formalizes the **local-first application reverse engineering standard** (George Kurtz forensic provenance / Joe Ucuzoglu compliance and IP auditing) using REA.

---

## 🎯 When to Use

* **Desktop Application Security Audits:** Unpacking Electron apps to audit ASAR bundles, internal IPC channels, and embedded secrets.
* **Mobile Security & APK Analysis:** Decompiling Android APKs with JADX to inspect exported activities, intent filters, and crypto routines.
* **Third-Party Dependency Forensics:** De-obfuscating web/Node bundles to inspect closed-source SDKs or verify absence of backdoors.
* **Native Binary Inspection:** Querying symbols, strings, and cross-references exported from Ghidra/Hopper disassemblers.

---

## 🧭 The 4-Step Reverse Engineering Protocol

```
1. Format Identification ──► 2. Local Unpacking/Decompilation ──► 3. Semantic Analysis ──► 4. Forensic Synthesis
```

### Step 1: Format Identification
- Inspect magic bytes and file headers to determine format (ASAR, APK, ELF, Mach-O, PE).
- Establish an isolated scratch working directory within the local workspace.

### Step 2: Local Unpacking & Decompilation
- Execute appropriate local unpacker (e.g., ASAR extractor, JADX decompiler).
- Ensure no external network requests are made during disassembly.

### Step 3: Semantic Analysis
- Search for sensitive patterns (hardcoded API keys, unencrypted local databases, insecure IPC endpoints).
- Map application routing, control flow graphs, and external API dependencies.

### Step 4: Forensic Synthesis
- Compile findings into structured Markdown documentation.
- Document entry points, security exposure points, and interoperability specifications.

---

## 🛡️ Operational Guardrails

- [ ] **Workstation Isolation:** Analyze untrusted binaries in isolated sandbox directories or containers.
- [ ] **Zero Cloud Telemetry:** Never send target binary bytes or decompiled source files to third-party translation or analysis APIs.
- [ ] **Compliance Gate:** Restrict usage strictly to authorized security auditing, interoperability development, and defensive analysis.
