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
    agent: {
      type: "string",
      description: "Name of the agent to revoke permissions from",
    },
    reason: {
      type: "string",
      description: "Why permissions are being revoked (e.g., 'Inference detected in login form code')",
    },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const callerAgent = context.agent || "Unknown"

    // Only Daedalus or Hermes can revoke
    if (callerAgent.toLowerCase() !== "daedalus" && callerAgent.toLowerCase() !== "hermes") {
      return `BLOCKED: Only Daedalus or Hermes can revoke permissions. ${callerAgent} is not authorized.`
    }

    const targetAgent = args.agent.toLowerCase()
    const agentsDir = path.join(process.cwd(), ".opencode", "agents")
    const agentFile = path.join(agentsDir, `${targetAgent}.md`)

    if (!fs.existsSync(agentFile)) {
      return `Agent file not found: ${agentFile}`
    }

    // Read the agent file
    let content = fs.readFileSync(agentFile, "utf-8")

    // Replace edit: allow → edit: deny
    content = content.replace(/edit:\s*allow/g, "edit: deny")
    // Replace bash: allow → bash: deny
    content = content.replace(/bash:\s*allow/g, "bash: deny")

    // Add a revoked note
    const revokeNote = `\n\n## ⚠️ PERMISSIONS REVOKED\n- **Revoked by:** ${callerAgent}\n- **Reason:** ${args.reason}\n- **Time:** ${new Date().toISOString()}\n- **Status:** edit and bash permissions removed. Agent can only read until CEO restores.\n`

    // Add note after frontmatter (after second ---)
    const parts = content.split("---")
    if (parts.length >= 3) {
      content = parts[0] + "---" + parts[1] + "---" + revokeNote + parts.slice(2).join("---")
    }

    fs.writeFileSync(agentFile, content, "utf-8")

    // Log to memory
    const memDir = path.join(process.cwd(), ".webforge", "memory")
    fs.mkdirSync(memDir, { recursive: true })
    const logPath = path.join(memDir, "revocations.md")
    const logEntry = `- **[${new Date().toISOString()}]** ${callerAgent} revoked edit+bash from ${targetAgent}. Reason: ${args.reason}\n`
    fs.appendFileSync(logPath, logEntry, "utf-8")

    return `Permissions revoked from ${args.agent}. edit and bash are now denied. Reason: ${args.reason}. The CEO must manually restore permissions.`
  },
}
