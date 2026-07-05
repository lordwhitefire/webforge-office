/**
 * WebForge Agent Runtime — the core LLM loop.
 *
 * This is the engine that EVERY agent uses. The only differences between
 * agents are:
 *   - systemPrompt → loaded from their skill .md file
 *   - tools → different sets per department/role
 *   - permissions → different rules per agent
 *   - model → DeepSeek vs GLM
 *
 * The loop (same as OpenCode):
 *   1. Load system prompt (skill file)
 *   2. Load conversation history
 *   3. Call LLM with: system + history + available tools
 *   4. LLM responds: speaks naturally OR calls a tool
 *   5. If tool called: check permissions → execute → feed result back → loop
 *   6. If done: return result
 *
 * Uses Vercel AI SDK's streamText with maxSteps for the loop.
 */

import { streamText, type Tool, type CoreMessage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { getAgentTools } from "./tool-registry";
import { checkPermission, type AgentConfig } from "./permissions";
import { loadAgentConfig } from "./agent-config";

const WEBFORGE_HOME = join(homedir(), "webforge");
const SKILLS_DIR = join(WEBFORGE_HOME, "skills");

// ── Model providers ──

function getApiKey(): string {
  // Check env var
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY;
  // Check .env file
  try {
    const envPath = join(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      if (line.startsWith("DEEPSEEK_API_KEY=")) {
        return line.split("=")[1].trim();
      }
    }
  } catch {}
  return "";
}

function getProvider(model: string) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY not set. Add it to .env or environment.");
  }
  const openrouter = createOpenRouter({ apiKey });
  // For now, all models go through OpenRouter
  // DeepSeek v4 Flash for code tasks, GLM could be added later
  return openrouter("deepseek/deepseek-v4-flash");
}

// ── The runtime loop ──

export interface RuntimeResult {
  text: string;
  toolCalls: Array<{ name: string; input: unknown; result: unknown }>;
  model: string;
  steps: number;
}

export interface RuntimeOptions {
  agentName: string;
  message: string;
  history?: CoreMessage[];
  maxSteps?: number;
  taskId?: string;
  runId?: string;
}

/**
 * Run an agent's runtime loop.
 *
 * This is THE function that powers every agent in WebForge.
 * Hermes, Hephaestus, Jr-Hawk — they all call this.
 */
export async function runAgent(options: RuntimeOptions): Promise<RuntimeResult> {
  const { agentName, message, history = [], maxSteps = 10, taskId, runId } = options;

  // 1. Load agent configuration (skill file, tools, permissions, model)
  const config = await loadAgentConfig(agentName);
  console.log(`[Runtime] ${agentName} loaded: model=${config.model}, tools=${config.tools.length}`);

  // 2. Load system prompt from skill file
  const systemPrompt = loadSkillFile(config.skillFile);
  console.log(`[Runtime] ${agentName} system prompt: ${systemPrompt.length} chars`);

  // 3. Build tools (filtered by agent's tool list + permissions)
  const tools = await buildTools(config, taskId, runId);
  console.log(`[Runtime] ${agentName} tools: ${Object.keys(tools).join(", ")}`);

  // 4. Build messages
  const messages: CoreMessage[] = [
    ...history,
    { role: "user" as const, content: message },
  ];

  // 5. Call LLM with the loop
  const provider = getProvider(config.model);
  const toolCalls: Array<{ name: string; input: unknown; result: unknown }> = [];

  const result = streamText({
    model: provider,
    system: systemPrompt,
    messages,
    tools,
    maxSteps,
    temperature: 0.7,
    maxOutputTokens: 4096,
    onStepFinish: (event) => {
      if (event.toolCalls) {
        for (const tc of event.toolCalls) {
          console.log(`[Runtime] ${agentName} called tool: ${tc.toolName}`);
          toolCalls.push({ name: tc.toolName, input: tc.input, result: null });
        }
      }
      if (event.toolResults) {
        for (let i = 0; i < event.toolResults.length; i++) {
          const tr = event.toolResults[i];
          const idx = toolCalls.length - event.toolResults.length + i;
          if (idx >= 0 && idx < toolCalls.length) {
            toolCalls[idx].result = tr.output;
          }
        }
      }
    },
  });

  // 6. Wait for completion and get final text
  const finalResult = await result;
  const text = await finalResult.text;

  return {
    text,
    toolCalls,
    model: config.model,
    steps: finalResult.steps,
  };
}

// ── Skill file loader ──

function loadSkillFile(skillFile: string): string {
  if (!skillFile) {
    return "You are a WebForge agent. Follow the laws and do your job.";
  }
  const path = join(SKILLS_DIR, skillFile);
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return `You are a WebForge agent. Your skill file (${skillFile}) was not found.`;
  }
}

// ── Tool builder ──

async function buildTools(
  config: AgentConfig,
  taskId?: string,
  runId?: string,
): Promise<Record<string, Tool>> {
  const allTools = getAgentTools(config, taskId, runId);
  const filtered: Record<string, Tool> = {};

  for (const [name, tool] of Object.entries(allTools)) {
    // Check permission: is this tool allowed for this agent?
    const allowed = checkPermission(config, name);
    if (allowed) {
      filtered[name] = tool;
    } else {
      console.log(`[Runtime] Permission denied: ${config.name} cannot use ${name}`);
    }
  }

  return filtered;
}
