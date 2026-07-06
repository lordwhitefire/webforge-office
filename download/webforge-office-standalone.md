# Implementation Plan — WebForge Office Standalone

## What We Decided

WebForge Office stays as a standalone TypeScript system.
But we adopt OpenCode's patterns — their UI style, their tool design,
their agent model. We keep our chain of command, our watchdog,
our sleep/wake, and add monitoring agents.

The goal: if OpenCode has a feature we want, we can integrate it.
If we have a feature OpenCode doesn't, we keep it.

---

## What We Keep (Already Built)

These are things we already have that work well:

1. **Manual agent loop** (`runtime.ts`)
   - The `while(true)` loop where the LLM thinks, calls tools, loops
   - We control it, not the SDK
   - Synchronous delegation (results bubble back up)

2. **285 agents** (in `agents.json`)
   - Each agent has: name, department, role tier, title, skill file, tools
   - Loaded dynamically — no hardcoded agents

3. **Skill .md files** (in `src/skills/`)
   - 285 files, one per agent
   - Loaded as system prompts at runtime

4. **Agent states** (in Prisma SQLite)
   - idle, active, waiting, sleeping, no_response
   - Real-time polling every 2 seconds

5. **Watchdog** (in `runtime.ts`)
   - 3-minute check-in timer
   - 5-retry limit before reporting failure
   - Sends check-in mailbox messages

6. **Sleep/wake** (in `runtime.ts`)
   - Agents sleep when done AND no subordinates working
   - Agents wake when their superior delegates to them

7. **Tool system** (in `tool-registry.ts`)
   - 10 tools: task.create, task.list, task.show, task.pick, task.done,
     mailbox.send, mailbox.read, file.read, file.write, git.commit
   - Tools assigned per agent based on department and role

8. **Campus UI**
   - 2D circular map (zoom, pan, agent symbols)
   - 3D walk mode (WASD movement, buildings)
   - Spy cam (click building → 3D interior)
   - Agent tree (real-time hierarchy with states)

---

## What We Change

### Change 1 — Adopt OpenCode's Tool Pattern

OpenCode defines tools as: description + schema + execute function.
We already do this, but we make it more OpenCode-compatible.

**Before (our current tools):**
```typescript
export const fileWriteTool = tool({
  description: "Write content to a file",
  inputSchema: jsonSchema({ ... }),
  execute: async (input) => { ... },
})
```

**After (OpenCode-compatible pattern):**
```typescript
// Each tool is a separate file in src/lib/tools/
// File: src/lib/tools/file_write.ts

export const FileWriteTool = {
  name: "file.write",
  description: "Write content to a file in the project",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path" },
      content: { type: "string", description: "File content" },
    },
    required: ["path", "content"],
  },
  async execute(input: { path: string; content: string }, context: ToolContext) {
    // 1. Check permissions (can this agent write to this path?)
    if (!checkPermission(context.agent, "file.write", input.path)) {
      return { ok: false, error: "Permission denied" }
    }

    // 2. Do the work
    writeFileSync(join(process.cwd(), input.path), input.content)

    // 3. Run the Flagger (Law 5 enforcement)
    const flags = scanForInference(input.content, context.agent)
    if (flags.length > 0) {
      await sendToReviewer(context.agent, flags)
    }

    // 4. Log automatically (Law 6: real-time documentation)
    await logToMemory(context.agent, `Wrote ${input.path}`)

    return { ok: true, path: input.path, bytes: input.content.length }
  },
}
```

This makes our tools compatible with OpenCode's plugin system.
If someone builds a tool for OpenCode, we can use it in WebForge Office too.

### Change 2 — Add the Flagger and Reviewer

These are new agents that enforce Law 5 (No Inference).

**The Flagger** — not an AI agent. Just code that runs after every tool call.

File: `src/lib/flagger.ts`

```typescript
// Runs after EVERY tool execution
export function scanForInference(output: string, agentName: string): Flag[] {
  const flags: Flag[] = []

  // Check 1: Did the agent guess a value?
  // Look for patterns like "I assume", "probably", "I think this should be"
  const guessPatterns = [
    /I assume/i, /I guess/i, /probably/i, /I think this should/i,
    /let's use/i, /I'll just/i, /might as well/i,
  ]
  for (const pattern of guessPatterns) {
    if (pattern.test(output)) {
      flags.push({ type: "guess", message: "Agent may be guessing", excerpt: output.slice(0, 200) })
    }
  }

  // Check 2: Did the agent make a decision without evidence?
  // Look for decisions that don't reference a tool result
  const decisionPatterns = [
    /I decided to/i, /I chose/i, /I went with/i,
  ]
  for (const pattern of decisionPatterns) {
    if (pattern.test(output)) {
      flags.push({ type: "decision_without_evidence", message: "Agent made a decision" })
    }
  }

  // Check 3: Did the agent skip asking the CEO?
  // If the agent wrote code that includes config values, flags, or design choices
  // without citing where they came from
  const configPatterns = [
    /process\.env\.[A-Z_]+/,  // env vars without checking
    /const.*=.*["'](?:true|false|localhost|3000|production)["']/,  // hardcoded values
  ]
  for (const pattern of configPatterns) {
    if (pattern.test(output)) {
      flags.push({ type: "hardcoded_value", message: "Agent may have hardcoded a value" })
    }
  }

  return flags
}
```

