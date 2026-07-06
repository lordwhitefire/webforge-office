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
    to: {
      type: "string",
      description: "Agent name to send the message to",
    },
    subject: {
      type: "string",
      description: "Short subject line",
    },
    body: {
      type: "string",
      description: "Full message body",
    },
    msg_type: {
      type: "string",
      description: "Message type: TASK_ASSIGNED, TASK_ACK, TASK_PROGRESS, TASK_DONE, TASK_BLOCKED, QUESTION, ANSWER, INFO",
    },
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

    // Check chain of command
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

    // Save the message
    const mailboxDir = path.join(process.cwd(), ".webforge", "mailbox")
    fs.mkdirSync(mailboxDir, { recursive: true })

    const inboxPath = path.join(mailboxDir, `${toAgent.toLowerCase()}.json`)

    let inbox = { messages: [] }
    try {
      inbox = JSON.parse(fs.readFileSync(inboxPath, "utf-8"))
    } catch {}

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      from: fromAgent,
      to: toAgent,
      type: args.msg_type || "INFO",
      subject: args.subject,
      body: args.body,
      timestamp: new Date().toISOString(),
      read: false,
    }

    inbox.messages.push(message)
    fs.writeFileSync(inboxPath, JSON.stringify(inbox, null, 2))

    return `Message sent to ${toAgent}: ${args.subject}`
  },
}
