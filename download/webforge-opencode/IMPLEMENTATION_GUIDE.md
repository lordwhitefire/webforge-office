# WebForge OpenCode Integration — Implementation Guide

## What This Is

This package contains everything needed to integrate WebForge into OpenCode.
OpenCode will read these files and become the WebForge agent organization.

## What's In This Package

```
webforge-opencode/
  opencode.json              ← Config: Hermes = default, built-in agents disabled
  .webforge/
    agents.json              ← Agent registry (285 agents, for chain of command)
  agents/                    ← 284 agent markdown files (CEO is the user)
    hermes.md                ← Primary agent (you talk to him)
    hephaestus.md            ← Build Director
    athena.md                ← Intelligence Director
    ... (284 total, each with full skill content)
  tools/                     ← 7 custom tools (TypeScript)
    mailbox.ts               ← Agent messaging (chain of command enforced)
    memory.ts                ← Project memory read/write (Law 2 + Law 6)
    registry.ts              ← Look up agent info and relationships
    status.ts                ← Report status to superior (watchdog)
    safe_edit.ts             ← Safe file editing (Law 2 + Law 5 + Law 6)
    safe_bash.ts             ← Safe bash commands (blocks dangerous ops)
    revoke.ts                ← Strip tools from misbehaving agents
```

## Installation — Step by Step

### Step 1: Copy agent files

Copy the agents to OpenCode's global agents directory:

```bash
mkdir -p ~/.config/opencode/agents/
cp webforge-opencode/agents/*.md ~/.config/opencode/agents/
```

Or copy to a specific project:

```bash
mkdir -p .opencode/agents/
cp webforge-opencode/agents/*.md .opencode/agents/
```

### Step 2: Copy tool files

Copy the tools to OpenCode's global tools directory:

```bash
mkdir -p ~/.config/opencode/tools/
cp webforge-opencode/tools/*.ts ~/.config/opencode/tools/
```

Or copy to a specific project:

```bash
mkdir -p .opencode/tools/
cp webforge-opencode/tools/*.ts .opencode/tools/
```

### Step 3: Copy the config

Merge the opencode.json with your existing config:

```bash
cp webforge-opencode/opencode.json ~/.config/opencode/opencode.json
```

Or merge manually. The key settings are:
- `"default_agent": "hermes"` — makes Hermes the default when you open OpenCode
- `"agent": { "build": { "disable": true }, "plan": { "disable": true } }` — hides built-in agents

### Step 4: Copy the registry

The custom tools need the agent registry for chain of command:

```bash
mkdir -p .webforge/
cp webforge-opencode/.webforge/agents.json .webforge/agents.json
```

### Step 5: Start OpenCode

```bash
opencode
```

Hermes should be the default agent. Type a message and he will coordinate.

---

## Agent File Format (from OpenCode official docs)

Each agent is a markdown file. The filename becomes the agent name.
Example: `hermes.md` creates an agent named `hermes`.

### YAML Frontmatter

```yaml
---
description: "COO / Coordinator — executive department"
mode: primary              # or "subagent"
model: ""                  # Optional — leave empty to use OpenCode's default model
color: "#f59e0b"          # Hex color for the agent
steps: 10                  # Max LLM iterations before stopping
permission:                # What this agent CAN and CANNOT do
  read: allow              # "allow", "deny", or "ask"
  edit: deny
  bash: deny
  task: allow              # Can spawn subagents
  websearch: deny
  webfetch: deny
  glob: allow
  grep: allow
  list: allow
  todowrite: deny
  question: allow
  skill: allow
---

(System prompt content goes here — the skill .md)
```

### Important config keys (from official docs):

- **`description`** — REQUIRED. Brief description of what the agent does.
- **`mode`** — `primary` (you interact with it directly) or `subagent` (called by other agents)
- **`model`** — Optional. Which AI model to use. Leave empty to use OpenCode's configured model.
- **`steps`** — Max number of agentic iterations before forcing text-only response.
- **`permission`** — Tool permissions. Each tool can be `allow`, `deny`, or `ask`.
- **`disable`** — Set to `true` to disable an agent (used in opencode.json for built-in agents).
- **`hidden`** — Set to `true` to hide from the @ autocomplete menu.
- **`color`** — Hex color code (e.g., `#FF5733`) for the agent.

### Config file format (from official docs):

The config key is `"agent"` (singular), NOT `"agents"` (plural):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "hermes",
  "agent": {
    "build": { "disable": true },
    "plan": { "disable": true }
  }
}
```

Note: It's `"disable": true` (not `"disabled": true`).

---

## Custom Tool Format (from OpenCode official docs)

Tools are TypeScript or JavaScript files. The filename becomes the tool name.
Example: `mailbox.ts` creates a tool named `mailbox`.

### Using the tool() helper (recommended by docs):

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Send a message to another agent",
  args: {
    to: tool.schema.string().describe("Agent name"),
    body: tool.schema.string().describe("Message body"),
  },
  async execute(args, context) {
    // context.agent = the agent calling this tool
    return "Message sent"
  },
})
```

