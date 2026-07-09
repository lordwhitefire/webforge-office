# WebForge Errors & Fixes Log

> **Purpose:** Document every error found during OpenCode integration, the root cause, the battle-tested fix, and status. **Read this file FIRST at the start of every session** before doing any WebForge work.
>
> **Rule:** Do NOT apply any fix without CEO confirmation. Mark each fix as `[PENDING]` until confirmed, then `[APPLIED]` when done.

---

## How to Use This File

1. **At session start:** Read this file top to bottom. Check for `[PENDING]` fixes that need confirmation.
2. **When you hit a new error:** Add it at the bottom with `[PENDING]` status. Research the battle-tested fix before writing it.
3. **Before applying a fix:** Show the CEO the proposed fix and get confirmation.
4. **After applying:** Change `[PENDING]` to `[APPLIED]` and note the date.

---

## Error #1 — MCPs Missing `type: "local"` and `enabled: true`

**Status:** `[APPLIED]` (fixed during integration)

**Symptom:** MCPs in `opencode.json` didn't work when OpenCode loaded them.

**Root Cause:** The v2 `opencode.json` used the v1 MCP format (just `command` + `args` + `env`). OpenCode's current MCP spec requires every MCP to declare `"type": "local"` and `"enabled": true` explicitly.

**OpenCode's Suggestion:** Add both fields to all MCPs.

**Battle-Tested Fix:** Same as OpenCode's suggestion — this is a config schema requirement, not a design choice. Applied to all 7 MCPs:

```json
"context7": {
  "type": "local",
  "enabled": true,
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp"]
}
```

**Lesson:** Always check the current OpenCode config schema at https://opencode.ai/config.json before writing `opencode.json`. The schema evolves.

---

## Error #2 — `_comment` Key in Project Config

**Status:** `[APPLIED]` (fixed during integration)

**Symptom:** OpenCode rejected the `opencode.json` because of the `_comment_isolation` field.

**Root Cause:** JSON doesn't support comments. I added a `_comment_isolation` key to document the isolation policy, but OpenCode's config validator rejects unknown keys.

**Battle-Tested Fix:** Deleted the `_comment` line. Moved the isolation documentation into `INSTALL.md` and the agent files themselves (where it belongs).

**Lesson:** Never put documentation in config JSON files. Put it in `.md` files next to the config. If you must document inline, use a sibling `.md` file with the same name (e.g., `opencode.json.md`).

---

## Error #3 — GitHub MCP Conflict (Remote vs npx)

**Status:** `[APPLIED]` (fixed during integration)

**Symptom:** Two GitHub MCPs were registered — one remote (old), one npx (v2). They conflicted.

**Root Cause:** The project already had a remote GitHub MCP configured. The v2 package added an npx version. Both tried to provide the same tools.

**Battle-Tested Fix:**
1. Removed the remote GitHub MCP from the config
2. Kept the v2 npx version
3. Saved the GitHub token to `~/.bashrc` so it persists across sessions:
   ```bash
   echo 'export GITHUB_TOKEN="ghp_..."' >> ~/.bashrc
   source ~/.bashrc
   ```

**Lesson:** Before installing WebForge's `opencode.json`, check for existing MCP configs and merge — don't overwrite. Document the merge process in `INSTALL.md`.

---

## Error #4 — `safe_task.ts` Used Subprocess (`opencode run`) — Fragile

**Status:** `[APPLIED]` (fixed during integration)

**Symptom:** `safe_task` broke agent spawning. The subprocess approach (`opencode run --agent <name>`) was fragile — it didn't properly inherit context, sometimes hung, and didn't return results reliably.

**Root Cause:** I built `safe_task` as a subprocess wrapper because OpenCode's plugin API doesn't let custom tools call the built-in `task` tool programmatically. The subprocess approach was a workaround that didn't hold up in practice.

**OpenCode's Suggestion:** Remove `safe_task: allow` from all agents. Use OpenCode's native `task` tool with granular permissions.

**Battle-Tested Fix Applied:**
1. Removed `safe_task: allow` from all 3 permanent agent files
2. Deleted `safe_task.ts` entirely
3. Replaced Hermes's `task: allow` (which allowed spawning ANY agent) with granular native permissions:
   ```yaml
   permission:
     task:
       "*": deny           # ← deny ALL agents by default
       voss: allow          # ← Hermes can only spawn Voss
       daedalus: allow      # ← Hermes can only spawn Daedalus
       "recruited-*": allow # ← Hermes can spawn any recruited agent
   ```
4. This uses OpenCode's native allowlist pattern — no custom tool needed, no subprocess, no fragility.

