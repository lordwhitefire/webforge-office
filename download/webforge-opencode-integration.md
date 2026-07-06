# Implementation Plan — WebForge Inside OpenCode

## What We Decided

WebForge will live INSIDE OpenCode as custom agents, tools, and plugins.
We are not building a separate system. We are extending OpenCode.

OpenCode already has:
- A terminal UI that shows agents running, delegating, and working
- Built-in tools (file read, file write, bash, grep, glob, web search)
- A subagent system (the `task` tool — one agent can spawn another)
- Permission control per agent (which tools each agent can use)
- Custom agents via markdown files in `.opencode/agents/`
- Custom tools via TypeScript files in `.opencode/tools/`
- Custom plugins via TypeScript files in `.opencode/plugins/`
- MCP server connections (external services like GitHub, databases)

We add our 285 agents, our custom tools, and our rules on top.

---

## Step 1 — Create the Agent Files

Each agent is a markdown file in `.opencode/agents/`.

Example: `.opencode/agents/hermes.md`

```markdown
---
mode: primary
description: "COO — the CEO's sole point of contact"
model: deepseek/deepseek-v4-flash
tools:
  read: true
  task: true
  edit: false
  bash: false
  websearch: false
---

You are Hermes, the COO of WebForge.

## Who You Are
You coordinate all departments. The CEO talks to you and only you.

## What You Do
- Receive instructions from the CEO
- Break tasks into pieces
- Delegate to department heads using the task tool
- Report results back to the CEO

## What You Do NOT Do
- Write code
- Edit files
- Run bash commands
- Make decisions for the CEO (Law 5: No Inference)
```

### Agent Categories and Their Tools

| Agent Type | Examples | Tools They Get | Tools They Don't Get |
|---|---|---|---|
| CEO (you) | You talk to Hermes | — | — |
| Coordinators | Hermes | read, task | edit, bash, websearch |
| Directors | Hephaestus, Athena, Minos, Thoth, Voss, Daedalus | read, task | edit, bash |
| Intelligence | Probe-*, Odin-*, Dorian | read, grep, glob, websearch, webfetch | edit, bash |
| Leads | Aurora, Titan, Zephyr, Lead-* | read, task | edit, bash |
| Seniors | Sr-* | read, task | edit, bash |
| Juniors | Jr-* | read, edit, bash, grep, glob | task (cannot delegate) |
| Quality (review) | Verdict-*, Scalpel-* | read, grep, glob, bash | edit |
| Quality (fix) | Pulse-*, Patch-Core | read, edit, bash | task |
| Documentation | Quill, Scroll, Stamp, Draft, doc-* | read, edit | bash, task |
| HR | Rook, Weld | read, todowrite | edit, bash |

### How Many Files

285 markdown files total. Each one is small (50-100 lines).
The skill .md files we already wrote become the system prompt content.

---

## Step 2 — Create Custom Tools

These are the tools OpenCode does not have but we need.

Each tool is a TypeScript file in `.opencode/tools/`.

### Tool 1: Mailbox

File: `.opencode/tools/mailbox.ts`

