/**
 * Shared helper for WebForge tools — ensures .webforge/agents.json exists.
 *
 * If the file doesn't exist, creates it with an empty agents array.
 * This prevents tools from crashing when entering a project that hasn't
 * been fully activated yet.
 */

export function ensureAgentsJson(fs: any, path: any): string {
  const webforgeDir = path.join(process.cwd(), ".webforge")
  const regPath = path.join(webforgeDir, "agents.json")

  if (!fs.existsSync(webforgeDir)) {
    fs.mkdirSync(webforgeDir, { recursive: true })
  }

  if (!fs.existsSync(regPath)) {
    fs.writeFileSync(regPath, JSON.stringify({ agents: [] }, null, 2), "utf-8")
  }

  return regPath
}

export function readAgentsJson(fs: any, path: any): any {
  const regPath = ensureAgentsJson(fs, path)
  try {
    return JSON.parse(fs.readFileSync(regPath, "utf-8"))
  } catch {
    return { agents: [] }
  }
}

export function isWebForgeAgent(fs: any, path: any, agentName: string): boolean {
  const reg = readAgentsJson(fs, path)
  const agents = reg.agents || Object.values(reg)
  return agents.some((a: any) => a.name?.toLowerCase() === agentName.toLowerCase())
}