**The Reviewer** — an AI agent that reads flags and decides what to do.

This is a new agent in the Meta Engineering department.
When the Flagger detects something, the Reviewer:
1. Reads the flagged output
2. Decides: is this real inference?
3. If yes → strips the agent's tools, reports to Hermes → Hermes reports to CEO
4. If no → agent continues
5. If unsure → reports to CEO with "please confirm"

### Change 3 — Add New Monitoring Agents

These agents join the Meta Engineering department:

| Agent | Role | How it works |
|---|---|---|
| **Flagger** | Code (not AI) | Scans every tool output for inference patterns |
| **Reviewer** | AI agent | Reads flags, decides if they're real |
| **Compass** | AI agent | Already exists — tests the system, finds bugs |
| **Daedalus** | AI director | Reads reviewer reports, escalates to Hermes |

Flow:
```
Agent does something
  → Flagger scans the output (instant, code, not AI)
  → If flagged: Reviewer reads it (AI agent, under Daedalus)
    → Reviewer says "yes, inference" → strip tools → report to Hermes → CEO
    → Reviewer says "no, not inference" → agent continues
    → Reviewer says "not sure" → report to Hermes → CEO decides
```

### Change 4 — Make Tools Extensible

We want other people's OpenCode tools to work in our system.

File: `src/lib/tools/loader.ts`

```typescript
// Loads tools from multiple sources:
// 1. Built-in tools (our tools in src/lib/tools/)
// 2. Custom tools from .opencode/tools/ (OpenCode-compatible)
// 3. MCP servers (external services)

export async function loadToolsForAgent(agentName: string): Promise<Tool[]> {
  const tools: Tool[] = []

  // 1. Load built-in tools based on agent's department and role
  const builtinTools = getBuiltinToolsForAgent(agentName)
  tools.push(...builtinTools)

  // 2. Load custom tools from .opencode/tools/ directory
  const customTools = await loadCustomTools()
  tools.push(...customTools)

  // 3. Filter by agent permissions
  return tools.filter(tool => checkPermission(agentName, tool.name))
}
```

This means:
- Our tools work (task.create, mailbox.send, etc.)
- OpenCode-style custom tools work (if someone writes a tool for OpenCode, we can use it)
- MCP servers work (GitHub, Supabase, etc.)

### Change 5 — Terminal-Style UI (Optional)

The user wants to see agents running like OpenCode's terminal:
```
[Hermes] Creating task: Build login page
[Hermes] Delegating to Hephaestus...
  [Hephaestus] Received task. Breaking down...
  [Hephaestus] Delegating to Aurora (Frontend)...
    [Aurora] Delegating to Lead-Faro...
      [Lead-Faro] Assigning to Sr-Hale...
        [Sr-Hale] Assigning to Jr-Hawk...
          [Jr-Hawk] Writing code...
          [Jr-Hawk] Done. Code at src/components/LoginForm.tsx
        [Sr-Hale] Reviewing... OK. Reporting to Lead-Faro.
      [Lead-Faro] Done. Reporting to Aurora.
    [Aurora] Done. Reporting to Hephaestus.
  [Hephaestus] All teams done. Reporting to Hermes.
[Hermes] Login page complete. Frontend, backend, and database built.
```

We add this as a new component: `src/components/office/ActivityLog.tsx`

It reads from the Prisma `Message` table (mailbox messages) and renders
a live terminal-style feed. Each delegation, ACK, progress update, and
completion shows up as a line in the log.

The campus map + agent tree stay for the visual overview.
The activity log adds the terminal-style detail view.

### Change 6 — Keep the Campus UI but Simplify

The campus map (2D/3D) stays for visualizing where agents are.
But the PRIMARY interaction is through the activity log and chat panel.

Layout:
```
┌──────────────────────────────────────────────┐
│  CEO Office (talk to Hermes)                  │
├────────────────────┬─────────────────────────┤
│  Activity Log      │  Chat Panel             │
│  (terminal style)  │  (talk to current agent)│
│                    │                         │
│  [Hermes] Running  │  You: Build login page  │
│  [Hephaestus] ...  │  Hermes: On it.         │
│  [Aurora] ...      │                         │
│                    │                         │
├────────────────────┴─────────────────────────┤
│  Agent Tree (compact, status indicators)      │
├──────────────────────────────────────────────┤
│  Task Board (Kanban)                          │
└──────────────────────────────────────────────┘
```