What it does: Lets agents send messages to each other.

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Send a message to another agent's inbox",
  args: {
    to: tool.schema.string().describe("Agent name to send to"),
    subject: tool.schema.string().describe("Short subject"),
    body: tool.schema.string().describe("Message body"),
  },
  async execute(args, context) {
    // Write to a JSON file: .webforge/mailbox/<agent-name>.json
    // Chain of command is enforced here in code
    const allowed = checkChainOfCommand(context.agent, args.to)
    if (!allowed) {
      return `BLOCKED: You can only message your direct superior or subordinates.`
    }
    // Save the message
    await saveMessage(context.agent, args.to, args.subject, args.body)
    return `Message sent to ${args.to}`
  },
})
```

### Tool 2: Agent Registry

File: `.opencode/tools/registry.ts`

What it does: Look up agent info, check who reports to whom.

### Tool 3: Memory

File: `.opencode/tools/memory.ts`

What it does: Read and write to project memory files.
- Read decisions from `.webforge/memory/decisions/`
- Read project state from `.webforge/memory/STATE.md`
- Write new decisions

### Tool 4: Permission Revoke

File: `.opencode/tools/revoke.ts`

What it does: Daedalus uses this to strip tools from a misbehaving agent.
When an agent is caught inferring, this tool removes their `edit` and `bash` access.

### Tool 5: Status Report

File: `.opencode/tools/status.ts`

What it does: An agent reports its current status to its superior.
This is how the watchdog works — agents call this to say "I'm working" or "I'm done."

---

## Step 3 — Create Custom MCPs

MCPs connect OpenCode to external services.

### MCP 1: GitHub MCP
- Read repos, create issues, manage PRs
- We already have a GitHub MCP key

### MCP 2: Supabase MCP (if needed)
- Database access for the project being built

### MCP 3: Custom WebForge MCP
- Connects to our SQLite database (tasks, messages, agent states)
- Lets agents query the task board and mailbox

---

## Step 4 — The Chain of Command

OpenCode's `task` tool already supports subagent spawning.
When Hermes calls `task({ subagent_type: "hephaestus", prompt: "..." })`,
OpenCode creates a child session for Hephaestus.

### How delegation works:

1. Hermes calls the `task` tool with `subagent_type: "hephaestus"`
2. OpenCode spawns Hephaestus as a subagent
3. Hephaestus runs his own loop with his own tools
4. When Hephaestus is done, the result comes back to Hermes
5. Hermes continues

This is EXACTLY the synchronous delegation we designed.
OpenCode already does it natively.

### Chain of command enforcement:

Each agent's markdown file specifies `tools: { task: true/false }`.
- Directors have `task: true` (can delegate)
- Juniors have `task: false` (cannot delegate)

An agent can only spawn subagents that are defined in `.opencode/agents/`.
We control which agents exist by which files we create.

---

## Step 5 — The 6 Laws as Living Rules

### The problem with laws in prompts:
Rules written in a markdown prompt are "dead laws." The AI reads them but may ignore them.

### The solution — two layers:

**Layer 1: Dead laws (in the prompt)**
Write the 6 laws in each agent's system prompt. This gives the AI context.
It will USUALLY follow them because they're in the prompt.

**Layer 2: Living laws (in code)**
Enforce the laws through tool availability and custom code:

| Law | How it's enforced in code |
|---|---|
| Law 1: Task size limit | A custom tool checks file count before allowing task creation |
| Law 2: 300-line rule | A custom tool checks file length before allowing writes |
| Law 3: Real-time docs | The `edit` tool automatically logs changes to memory |
| Law 4: Chain of command | The `mailbox` tool checks relationships before sending |
| Law 5: No inference | The Flagger agent + Reviewer agent check outputs (see below) |
| Law 6: Documentation | Auto-triggered by the `edit` tool — docs update automatically |

### Law 5 — No Inference (the hardest one)

Three roles handle this:

**Role 1 — The Flagger (automated code, not AI)**
After every agent action, a script scans the output for patterns:
- Did the agent guess a value without evidence?
- Did the agent make a decision without being told to?
- Did the agent skip asking the CEO?

This is a TypeScript function, not an AI. It runs fast and free.

**Role 2 — The Reviewer (AI agent under Daedalus)**
When the Flagger detects something, it sends the flag to the Reviewer.
The Reviewer is an AI agent that reads the flag and decides:
- Yes, this is inference → strip tools, report to CEO
- No, this is not inference → agent continues
- Not sure → send to CEO with "please confirm"

**Role 3 — The CEO (you)**
Final authority. You see the flag + the reviewer's judgment.

### How to implement the Flagger:

This is NOT an OpenCode plugin hook (those don't exist as described).
Instead, it's a custom tool that wraps OpenCode's built-in tools.

File: `.opencode/tools/safe_edit.ts`

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Edit a file safely — checks for inference after editing",
  args: {
    path: tool.schema.string(),
    content: tool.schema.string(),
  },
  async execute(args, context) {
    // 1. Do the edit (same as built-in edit)
    await writeFile(args.path, args.content)

    // 2. Run the Flagger on the result
    const flags = scanForInference(args.content, context.agent)

    // 3. If flags found, send to Reviewer
    if (flags.length > 0) {
      await sendToReviewer(context.agent, flags)
      return `File edited but ${flags.length} potential inference(s) flagged for review.`
    }

    return `File edited successfully. No issues detected.`
  },
})
```

We REPLACE the built-in `edit` tool with our `safe_edit` tool for agents
that need monitoring. The AI doesn't know the difference — it just calls "edit."

---

## Step 6 — File Structure

```
.opencode/
  agents/                    # 285 agent markdown files
    hermes.md
    hephaestus.md
    athena.md
    jr-hawk.md
    ...
  tools/                     # Custom tools
    mailbox.ts
    registry.ts
    memory.ts
    revoke.ts
    status.ts
    safe_edit.ts
    safe_bash.ts
  plugins/                   # Custom plugins
    webforge-init.ts         # Initialize project memory on startup
  opencode.json              # Configuration
```

### opencode.json:

```json
{
  "default_agent": "hermes",
  "agents": {
    "build": { "hidden": true },
    "plan": { "hidden": true }
  }
}
```

This makes Hermes the default agent and hides OpenCode's built-in agents.
The CEO (you) only sees Hermes when they open OpenCode.

---

## Step 7 — What We Keep from WebForge

- The 285 skill .md files (become agent system prompts)
- The agent hierarchy (becomes agent relationships)
- The chain of command (enforced by tool availability)
- The 6 laws (enforced by custom tools and the Flagger/Reviewer)
- The mailbox system (becomes a custom tool)
- The memory system (becomes a custom tool)

## Step 8 — What We Get from OpenCode

- The terminal UI (shows agents running, delegating, working)
- Built-in tools (file read, write, bash, grep, glob, web search)
- The `task` tool (synchronous subagent delegation)
- Session management (resume sessions)
- Model routing (use DeepSeek, GLM, or any model)
- Community tools and MCPs (other people's work)
- Automatic updates (OpenCode improves, we benefit)

---

## Summary

We are NOT building a new system. We are adding 285 agents, 7 custom tools,
and a rules enforcement layer ON TOP of OpenCode. OpenCode handles the UI,
the tool-calling infrastructure, the model routing, and the session management.
We handle the agents, the hierarchy, the laws, and the monitoring.

The key insight: you restrict AI by removing tools, not by writing rules.
Every law that matters is enforced in code, not in prompts.
