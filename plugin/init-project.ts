/**
 * WebForge Init Project Plugin
 *
 * Runs automatically when OpenCode loads config (effectively: when you start
 * a session in any project). Ensures the project has:
 *
 * 1. ALL 301 agent MD files in .opencode/agents/
 *    — copied from the global config's agent/ folder
 *    — only copies files that don't already exist (won't overwrite your work)
 *
 * 2. The .webforge/ runtime state folder with:
 *    — agents.json (the file all tools read — registry, safe_edit, etc.)
 *    — plan.md (shared plan for the Ralph Loop)
 *    — memory/ (STATE.md, PROJECT.md, edit-log.md, bash-log.md, etc.)
 *    — mailbox/ (hermes.json, voss.json, daedalus.json)
 *    — status/ (hermes.json, voss.json, daedalus.json)
 *
 * This plugin finds the global config folder by looking at its own location:
 *   this file is at:  <global-config>/plugin/init-project.ts
 *   global agents at: <global-config>/agent/*.md
 *   global template:  <global-config>/project-template/
 *
 * Place in: plugin/init-project.ts (auto-discovered by OpenCode)
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GLOBAL_CONFIG_DIR = join(__dirname, "..");
const GLOBAL_AGENTS_DIR = join(GLOBAL_CONFIG_DIR, "agent");
const GLOBAL_TEMPLATE_DIR = join(GLOBAL_CONFIG_DIR, "project-template");

function initProject() {
  const projectDir = process.cwd();
  const projectAgentsDir = join(projectDir, ".opencode", "agents");
  const projectWebforgeDir = join(projectDir, ".webforge");

  let agentsCopied = 0;
  let stateCreated = false;

  // ═══════════════════════════════════════════════════════════════
  // 1. COPY ALL 301 AGENT MD FILES INTO THE PROJECT
  // ═══════════════════════════════════════════════════════════════
  if (existsSync(GLOBAL_AGENTS_DIR)) {
    mkdirSync(projectAgentsDir, { recursive: true });
    const agentFiles = readdirSync(GLOBAL_AGENTS_DIR).filter(
      (f) => f.endsWith(".md") && !f.startsWith(".")
    );

    for (const file of agentFiles) {
      const src = join(GLOBAL_AGENTS_DIR, file);
      const dest = join(projectAgentsDir, file);
      if (!existsSync(dest)) {
        copyFileSync(src, dest);
        agentsCopied++;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. CREATE .webforge/ RUNTIME STATE FOLDER
  // ═══════════════════════════════════════════════════════════════
  if (existsSync(GLOBAL_TEMPLATE_DIR)) {
    mkdirSync(projectWebforgeDir, { recursive: true });

    // Copy agents.json (THE file all tools read)
    const agentsJsonSrc = join(GLOBAL_TEMPLATE_DIR, "agents.json");
    const agentsJsonDest = join(projectWebforgeDir, "agents.json");
    if (existsSync(agentsJsonSrc) && !existsSync(agentsJsonDest)) {
      copyFileSync(agentsJsonSrc, agentsJsonDest);
      stateCreated = true;
    }

    // Copy plan.md
    const planSrc = join(GLOBAL_TEMPLATE_DIR, "plan.md");
    const planDest = join(projectWebforgeDir, "plan.md");
    if (existsSync(planSrc) && !existsSync(planDest)) {
      copyFileSync(planSrc, planDest);
    }

    // Create directory structure
    for (const dir of [
      "memory",
      "memory/decisions",
      "mailbox",
      "status",
      "repo-agents",
    ]) {
      mkdirSync(join(projectWebforgeDir, dir), { recursive: true });
    }

    // Copy memory templates
    const memoryFiles = [
      "STATE.md",
      "PROJECT.md",
      "edit-log.md",
      "bash-log.md",
      "recruitments.md",
      "revocations.md",
    ];
    for (const file of memoryFiles) {
      const src = join(GLOBAL_TEMPLATE_DIR, "memory", file);
      const dest = join(projectWebforgeDir, "memory", file);
      if (existsSync(src) && !existsSync(dest)) {
        copyFileSync(src, dest);
      }
    }

    // Copy memory/decisions/README.md
    const decisionsSrc = join(GLOBAL_TEMPLATE_DIR, "memory", "decisions", "README.md");
    const decisionsDest = join(projectWebforgeDir, "memory", "decisions", "README.md");
    if (existsSync(decisionsSrc) && !existsSync(decisionsDest)) {
      copyFileSync(decisionsSrc, decisionsDest);
    }

    // Copy mailbox + status for the 3 permanent agents
    for (const agent of ["hermes", "voss", "daedalus"]) {
      for (const dir of ["mailbox", "status"]) {
        const src = join(GLOBAL_TEMPLATE_DIR, dir, `${agent}.json`);
        const dest = join(projectWebforgeDir, dir, `${agent}.json`);
        if (existsSync(src) && !existsSync(dest)) {
          copyFileSync(src, dest);
        }
      }
    }

    // Copy .pocket-universe.jsonc
    const puSrc = join(GLOBAL_TEMPLATE_DIR, ".pocket-universe.jsonc");
    const puDest = join(projectWebforgeDir, ".pocket-universe.jsonc");
    if (existsSync(puSrc) && !existsSync(puDest)) {
      copyFileSync(puSrc, puDest);
    }

    // Copy repo-agents/README.md
    const repoAgentsSrc = join(GLOBAL_TEMPLATE_DIR, "repo-agents", "README.md");
    const repoAgentsDest = join(projectWebforgeDir, "repo-agents", "README.md");
    if (existsSync(repoAgentsSrc) && !existsSync(repoAgentsDest)) {
      copyFileSync(repoAgentsSrc, repoAgentsDest);
    }
  }

  // Log to stderr (doesn't interfere with OpenCode's stdout)
  if (agentsCopied > 0 || stateCreated) {
    process.stderr.write(
      `[webforge-init] Project initialized: ${agentsCopied} agents copied, .webforge/ ${stateCreated ? "created" : "exists"}\n`
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT — OpenCode plugin format
// ═══════════════════════════════════════════════════════════════
// This plugin hooks into OpenCode's "config" lifecycle event, which
// fires when config is loaded (effectively: session start).
//
// The plugin also runs immediately on import as a fallback, so even
// if the hook doesn't fire, the project still gets initialized.

// Run immediately on load (belt and suspenders)
try {
  initProject();
} catch (err) {
  // Don't crash OpenCode if init fails — just log
  process.stderr.write(`[webforge-init] Warning: ${err}\n`);
}

export default function initProjectPlugin(_input?: any, _options?: any) {
  return {
    // Fires when OpenCode loads config
    config: async (_configInput?: any) => {
      try {
        initProject();
      } catch (err) {
        process.stderr.write(`[webforge-init] Config hook error: ${err}\n`);
      }
    },
  };
}
