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
├── tool/                        ← 10 custom tools (auto-discovered)
│   ├── safe_edit.ts             ← file editing with Law 2/5/6 enforcement
│   ├── safe_bash.ts             ← bash with dangerous-command blocking + logging
│   ├── memory.ts                ← read/write to .webforge/memory/
│   ├── registry.ts              ← look up agent info + reporting relationships
│   ├── revoke.ts                ← strip permissions from law-violating agents
│   ├── status.ts                ← write status snapshots for coordination
│   ├── create_agent.ts          ← HR (Voss) creates new agent files on demand
│   ├── update_plan.ts           ← Hermes updates shared plan, signals PROJECT COMPLETE
│   ├── report_metrics.ts        ← workers report task metrics before sign-off
│   ├── verify_work.ts           ← superiors verify + sign off on subordinate work
│   └── lib/
│       └── metrics.ts           ← shared metrics types + scoring
├── plugin/                      ← guardrails plugin (auto-discovered)
│   ├── guardrails.ts            ← pre-tool-call hook, blocks inference patterns
│   └── lib/
│       └── patterns.ts          ← inference pattern database
├── project-template/            ← copy into each new project as .webforge/
│   ├── plan.md                  ← shared plan file (Ralph Loop checks for PROJECT COMPLETE)
│   ├── registry.json            ← name → role lookup for all agents
│   ├── agents.json              ← full org tree (reportsTo + subordinates)
│   ├── .pocket-universe.jsonc   ← Pocket Universe config (broadcast + recall)
│   ├── memory/                  ← STATE.md, PROJECT.md, edit-log.md, etc.
│   ├── mailbox/                 ← hermes.json, voss.json, daedalus.json
│   ├── status/                  ← hermes.json, voss.json, daedalus.json
│   └── repo-agents/             ← how to clone external agent libraries
├── scripts/
│   └── webforge-loop.sh         ← Ralph Loop: re-launches Hermes until PROJECT COMPLETE
└── docs/
    ├── IMPLEMENTATION.md        ← full system design
    ├── AGENT-SPEC.md            ← agent template specification
    └── CHANGELOG.md             ← errors found + fixes applied during integration
```

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
mkdir my-project && cd my-project

# Copy the per-project state files
cp -r ~/.config-webforge/opencode/project-template .webforge

# Edit .webforge/plan.md with your project goal

# Start the Ralph Loop
OPENCODE_CMD=webforge bash ~/.config-webforge/opencode/scripts/webforge-loop.sh
```

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
