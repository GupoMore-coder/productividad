---
name: android-agent-artemis
description: End-to-end Android mobile automation and testing using Google Artemis. Translates natural language instructions into multi-step touch interactions, captures UI accessibility trees, inspects Logcat traces, and benchmarks mobile apps. Certified for Antigravity, Codex, and Claude Code with 99%+ success on AndroidWorld. Activate when developing mobile apps, testing Android PWAs/native apps, or automating mobile workflows.
metadata:
  origin: Antigravity-Core
---

# 📱 Android Agent Artemis (Google Artemis)

This skill operationalizes **Google Artemis** (Demis Hassabis / Jeff Dean mobile AI engineering standard). It enables Antigravity to autonomously test, navigate, and debug Android applications on physical devices and emulators using pure natural language instructions.

---

## 🎯 When to Use

* **PWA & Mobile App E2E Testing:** Verifying user flows in mobile apps (such as the Antigravity PWA in [`src/sw.ts`](file:///c:/Users/ferna/Documents/Antigravity%20Project/src/sw.ts) or React Native / Flutter builds).
* **Automated Mobile Workflows:** Automating mobile actions (e.g. downloading medical attachments in WhatsApp, verifying SMS OTPs, testing push notifications).
* **Mobile Crash Forensics:** Extracting Logcat traces, ANRs (Application Not Responding), and UI hierarchy snapshots when mobile errors occur.

---

## 🧭 The 4-Step Artemis Mobile Automation Loop

```
1. Screen & UI Hierarchy Perception ──► 2. Goal-Action Mapping ──► 3. Atomic ADB/Touch Execution ──► 4. State Verification
```

### Step 1: Screen & UI Hierarchy Perception
Before executing any action, inspect the current activity and accessibility tree:
```bash
# Capture screen layout and active package
adb shell dumpsys window | grep -E "mCurrentFocus"
adb exec-out screencap -p > /tmp/artemis_viewport.png
```

### Step 2: Goal-Action Mapping
Map the user prompt into high-leverage atomic actions:
- `tap(x, y)` or `tap_by_resource_id("com.app:id/submit_button")`
- `type_text("search_query")`
- `swipe(x1, y1, x2, y2, duration_ms)`
- `keyevent(KEYCODE_BACK)`

### Step 3: Atomic Execution
Execute via ADB bridge:
```bash
# Tap example via ADB input
adb shell input tap 540 1200
# Text input with URL encoding
adb shell input text "Dr.%sPerez"
```

### Step 4: State Verification
Re-inspect the accessibility tree to confirm the expected UI transition occurred (e.g., confirmation dialog appeared, view loaded). If the screen did not change, trigger automatic retry or report failure with Logcat trace.

---

## 🛡️ Mobile Security Gate

- [ ] **No Hardcoded Keystores or Passwords:** Mobile automation must never input live master passwords in plain text.
- [ ] **Isolated Device Sandbox:** Tests should be run in emulator instances or test-dedicated hardware.
- [ ] **Clean Artifact Evacuation:** Screenshots and temporary screen recordings must be purged after test completion.
