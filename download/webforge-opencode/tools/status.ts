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

    // Save status to .webforge/status/<agent>.json
    const statusDir = path.join(process.cwd(), ".webforge", "status")
    fs.mkdirSync(statusDir, { recursive: true })

    const statusPath = path.join(statusDir, `${fromAgent.toLowerCase()}.json`)
    const statusData = {
      agent: fromAgent,
      status: args.status,
      message: args.message || "",
      timestamp: new Date().toISOString(),
    }
    fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2))

    // Send mailbox message to superior if exists
    if (superior) {
      const mailboxPath = path.join(process.cwd(), ".webforge", "mailbox", `${superior.toLowerCase()}.json`)
      fs.mkdirSync(path.dirname(mailboxPath), { recursive: true })

      let inbox = { messages: [] }
      try {
        inbox = JSON.parse(fs.readFileSync(mailboxPath, "utf-8"))
      } catch {}

      inbox.messages.push({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        from: fromAgent,
        to: superior,
        type: args.status === "done" ? "TASK_DONE" : args.status === "blocked" ? "TASK_BLOCKED" : "TASK_PROGRESS",
        subject: `Status: ${args.status}`,
        body: args.message || `Agent ${fromAgent} reports: ${args.status}`,
        timestamp: new Date().toISOString(),
        read: false,
      })
      fs.writeFileSync(mailboxPath, JSON.stringify(inbox, null, 2))
    }

    return `Status reported: ${args.status}. ${superior ? `Notified ${superior}.` : ""}`
  },
}