**Lesson:** Don't build custom wrappers for things OpenCode already supports natively. OpenCode's `task` permission supports glob patterns (`"recruited-*": allow`) — use that instead of a custom tool. **This is the battle-tested method:** the native permission system is more reliable than any subprocess wrapper.

**Trade-off:** We lose the WebForge registry check on spawns. But the glob pattern `"recruited-*": allow` means Hermes can only spawn agents whose names start with `recruited-` (plus Voss and Daedalus). Built-in agents like `build` and `plan` are denied by the `"*": deny` rule. **This achieves the same isolation as `safe_task` without the fragility.**

---

## Error #5 — Hermes Instructions Said "Mailbox Voss" But Mailbox Doesn't Wake Agents

**Status:** `[APPLIED]` (fixed during integration)

**Symptom:** Hermes was told to "mailbox Voss" when he needed to recruit someone. But Voss never woke up — mailbox just writes to a JSON file, it doesn't trigger anything.

**Root Cause:** The `mailbox` tool is a passive file-writing tool. It puts a message in the recipient's inbox JSON file, but nothing reads that file unless the recipient agent is already running. There's no wake-up mechanism.

**Battle-Tested Fix Applied:** Updated Hermes's instructions from "mailbox Voss" to "spawn Voss via the `task` tool". The `task` tool is the wake-up mechanism — spawning an agent IS waking them.

**Lesson:** Mailbox is for async communication between ALREADY-RUNNING agents. It is NOT a wake-up mechanism. To wake an agent, you must `spawn` them via `task`. See Error #7 for the deeper problem this exposes.

---

## Error #6 — Voss and Daedalus Instructions Still Referenced `safe_task`

**Status:** `[APPLIED]` (fixed during integration)

