# WebForge Implementation Plan v2
## The Complete System — Built on OpenCode

> **v2.1 UPDATE (post-integration):** After real integration testing, 6 errors were found and fixed (see `webforge-errors-and-fixes.md`). The key changes:
>
> 1. **`safe_task` REMOVED** — the subprocess wrapper was fragile. Replaced with OpenCode's native `task` tool using **glob permissions** (`"*": deny`, `"voss": allow`, `"recruited-*": allow`). This is battle-tested — native permission system > custom wrapper. (Error #4)
> 2. **`mailbox` REMOVED** — passive file-writing can't wake agents. Replaced with **Pocket Universe plugin** (`broadcast` tool auto-wakes recipients, `recall` tool gives agents memory of what previous agents did). (Error #7)
> 3. **Agent format UPGRADED** — simple "Who I Am / What I Do" replaced with the comprehensive ankitmundada + jbeck018 format: `When Invoked`, `Workflow Position`, `Capabilities`, `Communication Protocol`, `Escalation Rules`, `Key Distinctions`, `Example Interactions`. Worker agents: 130-180 lines. Directors: 200-300 lines. (Error #9)
> 4. **Wake-up protocol DEFINED** — 6-step startup procedure on every agent wake-up: read task → `recall(direct_superior)` → read plan → check inbox → start working. Tiered recall: always check direct superior, only check peers if your task depends on them, NEVER check everyone. (Error #8)
> 5. **MCP config FIXED** — all MCPs now have `"type": "local"` + `"enabled": true` (Error #1). `_comment` key removed from JSON (Error #2).
> 6. **Tool count: 10 → 8** — removed `mailbox.ts` + `safe_task.ts`. Added Pocket Universe's `broadcast` + `recall` as plugin-provided tools (not custom .ts files).
>
> ⚠️ **POCKET UNIVERSE PR BLOCKER:** The `broadcast` auto-wake feature requires unmerged OpenCode PRs (#9272 + #7725). The `recall` tool works today. Until the PRs merge, use native `task` to wake agents (spawn them = wake them). The plugin config is installed and ready for when the PRs merge.
>
> **Original v2 changelog:** Restructured 7 pillars → 6 pillars. The MCPs + Context Tools + Custom Tools sections from v1 are now unified under **Pillar 6: MCPs + Tools** — a single cohesive capability layer covering 3 context tools (Repomix, Context7, ast-grep), 6 MCPs (GitHub, Exa, Playwright, Sentry, Vercel, Supabase), and 8 custom TypeScript tools + 2 Pocket Universe plugin tools (`broadcast`, `recall`). Full source code included for every custom tool.

---

## What We're Building

An autonomous agent system that lives inside OpenCode. You give it a goal, it recruits agents, divides work, builds everything, and reports back — without you being present for every step.

OpenCode already provides the runtime, the terminal UI, the tool-calling infrastructure, the `task` subagent system, and session management. We do not rebuild any of that. We add agents, custom tools, MCP connections, and a rules-enforcement layer on top.

### The 6 Pillars

| # | Pillar | What It Is | Battle-Tested Source |
|---|---|---|---|
| 1 | **Agents** | Markdown files (system prompt + permissions + `steps: 35`) | ankitmundada + jbeck018 repos |
| 2 | **The Loop** | Ralph Loop — wrapper re-launches Hermes until plan is done | oh-my-openagent / open-ralph-wiggum |
| 3 | **Worktree** | Each agent works in isolated git worktree | opencode-worktree plugin |
| 4 | **Skills** | Loaded on-demand by agents at runtime | Vercel / Gentleman / FrancoStino repos |
| 5 | **Repo Agent Library** | HR recruits from 200+ downloaded agent MD files | ankitmundada (128) + jbeck018 (95) |
| 6 | **MCPs + Tools** | Unified capability layer: 3 context tools + 6 MCPs + 10 custom TS tools | Repomix + Context7 + ast-grep + OpenCode MCP system |

> v1 had 7 pillars (split MCPs and Context Tools into two). v2 merges them into one because they serve the same purpose: **external capabilities the agents call to do their job.**

---

## Pillar 1: Permanent Agents (3 files)

These are the ONLY agents that exist before a project starts. Everything else is recruited on demand.

### Agent 1: Hermes (the coordinator)

File: `~/.config/opencode/agents/hermes.md`

```markdown
---
description: "WebForge COO — receives tasks from CEO, delegates to recruited agents"
mode: primary
steps: 35
permission:
  read: allow
  edit: allow
  bash: allow
  task: allow
  websearch: allow
  webfetch: allow
  glob: allow
  grep: allow
  list: allow
  todowrite: allow
  question: allow
  skill: allow
---

# WebForge Identity
You are Hermes, the COO of WebForge. The CEO (the user) gives you goals.
You do NOT do the work yourself. You analyze, delegate, and verify.

## Your Job
1. Read the plan file at .webforge/plan.md (create it if it doesn't exist)
2. Check what's done vs what's left
3. If you can finish a task in your 35 tool calls — do it
4. If you can't — recruit agents by asking Voss (HR)
5. Delegate to recruited agents using the task tool
6. Collect their results
7. Update .webforge/plan.md with what's done
8. If everything is done, say "PROJECT COMPLETE"
9. If work remains, say "CONTINUE NEEDED: [what's left]"

## Rules
- You CANNOT write code yourself (delegate to build agents)
- You CANNOT research yourself (delegate to intelligence agents)
- You CAN read files, create tasks, delegate, and verify
- You have 35 tool calls per session — use them wisely
- If an agent fails, recruit another one
- Everything is SEQUENTIAL — one agent at a time

## When to Recruit
- Different areas + too much work = divide (create new agents)
- Same area + too much context = spawn copies (parallel workers)
- Small task = do it yourself or give to one agent

## The 35-Call Rule
Every agent has 35 tool calls. If an agent can't finish in 35 calls:
- It will summarize what's left (OpenCode does this automatically)
- You read the summary
- You recruit another agent to continue
- The plan file tracks where things are

# Battle-Tested Expertise
[Contents of multi-agent-coordinator.md from ankitmundada repo]
[Contents of task-distributor.md from ankitmundada repo]
[Contents of workflow-orchestrator.md from ankitmundada repo]
[Contents of task-router.md from ankitmundada repo]
```

### Agent 2: Voss (HR — the recruiter)

File: `~/.config/opencode/agents/voss.md`

```markdown
---
description: "WebForge HR — recruits and creates agents on demand"
mode: subagent
steps: 35
permission:
  read: allow
  edit: allow
  bash: allow
  task: deny
  websearch: deny
  glob: allow
  grep: allow
  list: allow
  todowrite: deny
  question: allow
  skill: allow
---

# WebForge Identity
You are Voss, the HR Director. Your ONLY job is to recruit agents.

When Hermes tells you what kind of agent he needs:
1. Pick a name (use the registry at .webforge/registry.json for familiar names)
2. Find the right agent MD file from the repo library at .webforge/repo-agents/
3. Use the create_agent tool to write a new agent file to .opencode/agents/
4. Report back to Hermes with the agent name

## What goes into a recruited agent file
- YAML frontmatter: permissions (based on role), steps: 35, mode: subagent
- Custom system prompt: identity, who they report to, what their job is
- Battle-tested agent MD files from the repo library (concatenated)

## Agent Types and Permissions
- Coordinator/Lead: read=allow, edit=deny, bash=deny, task=allow (can delegate)
- Build worker: read=allow, edit=allow, bash=allow, task=deny (writes code)
- Researcher: read=allow, edit=deny, bash=deny, task=allow, websearch=allow
- Quality: read=allow, edit=deny, bash=allow, task=deny (tests only)
- Documentation: read=allow, edit=allow, bash=deny, task=deny (docs only)

## Rules
- You do NOT do project work
- You do NOT delegate
- You ONLY create agent files
- One agent can combine multiple repo MD files (e.g., frontend-developer + react-specialist + typescript-pro)
- All recruited agents get steps: 35

# Battle-Tested Expertise
[Contents of hr-pro.md from ankitmundada repo]
[Contents of agent-installer.md from ankitmundada repo]
[Contents of agent-organizer.md from ankitmundada repo]
```

### Agent 3: Daedalus (Meta Engineering — the enforcer)

File: `~/.config/opencode/agents/daedalus.md`

```markdown
---
description: "WebForge Meta Engineering Director — enforces the 6 Laws, revokes tools from misbehaving agents, monitors the Flagger"
mode: subagent
steps: 35
permission:
  read: allow
  edit: deny
  bash: deny
  safe_edit: allow
  safe_bash: allow
  task: allow
  websearch: deny
  glob: allow
  grep: allow
  list: allow
  todowrite: deny
  question: allow
  skill: allow
  revoke: allow
---

# WebForge Identity
You are Daedalus, the Meta Engineering Director. You report to Hermes.
Your job is to enforce the 6 Laws and keep the agent organization healthy.

## Your Job
1. Monitor the Flagger (`.webforge/memory/edit-log.md`)
2. Investigate inference (Law 5) violations flagged by safe_edit
3. Revoke safe_edit/safe_bash from misbehaving WebForge agents via the revoke tool
4. Report revocations to Hermes via mailbox
5. The CEO (only) can restore revoked permissions — you recommend, the CEO decides

## CRITICAL: Isolation from OpenCode Built-in Agents
You can ONLY affect WebForge agents. You can NEVER affect OpenCode built-in agents.
The revoke tool enforces this in 3 ways:
1. It only operates on .opencode/agents/<name>.md (built-in agents don't live there)
2. It checks .webforge/agents.json — built-in agents are never in the registry
3. Your YAML has no edit/bash on built-in tools — you use safe_edit/safe_bash
If you ever want to modify a built-in agent, STOP. Report to Hermes instead.

## The 6 Laws You Enforce
- Law 1: 35 calls (automatic)
- Law 2: 300-line files (safe_edit blocks)
- Law 3: Real-time docs (safe_edit auto-logs)
- Law 4: Chain of command (mailbox enforces)
- Law 5: No inference (safe_edit Flagger scans — YOUR MAIN FOCUS)
- Law 6: Documentation (safe_edit + safe_bash auto-log)
```

### Why 3 permanent agents (not 2, not 285)

v1 had 285 agents pre-defined. v2 keeps 3 — Hermes, Voss, and Daedalus — because:

1. **Smaller surface area.** 3 files to maintain, not 285.
2. **Dynamic.** Different projects need different agents. HR creates what each project needs.
3. **Update-friendly.** When ankitmundada or jbeck018 publish new agent MD files, HR reads from the latest — no rebuild needed.
4. **Avoids dead agents.** Pre-defining 285 agents means most of them sit idle for any given project. Recruiting on demand means every agent that exists is being used.
5. **Daedalus must be permanent.** Law 5 (No Inference) enforcement cannot wait for HR to recruit an enforcer. The Flagger runs on every `safe_edit` call; when it flags a violation, Daedalus must already exist to investigate and revoke. If Daedalus had to be recruited on demand, there would be a window where a misbehaving agent keeps inferring with no one to stop them.

The 285 skill files from v1 are NOT lost — they're available as **repo agent MD files** in `.webforge/repo-agents/` (see Pillar 5). HR pulls from them when recruiting.

---

## Pillar 2: The Loop (Ralph Loop)

File: `~/.config/opencode/webforge-loop.sh`

```bash
#!/bin/bash
# WebForge Autonomous Loop (Ralph Loop pattern)
# Keeps re-launching Hermes until the plan is 100% complete

PROJECT_DIR=$(pwd)
PLAN_FILE="$PROJECT_DIR/.webforge/plan.md"
MAX_ITERATIONS=50  # Safety limit

for i in $(seq 1 $MAX_ITERATIONS); do
    echo "=== WebForge Loop Iteration $i ==="

    # Check if plan says COMPLETE
    if [ -f "$PLAN_FILE" ]; then
        if grep -q "PROJECT COMPLETE" "$PLAN_FILE"; then
            echo "✅ Project complete! Stopping loop."
            exit 0
        fi
    fi

    # Launch Hermes
    echo "Launching Hermes..."
    opencode run "Continue the WebForge project. Read .webforge/plan.md to see what's done and what's left. Recruit agents if needed. Update the plan as you go. Say PROJECT COMPLETE only when everything is verified done."

    # Check again after Hermes finishes
    if grep -q "PROJECT COMPLETE" "$PLAN_FILE" 2>/dev/null; then
        echo "✅ Project complete! Stopping loop."
        exit 0
    fi

    echo "Work remains. Relaunching Hermes in 5 seconds..."
    sleep 5
done

echo "⚠️ Reached max iterations ($MAX_ITERATIONS). Stopping."
echo "Check .webforge/plan.md for remaining work."
```

**How it works:**
1. Script checks if `plan.md` says `PROJECT COMPLETE`
2. If not — launches Hermes via `opencode run`
3. Hermes runs (35 tool calls), recruits agents, delegates, updates plan
4. Hermes exits
5. Script checks plan again
6. If not done — re-launches Hermes (fresh 35 calls)
7. Repeats until complete or max iterations reached

The Ralph Loop is what makes the system autonomous. You start it, walk away, come back to results. The plan file on disk is the shared memory between iterations — Hermes reads it, updates it, exits; the next Hermes iteration picks up where the last one left off.

---

## Pillar 3: Worktree Isolation

Each agent works in its own git worktree. The main directory stays read-only for context.

### Install the worktree plugin

```bash
# Install opencode-worktree plugin (follow plugin's installation instructions)
```

### How worktrees work in the flow

1. Hermes recruits an agent for a task
2. Before the agent starts, a worktree is created: `.worktrees/<agent-name>/`
3. The agent works in the worktree (can't touch main branch)
4. When the agent finishes, the worktree branch is merged back
5. The worktree is cleaned up
6. The next agent gets a fresh worktree

### Configuration

The worktree plugin should be configured to:
- Create worktrees in `.worktrees/`
- Auto-merge when the agent finishes
- Clean up after merge
- Keep the main directory read-only for context

Worktree isolation prevents agents from clobbering each other's work. Even though execution is sequential (one agent at a time), worktrees give us clean rollback — if an agent produces garbage, we discard the worktree instead of rolling back the main branch.

---

## Pillar 4: Skills

### Install skill repos (one-time)

```bash
# Install Vercel skills
npx skills add vercel-labs/agent-skills --skill frontend-design -a opencode
npx skills add vercel-labs/agent-skills --skill nextjs-performance -a opencode

# Install Gentleman skills
npx skills add Gentleman-Programming/Gentleman-Skills --skill react-19 -a opencode
npx skills add Gentleman-Programming/Gentleman-Skills --skill typescript -a opencode

# Install FrancoStino collection (1595+ skills)
# Browse and install specific skills as needed
```

### How skills work

Skills are NOT part of the agent file. They are NOT assigned by HR.

Each agent has `skill: allow` in its permissions. When an agent runs and needs expertise (e.g., "how to structure a Next.js component"), it uses OpenCode's built-in `skill` tool to load the relevant skill on-demand.

The agent decides what skill it needs. Nobody assigns skills.

> **Important:** Library-specific skills (Next.js, Tailwind, Supabase) are NOT installed as static files anymore — they go stale when the library updates. Instead, Context7 (see Pillar 6) serves live docs through one MCP connection. Static skills are reserved for non-library expertise: design patterns, code review checklists, architecture templates.

---

## Pillar 5: Repo Agent Library

### Setup (one-time)

Clone the two repos into `.webforge/repo-agents/`:

```bash
mkdir -p .webforge/repo-agents
cd .webforge/repo-agents

# Clone ankitmundada (128 agents in 10 categories)
git clone https://github.com/ankitmundada/awesome-opencode-subagents.git ankitmundada

# Clone jbeck018 (95 agents flat)
git clone https://github.com/jbeck018/agents-opencode.git jbeck018
```

### How HR uses the library

When Hermes says "I need a frontend developer," HR:
1. Searches `.webforge/repo-agents/` for `frontend-developer.md`
2. Finds it in `ankitmundada/categories/01-core-development/frontend-developer.md`
3. Reads the file content
4. Combines it with other relevant files (e.g., `react-specialist.md`, `typescript-pro.md`)
5. Uses the `create_agent` tool (see Pillar 6.3) to write a new agent file to `.opencode/agents/recruited-01.md`

### Updating the library

When the repos update:
```bash
cd .webforge/repo-agents/ankitmundada && git pull
cd .webforge/repo-agents/jbeck018 && git pull
```

HR always reads from the latest version. No rebuild needed.

---

## Pillar 6: MCPs + Tools (THE UNIFIED CAPABILITY LAYER)

This is the biggest change from v1. Three categories of capabilities live here:

| Category | Count | What It Is |
|---|---|---|
| **6.1 Context Tools** | 3 | Repomix (project packing), Context7 (live docs), ast-grep (code structure search) |
| **6.2 MCPs** | 6 | GitHub, Exa, Playwright, Sentry, Vercel, Supabase |
| **6.3 Custom Tools** | 9 | TypeScript files in `.opencode/tools/` — mailbox, memory, registry, revoke, safe_edit, safe_bash, status, create_agent, update_plan |

All three categories serve the same purpose: **external capabilities the agents call to do their job.** Tools are filtered by agent permissions — an agent only sees the tools its YAML frontmatter allows.

### Why this is the most important pillar

Without these tools, agents burn all 35 of their tool calls just trying to understand the project. With them, agents understand the project in 1-2 calls and spend the remaining 33 calls doing actual work. The math for a 414-file project like Athletica:

| Approach | Calls spent understanding | Calls left for work |
|---|---|---|
| Read files one by one | 50+ (impossible in 35) | 0 |
| Repomix (1 call) | 1 | 34 |
| Repomix + Context7 + ast-grep | 3 | 32 |

---

### 6.1 Context Tools (3) — MANDATORY for large projects

These three tools solve the biggest problem with large projects: agents wasting all 35 tool calls just trying to understand the codebase.

#### Tool 1: Repomix — project packer

**Problem:** An agent has 35 tool calls. If it reads files one by one to understand a 414-file project like Athletica, it burns 50+ calls just looking around. It never gets to do actual work.

**What Repomix does:** Packs the ENTIRE project — file tree + important file contents — into ONE text file. The agent reads it in ONE tool call and understands the whole project instantly.

**Before Repomix (wasted calls):**
```
Call 1: read package.json
Call 2: read src/app/page.tsx
Call 3: read src/components/Header.tsx
Call 4: read src/components/Footer.tsx
...
Call 35: (still reading, no work done)
```

**With Repomix (efficient):**
```
Call 1: read .webforge/project-snapshot.txt (entire project packed)
Calls 2-35: actual work (writing code, running tests, etc.)
```

**Installation:**
```bash
npm install -g repomix
```

**Usage in agent system prompt:**
```
Before starting work, run `repomix` to pack the project into a single file.
Read the output file to understand the full project structure.
Then start working.
```

**For Athletica specifically:** Repomix is not optional. Without it, no agent can understand Athletica in 35 tool calls. With it, they understand it in 1 call.

#### Tool 2: Context7 — live library docs

**Problem:** Skill files for libraries (Next.js, Tailwind, Supabase) go outdated. Next.js updates to v16 but the skill file still describes v15. Agent follows old patterns, breaks things.

**What Context7 does:** ONE MCP connection serves live, current documentation for 9,000+ libraries. When an agent needs to know "how does Next.js 16 routing work?", it asks Context7 and gets the real current docs — not a stale skill file.

**What it replaces:**
- ❌ Install Next.js skill → Context7 has it live
- ❌ Install Tailwind skill → Context7 has it live
- ❌ Install Supabase skill → Context7 has it live
- ❌ Install 100 library skills → Context7 covers all of them

**Installation:** See 6.2 below — Context7 is configured as an MCP server in `opencode.json`.

**For Athletica specifically:** Athletica uses Next.js, Tailwind, Prisma, Supabase. All of these have frequently-updating APIs. Context7 ensures agents always use the current version's patterns.

#### Tool 3: ast-grep — code structure search

**Problem:** Regular `grep` searches for TEXT, not CODE. If an agent searches for `getX` to rename it, grep finds:
- `const result = getX()` ✅ (the function call — what we want)
- `// TODO: remove getX later` ❌ (a comment — false match)
- `function getXName()` ❌ (a different function — false match)

The agent wastes calls fixing false matches and breaks things that weren't broken.

**What ast-grep does:** Understands CODE STRUCTURE. It knows the difference between a function call, a comment, and a variable name. When you say "rename every `getX` to `useX`", ast-grep only changes actual function calls.

**Installation:**
```bash
npm install -g @ast-grep/cli
```

**Usage in agent system prompt:**
```
When refactoring (renaming, restructuring), use ast-grep instead of grep.
ast-grep understands code structure and avoids false matches.
Example: ast-grep run --pattern 'getX()' --rewrite 'useX()' --lang typescript
```

**For Athletica specifically:** Athletica has 414 files. When an agent needs to rename a function or restructure components, ast-grep ensures it changes the right things across all 414 files without false matches.

#### How all three work together

```
Agent starts (35 tool calls available):
  Call 1: Repomix → reads entire project (1 call, understands everything)
  Call 2: Context7 → fetches current Next.js docs (1 call, latest patterns)
  Call 3-30: Writes code using latest patterns
  Call 31: ast-grep → renames a function across all 414 files (1 call, no false matches)
  Call 32-35: Verifies, commits, reports
```

Without these tools:
```
Call 1-35: Still reading files, never gets to write any code
```

---

### 6.2 MCPs (6) — external service connections

MCPs connect OpenCode to external services. Once installed at the project level, all agents can use them (filtered by their permissions). You install once, every recruited agent benefits.

MCPs are configured in `opencode.json` (or `.opencode/mcp.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "hermes",
  "agent": {
    "build": { "disable": true },
    "plan": { "disable": true }
  },
  "mcp": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    },
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "your-key-here"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "your-token-here"
      }
    },
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp-adapter"],
      "env": {
        "VERCEL_TOKEN": "your-token-here"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

#### MCP Stack Summary

| MCP | What It Does | Priority | Who Uses It |
|---|---|---|---|
| **Context7** | Fetches CURRENT documentation for 9,000+ libraries | ✅ CRITICAL | All build agents — prevents outdated API usage |
| **GitHub MCP** | Read repos, create PRs, manage issues, branches | ✅ CRITICAL | Build workers, commit agents |
| **Exa MCP** | Semantic web search designed for AI agents | ✅ HIGH | Intelligence/research agents |
| **Playwright MCP** | Browser automation for e2e testing | ⚠️ MEDIUM | Quality agents (testing) |
| **Sentry MCP** | Error tracking, stack traces | ⚠️ LATER | Quality agents (debugging) |
| **Vercel MCP** | Deploy, check status, rollback | ⚠️ LATER | Build/DB agents (deployment) |
| **Supabase MCP** | Direct database access | ⚠️ LATER | DB/Infra agents |

#### Why Context7 replaces most library skills

Instead of installing a skill file for Next.js, another for Tailwind, another for Supabase — and having them go outdated when the library updates — Context7 serves live, current documentation through ONE MCP connection.

- Agent needs to know Next.js 16 routing? → asks Context7 → gets current docs
- Agent needs Tailwind v4 config? → asks Context7 → gets current docs
- Agent needs Supabase RLS patterns? → asks Context7 → gets current docs

**One connection, 9,000+ libraries, always up-to-date.** This replaces most library-specific skill installations.

---

### 6.3 Custom Tools (10) — TypeScript files in `.opencode/tools/`

These are WebForge-specific tools. They enforce the 6 Laws and the WebForge-only isolation through code, not prompts.

The 7 original tools exist in `download/webforge-opencode/tools/` and ship in the integration package. The remaining 3 (`create_agent`, `update_plan`, `safe_task`) were added in v2 — `safe_task` is the critical isolation fix that prevents WebForge agents from spawning OpenCode built-in agents.

| # | Tool | File | Status | Who Uses It | What It Does |
|---|---|---|---|---|---|
| 1 | **create_agent** | `create_agent.ts` | ✅ CREATED in v2 | Voss (HR) | Creates new agent files on disk from repo templates + updates agents.json |
| 2 | **update_plan** | `update_plan.ts` | ✅ CREATED in v2 | Hermes | Updates the plan file (`.webforge/plan.md`) |
| 3 | **mailbox** | `mailbox.ts` | ✅ EXISTS | All agents | Send messages (enforces chain of command) |
| 4 | **memory** | `memory.ts` | ✅ EXISTS | All agents | Read/write project memory (Law 6) |
| 5 | **registry** | `registry.ts` | ✅ EXISTS | All agents | Look up agent info, check who reports to whom |
| 6 | **safe_edit** | `safe_edit.ts` | ✅ EXISTS | Build workers | Edit files with Law 2 (300-line check) + Law 5 (Flagger) + Law 6 (log) |
| 7 | **safe_bash** | `safe_bash.ts` | ✅ EXISTS | Build workers | Run commands with dangerous-op blocking + logging |
| 8 | **safe_task** | `safe_task.ts` | ✅ CREATED in v2 | Hermes, Daedalus, directors | Spawn subagents — validates target against agents.json, BLOCKS built-in agents. Replaces built-in `task` tool. |
| 9 | **revoke** | `revoke.ts` | ✅ EXISTS | Daedalus/Hermes | Strip safe_edit/safe_bash from misbehaving WebForge agents (NEVER built-in agents — registry-guarded) |
| 10 | **status** | `status.ts` | ✅ EXISTS | All agents | Report status to superior (working/done/blocked) |

#### How permissions control tool access

An agent only sees the tools its YAML frontmatter allows. WebForge agents **deny** the built-in `edit`/`bash`/`task` and **allow** `safe_edit`/`safe_bash`/`safe_task` instead — this forces them through the law-enforcing wrappers. OpenCode's built-in agents keep their own `edit`/`bash`/`task` permissions and never see the `safe_*` variants, so WebForge rules don't affect them. See "Isolation from OpenCode Built-in Agents" below for the full four-layer isolation design.

#### The 6 Laws and how each is enforced in code

| Law | Description | Enforced By |
|---|---|---|
| Law 1 | Task size limit (35 calls) | OpenCode's `steps: 35` in agent YAML |
| Law 2 | 300-line file rule | `safe_edit.ts` + `memory.ts` block writes > 300 lines |
| Law 3 | Real-time docs | `safe_edit.ts` logs every edit to `.webforge/memory/edit-log.md` |
| Law 4 | Chain of command | `mailbox.ts` checks relationships before sending |
| Law 5 | No inference | `safe_edit.ts` Flagger scans for "I assume", "probably", hardcoded secrets |
| Law 6 | Documentation | `safe_edit.ts` + `safe_bash.ts` auto-log to memory |

#### Isolation from OpenCode Built-in Agents (CRITICAL)

**WebForge rules ONLY apply to WebForge agents. OpenCode's built-in agents are completely unaffected — they cannot be modified by Daedalus, spawned by Hermes, or affected by any WebForge tool.**

This is achieved through **four layers**:

**Layer 1 — YAML Permission Gating**

Every WebForge agent (hermes, voss, daedalus, recruited-*) denies built-in `edit`/`bash`/`task` and allows `safe_edit`/`safe_bash`/`safe_task`:

```yaml
permission:
  edit: deny           # ← denies built-in edit (no law enforcement)
  bash: deny           # ← denies built-in bash (no dangerous-op blocking)
  task: deny           # ← denies built-in task (no allowlist — could spawn built-in agents)
  safe_edit: allow     # ← allows our law-enforcing safe_edit
  safe_bash: allow     # ← allows our law-enforcing safe_bash
  safe_task: allow     # ← allows our allowlist-enforced safe_task (only spawns WebForge agents)
```

OpenCode's built-in agents have their OWN YAML with their OWN permissions. They keep `edit: allow`, `bash: allow`, and `task: allow` — they never see the `safe_*` variants.

**Layer 2 — Tool Guards (Belt and Suspenders)**

Every WebForge custom tool checks `.webforge/agents.json` at the start of its `execute()`:

```typescript
// ─── WebForge Tool Guard ───
const regPath = path.join(process.cwd(), ".webforge", "agents.json")
let _isWebForgeAgent = false
try {
  const reg = JSON.parse(fs.readFileSync(regPath, "utf-8"))
  _isWebForgeAgent = Object.values(reg).some(
    (a: any) => a.name?.toLowerCase() === callerAgent.toLowerCase()
  )
} catch {}
if (!_isWebForgeAgent) {
  return `BLOCKED: ${callerAgent} is not a registered WebForge agent.`
}
```

If a built-in agent somehow calls our tools, the guard blocks it. The built-in agent falls back to its own tools. The 3 tools with role-based guards (`create_agent` → Voss only, `update_plan` → Hermes only, `revoke` → Daedalus/Hermes only) don't need the registry guard — the role check is stricter.

**Layer 3 — safe_task Allowlist (Spawn Isolation)**

This is the layer that closes the "filesystem path guard" gap. Without it, a WebForge agent with `task: allow` could call `task({ subagent_type: "build" })` to spawn a built-in agent. With `safe_task`, that's impossible:

- All WebForge agents have `task: deny` — the built-in `task` tool is blocked at the YAML level
- All WebForge agents have `safe_task: allow` — the only spawn mechanism available to them
- `safe_task` checks `.webforge/agents.json` before spawning. If the target is not a registered WebForge agent, it returns `BLOCKED: '<name>' is not a registered WebForge agent`
- Built-in agents (build, plan, etc.) are NEVER in `.webforge/agents.json`, so `safe_task` provably cannot spawn them

This means: **a WebForge agent can ONLY spawn other WebForge agents. It can never spawn a built-in agent.**

**Layer 4 — Ralph Loop Isolation**

`webforge-loop.sh` ONLY launches Hermes via `opencode run`. It never modifies, disables, or touches any OpenCode built-in agent. If you're using OpenCode's `build` or `plan` agent in another session, the Ralph Loop has zero effect on it.

**Summary table:**

| Agent | Status | WebForge Rules Apply? | Can Be Revoked by Daedalus? | Can Be Spawned by WebForge Agents? |
|---|---|---|---|---|
| Hermes | Active (default) | ✅ Yes | ✅ Yes (only by CEO manually) | ✅ Yes — via `safe_task` |
| Voss | Active (subagent) | ✅ Yes | ✅ Yes (only by CEO manually) | ✅ Yes — via `safe_task` |
| Daedalus | Active (subagent) | ✅ Yes | ✅ Yes (only by CEO manually) | ✅ Yes — via `safe_task` |
| recruited-* | Active when created | ✅ Yes | ✅ Yes — Daedalus's primary target | ✅ Yes — via `safe_task` |
| build (built-in) | Disabled (redundant) | N/A — can't run | ❌ NEVER — not in registry | ❌ NEVER — `safe_task` blocks it |
| plan (built-in) | Disabled (redundant) | N/A — can't run | ❌ NEVER — not in registry | ❌ NEVER — `safe_task` blocks it |
| Any other built-in | Active (if exists) | ❌ No — keeps own permissions | ❌ NEVER — not in registry | ❌ NEVER — `safe_task` blocks it |

**Daedalus's revocation authority is hard-limited by the `revoke` tool's registry check.** Even if Daedalus tried to revoke a built-in agent, the tool returns `BLOCKED: <name> is not a registered WebForge agent.` Built-in agents are never in `.webforge/agents.json`, so they are provably unreachable.

**WebForge's spawn authority is hard-limited by the `safe_task` tool's registry check.** Even if Hermes tried to spawn a built-in agent, the tool returns `BLOCKED: '<name>' is not a registered WebForge agent.` Combined with `task: deny` in the YAML, WebForge agents have NO path to spawn built-in agents.

#### Tool 1: create_agent.ts (NEEDS CREATION)

Used by Voss (HR) to create new agent files on disk.

```typescript
/**
 * WebForge Create Agent — HR uses this to create new agent files.
 *
 * Reads repo agent MD files from .webforge/repo-agents/, concatenates them
 * with a custom identity prompt + YAML frontmatter, and writes the result
 * to .opencode/agents/<name>.md.
 *
 * Place in: .opencode/tools/create_agent.ts
 */

export default {
  description: "Create a new agent file from repo templates. HR (Voss) uses this to recruit agents. The agent file is written to .opencode/agents/<name>.md and is immediately spawnable via the task tool.",
  args: {
    name: {
      type: "string",
      description: "Agent name (lowercase, hyphenated, e.g., 'recruited-01' or 'athena')",
    },
    identity: {
      type: "string",
      description: "Custom identity prompt — who this agent is, who they report to, what their job is",
    },
    repo_files: {
      type: "array",
      items: { type: "string" },
      description: "Paths to repo agent MD files in .webforge/repo-agents/ to concatenate (e.g., ['ankitmundada/categories/01-core-development/frontend-developer.md'])",
    },
    permissions: {
      type: "object",
      description: "Permissions object: { read, edit, bash, task, websearch, glob, grep, list, todowrite, question, skill } — each 'allow' or 'deny'",
    },
    department: {
      type: "string",
      description: "Department: build, intelligence, quality, documentation, meta, hr, executive",
    },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const callerAgent = context.agent || "Unknown"
    if (callerAgent.toLowerCase() !== "voss") {
      return `BLOCKED: Only Voss (HR) can create agents. ${callerAgent} is not authorized.`
    }

    // 1. Read repo agent MD files
    const repoDir = path.join(process.cwd(), ".webforge", "repo-agents")
    let repoContent = ""
    for (const repoFile of args.repo_files || []) {
      const fullPath = path.join(repoDir, repoFile)
      try {
        repoContent += `\n\n# Battle-Tested Expertise (from ${repoFile})\n\n`
        repoContent += fs.readFileSync(fullPath, "utf-8")
      } catch {
        return `Repo file not found: ${repoFile}`
      }
    }

    // 2. Build YAML frontmatter
    const perms = args.permissions || { read: "allow", edit: "deny", bash: "deny", task: "deny" }
    const frontmatter = [
      "---",
      `description: "WebForge recruited agent — ${args.name}"`,
      "mode: subagent",
      "steps: 35",
      "permission:",
      `  read: ${perms.read || "allow"}`,
      `  edit: ${perms.edit || "deny"}`,
      `  bash: ${perms.bash || "deny"}`,
      `  task: ${perms.task || "deny"}`,
      `  websearch: ${perms.websearch || "deny"}`,
      `  glob: ${perms.glob || "allow"}`,
      `  grep: ${perms.grep || "allow"}`,
      `  list: ${perms.list || "allow"}`,
      `  todowrite: ${perms.todowrite || "deny"}`,
      `  question: ${perms.question || "allow"}`,
      `  skill: ${perms.skill || "allow"}`,
      "---",
    ].join("\n")

    // 3. Assemble the agent file
    const agentContent = `${frontmatter}

# WebForge Identity
${args.identity}

## Department
${args.department || "unassigned"}

${repoContent}
`

    // 4. Write to .opencode/agents/<name>.md
    const agentsDir = path.join(process.cwd(), ".opencode", "agents")
    fs.mkdirSync(agentsDir, { recursive: true })
    const agentFile = path.join(agentsDir, `${args.name}.md`)
    fs.writeFileSync(agentFile, agentContent, "utf-8")

    // 5. Log to memory
    const memDir = path.join(process.cwd(), ".webforge", "memory")
    fs.mkdirSync(memDir, { recursive: true })
    const logPath = path.join(memDir, "recruitments.md")
    const logEntry = `- **[${new Date().toISOString()}]** ${callerAgent} recruited ${args.name} (${args.department || "unassigned"})\n`
    fs.appendFileSync(logPath, logEntry, "utf-8")

    return `Agent ${args.name} created at .opencode/agents/${args.name}.md. Hermes can now spawn it via task({ subagent_type: "${args.name}" }).`
  },
}
```

#### Tool 2: update_plan.ts (NEEDS CREATION)

Used by Hermes to update the shared plan file.

```typescript
/**
 * WebForge Update Plan — Hermes uses this to update the shared plan file.
 *
 * The plan file at .webforge/plan.md is the shared memory between Ralph Loop
 * iterations. Hermes reads it at the start of each session and updates it
 * as work progresses. The loop script checks for "PROJECT COMPLETE" to stop.
 *
 * Place in: .opencode/tools/update_plan.ts
 */

export default {
  description: "Update the WebForge plan file. Use this to mark tasks as done, in_progress, blocked, or remaining. Say 'PROJECT COMPLETE' only when everything is verified done.",
  args: {
    task_id: {
      type: "string",
      description: "Task ID to update (e.g., 'task-001')",
    },
    status: {
      type: "string",
      description: "New status: 'done', 'in_progress', 'blocked', 'remaining'",
    },
    notes: {
      type: "string",
      description: "Notes about this update (what was done, what's blocking, etc.)",
    },
    project_complete: {
      type: "boolean",
      description: "Set to true ONLY when every task is verified done. This stops the Ralph Loop.",
    },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const callerAgent = context.agent || "Unknown"
    if (callerAgent.toLowerCase() !== "hermes") {
      return `BLOCKED: Only Hermes can update the plan. ${callerAgent} is not authorized.`
    }

    const planPath = path.join(process.cwd(), ".webforge", "plan.md")
    const planDir = path.dirname(planPath)
    fs.mkdirSync(planDir, { recursive: true })

    // Read existing plan or create new one
    let content = ""
    if (fs.existsSync(planPath)) {
      content = fs.readFileSync(planPath, "utf-8")
    } else {
      content = "# WebForge Project Plan\n\n## Tasks\n\n"
    }

    // Update or add the task entry
    const timestamp = new Date().toISOString()
    const taskLine = `- **[${timestamp}]** ${args.task_id}: ${args.status.toUpperCase()} — ${args.notes || "(no notes)"}`

    if (content.includes(`### ${args.task_id}`)) {
      // Append update to existing task section
      content = content.replace(
        new RegExp(`### ${args.task_id}([\\s\\S]*?)(?=### |$)`),
        `### ${args.task_id}\n${taskLine}\n`
      )
    } else {
      // Create new task section
      content += `\n### ${args.task_id}\n${taskLine}\n`
    }

    // Add PROJECT COMPLETE marker if requested
    if (args.project_complete) {
      if (!content.includes("PROJECT COMPLETE")) {
        content += `\n## PROJECT COMPLETE\nAll tasks verified done at ${timestamp}.\n`
      }
    }

    fs.writeFileSync(planPath, content, "utf-8")

    return `Plan updated. Task ${args.task_id} marked ${args.status}. Plan file: .webforge/plan.md${args.project_complete ? ". PROJECT COMPLETE marker set — loop will stop." : ""}`
  },
}
```

#### Tool 3: mailbox.ts (EXISTS)

Source: `download/webforge-opencode/tools/mailbox.ts`

```typescript
/**
 * WebForge Mailbox Tool — lets agents send messages to each other.
 *
 * Enforces the chain of command: an agent can only message its direct
 * superior or direct subordinates. Messages are saved to a JSON file.
 *
 * Place in: .opencode/tools/mailbox.ts
 */

export default {
  description: "Send a message to another agent. The recipient must be your direct superior or direct subordinate (chain of command enforced).",
  args: {
    to: { type: "string", description: "Agent name to send the message to" },
    subject: { type: "string", description: "Short subject line" },
    body: { type: "string", description: "Full message body" },
    msg_type: { type: "string", description: "Message type: TASK_ASSIGNED, TASK_ACK, TASK_PROGRESS, TASK_DONE, TASK_BLOCKED, QUESTION, ANSWER, INFO" },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const fromAgent = context.agent || "Unknown"
    const toAgent = args.to

    // Load the WebForge registry to check chain of command
    const registryPath = path.join(process.cwd(), ".webforge", "agents.json")
    let registry = {}
    try {
      registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"))
    } catch {
      // Registry not found — allow the message
    }

    const fromAgentInfo = Object.values(registry).find(
      (a) => a.name.toLowerCase() === fromAgent.toLowerCase()
    )
    const toAgentInfo = Object.values(registry).find(
      (a) => a.name.toLowerCase() === toAgent.toLowerCase()
    )

    if (fromAgentInfo && toAgentInfo) {
      const isSuperior = fromAgentInfo.reportsTo?.toLowerCase() === toAgent.toLowerCase()
      const isSubordinate = fromAgentInfo.subordinates?.some(
        (s) => s.toLowerCase() === toAgent.toLowerCase()
      )

      if (!isSuperior && !isSubordinate) {
        return `BLOCKED: Chain of command violation. ${fromAgent} can only message ${fromAgentInfo.reportsTo || "their superior"} or their direct subordinates: ${fromAgentInfo.subordinates?.join(", ") || "none"}`
      }
    }

    const mailboxDir = path.join(process.cwd(), ".webforge", "mailbox")
    fs.mkdirSync(mailboxDir, { recursive: true })

    const inboxPath = path.join(mailboxDir, `${toAgent.toLowerCase()}.json`)
    let inbox = { messages: [] }
    try { inbox = JSON.parse(fs.readFileSync(inboxPath, "utf-8")) } catch {}

    inbox.messages.push({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      from: fromAgent, to: toAgent,
      type: args.msg_type || "INFO",
      subject: args.subject, body: args.body,
      timestamp: new Date().toISOString(), read: false,
    })

    fs.writeFileSync(inboxPath, JSON.stringify(inbox, null, 2))
    return `Message sent to ${toAgent}: ${args.subject}`
  },
}
```

#### Tool 4: memory.ts (EXISTS)

Source: `download/webforge-opencode/tools/memory.ts`

```typescript
/**
 * WebForge Memory Tool — read and write to project memory.
 *
 * Memory is stored as markdown files in .webforge/memory/.
 * This implements Law 6 (real-time documentation) and Law 2 (300-line rule).
 *
 * Place in: .opencode/tools/memory.ts
 */

export default {
  description: "Read from or write to WebForge project memory. Use 'read' to get project state, decisions, or rules. Use 'write' to log a decision or update state.",
  args: {
    action: { type: "string", description: "Action: 'read' or 'write'" },
    file: { type: "string", description: "File to read/write: 'STATE.md', 'PROJECT.md', 'decisions/<name>.md'" },
    content: { type: "string", description: "Content to write (only for 'write' action)" },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const memoryDir = path.join(process.cwd(), ".webforge", "memory")
    fs.mkdirSync(memoryDir, { recursive: true })
    fs.mkdirSync(path.join(memoryDir, "decisions"), { recursive: true })

    const filePath = path.join(memoryDir, args.file)

    if (args.action === "read") {
      try {
        const content = fs.readFileSync(filePath, "utf-8")
        const lines = content.split("\n")
        if (lines.length > 240) {
          return `${content}\n\n⚠️ WARNING: This file has ${lines.length} lines (Law 2: max 300). Consider splitting.`
        }
        return content
      } catch {
        return `File not found: ${args.file}`
      }
    }

    if (args.action === "write") {
      const lines = (args.content || "").split("\n")
      if (lines.length > 300) {
        return `BLOCKED: File would have ${lines.length} lines (Law 2: max 300). Split the content.`
      }
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, args.content, "utf-8")
      return `Written to ${args.file} (${lines.length} lines)`
    }

    return "Unknown action. Use 'read' or 'write'."
  },
}
```

#### Tool 5: registry.ts (EXISTS)

Source: `download/webforge-opencode/tools/registry.ts`

```typescript
/**
 * WebForge Registry Tool — look up agent info and check relationships.
 *
 * Place in: .opencode/tools/registry.ts
 */

export default {
  description: "Look up agent information from the WebForge registry. Check who reports to whom, what tools an agent has, or find agents by department.",
  args: {
    action: { type: "string", description: "Action: 'lookup', 'subordinates', 'superior', or 'department'" },
    agent: { type: "string", description: "Agent name (for 'lookup', 'subordinates', 'superior')" },
    department: { type: "string", description: "Department name (for 'department'): build, intelligence, quality, documentation, meta, hr, executive" },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const registryPath = path.join(process.cwd(), ".webforge", "agents.json")
    let registry = {}
    try { registry = JSON.parse(fs.readFileSync(registryPath, "utf-8")) }
    catch { return "Registry not found. Run WebForge setup first." }

    const agents = Object.values(registry)

    if (args.action === "lookup") {
      const agent = agents.find(a => a.name.toLowerCase() === args.agent?.toLowerCase())
      if (!agent) return `Agent not found: ${args.agent}`
      return JSON.stringify({
        name: agent.name, title: agent.title, department: agent.department,
        roleTier: agent.roleTier, reportsTo: agent.reportsTo,
        subordinates: agent.subordinates, skillFile: agent.skillFile,
      }, null, 2)
    }

    if (args.action === "subordinates") {
      const agent = agents.find(a => a.name.toLowerCase() === args.agent?.toLowerCase())
      if (!agent) return `Agent not found: ${args.agent}`
      return `Subordinates of ${agent.name}: ${agent.subordinates?.join(", ") || "none"}`
    }

    if (args.action === "superior") {
      const agent = agents.find(a => a.name.toLowerCase() === args.agent?.toLowerCase())
      if (!agent) return `Agent not found: ${args.agent}`
      return `Superior of ${agent.name}: ${agent.reportsTo || "none (top of chain)"}`
    }

    if (args.action === "department") {
      const deptAgents = agents.filter(a => a.department === args.department)
      return `Agents in ${args.department}: ${deptAgents.map(a => a.name).join(", ")}`
    }

    return "Unknown action. Use 'lookup', 'subordinates', 'superior', or 'department'."
  },
}
```

#### Tool 6: safe_edit.ts (EXISTS)

Source: `download/webforge-opencode/tools/safe_edit.ts`

```typescript
/**
 * WebForge Safe Edit — wraps file editing with Law enforcement.
 *
 * Checks:
 * - Law 2: File must not exceed 300 lines after edit
 * - Law 6: Logs the edit to project memory
 * - Law 5: Scans content for inference patterns (Flagger)
 *
 * Place in: .opencode/tools/safe_edit.ts
 */

export default {
  description: "Edit a file safely. Checks file length (Law 2), logs to memory (Law 6), and scans for inference (Law 5). Use this instead of the built-in edit tool.",
  args: {
    path: { type: "string", description: "File path to edit" },
    content: { type: "string", description: "New file content" },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const agentName = context.agent || "Unknown"
    const filePath = path.join(process.cwd(), args.path)

    // Law 2: Check file length
    const lines = (args.content || "").split("\n")
    if (lines.length > 300) {
      return `BLOCKED by Law 2: File would have ${lines.length} lines (max 300). Split the content into smaller files.`
    }

    // Law 5: Scan for inference patterns (Flagger)
    const inferenceFlags = []
    const patterns = [
      { regex: /I assume/gi, message: "Agent wrote 'I assume' — possible inference" },
      { regex: /I guess/gi, message: "Agent wrote 'I guess' — possible inference" },
      { regex: /probably/gi, message: "Agent wrote 'probably' — possible inference" },
      { regex: /I think this should/gi, message: "Agent wrote 'I think this should' — possible inference" },
      { regex: /sk-[a-zA-Z0-9]{20,}/gi, message: "Possible API key found in code" },
      { regex: /password\s*=\s*["'][^"']+["']/gi, message: "Hardcoded password found" },
    ]
    for (const p of patterns) {
      if (p.regex.test(args.content)) inferenceFlags.push(p.message)
    }

    // Write the file
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, args.content, "utf-8")

    // Law 6: Log to memory
    const memDir = path.join(process.cwd(), ".webforge", "memory")
    fs.mkdirSync(memDir, { recursive: true })
    const logPath = path.join(memDir, "edit-log.md")
    const logEntry = `- **[${new Date().toISOString()}]** ${agentName} edited ${args.path} (${lines.length} lines)\n`
    fs.appendFileSync(logPath, logEntry, "utf-8")

    let response = `File edited: ${args.path} (${lines.length} lines). Logged to memory.`
    if (inferenceFlags.length > 0) {
      response += `\n\n⚠️ FLIGGER DETECTED ${inferenceFlags.length} POTENTIAL ISSUE(S):\n`
      inferenceFlags.forEach(f => response += `  - ${f}\n`)
      response += `\nThese have been logged for review by the Reviewer agent.`
    }
    return response
  },
}
```

#### Tool 7: safe_bash.ts (EXISTS)

Source: `download/webforge-opencode/tools/safe_bash.ts`

```typescript
/**
 * WebForge Safe Bash — wraps bash commands with safety checks.
 *
 * Checks:
 * - Blocks dangerous commands (rm -rf /, sudo, etc.)
 * - Blocks writing to .env files
 * - Logs all commands to memory (Law 6)
 *
 * Place in: .opencode/tools/safe_bash.ts
 */

export default {
  description: "Run a shell command safely. Blocks dangerous commands, protects .env files, and logs to memory. Use this instead of the built-in bash tool.",
  args: {
    command: { type: "string", description: "Shell command to execute" },
  },
  async execute(args, context) {
    const { execSync } = await import("child_process")
    const fs = await import("fs")
    const path = await import("path")

    const agentName = context.agent || "Unknown"
    const command = args.command

    // Block dangerous commands
    const blocked = [
      { pattern: /rm\s+-rf\s+\//i, message: "BLOCKED: Cannot delete root directory" },
      { pattern: /rm\s+-rf\s+~/i, message: "BLOCKED: Cannot delete home directory" },
      { pattern: /sudo/i, message: "BLOCKED: Cannot use sudo" },
      { pattern: /chmod\s+777/i, message: "BLOCKED: Cannot set world-writable permissions" },
      { pattern: /\.env/i, message: "BLOCKED: Cannot access .env files (Law 4: security)" },
      { pattern: /DROP\s+TABLE/i, message: "BLOCKED: Cannot drop database tables" },
      { pattern: /git\s+push\s+.*main/i, message: "BLOCKED: Cannot push directly to main branch" },
      { pattern: /git\s+push\s+--force/i, message: "BLOCKED: Cannot force push" },
    ]

    for (const block of blocked) {
      if (block.pattern.test(command)) return block.message
    }

    let output
    try {
      output = execSync(command, {
        encoding: "utf-8", timeout: 60000,
        cwd: process.cwd(), maxBuffer: 1024 * 1024,
      })
    } catch (e) {
      output = `Command failed: ${e.message}`
    }

    // Law 6: Log to memory
    const memDir = path.join(process.cwd(), ".webforge", "memory")
    fs.mkdirSync(memDir, { recursive: true })
    const logPath = path.join(memDir, "bash-log.md")
    const logEntry = `- **[${new Date().toISOString()}]** ${agentName} ran: \`${command.slice(0, 100)}\`\n`
    fs.appendFileSync(logPath, logEntry, "utf-8")

    if (output.length > 5000) return output.slice(0, 5000) + "\n... (output truncated)"
    return output || "(no output)"
  },
}
```

#### Tool 8: revoke.ts (EXISTS)

Source: `download/webforge-opencode/tools/revoke.ts`

```typescript
/**
 * WebForge Revoke — strips tools from a misbehaving agent.
 *
 * Used by Daedalus (Meta Engineering Director) when an agent is caught
 * violating Law 5 (No Inference). Removes edit and bash permissions
 * from the agent's config file.
 *
 * Place in: .opencode/tools/revoke.ts
 */

export default {
  description: "Revoke edit and bash permissions from an agent that violated laws. Only Daedalus or Hermes should use this. The agent will be unable to modify files or run commands until manually restored.",
  args: {
    agent: { type: "string", description: "Name of the agent to revoke permissions from" },
    reason: { type: "string", description: "Why permissions are being revoked (e.g., 'Inference detected in login form code')" },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const callerAgent = context.agent || "Unknown"

    if (callerAgent.toLowerCase() !== "daedalus" && callerAgent.toLowerCase() !== "hermes") {
      return `BLOCKED: Only Daedalus or Hermes can revoke permissions. ${callerAgent} is not authorized.`
    }

    const targetAgent = args.agent.toLowerCase()
    const agentsDir = path.join(process.cwd(), ".opencode", "agents")
    const agentFile = path.join(agentsDir, `${targetAgent}.md`)

    if (!fs.existsSync(agentFile)) return `Agent file not found: ${agentFile}`

    let content = fs.readFileSync(agentFile, "utf-8")
    content = content.replace(/edit:\s*allow/g, "edit: deny")
    content = content.replace(/bash:\s*allow/g, "bash: deny")

    const revokeNote = `\n\n## ⚠️ PERMISSIONS REVOKED\n- **Revoked by:** ${callerAgent}\n- **Reason:** ${args.reason}\n- **Time:** ${new Date().toISOString()}\n- **Status:** edit and bash permissions removed. Agent can only read until CEO restores.\n`

    const parts = content.split("---")
    if (parts.length >= 3) {
      content = parts[0] + "---" + parts[1] + "---" + revokeNote + parts.slice(2).join("---")
    }

    fs.writeFileSync(agentFile, content, "utf-8")

    const memDir = path.join(process.cwd(), ".webforge", "memory")
    fs.mkdirSync(memDir, { recursive: true })
    const logPath = path.join(memDir, "revocations.md")
    const logEntry = `- **[${new Date().toISOString()}]** ${callerAgent} revoked edit+bash from ${targetAgent}. Reason: ${args.reason}\n`
    fs.appendFileSync(logPath, logEntry, "utf-8")

    return `Permissions revoked from ${args.agent}. edit and bash are now denied. Reason: ${args.reason}. The CEO must manually restore permissions.`
  },
}
```

#### Tool 9: status.ts (EXISTS)

Source: `download/webforge-opencode/tools/status.ts`

```typescript
/**
 * WebForge Status Tool — agents report their status to their superior.
 *
 * This implements the watchdog pattern: agents call this to say
 * "I'm working", "I'm done", or "I'm blocked".
 *
 * Place in: .opencode/tools/status.ts
 */

export default {
  description: "Report your status to your superior. Use 'working' when you start, 'done' when finished, or 'blocked' when stuck. Your superior will be notified.",
  args: {
    status: { type: "string", description: "Status: 'working', 'done', or 'blocked'" },
    message: { type: "string", description: "Details about your status" },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const fromAgent = context.agent || "Unknown"

    // Load registry to find superior
    const registryPath = path.join(process.cwd(), ".webforge", "agents.json")
    let superior = null
    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"))
      const agentInfo = Object.values(registry).find(
        a => a.name.toLowerCase() === fromAgent.toLowerCase()
      )
      superior = agentInfo?.reportsTo
    } catch {}

    const statusDir = path.join(process.cwd(), ".webforge", "status")
    fs.mkdirSync(statusDir, { recursive: true })

    const statusPath = path.join(statusDir, `${fromAgent.toLowerCase()}.json`)
    fs.writeFileSync(statusPath, JSON.stringify({
      agent: fromAgent, status: args.status,
      message: args.message || "", timestamp: new Date().toISOString(),
    }, null, 2))

    if (superior) {
      const mailboxPath = path.join(process.cwd(), ".webforge", "mailbox", `${superior.toLowerCase()}.json`)
      fs.mkdirSync(path.dirname(mailboxPath), { recursive: true })

      let inbox = { messages: [] }
      try { inbox = JSON.parse(fs.readFileSync(mailboxPath, "utf-8")) } catch {}

      inbox.messages.push({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        from: fromAgent, to: superior,
        type: args.status === "done" ? "TASK_DONE" : args.status === "blocked" ? "TASK_BLOCKED" : "TASK_PROGRESS",
        subject: `Status: ${args.status}`,
        body: args.message || `Agent ${fromAgent} reports: ${args.status}`,
        timestamp: new Date().toISOString(), read: false,
      })
      fs.writeFileSync(mailboxPath, JSON.stringify(inbox, null, 2))
    }

    return `Status reported: ${args.status}. ${superior ? `Notified ${superior}.` : ""}`
  },
}
```

---

## Pillar 7: The Registry (naming only)

File: `.webforge/registry.json`

A simple JSON file with familiar names and their roles. HR uses this to pick names when recruiting.

```json
{
  "hermes": { "role": "coordinator", "title": "COO" },
  "voss": { "role": "hr", "title": "HR Director" },
  "athena": { "role": "intelligence", "title": "Intelligence Director" },
  "hephaestus": { "role": "build", "title": "Build Director" },
  "minos": { "role": "quality", "title": "Quality Director" },
  "thoth": { "role": "documentation", "title": "Documentation Director" },
  "daedalus": { "role": "meta", "title": "Meta Engineering Director" }
}
```

When Hermes says "I need someone like Athena for intelligence," HR looks up "athena" in the registry, sees it's an intelligence role, and creates an agent with that name + research agent MD files.

A full `agents.json` (with reportsTo + subordinates for chain-of-command enforcement) lives at `.webforge/agents.json` — this is what the `mailbox` and `status` tools read to enforce Law 4.

---

## The Complete File Structure

```
~/.config/opencode/
  agents/
    hermes.md              ← Permanent (coordinator)
    voss.md                ← Permanent (HR recruiter)
    daedalus.md            ← Permanent (Meta Engineering / enforcer)
  tools/
    create_agent.ts         ← HR uses this to create agents (NEEDS CREATION)
    update_plan.ts          ← Hermes uses this to track progress (NEEDS CREATION)

.opencode/
  agents/                  ← Recruited agents (created by HR, project-scoped)
    recruited-01.md        ← Created during the project, deleted after
    recruited-02.md
    ...
  tools/                   ← Project-scoped tools (10 total)
    create_agent.ts        ← CREATED in v2 (HR creates agents)
    update_plan.ts         ← CREATED in v2 (Hermes updates plan)
    safe_task.ts           ← CREATED in v2 (allowlist-enforced spawn — ISOLATION CRITICAL)
    mailbox.ts             ← EXISTS in package
    memory.ts              ← EXISTS in package
    registry.ts            ← EXISTS in package
    safe_edit.ts           ← EXISTS in package
    safe_bash.ts           ← EXISTS in package
    revoke.ts              ← EXISTS in package (hardened in v2 — registry-guarded)
    status.ts              ← EXISTS in package
  opencode.json            ← Config: Hermes = default, MCPs wired up

.webforge/
  plan.md                  ← The shared plan file (Hermes reads/writes this)
  registry.json            ← Name lookup for HR
  agents.json              ← Full org tree (reportsTo + subordinates) for Law 4
  repo-agents/             ← Downloaded agent MD files from repos
    ankitmundada/          ← 128 agents in 10 categories
    jbeck018/              ← 95 agents flat
  memory/                  ← Project memory (Law 6)
    STATE.md               ← Current project state
    PROJECT.md             ← Project overview
    decisions/             ← Decision log
    edit-log.md            ← Auto-appended by safe_edit.ts
    bash-log.md            ← Auto-appended by safe_bash.ts
    recruitments.md        ← Auto-appended by create_agent.ts
    revocations.md         ← Auto-appended by revoke.ts
  mailbox/                 ← Agent inboxes (one JSON file per agent)
    hermes.json
    voss.json
    ...
  status/                  ← Agent status snapshots (one JSON file per agent)
    hermes.json
    voss.json
    ...

.worktrees/                ← Isolated workspaces (one per agent)
  recruited-01/
  recruited-02/

webforge-loop.sh           ← The Ralph Loop wrapper script
```

---

## The Complete Flow

```
1. You start the loop:
   $ bash webforge-loop.sh

2. Loop launches Hermes:
   "Build Athletica — a sports marketplace"

3. Hermes (35 calls):
   - Creates .webforge/plan.md with tasks
   - "I need intelligence research first"
   - Calls task("voss", "Create an intelligence researcher")

4. Voss (35 calls):
   - Reads .webforge/repo-agents/ankitmundada/categories/10-research-analysis/research-analyst.md
   - Reads search-specialist.md, data-researcher.md
   - Uses create_agent tool to write .opencode/agents/athena.md
   - Returns to Hermes: "Athena is ready"

5. Hermes calls task("athena", "Research sports marketplace"):

6. Athena (35 calls):
   - Reads the task
   - Call 1: Repomix → packs project, understands structure
   - Call 2: Context7 → fetches current Supabase docs
   - Loads skills on-demand (research methodology skill)
   - Call 3-30: Uses Exa MCP for semantic web search
   - If too big: asks Hermes to recruit more research agents
   - If done: returns research summary to Hermes

7. Hermes updates plan.md via update_plan tool:
   - "Research: DONE"
   - "Build: REMAINING"

8. Hermes exits. Loop checks plan — not done. Re-launches Hermes.

9. Hermes (fresh 35 calls):
   - Reads plan.md — sees research is done, build is remaining
   - Calls task("voss", "Create a build director")

10. Voss creates hephaestus.md from backend-architect + fullstack-developer

11. Hermes calls task("hephaestus", "Build based on research"):

12. Hephaestus (35 calls):
    - Reads research
    - Call 1: Repomix → understands current project state
    - Call 2: Context7 → fetches Next.js 16 + Tailwind v4 docs
    - "I need frontend, backend, and database workers"
    - Calls task("voss", "Create 3 build workers")

13. Voss creates:
    - .opencode/agents/recruited-01.md (frontend-developer + react-specialist + typescript-pro)
    - .opencode/agents/recruited-02.md (backend-developer + api-designer)
    - .opencode/agents/recruited-03.md (database-admin + postgres-pro)

14. Hephaestus delegates SEQUENTIALLY:
    - task("recruited-01", "Build frontend") → runs in worktree → finishes → merges
    - task("recruited-02", "Build backend") → runs in worktree → finishes → merges
    - task("recruited-03", "Build database") → runs in worktree → finishes → merges

15. Each recruited worker:
    - Uses safe_edit (not raw edit) → Law 2, 5, 6 enforced
    - Uses safe_bash (not raw bash) → dangerous ops blocked
    - Calls status("working") at start, status("done") at end
    - Calls ast-grep for any refactors (no false matches across 414 files)

16. Hephaestus returns to Hermes: "Build complete"

17. Hermes updates plan.md:
    - "Research: DONE"
    - "Build: DONE"
    - "PROJECT COMPLETE"

18. Loop checks plan — says COMPLETE. Stops.

19. You get: "Athletica is built."
```

---

## Implementation Order

### Step 1 (Day 1): Create the 3 permanent agent files
- `hermes.md` (with repo agent MD files concatenated)
- `voss.md` (with HR repo agent MD files concatenated)
- `daedalus.md` (Meta Engineering Director — enforces 6 Laws, uses revoke tool)
- Download the repo agent MD files and concatenate them

### Step 2 (Day 1): Create the 10 custom tools
- Copy the 7 existing tools from `download/webforge-opencode/tools/` into `~/.config/opencode/tools/`
- Write `create_agent.ts` (see Pillar 6.3 — code provided above)
- Write `update_plan.ts` (see Pillar 6.3 — code provided above)
- Write `safe_task.ts` (see Pillar 6.3 — code provided above) — CRITICAL for isolation

### Step 3 (Day 1): Create the loop script
- `webforge-loop.sh` (Ralph Loop wrapper)

### Step 4 (Day 2): Set up the repo library
- Clone ankitmundada and jbeck018 repos into `.webforge/repo-agents/`
- Create `registry.json`
- Create `agents.json` with full org tree (for Law 4 enforcement)

### Step 5 (Day 2): Install MCPs + Context Tools
- Install Context7 MCP (live library docs — replaces library skill files)
- Install GitHub MCP (repo management)
- Install Exa MCP (semantic search for research agents)
- Install Playwright MCP (browser automation for quality agents)
- Install Sentry MCP (error tracking — for later)
- Install Vercel MCP (deployment — for later)
- Install Supabase MCP (database — for later)
- Install Repomix globally (`npm install -g repomix`)
- Install ast-grep globally (`npm install -g @ast-grep/cli`)
- Install skills (Vercel, Gentleman — for non-library expertise like design patterns)

### Step 6 (Day 2): Install worktree plugin
- Install opencode-worktree plugin
- Configure for auto-merge

### Step 7 (Day 3): Test end-to-end
- Give Hermes a simple task
- Watch: Hermes → Voss → recruited agent → work → report → plan update
- Verify the loop works autonomously

### Step 8 (Day 3): Test with a real project
- Give Hermes "Build a login page"
- Watch the full flow: research → recruit → build → verify → complete
- Verify Repomix + Context7 + ast-grep are being used (check `.webforge/memory/edit-log.md`)

---

## What We're NOT Building (anymore)

| Old Approach | New Approach |
|---|---|
| 283 agents from the start | 3 permanent agents, rest recruited on demand |
| Fixed departments | Dynamic — departments created when needed |
| Python scripts | OpenCode native — agents, tools, plugins |
| WebForge Office (standalone TS) | OpenCode terminal UI |
| Fixed 82 areas | Areas as a guideline map, not fixed |
| Skills written from scratch | Skills installed from repos |
| System prompts written from scratch | Repo agent MD files + custom identity prompt |
| Custom runtime (runtime.ts) | OpenCode's native agent loop |
| Custom watchdog | OpenCode's steps: 35 + plan file |
| Custom campus UI | OpenCode's terminal UI |
| SQLite state tracking | Plan file (.webforge/plan.md) + JSON files on disk |
| Library-specific skill files | Context7 MCP (live docs, always current) |
| Raw `edit` and `bash` tools | `safe_edit` and `safe_bash` (law-enforcing wrappers) |
| Text grep for refactors | ast-grep (structure-aware code search) |
| Reading 414 files one-by-one | Repomix (1 call to understand the whole project) |

---

## Key Decisions Summary

1. **OpenCode-native** — not a standalone system
2. **3 permanent agents** — Hermes (COO) + Voss (HR) + Daedalus (Meta Engineering / enforcer)
3. **Dynamic recruiting** — HR creates agents on demand from repo templates
4. **Agent = custom prompt + repo MD files** — concatenated into one file
5. **35 tool-call limit** — using OpenCode's `steps: 35`
6. **Ralph Loop** — wrapper script re-launches Hermes until plan is done
7. **Plan file** — `.webforge/plan.md` as shared memory on disk
8. **Worktree isolation** — each agent works in its own git worktree
9. **Skills on-demand** — agents load skills themselves at runtime
10. **Sequential execution** — one agent at a time, no parallel
11. **Registry for naming** — HR uses familiar names from registry
12. **No forced model** — OpenCode uses whatever model is configured
13. **Fully autonomous** — you start the loop, walk away, come back to results
14. **Areas as guideline** — not fixed, used to decide divide vs parallel
15. **Repo agent library** — downloaded, not copied — updates flow through
16. **MCPs (6)** — Context7 (live docs), GitHub (repos), Exa (search), Playwright (e2e), Sentry (errors), Vercel (deploy), Supabase (db) — one setup, all agents use
17. **Custom Tools (10)** — create_agent, update_plan, mailbox, memory, registry, safe_edit, safe_bash, safe_task, revoke, status
18. **Repomix** — MANDATORY for large projects — packs 414-file project into 1 tool call
19. **Context7** — MANDATORY — replaces 100+ library skill files with 1 live MCP connection
20. **ast-grep** — MANDATORY for refactors — smart code search that understands structure
21. **6 Laws enforced in code** — not in prompts. `safe_edit` enforces Laws 2, 5, 6. `mailbox` enforces Law 4. `steps: 35` enforces Law 1.
22. **Four-layer isolation from built-in agents** — YAML gating + tool guards + `safe_task` allowlist + Ralph Loop isolation. Built-in agents can never be modified, spawned, or affected by WebForge.
23. **The 6th pillar is unified** — MCPs + Context Tools + Custom Tools are all "external capabilities the agents call." Splitting them in v1 was artificial.
