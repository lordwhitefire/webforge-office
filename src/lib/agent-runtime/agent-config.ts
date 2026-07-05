/**
 * Agent Config Loader — loads agent configuration from TypeScript data.
 *
 * NO MORE PYTHON. Everything is TypeScript.
 *
 * An agent IS its configuration. The engine is the same for everyone.
 * Adding an agent = adding config data, not writing code.
 *
 * Agent = {
 *   systemPrompt: read("skills/build/hephaestus.md"),
 *   tools: ["task.create", "task.assign", "mailbox.send"],
 *   permissions: { "file.write": "deny", "git.push": "deny" },
 *   model: "deepseek",
 *   boss: "hermes",
 *   subordinates: ["aurora", "titan"],
 * }
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { AgentConfig, PermissionRule } from "./permissions";
import { getDefaultPermissions } from "./permissions";
import { getToolListForAgent } from "./tool-registry";

interface RegistryAgent {
  name: string;
  roleTier: string;
  department: string;
  title: string;
  reportsTo: string | null;
  subordinates: string[];
  canDo: string[];
  cannotDo: string[];
  areas: string;
  skillFile: string;
}

// Load the agent registry from JSON (generated from the Python registry, one-time)
let _agents: Record<string, RegistryAgent> | null = null;

function loadRegistry(): Record<string, RegistryAgent> {
  if (_agents) return _agents;

  const path = join(__dirname, "agents.json");
  // In production, __dirname might not work — fall back to process.cwd()
  let data: string;
  try {
    data = readFileSync(path, "utf-8");
  } catch {
    data = readFileSync(join(process.cwd(), "src/lib/agent-runtime/agents.json"), "utf-8");
  }

  const parsed = JSON.parse(data) as { agents: RegistryAgent[] };
  _agents = {};
  for (const agent of parsed.agents) {
    _agents[agent.name.toLowerCase()] = agent;
  }
  return _agents;
}

/**
 * Load agent configuration.
 *
 * This is pure TypeScript — no Python subprocess, no MCP calls.
 */
export async function loadAgentConfig(agentName: string): Promise<AgentConfig> {
  const registry = loadRegistry();
  const regAgent = registry[agentName.toLowerCase()];

  if (!regAgent) {
    throw new Error(`Agent not found: ${agentName}`);
  }

  // Get tools for this agent based on department + role
  const tools = getToolListForAgent(regAgent.department, regAgent.roleTier, regAgent.canDo);

  // Get default permissions + any agent-specific ones
  const permissions = getDefaultPermissions(regAgent.roleTier, regAgent.department);

  // Determine model based on department/task type
  const model = selectModel(regAgent.department, regAgent.roleTier);

  return {
    name: regAgent.name,
    department: regAgent.department,
    roleTier: regAgent.roleTier,
    title: regAgent.title,
    model,
    skillFile: regAgent.skillFile,
    tools,
    permissions,
    reportsTo: regAgent.reportsTo,
    subordinates: regAgent.subordinates,
  };
}

/**
 * Get a list of all agent names.
 */
export function listAgents(): string[] {
  const registry = loadRegistry();
  return Object.values(registry).map((a) => a.name);
}

/**
 * Select the AI model based on agent's department and role.
 *
 * Code tasks → DeepSeek (better at code)
 * Directors → DeepSeek (need strong reasoning for planning)
 */
function selectModel(department: string, roleTier: string): string {
  // For now, all agents use DeepSeek via OpenRouter
  // GLM could be added as an alternative for documentation/research tasks
  return "deepseek";
}
