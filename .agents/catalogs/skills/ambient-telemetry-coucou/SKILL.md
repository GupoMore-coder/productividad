---
name: ambient-telemetry-coucou
description: Ambient desktop status monitoring, out-of-window permission gating, and glanceable agent telemetry based on Coucou architecture. Projects live coding agent state (thinking, running tests, awaiting approval) onto subtle screen notch indicators and mobile companion devices, enabling non-intrusive human-in-the-loop approvals without window switching. Activate when designing ambient agent notifications, configuring desktop status companions, or streamlining permission approval workflows.
metadata:
  origin: Antigravity-Core
---

# 🦉 Ambient Telemetry Coucou

This skill defines the **ambient status monitoring and glanceable human-in-the-loop standard** (Mustafa Suleyman ambient UX / Joe Ucuzoglu fiduciary approval controls) for supervising autonomous coding agents with zero window-switching fatigue.

---

## 🎯 When to Use

* **Long-Running Agent Oversight:** Keeping visual tabs on a multi-minute agent build or test run without keeping the terminal in the foreground.
* **Out-of-Window Approvals:** Approving file modifications, bash commands, or git pushes directly from a screen notch widget or mobile lock screen.
* **Diff Preview Streaming:** Streaming real-time line modifications to a lightweight overlay widget while reviewing code.
* **Zero-Context-Switch Ergonomics:** Reducing developer distraction while maintaining full control over agent execution boundaries.

---

## 🧭 The 4-Stage Ambient Telemetry Lifecycle

```
1. State Transition Event ──► 2. Ambient Signal Emission ──► 3. Approval Gate Wait ──► 4. Resumption / Halt
```

### Stage 1: State Transition Detection
- Hook into the agent's execution lifecycle (start, tool call, test execution, idle).
- Categorize current action urgency and determine if human permission is needed.

### Stage 2: Ambient Signal Emission
- Send lightweight status payload via local socket to the desktop overlay daemon.
- Update glanceable visual state (subtle pulsing glow or icon transition).

### Stage 3: Approval Gate Wait (If Required)
- If the agent is executing a restricted command (destructive bash, git push), trigger modal prompt in notch/tray.
- Await user approval click or timeout rejection.

### Stage 4: Resumption or Safe Halt
- If approved, proceed with execution.
- If rejected or timed out, gracefully abort action and report cancellation to user conversation context.

---

## 🛡️ Telemetry & Security Safeguards

- [ ] **Zero Cloud Telemetry:** Telemetry signals stay strictly on the local loopback interface (`127.0.0.1`).
- [ ] **Non-Intrusive Presence:** No aggressive audio alerts or pop-ups unless an urgent approval is actively blocking progress.
- [ ] **Secure Storage:** Pairing keys and device tokens kept in OS credential stores.
