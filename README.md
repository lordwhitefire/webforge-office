# WebForge

> A 301-agent autonomous development system that runs on top of stock [OpenCode](https://opencode.ai). No build step. No compilation. Just config files.

## What This Is

This repo is **not** a fork of OpenCode. It is a **config-only package** — 337 files that drop directly into OpenCode's user-level config directory and instantly give you:

- **301 agents** organized in a strict hierarchy (CEO → Hermes → Department Heads → Directors → Leads → Seniors → Juniors)
- **10 custom tools** that enforce the 12 Laws (no inference, 35-call limit, communication circles, real-time docs, etc.)
- **1 guardrails plugin** that intercepts tool calls *before* they execute and blocks inference patterns
- **1 automation script** (Ralph Loop) that re-launches Hermes until the project is complete
- **6 MCP servers** wired up (GitHub, Exa, Playwright, Sentry, Vercel, Supabase, Context7)

## Prerequisites

1. **Stock OpenCode installed** — `curl -fsSL https://opencode.ai/install | bash`
2. **Node.js** (for `npx`, which runs the MCP servers)
3. **API keys** for any MCPs you want to use (GitHub, Exa, Sentry, Vercel, Supabase)

That's it. No Bun, no TypeScript compiler, no `bun install`, no build tooling.

## Setup

### Option A — Isolated install (recommended)

Use this if you want WebForge separate from your stock OpenCode:

```bash
# Clone this repo into a dedicated config directory
git clone https://github.com/lordwhitefire/webforge-office.git ~/.config-webforge/opencode

# Create an alias that points OpenCode at the isolated config
echo 'alias webforge="XDG_CONFIG_HOME=~/.config-webforge opencode"' >> ~/.bashrc
source ~/.bashrc

# Run it
webforge
```

### Option B — Replace stock OpenCode

Use this if you want WebForge as your only OpenCode:

```bash
git clone https://github.com/lordwhitefire/webforge-office.git ~/.config/opencode
opencode
```

## What's Inside

```
webforge-office/
├── opencode.json                ← main config: hermes=default, 6 MCPs, pocket-universe plugin
├── agent/                       ← 301 agent files (auto-discovered)
│   ├── hermes.md                ← permanent COO (172 lines)
│   ├── voss.md                  ← permanent HR Director (149 lines)
│   ├── daedalus.md              ← permanent Meta Engineering Director (169 lines)
│   └── ...                      ← 298 generated agents (full org chart)
├── tool/                        ← 11 custom tools (auto-discovered, all global)
│   ├── activate_project.ts     ← checks/creates .webforge/ per project (Hermes calls first)
│   ├── safe_edit.ts            ← docs-only editing with 300-line limit (Law 2)
│   ├── safe_bash.ts            ← docs-only bash with dangerous-command blocking
│   ├── memory.ts               ← read/write to .webforge/memory/ (doc + intel only)
│   ├── status.ts               ← log activity to work-log.md (EVERY agent uses this)
│   ├── registry.ts             ← look up agent info + reporting relationships
│   ├── revoke.ts               ← strip permissions from law-violating agents (Daedalus)
│   ├── create_agent.ts         ← HR (Voss) creates new agent files on demand
│   ├── update_plan.ts          ← Hermes updates shared plan, signals PROJECT COMPLETE
│   ├── report_metrics.ts       ← workers report task metrics before sign-off
│   ├── verify_work.ts          ← superiors verify + sign off on subordinate work
│   └── lib/
│       ├── metrics.ts          ← shared metrics types + scoring
│       └── agents-json.ts      ← auto-creates agents.json if missing (prevents crashes)
├── plugin/                      ← 1 plugin (auto-discovered)
│   ├── guardrails.ts            ← pre-tool-call hook, blocks inference patterns
│   └── lib/
│       └── patterns.ts          ← inference pattern database
├── project-template/            ← template files copied by activate_project.ts
│   ├── plan.md                  ← shared plan file (Ralph Loop checks for PROJECT COMPLETE)
│   ├── PROJECT.md               ← project overview template (documentation fills this in)
│   ├── agents.json              ← org tree (read by 8 tools)
│   ├── constraints.md           ← project constraints template
│   ├── errors-and-fixes.md      ← error log template
│   ├── preferences.md           ← developer preferences template
│   ├── areas/                   ← 80-area documentation (one file per area, created during scan)
│   ├── .pocket-universe.jsonc   ← Pocket Universe config
│   ├── memory/                  ← STATE.md, work-log.md, edit-log.md, research/, decisions/
│   ├── mailbox/                 ← hermes.json, voss.json, daedalus.json
│   ├── status/                  ← hermes.json, voss.json, daedalus.json
│   └── repo-agents/             ← how to clone external agent libraries
├── scripts/
│   └── webforge-loop.sh         ← Ralph Loop: re-launches Hermes until PROJECT COMPLETE
└── docs/
    ├── IMPLEMENTATION.md        ← full system design
    ├── AGENT-SPEC.md            ← agent template specification
    ├── CHANGELOG.md             ← errors found + fixes applied during integration
    └── web-development-areas.md ← 80-area checklist for project documentation
```

## Architecture: Global + Per-Project

**Everything is GLOBAL except memory and documentation.**

| Lives globally (~/.config/webforge/opencode/) | Lives per-project (<project>/.webforge/) |
|---|---|
| 301 agent MD files | PROJECT.md (overview) |
| 11 custom tools | areas/ (80-area documentation) |
| Guardrails plugin | memory/ (STATE.md, work-log.md, research/, decisions/) |
| opencode.json config | constraints.md, errors-and-fixes.md, preferences.md |
| Permissions | agents.json (org tree for tools) |
| | plan.md (shared plan for Ralph Loop) |

**WebForge launches from a dedicated home base folder and points at projects.**
This prevents `.opencode/` folder clashes with stock OpenCode.

## Active Project Memory (survives compaction)

WebForge remembers which project it's currently working on. This is stored in:

```
~/.config/webforge/active-project.txt
```

The file contains one line: the absolute path to the active project. Every tool that touches `.webforge/` auto-reads this file to find the project folder. This means:

- **Hermes survives compaction.** Even after a context compaction, Hermes reads `active-project.txt` and knows exactly which project to continue working on. He doesn't get confused or start scanning the wrong folder.
- **Tools auto-detect the project.** You don't need to pass the project path on every tool call. The `status`, `memory`, `safe_edit`, `safe_bash`, `activate_project`, and other tools all read `active-project.txt` automatically.
- **Path override is optional.** Every tool accepts an optional `path` (or `project_path`) argument. If provided, it overrides the active project. If omitted, the tool uses `active-project.txt`. If that file doesn't exist either, it falls back to `process.cwd()`.

### Path resolution order (every tool)

```
1. Explicit `path` argument from the agent     ← highest priority
2. ~/.config/webforge/active-project.txt       ← auto-detected
3. process.cwd()                                ← fallback
```

### How Hermes uses it on every wake-up

Hermes's startup procedure (defined in `agent/hermes.md`):

1. **`activate_project(action="get_active")`** — read the active project path
2. **`activate_project(action="check")`** — check if it's activated (has `.webforge/`)
3. If not activated → ask you: new project or subfolder?
4. If activated → read `PROJECT.md` + `work-log.md` → continue working

### Switching projects

When you tell Hermes "switch to project B":

1. Hermes calls `activate_project(action="switch_project", path="/path/to/project-b")`
2. This updates `active-project.txt`
3. All subsequent tool calls auto-detect the new project
4. Hermes reads the new project's `PROJECT.md` and `work-log.md`
5. Work continues on project B

### Project path argument

Every tool accepts an optional `path` (or `project_path`) argument. This lets an agent work on a different project without switching the active one:

```typescript
// Auto-detected from active-project.txt:
status({ event: "work_started", task_id: "task-001", details: "Starting" })

// Override — write to a specific project:
status({ event: "work_started", task_id: "task-001", details: "Starting", path: "/home/me/project-b" })
```

This is useful when Hermes needs to read from one project while writing to another, or when an agent is recruited for a specific project that isn't the active one.

## How It Works

OpenCode scans its config directory for `agent/*.md`, `tool/*.ts`, and `plugin/*.ts` files automatically. This repo provides exactly those files, pre-built.

When you run `webforge` (or `opencode` if you used Option B):

1. OpenCode reads `opencode.json` → sets `hermes` as the default agent, disables built-in `build`/`plan` agents, wires up 6 MCPs, loads the Pocket Universe plugin
2. OpenCode scans `agent/` → loads all 301 agents (hermes, voss, daedalus as permanent; the rest spawnable on demand)
3. OpenCode scans `tool/` → loads all 10 custom tools (safe_edit, safe_bash, memory, etc.)
4. OpenCode scans `plugin/` → loads the guardrails plugin (intercepts every tool call)
5. You start typing → Hermes (the default agent) receives your goal, decomposes it, delegates to directors via the `task` tool, directors delegate to leads, leads to seniors, seniors to juniors
6. Every tool call passes through the guardrails plugin first — inference patterns are blocked before execution
7. Workers report metrics via `report_metrics` → superiors verify via `verify_work` → sign-off chain bubbles up to Hermes
8. Hermes updates the plan via `update_plan`
9. When Hermes exits, the Ralph Loop re-launches him until `## PROJECT COMPLETE` appears in `.webforge/plan.md`

## Starting a New Project

```bash
# From your WebForge home base folder, point at the project:
webforge /path/to/my-project

# Hermes's first action is to call activate_project:
# - If .webforge/ exists → reads PROJECT.md + work-log.md, starts working
# - If not → asks you: new project or subfolder?
#   - New project → creates .webforge/ structure, intelligence scans codebase
#   - Subfolder → creates .webforge-subfolder marker pointing to parent

# After activation, intelligence department scans all files and writes
# findings to .webforge/memory/research/. Documentation department then
# writes area docs to .webforge/areas/ and fills in PROJECT.md.

# Start the Ralph Loop (optional — for autonomous unattended runs)
OPENCODE_CMD=webforge bash ~/.config-webforge/opencode/scripts/webforge-loop.sh
```

**No agents are copied into projects.** Everything stays global. Only memory
and documentation live per-project.

Walk away. The loop will:
1. Launch Hermes with a continuation prompt
2. Hermes runs (35 tool calls), recruits agents, delegates, updates plan
3. Hermes exits
4. Loop checks `.webforge/plan.md` for `## PROJECT COMPLETE`
5. If not done — re-launches Hermes (fresh 35 calls)
6. Repeats until complete or max iterations (50) reached

## The 12 Laws (enforced in code, not just prompts)

1. **No inference** — guardrails plugin blocks "I assume", "probably", "I think" patterns
2. **300-line files** — `safe_edit` rejects edits that exceed the limit
3. **35 tool calls per agent** — `steps: 35` in every agent's frontmatter
4. **Chain of command** — agents can only contact superior, peers, or direct subordinates
5. **Only workers do real work** — heads/directors have `edit: deny, bash: deny`
6. **Real-time documentation** — `safe_edit` and `safe_bash` auto-log to `.webforge/memory/`
7. **Heads don't build** — enforced via permission config
8. **Mandatory review** — `verify_work` tool requires 5 verification items
9. **No design inference** — guardrails blocks color/layout choices without spec citation
10. **Source comparison** — Daedalus must cite screenshots before approving
11. **Verification proof** — `report_metrics` requires all 5 fields
12. **Communication circles** — `task` tool uses glob permissions (`"*": deny`, specific agents `allow`)

## Permission Enforcement (how it actually works)

OpenCode's built-in permission system (the `permission:` block in agent .md files) has a critical bug: it only enforces on the **primary agent** — not on subagents spawned via the `task` tool. This means Hermes's permissions work, but Athena's (and every other subagent's) are silently ignored. Confirmed in OpenCode issues #7474, #12566, #23519.

