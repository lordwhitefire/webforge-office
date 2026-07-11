/**
 * WebForge Status Tool — agents write their status to a file on disk.
 *
 * This implements the watchdog pattern: agents call this to record
 * "I'm working", "I'm done", or "I'm blocked" in .webforge/status/<agent>.json.
 *
 * NOTE: This tool does NOT wake the superior. To notify a superior agent,
 * use `broadcast(send_to="<superior>", message="...")` separately.
 * The `broadcast` tool (from Pocket Universe) handles the wake-up mechanism.
 *
 * Place in: .opencode/tools/status.ts
 */

export default {
  description: "Write your status to .webforge/status/<your-name>.json. Use 'working' when you start, 'done' when finished, or 'blocked' when stuck. This creates a status snapshot on disk for monitoring. To actually notify your superior (with wake-up), use broadcast(send_to='...', message='...') separately.",
  args: {
    status: {
      type: "string",
      description: "Status: 'working', 'done', or 'blocked'",
    },
    message: {
      type: "string",
      description: "Details about your status",
    },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const fromAgent = context.agent || "Unknown"

    // Load registry to find superior (for informational purposes)
    const registryPath = path.join(process.cwd(), ".webforge", "agents.json")
    interface AgentInfo {
      name: string;
      reportsTo?: string | null;
    }
    let superior: string | null = null
    let _isWebForgeAgent = false
    try {
      const registry: Record<string, AgentInfo> = JSON.parse(fs.readFileSync(registryPath, "utf-8"))
      const agentInfo = Object.values(registry).find(
        a => a.name.toLowerCase() === fromAgent.toLowerCase()
      )
      superior = agentInfo?.reportsTo ?? null
      _isWebForgeAgent = !!agentInfo
    } catch {}

    // ─── WebForge Tool Guard ───
    // Only registered WebForge agents can use status.
    // OpenCode built-in agents are unaffected.
    if (!_isWebForgeAgent) {
      return `BLOCKED: ${fromAgent} is not a registered WebForge agent. status only applies to WebForge agents.`
    }

    // Save status to .webforge/status/<agent>.json
    const statusDir = path.join(process.cwd(), ".webforge", "status")
    fs.mkdirSync(statusDir, { recursive: true })

    const statusPath = path.join(statusDir, `${fromAgent.toLowerCase()}.json`)
    const statusData = {
      agent: fromAgent,
      status: args.status,
      message: args.message || "",
      superior: superior || null,
      timestamp: new Date().toISOString(),
    }
    fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2))

    // Log to memory (Law 6: documentation)
    const memDir = path.join(process.cwd(), ".webforge", "memory")
    fs.mkdirSync(memDir, { recursive: true })
    const logPath = path.join(memDir, "status-log.md")
    const logEntry = `- **[${new Date().toISOString()}]** ${fromAgent} → ${args.status}: ${args.message || "(no message)"}\n`
    fs.appendFileSync(logPath, logEntry, "utf-8")

    return `Status written: ${args.status}.
- File: .webforge/status/${fromAgent.toLowerCase()}.json
- Superior: ${superior || "(none)"}
- Logged: .webforge/memory/status-log.md

To notify your superior (with wake-up), call:
  broadcast(send_to="${superior || "<superior-name>"}", message="Status: ${args.status} — ${args.message || ""}")`
  },
}
