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
    command: {
      type: "string",
      description: "Shell command to execute",
    },
  },
  async execute(args, context) {
    const { execSync } = await import("child_process")
    const fs = await import("fs")
    const path = await import("path")

    const agentName = context.agent || "Unknown"
    const command = args.command

    // ─── WebForge Tool Guard ───
    // Only registered WebForge agents can use safe_bash.
    // OpenCode built-in agents (build, plan, etc.) are unaffected —
    // they use the built-in bash tool (no dangerous-op blocking).
    const regPath = path.join(process.cwd(), ".webforge", "agents.json")
    let _isWebForgeAgent = false
    try {
      const reg = JSON.parse(fs.readFileSync(regPath, "utf-8"))
      _isWebForgeAgent = Object.values(reg).some(
        (a: any) => a.name?.toLowerCase() === agentName.toLowerCase()
      )
    } catch {}
    if (!_isWebForgeAgent) {
      return `BLOCKED: ${agentName} is not a registered WebForge agent. safe_bash only applies to WebForge agents. Use the built-in bash tool instead.`
    }

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
      if (block.pattern.test(command)) {
        return block.message
      }
    }

    // Execute the command
    let output
    try {
      output = execSync(command, {
        encoding: "utf-8",
        timeout: 60000,
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024,
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

    // Return output (truncated if too long)
    if (output.length > 5000) {
      return output.slice(0, 5000) + "\n... (output truncated)"
    }
    return output || "(no output)"
  },
}