Plugin-based hooks don't fix this either — plugins only intercept the primary agent's calls, not subagent calls (issue #5894).

### The WebForge fix: same-name tool override

We create custom tools with the **exact same names** as OpenCode's built-in tools: `edit`, `bash`, `write`. OpenCode's docs confirm: "If a custom tool uses the same name as a built-in tool, the custom tool takes precedence." This means our version **replaces** the native one — there's no unguarded native tool left for anyone to fall back on.

Inside each of these tools, the **first line of code** (before anything else runs):

1. Read the calling agent's name from `context.agent`
2. Find that agent's `.md` file in `~/.config/webforge/opencode/agent/`
3. Parse the YAML frontmatter to extract the permission block
4. Check if the tool is allowed (`edit: allow` or `edit: deny`)
5. If denied → return `BLOCKED` immediately, do not touch any files
6. If allowed → proceed with the normal edit/bash/write logic

### Why this can't be bypassed

- The check isn't a hook or event listener that could get skipped — it's literally the first line of the function that runs the tool
- There's no other tool with that name to fall back to (we replaced the native one)
- The check runs unconditionally every single time the function executes
- Subagent, direct agent, doesn't matter — there's no path around it

### Tools that override built-ins

| Tool | File | Permission checked |
|------|------|-------------------|
| `edit` | `tool/edit.ts` | `edit` in agent's .md |
| `bash` | `tool/bash.ts` | `bash` in agent's .md |
| `write` | `tool/write.ts` | `edit` in agent's .md (write uses edit permission) |

### Shared permission checker

All three tools use `tool/lib/permission-check.ts` — a shared helper that reads the agent's .md file and parses the permission block. Built-in OpenCode agents (`build`, `plan`, `general`, `explore`) bypass WebForge enforcement (they don't have .md files in our config).

