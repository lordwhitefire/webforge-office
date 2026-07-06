/**
 * WebForge Memory Tool — read and write to project memory.
 *
 * Memory is stored as markdown files in .webforge/memory/.
 * This implements Law 6 (real-time documentation) and Law 2 (300-line rule).
 *
 * Place in: .opencode/tools/memory.ts
 */

export default {
  description: "Read from or write to WebForge project memory. Use 'read' to get project state, decisions, or rules. Use 'write' to log a decision or update state.",
  args: {
    action: {
      type: "string",
      description: "Action: 'read' or 'write'",
    },
    file: {
      type: "string",
      description: "File to read/write: 'STATE.md', 'PROJECT.md', 'decisions/<name>.md'",
    },
    content: {
      type: "string",
      description: "Content to write (only for 'write' action)",
    },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const memoryDir = path.join(process.cwd(), ".webforge", "memory")
    fs.mkdirSync(memoryDir, { recursive: true })
    fs.mkdirSync(path.join(memoryDir, "decisions"), { recursive: true })

    const filePath = path.join(memoryDir, args.file)

    if (args.action === "read") {
      try {
        const content = fs.readFileSync(filePath, "utf-8")
        // Law 2: warn if file is too long
        const lines = content.split("\n")
        if (lines.length > 240) {
          return `${content}\n\n⚠️ WARNING: This file has ${lines.length} lines (Law 2: max 300). Consider splitting.`
        }
        return content
      } catch {
        return `File not found: ${args.file}`
      }
    }

    if (args.action === "write") {
      // Law 2: check file length before writing
      const lines = (args.content || "").split("\n")
      if (lines.length > 300) {
        return `BLOCKED: File would have ${lines.length} lines (Law 2: max 300). Split the content.`
      }

      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, args.content, "utf-8")
      return `Written to ${args.file} (${lines.length} lines)`
    }

    return "Unknown action. Use 'read' or 'write'."
  },
}
