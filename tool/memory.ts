/**
 * WebForge Memory Tool — read and write to project memory.
 *
 * Memory is stored as markdown files in .webforge/memory/.
 * This implements Law 6 (real-time documentation) and Law 2 (300-line rule).
 *
 * WHO USES THIS: Documentation department + Intelligence department only.
 *   - Documentation writes: STATE.md, PROJECT.md, decisions/, research/
 *   - Intelligence writes: research/ (their raw findings)
 *
 * Allowed paths:
 *   - STATE.md, PROJECT.md (project state and overview)
 *   - decisions/<name>.md (decision records)
 *   - research/<name>.md (intelligence findings — the bridge to documentation)
 *
 * Place in: tool/memory.ts (auto-discovered by OpenCode)
 */

export default {
  description: "Read from or write to WebForge project memory (documentation + intelligence only). Write to 'research/<area>-findings.md' for raw intelligence findings. Write to 'STATE.md' or 'decisions/<name>.md' for project state and decisions.",
  args: {
    action: {
      type: "string",
      description: "Action: 'read' or 'write'",
    },
    file: {
      type: "string",
      description: "File to read/write: 'STATE.md', 'PROJECT.md', 'decisions/<name>.md', 'research/<area>-findings.md'",
    },
    content: {
      type: "string",
      description: "Content to write (only for 'write' action)",
      optional: true,
    },
  },
  async execute(args, context) {
    const fs = await import("fs")
    const path = await import("path")

    const callerAgent = context.agent || "Unknown"

    // ─── WebForge Tool Guard ───
    // Only registered WebForge agents can use memory.
    const regPath = path.join(process.cwd(), ".webforge", "agents.json")
    let _isWebForgeAgent = false
    try {
      const reg = JSON.parse(fs.readFileSync(regPath, "utf-8"))
      _isWebForgeAgent = Object.values(reg).some(
        (a: any) => a.name?.toLowerCase() === callerAgent.toLowerCase()
      )
    } catch {}
    if (!_isWebForgeAgent) {
      return `BLOCKED: ${callerAgent} is not a registered WebForge agent. memory only applies to WebForge agents.`
    }

    const memoryDir = path.join(process.cwd(), ".webforge", "memory")
    fs.mkdirSync(memoryDir, { recursive: true })
    fs.mkdirSync(path.join(memoryDir, "decisions"), { recursive: true })
    fs.mkdirSync(path.join(memoryDir, "research"), { recursive: true })

    const filePath = path.join(memoryDir, args.file)

    // ─── Path validation — only allow writes to approved subdirectories ───
    const allowedFiles = ["STATE.md", "PROJECT.md"]
    const allowedDirs = ["decisions", "research"]
    const fileBase = path.basename(args.file)
    const fileDir = path.dirname(args.file)

    const isAllowed =
      allowedFiles.includes(args.file) ||
      allowedDirs.includes(fileDir) ||
      allowedDirs.includes(fileDir.split("/")[0])

    if (!isAllowed) {
      return `BLOCKED: Cannot write to '${args.file}'. Allowed: STATE.md, PROJECT.md, decisions/<name>.md, research/<name>-findings.md`
    }

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
      if (!args.content) {
        return "BLOCKED: No content provided for write action."
      }

      // Law 2: check file length before writing
      const lines = args.content.split("\n")
      if (lines.length > 300) {
        return `BLOCKED: File would have ${lines.length} lines (Law 2: max 300). Split the content into smaller files.`
      }

      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, args.content, "utf-8")
      return `Written to ${args.file} (${lines.length} lines)`
    }

    return "Unknown action. Use 'read' or 'write'."
  },
}