### Testing

To verify enforcement works: spawn Athena (who has `edit: deny`) and have her try to edit a file. She should see:
```
BLOCKED: athena does not have permission to use edit. (Source: athena.md (edit: deny))
```

If she can edit the file, something is wrong — the override isn't taking effect.

## Configuration

### API Keys

Set these environment variables before running (only for MCPs you want to use):

```bash
export GITHUB_TOKEN=ghp_xxx          # GitHub MCP
export EXA_API_KEY=xxx               # Exa semantic search MCP
export SENTRY_AUTH_TOKEN=xxx         # Sentry MCP
export VERCEL_TOKEN=xxx              # Vercel MCP
export SUPABASE_ACCESS_TOKEN=xxx     # Supabase MCP
# Context7 and Playwright don't need keys
```

### Pocket Universe Plugin

The `broadcast` auto-wake feature requires unmerged OpenCode PRs (#9272 + #7725). The `recall` tool works today. The plugin config is installed and ready — when the PRs merge, `broadcast` will start working automatically.

Until then, agents wake each other via the native `task` tool (spawn = wake).

### Disabling Built-in Agents

The `opencode.json` already does this:
```json
"agent": {
  "build": { "disable": true },
  "plan": { "disable": true }
}
```

This prevents OpenCode's built-in `build` and `plan` agents from appearing in your agent list. The `general` and `explore` agents remain available as fallbacks.

## Documentation

- [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) — full system design, the 6 pillars, agent format
- [`docs/AGENT-SPEC.md`](docs/AGENT-SPEC.md) — the master template Voss uses to create agents
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — errors found during integration testing + fixes applied

## License

MIT
