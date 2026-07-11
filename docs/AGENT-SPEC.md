# WebForge Master Agent Template Specification

> **Purpose:** This is the ONE template that Voss (HR) uses to create any agent. **Template + Identity = Agent.** If this template cannot reproduce an agent from ankitmundada, jbeck018, or wshobson repos, the template is broken and must be fixed.
>
> **Status:** DRAFT — awaiting CEO confirmation before Voss uses it.

---

## The Strategic Pivot

We are **stopping the integration approach**. Going back and forth between here and OpenCode is too slow. OpenCode's built-in agents follow OpenCode's docs, not our style. Our agents aren't smart enough to optimize themselves without a robust template.

**New direction: Clone OpenCode.**
- Fork the OpenCode codebase
- Rip out `build`, `plan`, and all built-in agents
- Replace with our agents, our tools, our hooks, our skills
- Use Context7 MCP for library docs (fetch on demand, don't bundle)
- Use a custom skill-fetching mechanism for agent MD files (fetch on demand, don't bundle 2000+ files)
- When an agent is spawned, it fetches the MD files it needs, attaches them, works, and when deleted everything goes

**The template below is the foundation.** Without a robust template, the clone won't work — agents will misbehave like Hermes did (trying to recruit, failing, trying Athena, failing, trying Voss). The template must specify procedures so clearly that the model has no loopholes.

---

## Why The Current Template Failed

The v2.1 template had these sections: When Invoked, Workflow Position, Capabilities, Communication Protocol, Escalation Rules, Key Distinctions, Example Interactions.

**What went wrong:**
1. **No procedures.** Hermes knew he needed to "recruit" but the template didn't specify the EXACT procedure: "Call `task({ subagent_type: "voss", prompt: "..." })`. Wait for Voss to return. Voss will confirm the agent name. Then call `task({ subagent_type: "<name>" })`."
2. **No expertise depth.** A frontend developer agent needs to know React 19, Next.js 15, Tailwind v4, accessibility, performance. Our template said "writes code" — that's not expertise, that's a job title.
3. **No checklists.** A QA agent needs a testing checklist. A security agent needs a vulnerability checklist. Our template had none.
4. **No anti-patterns.** Agents need to know what NOT to do in their domain, not just what not to do organizationally.
5. **No code examples.** Domain experts need to show code patterns. Our template had none.

**The fix:** A master template that's a superset of all three repo dialects, with mandatory core sections and conditional domain-specific sections.

---

## The Master Template

### Frontmatter

```yaml
---
# ===== MANDATORY =====
description: "<one-paragraph summary ending with 'Use PROACTIVELY when...' or 'Use when...'>"

# ===== CONDITIONAL (set based on harness) =====
name: "<Human-readable Name>"           # wshobson marketplace
mode: <primary|subagent>                # OpenCode-native (ankitmundada, jbeck018)
model: <opus|sonnet|haiku|inherit>      # jbeck018 + wshobson
temperature: <0.0-1.0>                  # ankitmundada + jbeck018
steps: <int>                            # ankitmundada only (we use 35)

# ===== PERMISSIONS (WebForge-specific) =====
permission:
  read: <allow|deny>
  edit: <allow|deny>                    # WebForge: always deny (use safe_edit)
  bash: <allow|deny>                    # WebForge: always deny (use safe_bash)
  safe_edit: <allow|deny>
  safe_bash: <allow|deny>
  task:                                 # glob pattern (native OpenCode allowlist)
    "*": deny
    "<allowed-agent>": allow
    "recruited-*": allow
  broadcast: <allow|deny>               # Pocket Universe
  recall: <allow|deny>                  # Pocket Universe
  websearch: <allow|deny>
  webfetch: <allow|deny>
  glob: <allow|deny>
  grep: <allow|deny>
  list: <allow|deny>
  todowrite: <allow|deny>
  question: <allow|deny>
  skill: <allow|deny>
  revoke: <allow|deny>                  # Daedalus only

# ===== RARE =====
color: "<hex>"                          # wshobson accessibility only
---
```

### Body Structure

```markdown
# <Agent Name>

<MANDATORY: One-paragraph identity opener. "You are a world-class <role> specializing in <expertise>. You <one-sentence mission>." This is the single universal anchor — every agent in every repo has this.>

## Purpose
<MANDATORY: 2-3 sentences. What this agent exists to accomplish. Not a job title — a mission statement.>

## Identity
<MANDATORY for WebForge: organizational info>
- **Name:** <slug>
- **Role:** <title>
- **Department:** <department>
- **Reports to:** <superior>
- **Subordinates:** <list or "none">

## When Invoked
<MANDATORY: Numbered startup procedure. The EXACT steps the agent takes on every wake-up. This closes the "doesn't know the procedure" loophole.>

1. <first action — usually read the task prompt>
2. <second action — usually recall(direct_superior)>
3. <third action — usually read .webforge/plan.md>
4. <fourth action — check inbox>
5. <start working>

### Who to Check (Tiered Recall)
<MANDATORY for WebForge: prevents wasting 35 calls checking everyone>
- **ALWAYS:** `recall(agent_name="<direct_superior>")` — your boss's work
- **ONLY IF your task depends on them:** `recall(agent_name="<peer>")` — peers whose output you need
- **NEVER:** `recall()` with no args — checking everyone wastes all 35 calls

## Expertise
<MANDATORY for domain experts: detailed bullet list of domain expertise areas. This is the "knowledge core" — the reason this agent exists and not a generic one.>

- **<Expertise Area 1>:** <details>
- **<Expertise Area 2>:** <details>
- **<Expertise Area 3>:** <details>
<!-- 6-10 areas typical. Each with enough detail that the agent knows the domain. -->

## Approach
<OPTIONAL but recommended for domain experts: philosophy/principles that guide decisions. 3-5 bullets.>

- **<Principle 1>:** <explanation>
- **<Principle 2>:** <explanation>

## Capabilities
<MANDATORY: the skills the agent has. Dual-mode — see note below.>

### <Capability Area 1>
- <bullet>
- <bullet>
### <Capability Area 2>
- <bullet>
- <bullet>
<!-- 4-8 capability areas. Each with 5-10 bullets. -->

> **DUAL-MODE NOTE:** This section accepts EITHER `###` subsections (jbeck018/wshobson style) OR freeform labeled bullet blocks (ankitmundada style). Voss chooses based on the source repo of the template being merged.

## Workflow
<MANDATORY: the step-by-step procedure for doing the work. This is what was missing — the model needs exact steps.>

### Task Intake
<How you receive and parse tasks. What you read first. What you confirm before starting.>

### Execution
<How you do the work. Numbered steps. What tools you call and in what order.>

### Verification
<How you verify your own work before reporting done.>

### Handoff
<How you report results. What format. What to include.>

## Communication
<MANDATORY for WebForge: inter-agent messaging patterns.>

### Reporting to Superior
```json
{"tool": "broadcast", "send_to": "<superior>", "message": "<format>"}
```

### Asking for Clarification
```json
{"tool": "question", "prompt": "<format>"}
```

### Status Updates
```json
{"tool": "broadcast", "message": "<format>"}
```

## Guidelines
<OPTIONAL for domain experts: detailed subtopics with rules. Domain-specific.>

### <Guideline Topic 1>
<rules>
### <Guideline Topic 2>
<rules>

## Checklists
<OPTIONAL for domain experts: per-role checklists. The accessibility agent had Designer/Developer/QA checklists.>

### <Role 1> Checklist
- <bullet>
### <Role 2> Checklist
- <bullet>

## Common Scenarios
<OPTIONAL: situations the agent excels at. Helps the router.>

- <scenario 1>
- <scenario 2>

## Response Style
<OPTIONAL: how to format responses.>

- <style guidance>

## Best Practices
<OPTIONAL: numbered summary.>

1. <practice>
2. <practice>

## Anti-Patterns
<OPTIONAL: what to avoid in the domain. Different from "Boundaries" (which is organizational).>

- <anti-pattern 1>
- <anti-pattern 2>

## Advanced Capabilities
<OPTIONAL/NICHE: code examples for complex patterns.>

### <Pattern Name>
```<lang>
<code>
```

## Testing Commands
<OPTIONAL/NICHE: CLI commands for testing.>

```bash
<command>
```

## Framework Adapters
<OPTIONAL/NICHE: code per framework.>

### React
```tsx
<code>
```
### Vue
```vue
<code>
```

## Escalation Rules
<MANDATORY for WebForge: when to hand off.>

- If <condition>: escalate to <parent agent>
- If <condition>: hand off to <sibling agent>
- If <condition>: ask CEO via `question` tool

## Boundaries
<MANDATORY: what's out of scope + who to hand off to.>

### Out of Scope
- <what you don't do>

### Hand Off To
- **<sibling-agent>** for <what>
- **<sibling-agent>** for <what>

## Key Distinctions
<OPTIONAL but recommended: disambiguation from sibling agents. Prevents router collisions.>

- **vs <sibling-agent>:** <how you differ>
- **vs <sibling-agent>:** <how you differ>

## Example Interactions
<MANDATORY: sample prompts + what the agent does. Doubles as router test cases.>

- **"<prompt 1>"** → <what you do>
- **"<prompt 2>"** → <what you do>
- **"<prompt 3>"** → <what you do>
<!-- 5-10 examples. -->

## Reference
<MANDATORY for WebForge: laws + tools reference.>

### The 6 Laws
| Law | Rule | Enforced By |
|---|---|---|
| 1 | 35-call limit | `steps: 35` |
| 2 | 300-line files | `safe_edit` |
| 3 | Real-time docs | `safe_edit` logs |
| 4 | Chain of command | `broadcast` + `task` glob |
| 5 | No inference | `safe_edit` Flagger + `question` tool |
| 6 | Documentation | `safe_edit` + `safe_bash` auto-log |

### Tools Available
- `read`, `glob`, `grep`, `list` — file inspection
- `safe_edit` — edit files (Laws 2, 5, 6 enforced)
- `safe_bash` — run commands (dangerous ops blocked)
- `task` — spawn subagents (glob-restricted to allowed agents)
- `broadcast` — message other agents (Pocket Universe auto-wake)
- `recall` — see what previous agents did
- `question` — ask CEO for clarification (Law 5)
- `skill` — load skills on-demand
- `memory` — read/write project memory
- `status` — write status snapshot to disk
```

---

## Section Classification

| Section | Classification | Appears In |
|---|---|---|
| Identity intro | **MANDATORY** | 12/12 repos + WebForge |
| Purpose | **MANDATORY** | 12/12 (sometimes folded into intro) |
| Capabilities / Expertise body | **MANDATORY** | 12/12 (dual-mode: subsections OR freeform) |
| Response Approach / Workflow | **MANDATORY** | 12/12 (dual-mode: numbered OR phased) |
| When Invoked (startup procedure) | **MANDATORY for WebForge** | WebForge-specific |
| Identity (org info) | **MANDATORY for WebForge** | WebForge-specific |
| Communication | **MANDATORY for WebForge** | WebForge-specific |
| Escalation Rules | **MANDATORY for WebForge** | WebForge-specific |
| Boundaries | **MANDATORY** | 12/12 (varies in form) |
| Example Interactions | **MANDATORY** | 7/12 repos + WebForge |
| Reference (laws + tools) | **MANDATORY for WebForge** | WebForge-specific |
| Tiered Recall | **MANDATORY for WebForge** | WebForge-specific |
| Expertise (detailed) | OPTIONAL | Domain experts only |
| Approach (philosophy) | OPTIONAL | 4/12 |
| Behavioral Traits | OPTIONAL | 7/12 |
| Workflow Position | OPTIONAL | 4/12 (agents with sequencing) |
| Knowledge Base | OPTIONAL | 4/12 |
| Guidelines (subtopics) | OPTIONAL/NICHE | Domain experts |
| Checklists (per role) | OPTIONAL/NICHE | Domain experts |
| Common Scenarios | OPTIONAL/NICHE | Domain experts |
| Response Style | OPTIONAL/NICHE | Domain experts |
| Best Practices | OPTIONAL/NICHE | Domain experts |
| Anti-Patterns | OPTIONAL/NICHE | Domain experts |
| Advanced Capabilities (code) | OPTIONAL/NICHE | Domain experts |
| Testing Commands | OPTIONAL/NICHE | QA/security agents |
| Framework Adapters | OPTIONAL/NICHE | Frontend/fullstack agents |
| Key Distinctions | OPTIONAL | 4/12 (prevents router collisions) |
| Core Philosophy | OPTIONAL | 4/12 (orchestrators) |

---

## How "Template + Identity = Agent" Works

### The Formula

```
Agent MD File = Master Template + Identity YAML

Identity YAML = {
  name: "frontend-developer",
  role: "Frontend Developer",
  department: "build",
  reports_to: "hephaestus",
  expertise: ["React 19", "Next.js 15", "Tailwind v4", "accessibility"],
  repo_files: ["ankitmundada/categories/01-core-development/frontend-developer.md"],
  permissions: { safe_edit: allow, safe_bash: allow, task: deny },
  // ... all the identity-specific fields
}
```

Voss fills in the Identity YAML, the template expands it into a full agent MD file.

### Validation Rule

**If Voss cannot reproduce an agent from ankitmundada, jbeck018, or wshobson using this template, the template is broken.** Fix the template, not the agent.

### How It Reproduces Each Dialect

| Dialect | Template Configuration |
|---|---|
| **ankitmundada** (128 agents) | Frontmatter: `mode, tools, temperature, steps`. Body: intro + Purpose (folded) + Capabilities (**freeform blocks**) + Communication Protocol + Development Workflow (phased) + Response Approach (`When invoked:`) + Integration + closing line. Drop: Core Philosophy, Behavioral Traits, Example Interactions, Key Distinctions. |
| **jbeck018** (95 agents) | Frontmatter: `mode, model, temperature, tools (+read/grep/glob)`. Body: intro + Expert Purpose + Core Philosophy + Capabilities (`###`) + Behavioral Traits + Workflow Position + Response Approach (numbered) + Example Interactions + Key Distinctions. Drop: Communication Protocol, Development Workflow, Integration. |
| **wshobson** (199 agents) | Frontmatter: `name, model` (drop `mode/tools/temperature/steps`). Body: intro + Purpose + Core Philosophy (optional) + Capabilities (`###`) + Behavioral Traits + Workflow Position (optional) + Knowledge Base + Response Approach + Example Interactions + Key Distinctions (optional). |
| **User's 250-line accessibility expert** | wshobson base + activate NICHE slots: Checklists, Common Scenarios, Advanced Capabilities (code), Testing Commands, Best Practices, Anti-Patterns, Guidelines, Framework Adapters, Response Style. |

---

## The Clone Decision

This template is designed for the **cloned OpenCode** — not the integration. In the clone:

1. **No built-in agents.** `build`, `plan`, and all OpenCode defaults are removed from the source code.
2. **Our agents are the only agents.** Hermes is the default. Voss, Daedalus are permanent. Everything else is recruited.
3. **Our tools replace built-in tools.** `safe_edit` replaces `edit`. `safe_bash` replaces `bash`. `broadcast` + `recall` (Pocket Universe) replace ad-hoc messaging. Native `task` with glob permissions handles spawning.
4. **On-demand skill fetching.** Don't bundle 2000+ agent MD files. When an agent needs a skill, it fetches via Context7 (for library docs) or a custom skill-fetch MCP (for agent MD files). When the agent is deleted, fetched files are purged.
5. **Our hooks.** Custom hooks for law enforcement, logging, worktree management.
6. **Our documentation.** Agents follow our style, not OpenCode's.

---

## What Needs To Happen Next

### Phase 1: Lock The Template (this week)
- [ ] CEO confirms this template structure
- [ ] Build a validator: given `template + identity YAML`, assert every section in the target agent is reproducible
- [ ] Test: can Voss reproduce the accessibility expert? The frontend developer? The hive-queen? If not, fix the template.

### Phase 2: Rewrite The 3 Permanent Agents (next week)
- [ ] Rewrite Hermes using this template — with EXACT procedures (no more "try Athena, try Voss" loopholes)
- [ ] Rewrite Voss — with the EXACT recruitment procedure
- [ ] Rewrite Daedalus — with the EXACT investigation procedure

### Phase 3: Clone OpenCode (2-3 weeks)
- [ ] Fork the OpenCode repo
- [ ] Remove all built-in agents from source
- [ ] Replace tool implementations with ours
- [ ] Wire in Pocket Universe as the messaging layer
- [ ] Build the on-demand skill-fetch MCP
- [ ] Test end-to-end

### Phase 4: Build Voss's Agent Factory (1 week)
- [ ] Voss's `create_agent` tool takes an Identity YAML + repo file references
- [ ] It expands the template + identity into a full agent MD file
- [ ] The agent is immediately spawnable
- [ ] When deleted, all fetched files are purged

---

## CEO Decision Needed

1. **Confirm this template structure?** Or modify which sections are mandatory/optional?
2. **Confirm the clone decision?** This is a 2-3 week effort but eliminates the integration pain permanently.
3. **Confirm the on-demand fetch approach?** Context7 for library docs + custom MCP for agent MD files. No bundling.
4. **Priority order:** Template first, then rewrite permanent agents, then clone? Or clone first, then template?
