# Agent Orchestration

## Available Agents

Located in local Antigravity directories:
- **ECC Core & Reviewers:** `.agents/agents/*.md`
- **The Agency Catalog (279 specialists):** `.agents/agency/<division>/*.md`
- **Master Capability Matrix:** `.agents/MASTER_CAPABILITY_MATRIX.md`

| Agent | Purpose | When to Use | Path |
|-------|---------|-------------|------|
| planner | Implementation planning | Complex features, refactoring | `.agents/agents/planner.md` |
| architect | System design | Architectural decisions | `.agents/agents/architect.md` |
| tdd-guide | Test-driven development | New features, bug fixes | `.agents/agents/tdd-guide.md` |
| code-reviewer | Code review | After writing code | `.agents/agents/code-reviewer.md` |
| security-reviewer | Security analysis | Before commits | `.agents/agents/security-reviewer.md` |
| build-error-resolver | Fix build errors | When build fails | `.agents/agents/build-error-resolver.md` |
| e2e-runner | E2E testing | Critical user flows | `.agents/agents/e2e-runner.md` |
| refactor-cleaner | Dead code cleanup | Code maintenance | `.agents/agents/refactor-cleaner.md` |
| doc-updater | Documentation | Updating docs | `.agents/agents/doc-updater.md` |
| rust-reviewer | Rust code review | Rust projects | `.agents/agents/rust-reviewer.md` |
| harmonyos-app-resolver | HarmonyOS development | HarmonyOS/ArkTS | `.agents/agents/harmonyos-app-resolver.md` |
| *279 Agency Specialists* | Domain-specific expertise | On-demand via matrix | `.agents/agency/` |

## Immediate Agent Usage

No user prompt needed:
1. Complex feature requests - Use **planner** agent (`.agents/agents/planner.md`)
2. Code just written/modified - Use **code-reviewer** agent (`.agents/agents/code-reviewer.md`)
3. Bug fix or new feature - Use **tdd-guide** agent (`.agents/agents/tdd-guide.md`)
4. Architectural decision - Use **architect** agent (`.agents/agents/architect.md`)
5. Specialized domain tasks - Consult `.agents/MASTER_CAPABILITY_MATRIX.md` for the lead agent

## Parallel Task Execution

ALWAYS use parallel Task execution for independent operations:

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis of auth module
2. Agent 2: Performance review of cache system
3. Agent 3: Type checking of utilities

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```

## Delegation Completion Contract

Applies to every agent at every depth (parent, child, grandchild):

1. **Your final message IS the deliverable.** Never end your turn with "waiting for background agents" — a spawned task is not a completed task. Ending your turn while children are running orphans their results (completed children cannot notify a parent whose turn has ended).
2. **If you delegate, you own collection.** Wait for results, integrate them, then return. Fire-and-forget delegation is forbidden.
3. **Decompose only when the work cannot fit in one context.** Do not re-delegate a task already sized for a single agent — depth is an outcome, not a plan.

> Rationale: observed failure mode — research agents followed "Parallel Task Execution" above, spawned children, and returned "waiting" as their final answer. All children completed successfully but their results were orphaned. The parallel rule without a completion contract produces zombie tasks.

## Multi-Perspective Analysis

For complex problems, use split role sub-agents:
- Factual reviewer
- Senior engineer
- Security expert
- Consistency reviewer
- Redundancy checker
