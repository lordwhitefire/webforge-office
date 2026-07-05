/**
 * Agent Config Loader — loads agent configuration from the Python registry.
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

import { execSync } from "child_process";
import { join } from "path";
import { homedir } from "os";
import type { AgentConfig, PermissionRule } from "./permissions";
import { getDefaultPermissions } from "./permissions";
import { getToolListForAgent } from "./tool-registry";

const WEBFORGE_HOME = join(homedir(), "webforge");

interface RegistryAgent {
  name: string;
  role_tier: string;
  department: string;
  title: string;
  reports_to: string | null;
  subordinates: string[];
  can_do: string[];
  cannot_do: string[];
  skill_file: string;
}

/**
 * Load agent configuration from the Python registry.
 *
 * Calls: python3 ~/webforge/mcp/registry.py show <name>
 * Returns JSON with the agent's full definition.
 */
export async function loadAgentConfig(agentName: string): Promise<AgentConfig> {
  // Query the Python registry
  const result = execSync(
    `python3 ${WEBFORGE_HOME}/mcp/registry.py show "${agentName}"`,
    {
      encoding: "utf-8",
      timeout: 10000,
      env: { ...process.env, WEBFORGE_PROJECT: process.cwd() },
    }
  );

  const regAgent = JSON.parse(result) as RegistryAgent;

  // Get tools for this agent based on department + role
  const tools = getToolListForAgent(regAgent.department, regAgent.role_tier, regAgent.can_do);

  // Get default permissions + any agent-specific ones
  const permissions = getDefaultPermissions(regAgent.role_tier, regAgent.department);

  // Determine model based on department/task type
  const model = selectModel(regAgent.department, regAgent.role_tier);

  return {
    name: regAgent.name,
    department: regAgent.department,
    roleTier: regAgent.role_tier,
    title: regAgent.title,
    model,
    skillFile: regAgent.skill_file,
    tools,
    permissions,
    reportsTo: regAgent.reports_to,
    subordinates: regAgent.subordinates,
  };
}

/**
 * Select the AI model based on agent's department and role.
 *
 * Code tasks → DeepSeek (better at code)
 * Research/docs → GLM (faster, good at text)
 * Directors → DeepSeek (need strong reasoning for planning)
 */
function selectModel(department: string, roleTier: string): string {
  if (department === "build" || department === "meta") {
    return "deepseek"; // code-heavy
  }
  if (department === "intelligence" || department === "documentation") {
    return "deepseek"; // text-heavy, but DeepSeek is still good
  }
  if (roleTier === "director" || roleTier === "lead") {
    return "deepseek"; // planning needs strong reasoning
  }
  return "deepseek"; // default
}