The 2D/3D campus map becomes a secondary view (toggle to it when you want
to see the visual layout, but the activity log is the primary view).

---

## Step-by-Step Implementation Order

### Phase 1: Refactor Tools (1 day)
1. Split `tool-registry.ts` into individual tool files in `src/lib/tools/`
2. Add `ToolContext` type (agent name, permissions, task ID)
3. Add the Flagger to every tool's execute function
4. Test: tools still work, Flagger runs after each call

### Phase 2: Add the Reviewer Agent (1 day)
1. Create the Reviewer as a new agent in `agents.json`
2. Add the Reviewer to the Meta Engineering department
3. When Flagger flags something, send it to the Reviewer via mailbox
4. Reviewer reads it, decides, reports up the chain
5. Test: trigger an inference, verify it gets flagged and reviewed

### Phase 3: Add Activity Log (1 day)
1. Create `src/components/office/ActivityLog.tsx`
2. Polls the Message table every 1 second
3. Renders terminal-style output with agent names and timestamps
4. Auto-scrolls to bottom
5. Add to the main page layout

### Phase 4: Add Custom Tool Loader (1 day)
1. Create `src/lib/tools/loader.ts`
2. Load tools from `src/lib/tools/` (built-in)
3. Load tools from `.opencode/tools/` (OpenCode-compatible, if they exist)
4. Filter by agent permissions
5. Test: an OpenCode-style tool file works in our system

### Phase 5: Simplify the UI (1 day)
1. Make Activity Log the primary view
2. Move campus map to a toggle (secondary view)
3. Keep agent tree at the bottom (compact)
4. Keep chat panel on the right
5. Test: the layout feels like OpenCode's terminal but with our visual layer

### Phase 6: Add Lint Rules (1 day)
1. Write static lint rules for the 6 laws (TypeScript code, not AI)
2. Each lint rule checks one specific thing after a tool call
3. Lint runs automatically — no AI needed, no device cost
4. Results feed into the Flagger

Lint rules:
```typescript
const LINT_RULES = [
  {
    name: "no_hardcoded_secrets",
    check: (output: string) => {
      // Check for API keys, passwords, tokens in code
      if (/sk-[a-zA-Z0-9]{20,}/.test(output)) return "Possible API key found"
      if (/password\s*=\s*["']/.test(output)) return "Hardcoded password found"
      return null
    }
  },
  {
    name: "no_inference_markers",
    check: (output: string) => {
      if (/I assume|I guess|probably/i.test(output)) return "Agent may be guessing"
      return null
    }
  },
  {
    name: "file_size_limit",
    check: (output: string, context: ToolContext) => {
      if (context.toolName === "file.write") {
        const lines = output.split("\n").length
        if (lines > 300) return `File has ${lines} lines (Law 2: max 300)`
      }
      return null
    }
  },
  // ... more rules for each law
]
```

---

## What We Get from This Approach

| Feature | OpenCode | WebForge Office |
|---|---|---|
| Terminal UI | ✅ Built-in | ✅ Activity Log (we build) |
| Custom agents | ✅ Markdown files | ✅ agents.json + skill .md |
| Tool system | ✅ TypeScript tools | ✅ Same pattern |
| Permissions | ✅ Per-agent | ✅ Per-agent + per-tool |
| Subagent delegation | ✅ `task` tool | ✅ `task.delegate` (synchronous) |
| Watchdog (3-min check-in) | ❌ Doesn't exist | ✅ We have it |
| Sleep/wake | ❌ Doesn't exist | ✅ We have it |
| 3D campus UI | ❌ Doesn't exist | ✅ We have it |
| Flagger + Reviewer | ❌ Doesn't exist | ✅ We're adding it |
| Lint rules for laws | ❌ Doesn't exist | ✅ We're adding it |
| Community tools | ✅ Other people build | ✅ We can load them |
| MCP servers | ✅ Built-in | ✅ We can connect |
| Model routing | ✅ Built-in | ✅ We use OpenRouter |
| Session resume | ✅ Built-in | ⚠️ Not yet (can add) |
| Free updates | ✅ OpenCode improves | ⚠️ We maintain our code |

---

## Summary

We keep everything we built (runtime, tools, campus UI, watchdog, sleep/wake).
We add the Flagger + Reviewer for Law 5 enforcement.
We add lint rules for all 6 laws (code, not AI).
We add an activity log for the terminal-style view.
We make our tool system compatible with OpenCode's so we can use community tools.

The result: a standalone system that has everything OpenCode has,
PLUS the features OpenCode doesn't have (watchdog, sleep/wake, 3D campus,
Flagger/Reviewer, lint rules for laws).

If OpenCode adds a feature we want, we can integrate it.
If we have a feature OpenCode doesn't, we keep it.