### Using plain object export (also supported):

```typescript
export default {
  description: "Send a message to another agent",
  args: {
    to: { type: "string", description: "Agent name" },
    body: { type: "string", description: "Message body" },
  },
  async execute(args, context) {
    return "Message sent"
  },
}
```

### Tool locations (from official docs):

- **Global:** `~/.config/opencode/tools/`
- **Per-project:** `.opencode/tools/`

Files in these directories are automatically loaded at startup.

---

## Permission System (from official docs)

Permissions control which tools each agent can use. Three values:

| Value | Meaning |
|---|---|
| `allow` | Agent can use this tool freely |
| `deny` | Agent cannot use this tool at all |
| `ask` | Agent must ask for user approval before using this tool |

### Available permission keys:

| Key | What it controls |
|---|---|
| `read` | Reading files |
| `edit` | Editing/writing files |
| `bash` | Running shell commands |
| `task` | Spawning subagents (delegation) |
| `websearch` | Web search |
| `webfetch` | Fetching web pages |
| `glob` | File pattern matching |
| `grep` | Searching file contents |
| `list` | Listing directories |
| `todowrite` | Writing to-do lists |
| `question` | Asking the user questions |
| `skill` | Loading skill files |
| `external_directory` | Accessing directories outside the project |

### WebForge permission matrix:

| Agent Type | read | edit | bash | task | websearch | What they do |
|---|---|---|---|---|---|---|
| Hermes (primary) | allow | deny | deny | allow | deny | Coordinate, delegate |
| Directors | allow | deny | deny | allow | deny | Manage departments |
| Leads | allow | deny | deny | allow | deny | Manage teams |
| Juniors | allow | allow | allow | deny | deny | Write code (only ones) |
| Intelligence | allow | deny | deny | deny | allow | Research only |
| Quality | allow | deny | allow | deny | deny | Test, review |
| Documentation | allow | allow | deny | deny | deny | Write docs |
| HR | allow | deny | deny | deny | deny | Manage registry |

---

## How Delegation Works

OpenCode's built-in `task` tool lets one agent spawn another as a subagent.

When Hermes calls the `task` tool with `subagent_type: "hephaestus"`:
1. OpenCode loads the `hephaestus.md` agent file
2. Creates a child session with Hephaestus's permissions
3. Hephaestus runs his own LLM loop with his own tools
4. When done, the result comes back to Hermes
5. Hermes continues

This IS the synchronous delegation chain. Results bubble back up.

Only agents with `task: allow` in their permissions can delegate.
That means only directors and leads — juniors have `task: deny`.

---

## The 6 Laws — How Each Is Enforced

### Law 1: Task size limit
- Future: custom `safe_task` tool that checks file count

### Law 2: 300-line rule
- ENFORCED in `safe_edit.ts` — checks file length before writing
- ENFORCED in `memory.ts` — checks file length before writing

### Law 3: Real-time documentation
- ENFORCED in `memory.ts` — every write is logged
- ENFORCED in `status.ts` — all status changes are logged

### Law 4: Chain of command
- ENFORCED in `mailbox.ts` — checks registry before sending messages
- ENFORCED via tool availability — only directors/leads have `task: allow`

### Law 5: No inference
- PARTIALLY ENFORCED in `safe_edit.ts` — scans for inference patterns:
  - "I assume", "I guess", "probably", "I think this should"
  - Hardcoded API keys, passwords
- ENFORCED via `revoke.ts` — Daedalus can strip tools from violators
- The system prompt also tells agents not to infer

### Law 6: Documentation
- ENFORCED in `memory.ts` and `status.ts` — all actions logged
- ENFORCED in `safe_edit.ts` and `safe_bash.ts` — all operations logged

---

## Model Configuration

This integration does NOT force any specific model.
OpenCode uses whatever model you have configured.

To set a model:
```bash
opencode --model deepseek/deepseek-v4-flash
```

Or in opencode.json:
```json
{
  "model": "deepseek/deepseek-v4-flash"
}
```

Or per-agent in the agent's markdown frontmatter:
```yaml
---
model: deepseek/deepseek-v4-flash
---
```

If model is not set, OpenCode uses its default.

---

## References

- OpenCode Agents docs: https://opencode.ai/docs/agents
- OpenCode Config docs: https://opencode.ai/docs/config
- OpenCode Custom Tools docs: https://opencode.ai/docs/custom-tools
- OpenCode Plugins docs: https://opencode.ai/docs/plugins
- OpenCode source code: https://github.com/sst/opencode
