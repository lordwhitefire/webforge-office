/**
 * Permissions — unbreakable rules checked before every tool call.
 *
 * Permissions are DIFFERENT from tool availability:
 *   - Tool availability: "Does this agent have this tool?" (defined in config)
 *   - Permission: "Is this agent allowed to use this tool RIGHT NOW?"
 *     (can be conditional — e.g., file.write on src/* = ALLOW, on .env = DENY)
 *
 * Permission rules use: ACTION + RESOURCE + EFFECT
 *   read    | *.env           | DENY
 *   write   | src/*           | ALLOW
 *   git.push| main            | DENY
 *   git.push| feature/*       | ALLOW
 */

export interface PermissionRule {
  action: string;       // e.g., "file.write", "git.push", "task.create"
  resource?: string;    // glob pattern, e.g., "src/*", "*.env", "*"
  effect: "ALLOW" | "DENY";
}

export interface AgentConfig {
  name: string;
  department: string;
  roleTier: string;        // director | lead | worker | embedded
  title: string;
  model: string;           // "deepseek" | "glm"
  skillFile: string;       // path to skill .md
  tools: string[];         // list of tool names this agent can use
  permissions: PermissionRule[];
  reportsTo: string | null;
  subordinates: string[];
}

/**
 * Check if an agent is allowed to use a tool.
 *
 * Two checks:
 *   1. Is the tool in the agent's tool list? (availability)
 *   2. Do any permission rules DENY this action? (permission)
 *
 * Default: if no rule matches, ALLOW (but tool must be in the list).
 */
export function checkPermission(config: AgentConfig, toolName: string): boolean {
  // 1. Check tool availability
  if (!config.tools.includes(toolName)) {
    return false;
  }

  // 2. Check permission rules — any DENY rule blocks the action
  for (const rule of config.permissions) {
    if (rule.effect === "DENY") {
      // Check if this rule applies to the tool
      const action = toolName.split(".")[0]; // "file.write" → "file"
      const ruleAction = rule.action.split(".")[0];

      if (rule.action === toolName || rule.action === action || rule.action === "*") {
        if (!rule.resource || rule.resource === "*") {
          return false; // DENY all
        }
        // Resource-specific checks would go here
        // For now, deny if any matching rule says DENY
        return false;
      }
    }
  }

  return true;
}

/**
 * Default permission rules by role tier.
 */
export function getDefaultPermissions(roleTier: string, department: string): PermissionRule[] {
  const rules: PermissionRule[] = [];

  // Law 5: No inference — always enforced
  rules.push({ action: "inference", resource: "*", effect: "DENY" });

  // Never read .env files
  rules.push({ action: "file.read", resource: "*.env", effect: "DENY" });
  rules.push({ action: "file.write", resource: "*.env", effect: "DENY" });

  // Never write to system directories
  rules.push({ action: "file.write", resource: "/etc/*", effect: "DENY" });
  rules.push({ action: "file.write", resource: "/sys/*", effect: "DENY" });

  if (roleTier === "director") {
    // Directors cannot write code
    rules.push({ action: "file.write", resource: "*", effect: "DENY" });
    rules.push({ action: "file.read", resource: "*", effect: "DENY" });
    rules.push({ action: "git.push", resource: "*", effect: "DENY" });
    rules.push({ action: "git.commit", resource: "*", effect: "DENY" });
  }

  if (roleTier === "worker" && department === "build") {
    // Juniors can write to src/ but cannot push to main
    rules.push({ action: "file.write", resource: "src/*", effect: "ALLOW" });
    rules.push({ action: "git.push", resource: "main", effect: "DENY" });
    rules.push({ action: "git.push", resource: "feature/*", effect: "ALLOW" });
    rules.push({ action: "git.commit", resource: "*", effect: "ALLOW" });
  }

  if (roleTier === "worker" && department === "quality") {
    // Quality agents can run tests but NOT write code
    rules.push({ action: "file.write", resource: "*", effect: "DENY" });
    rules.push({ action: "test.run", resource: "*", effect: "ALLOW" });
    rules.push({ action: "lint.check", resource: "*", effect: "ALLOW" });
  }

  return rules;
}