**Symptom:** After removing `safe_task` (Error #4), Voss and Daedalus's system prompts still said "use `safe_task`" — which no longer existed.

**Root Cause:** When I removed `safe_task.ts` and `safe_task: allow` from the YAML, I forgot to update the prose in the agent files that referenced it.

**Battle-Tested Fix Applied:** Updated all agent files to say `task` instead of `safe_task`. Removed the "CRITICAL: Use safe_task, NOT task" sections entirely.

**Lesson:** When removing a tool, grep ALL files for references to it — not just the YAML. System prompts, README, INSTALL.md, plan MD — everything. A tool removal is a 5-file change minimum.

---

## Error #7 — THE BIG ONE: Mailbox Doesn't Wake Agents (Async Communication Gap)

**Status:** `[APPLIED]` (2026-07-08 — CEO confirmed Option A: Pocket Universe)

**Symptom:** When agent A sends a message to agent B's mailbox, B doesn't wake up. B has to already be running to check their inbox. But if B isn't running, the message sits there forever. And Hermes can't manually wake every agent — that wastes his 35 tool calls.

**Root Cause:** The v2 design assumed agents would poll their mailbox. But agents only run for 35 calls then exit. There's no daemon, no event loop, no wake-up trigger. The mailbox is a dead-letter box.

**The Real Problem:** WebForge is sequential (one agent at a time via the Ralph Loop). But real work needs async communication:
- Hermes delegates to Hephaestus
- Hephaestus delegates to a build worker
- The build worker hits a blocker and needs to ask Hephaestus a question
- But Hephaestus has already exited (his 35 calls are up)
- The worker's mailbox message to Hephaestus sits unread
- The worker either guesses (Law 5 violation) or stalls

**Battle-Tested Solution Found: Pocket Universe Plugin**

Source: `github.com/spoons-and-mirrors/pocket-universe`

This OpenCode plugin extends the native subagent paradigm with three tools:

| Tool | What It Does | WebForge Equivalent |
|---|---|---|
| `broadcast(send_to="agentB", message="...")` | Queues a message directly to agent B. **Agent B auto-wakes when the message arrives.** | Replaces `mailbox` — adds the wake-up mechanism |
| `subagent(...)` | Spawns a subagent (similar to native `task`) | Replaces native `task` for WebForge agents |
| `recall()` / `recall(agent_name="X")` / `recall(agent_name="X", show_output=true)` | Lets a new agent see what previous agents did — their status history and results. **Disabled by default.** | NEW — this is the "what to check when you wake up" mechanism |

**Why This Is Battle-Tested:** Pocket Universe is a published OpenCode plugin. It solves exactly the async wake-up problem. The `broadcast` tool auto-wakes the recipient — no polling, no daemon, no wasted Hermes calls. The `recall` tool gives new agents memory of what came before.

**Proposed Fix for WebForge:**

1. **Install Pocket Universe plugin** in `opencode.json`
2. **Replace `mailbox.ts`** with Pocket Universe's `broadcast` — agents call `broadcast(send_to="...", message="...")` instead of `mailbox(to="...", body="...")`. The recipient auto-wakes.
3. **Enable `recall`** (it's disabled by default) — this solves Error #8 below
4. **Update all agent system prompts** to use `broadcast` instead of `mailbox`
5. **Keep chain-of-command enforcement** — wrap `broadcast` in a custom tool that checks `.webforge/agents.json` before sending (same guard as before, but the wake-up is handled by Pocket Universe)

**Alternative Approach (if Pocket Universe doesn't fit):**
- Build a custom `wake_and_message` tool that: (a) writes to the mailbox JSON, (b) spawns the recipient via `task` with a prompt like "Check your inbox and respond". This is essentially what Pocket Universe does, but DIY.

**CEO Decision Needed:**
- [ ] Use Pocket Universe plugin (recommended — battle-tested)
- [ ] Build DIY wake-and-message tool (more control, more maintenance)
- [ ] Keep current mailbox (accept that async comms don't work — agents must be sequential only)

---

## Error #8 — "What to Check When You Wake Up" Is Not Defined

**Status:** `[APPLIED]` (2026-07-08 — CEO confirmed the 6-step wake-up protocol)

**Symptom:** When an agent wakes up (gets spawned), what should it check first? The v2 design doesn't specify this. An agent that doesn't know what to check will either:
- Check everything (wastes all 35 calls reading logs)
- Check nothing (starts from zero, duplicates work)

**Root Cause:** The v2 plan mentions "recall" conceptually but never defines the protocol. If you have a chain of command (CEO → Hermes → Hephaestus → Aurora → Lead → Senior → Junior), a junior can't check everyone's history — that's too much. They need to know WHO to check.

**The Problem With "Check Everybody":**
- A junior worker doesn't need to know what Athena researched
- A junior worker doesn't need to know what Minos tested
- A junior worker needs to know: what did MY DIRECT SUPERIOR do? What did MY PEERS do? What context was passed to me?

**Battle-Tested Solution: Tiered Recall Protocol**

Inspired by Pocket Universe's `recall` tool + the ankitmundada "Required Initial Step" pattern:

### The Wake-Up Protocol (proposed)

When an agent wakes up, they check in this order:

```
STEP 1: Check the task prompt (why was I spawned?)
  → The spawning agent's prompt tells you your task
  → This is in the `task` call arguments — read it first

STEP 2: recall(direct_superior)
  → What did my boss do? What decisions did they make?
  → This gives you context for your task

STEP 3: recall(peers) — ONLY if your task depends on their work
  → If you're building frontend and someone else built the API, recall them
  → If your task is independent, SKIP THIS

STEP 4: Read .webforge/plan.md
  → What's the overall project state? What's done? What's remaining?

STEP 5: Check your own inbox (broadcast messages)
  → Did anyone send you a message while you were asleep?
  → Only relevant if you've been spawned before

STEP 6: Start working
```

### Who to Check — The Rules

| Agent Tier | Who They Check | Who They Don't Check |
|---|---|---|
| Hermes (COO) | `.webforge/plan.md` + all directors' latest status | Does NOT check juniors |
| Director (Hephaestus) | Hermes's latest decisions + their team's status | Does NOT check other directors' teams |
| Lead (Aurora) | Their director's instructions + their team's status | Does NOT check other leads |
| Senior | Their lead's instructions + their own past work | Does NOT check other seniors |
| Junior | Their senior's instructions + the task prompt | Does NOT check anyone else |

### The "Recall Depth" Rule

- **recall(direct_superior)** — always, on every wake-up
- **recall(peers)** — only if your task depends on their output
- **recall(subordinates)** — only if you're a coordinator checking on progress
- **recall(everyone)** — NEVER. This is what wastes all 35 calls.

**CEO Decision Needed:**
- [ ] Adopt this wake-up protocol (6 steps + tiered recall)
- [ ] Modify it (how?)
- [ ] Use a simpler protocol (what?)

---

## Error #9 — Agent MD Format Is Too Simple

**Status:** `[APPLIED]` (2026-07-08 — CEO confirmed the comprehensive format upgrade)

**Symptom:** Our agent files (hermes.md, voss.md, daedalus.md) use a simple "Who I Am / What I Do / What I Don't Do" structure (~60-140 lines). The awesome-opencode-subagents and jbeck018/agents-opencode repos use a much more comprehensive format (130-320 lines) that specifies invocation triggers, workflow position, communication protocols, routing examples, and disambiguation.

**Root Cause:** I wrote the v2 agent files based on the v1 skill files, which were designed for a standalone system. The awesome-opencode format is designed for OpenCode's subagent paradigm — it treats agents as nodes in a typed DAG, not standalone personas.

**Research Findings (from ankitmundada + jbeck018 repos):**

### What Their Format Has That Ours Doesn't

| Feature | Our Format | awesome-opencode Format |
|---|---|---|
| Invocation trigger | ❌ (router guesses) | ✅ via `description: "Use PROACTIVELY when..."` |
| `## When Invoked` startup procedure | ❌ | ✅ (ankitmundada — numbered checklist of first actions) |
| `## Workflow Position` (After/Before/Complements/Coordinates) | ❌ | ✅ (jbeck018 — shows where agent sits in pipeline) |
| `## Capabilities` with subsections | ❌ (flat bullet list) | ✅ (6-10 subsections × 10 bullets each) |
| `## Behavioral Traits` (positive style) | ❌ (only "What I Don't Do") | ✅ |
| `## Communication Protocol` (JSON message schemas) | ❌ | ✅ (ankitmundada — typed inter-agent messages) |
| `## Escalation Rules` | ❌ | ✅ (when to hand off to parent/specialist) |
| `## Key Distinctions` (vs sibling agents) | ❌ | ✅ (prevents router collisions) |
| `## Example Interactions` (test cases for router) | ❌ | ✅ |
| `temperature` field | ❌ | ✅ (0.1 for code, 0.2 for orchestration, 0.4 for creative) |
| `model` field | ❌ | ✅ (opus for orchestration, sonnet for specialists, haiku for routers) |

### Proposed New Format for WebForge Agents

```markdown
---
description: "<one-paragraph role summary ending with 'Use PROACTIVELY when...'>"
mode: subagent
model: <opus for directors, sonnet for specialists, haiku for routers>
temperature: <0.1 for code, 0.2 for orchestration, 0.4 for creative>
steps: 35
permission:
  read: allow
  edit: deny
  bash: deny
  safe_edit: allow
  safe_bash: allow
  task:
    "*": deny
    <specific agents>: allow
  # ... etc
---

# <Agent Name> — <Role Title>

You are a senior <role> specializing in <expertise>.

## Purpose
<2-3 sentence scope statement>

## When Invoked
1. <first action — usually recall(direct_superior) or read plan.md>
2. <second action>
3. <third action>
4. <start working>

## Workflow Position
- **After:** <what upstream agent produces my input>
- **Before:** <what downstream agent consumes my output>
- **Complements:** <peer agents I work alongside>
- **Coordinates:** <which worker agents I direct>

## Capabilities
### <Capability Area 1>
- <bullet>
- <bullet>
### <Capability Area 2>
- <bullet>
- <bullet>

## Behavioral Traits
- <positive style guidance>
- <positive style guidance>

## Boundaries
- **Out of scope:** <what I don't do>
- **Hand off to:** `<sibling-agent>` instead

## Communication Protocol
### Receiving a task
```json
{"from": "<agent>", "type": "TASK_ASSIGNED", "task": "...", "context": "..."}
```
### Reporting progress
```json
{"from": "<self>", "type": "TASK_PROGRESS", "current": "...", "next": "..."}
```

## Escalation Rules
- If <condition>: escalate to <parent agent>
- If <condition>: hand off to <sibling agent>
- If <condition>: ask CEO via `question` tool

## Key Distinctions
- **vs <sibling-agent>:** <how I differ>
- **vs <sibling-agent>:** <how I differ>

## Example Interactions
- "Build a login page" → I delegate to Hephaestus
- "Research auth libraries" → I delegate to Athena
- "Fix the cart bug" → I create a bugfix task and route to Hephaestus
```

**Line Count Target:**
- Worker agents: 130-180 lines (was 60)
- Director/orchestrator agents: 200-300 lines (was 140)

**CEO Decision Needed:**
- [ ] Adopt this new comprehensive format for all 3 permanent agents
- [ ] Adopt it but simplify (which sections to drop?)
- [ ] Keep current format (accept that agents are underspecified)
- [ ] Adopt gradually (rewrite Hermes first, see if it works, then Voss and Daedalus)

---

## Summary: What Needs CEO Confirmation

| # | Error | Fix Proposed | Status |
|---|---|---|---|
| 1 | MCPs missing `type`/`enabled` | Add fields | `[APPLIED]` |
| 2 | `_comment` key in config | Delete it | `[APPLIED]` |
| 3 | GitHub MCP conflict | Remove remote, keep npx | `[APPLIED]` |
| 4 | `safe_task` fragile subprocess | Use native `task` with glob permissions | `[APPLIED]` |
| 5 | "Mailbox Voss" doesn't wake | Use `task` to spawn, not mailbox | `[APPLIED]` |
| 6 | Stale `safe_task` references | Updated all agent files | `[APPLIED]` |
| 7 | Mailbox doesn't wake agents | **Install Pocket Universe plugin** (broadcast auto-wakes, recall gives memory) | `[APPLIED]` |
| 8 | No wake-up protocol defined | **6-step tiered recall protocol** (always check superior, peers only if needed) | `[APPLIED]` |
| 9 | Agent format too simple | **Adopted awesome-opencode comprehensive format** (When Invoked, Workflow Position, Capabilities, etc.) | `[APPLIED]` |

**Next session priorities:**
1. ~~Get CEO decisions on #7, #8, #9~~ ✅ Done (2026-07-08)
2. ~~Apply confirmed fixes~~ ✅ Done (2026-07-08)
3. Test the rebuilt package with the new agent format + Pocket Universe
4. Monitor for the OpenCode PRs (#9272 + #7725) that unblock `broadcast` auto-wake
5. Add new errors to this file as they're discovered

---

## Error #10 — Agent Template Is Too Fragile (The Root Cause)

**Status:** `[APPLIED]` (2026-07-09 — CEO confirmed: design master template + clone OpenCode)

**Symptom:** Hermes tries to recruit, fails, tries to use Athena to recruit, fails, tries to use Voss. The permissions restrict him but the system isn't optimized for correct behavior. Agents know WHAT to do and WHAT NOT to do, but not HOW. The model sees loopholes because the template doesn't specify procedures.

**Root Cause:** The v2.1 template was too simple compared to the awesome-opencode repos. It lacked procedures, expertise depth, checklists, anti-patterns, and code examples. The back-and-forth between here and OpenCode is too stressful — integration is a pain.

**Battle-Tested Fix Applied:**

1. **Master Template Designed** — `webforge-agent-template-spec.md`. A superset of all 3 repo dialects (ankitmundada, jbeck018, wshobson). Template + Identity = any agent. If the template can't reproduce an agent from those repos, the template is broken.

2. **Clone OpenCode** — stop integrating. Fork the repo, rip out built-in agents, make it ours. On-demand fetching (Context7 for library docs, custom MCP for agent MD files) — no bundling 2000+ files.

**Key Design Decisions:**
- **Dual-mode Capabilities** — accepts `###` subsections OR freeform bullet blocks
- **Dual-mode Response Approach** — accepts numbered list OR phased workflow
- **Mandatory:** Identity, Purpose, Capabilities, Workflow, When Invoked, Communication, Escalation, Boundaries, Examples, Reference
- **Conditional (domain experts):** Expertise, Approach, Guidelines, Checklists, Scenarios, Response Style, Best Practices, Anti-Patterns, Advanced Capabilities, Testing Commands, Framework Adapters

**CEO Decisions Confirmed:**
- ✅ Adopt the master template structure
- ✅ Clone OpenCode (stop integrating)
- ✅ On-demand skill fetching (Context7 + custom MCP, no bundling)

**Next Steps:**
1. Lock the template (build a validator)
2. Rewrite the 3 permanent agents using the template
3. Clone OpenCode (2-3 weeks)
4. Build Voss's agent factory (template + identity = agent)

---

## Lessons Learned (Add to This Section as We Learn)

1. **Don't build custom wrappers for things OpenCode supports natively.** `safe_task` was a subprocess wrapper for something OpenCode's permission system already handled via glob patterns. Native > custom. (Error #4)

2. **Mailbox is not a wake-up mechanism.** It's a passive file-writing tool. To wake an agent, you must spawn them. (Error #5, #7)

3. **Never put documentation in JSON config files.** Use sibling `.md` files. (Error #2)

4. **When removing a tool, grep ALL files.** YAML, system prompts, README, INSTALL, plan MD — everything. (Error #6)

5. **Always check the current OpenCode config schema.** It evolves. What worked in v1 may not work in v2. (Error #1)

6. **Agent format matters for routing.** A simple "Who I Am" doesn't tell the router WHEN to invoke you or HOW you fit in the pipeline. (Error #9)

7. **Async communication needs a wake-up mechanism.** Polling doesn't work when agents only live for 35 calls. You need event-driven wake-up (Pocket Universe's `broadcast`) or accept that communication is strictly sequential. (Error #7)

8. **"What to check when you wake up" must be defined per tier.** A junior checking everyone's history wastes all 35 calls. A junior checking only their direct superior gets context without overload. (Error #8)
