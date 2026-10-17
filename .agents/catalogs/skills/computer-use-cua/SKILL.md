---
name: computer-use-cua
description: Non-intrusive Computer-Use 2.0 desktop automation based on Cua architecture (Cua Driver MCP, Cua Spaces, Lume virtualization). Executes background mouse, keyboard, and accessibility tree interactions without hijacking the developer's physical cursor. Operates within isolated virtualized desktop sandboxes for secure GUI testing. Activate when automating legacy desktop applications, executing end-to-end GUI flows, or running autonomous agents that interact with desktop windows.
metadata:
  origin: Antigravity-Core
---

# 🖥️ Computer-Use Cua

This skill defines the **Computer-Use 2.0 desktop automation standard** (Demis Hassabis structured interface perception / George Kurtz sandboxed OS isolation / Mustafa Suleyman non-intrusive user coexistence) for controlling software applications without physical hardware contention.

---

## 🎯 When to Use

* **Background GUI Automation:** Interacting with native desktop applications (CAD viewers, spreadsheet software, clinical DICOM viewers) while the user continues working unimpeded.
* **Isolated Desktop Sandboxes:** Executing untrusted workflows inside a dedicated macOS/Linux virtual display (*Cua Spaces*) with independent state.
* **Accessibility-First Interaction:** Targeting interface controls via OS accessibility trees and semantic node IDs rather than error-prone coordinate guessing.
* **Dual-Cursor Coexistence:** Operating alongside human users in collaborative desktop sessions where the agent has its own dedicated software pointer.

---

## 🧭 The 4-Stage Computer-Use 2.0 Loop

```
1. Tree Inspection ──► 2. Semantic Target Binding ──► 3. Background Event Dispatch ──► 4. State Verification
```

### Stage 1: UI Tree Inspection
- Query the OS accessibility API (macOS Accessibility, Windows UI Automation, Linux AT-SPI).
- Retrieve semantic bounding boxes, element roles (button, textfield, menuitem), and enabled states.
- Avoid raw OCR whenever native semantic node descriptors are accessible.

### Stage 2: Semantic Target Binding
- Match user goal ("Click the Export PDF button") against inspected element labels and roles.
- Compute the click target coordinates within the isolated space or target window frame.

### Stage 3: Background Event Dispatch
- Dispatch synthetic OS input events directly to the target window message queue.
- Keep the user's physical mouse cursor and keyboard focus completely undisturbed.

### Stage 4: Post-Action State Verification
- Inspect the resulting accessibility tree update (dialog opened, progress bar advancing, item added).
- Confirm successful state transition before proceeding to subsequent action turns.

---

## 🛡️ Sandbox Containment Rules

- [ ] **Dedicated Space Enforcement:** High-risk actions (file deletions, system setting changes) MUST execute inside isolated Cua Spaces.
- [ ] **Zero Mouse Stealing:** Never lock or teleport the user's physical mouse cursor on the host OS.
- [ ] **Timeout Bounds:** Every computer-use sequence bound by strict timeout guards to prevent infinite input loops.
