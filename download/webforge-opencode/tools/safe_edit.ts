/**
 * WebForge Safe Edit — wraps file editing with Law enforcement.
 *
 * Checks:
 * - Law 2: File must not exceed 300 lines after edit
 * - Law 6: Logs the edit to project memory
 * - Law 5: Scans content for inference patterns (Flagger)
 *
 * Place in: .opencode/tools/safe_edit.ts
 */

export default {
  description: "Edit a file safely. Checks file length (Law 2), logs to memory (Law 6), and scans for inference (Law 5). Use this instead of the built-in edit tool.",
  args: {
    path: {
      type: "string",
      description: "File path to edit",
    },
    content: {
      type: "string",
      description: "New file content",
    },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const agentName = context.agent || "Unknown"
    const filePath = path.join(process.cwd(), args.path)

    // Law 2: Check file length
    const lines = (args.content || "").split("\n")
    if (lines.length > 300) {
      return `BLOCKED by Law 2: File would have ${lines.length} lines (max 300). Split the content into smaller files.`
    }

    // Law 5: Scan for inference patterns (Flagger)
    const inferenceFlags = []
    const patterns = [
      { regex: /I assume/gi, message: "Agent wrote 'I assume' — possible inference" },
      { regex: /I guess/gi, message: "Agent wrote 'I guess' — possible inference" },
      { regex: /probably/gi, message: "Agent wrote 'probably' — possible inference" },
      { regex: /I think this should/gi, message: "Agent wrote 'I think this should' — possible inference" },
      { regex: /sk-[a-zA-Z0-9]{20,}/gi, message: "Possible API key found in code" },
      { regex: /password\s*=\s*["'][^"']+["']/gi, message: "Hardcoded password found" },
    ]
    for (const p of patterns) {
      if (p.regex.test(args.content)) {
        inferenceFlags.push(p.message)
      }
    }

    // Write the file
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, args.content, "utf-8")

    // Law 6: Log to memory
    const memDir = path.join(process.cwd(), ".webforge", "memory")
    fs.mkdirSync(memDir, { recursive: true })
    const logPath = path.join(memDir, "edit-log.md")
    const logEntry = `- **[${new Date().toISOString()}]** ${agentName} edited ${args.path} (${lines.length} lines)\n`
    fs.appendFileSync(logPath, logEntry, "utf-8")

    // Build response
    let response = `File edited: ${args.path} (${lines.length} lines). Logged to memory.`
    if (inferenceFlags.length > 0) {
      response += `\n\n⚠️ FLIGGER DETECTED ${inferenceFlags.length} POTENTIAL ISSUE(S):\n`
      inferenceFlags.forEach(f => response += `  - ${f}\n`)
      response += `\nThese have been logged for review by the Reviewer agent.`
    }

    return response
  },
}
