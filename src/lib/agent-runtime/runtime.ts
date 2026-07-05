/**
 * WebForge Agent Runtime — MANUAL LOOP
 *
 * We control the loop. Not the SDK. Not a black box.
 *
 * while (true):
 *   1. Call LLM with messages + tools
 *   2. If LLM returns text only → done, return text
 *   3. If LLM calls a tool:
 *      a. Check permissions
 *      b. Execute tool (task.delegate = SYNCHRONOUS subagent)
 *      c. Add tool result to messages
 *      d. Continue loop
 *
 * Synchronous delegation: when Hermes calls task.delegate to Hephaestus,
 * Hermes's loop PAUSES, Hephaestus's loop RUNS, result BUBBLES BACK UP.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { execSync } from "child_process";

// Prisma singleton (prevents Next.js hot-reload issues)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

const WEBFORGE_HOME = join(homedir(), "webforge");
const SKILLS_DIR = join(WEBFORGE_HOME, "skills");
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-v4-flash";

// ── Types ──

interface AgentConfig {
  name: string;
  department: string;
  roleTier: string;
  title: string;
  model: string;
  skillFile: string;
  tools: string[];
  reportsTo: string | null;
  subordinates: string[];
}

interface ToolDef {
  name: string;
  description: string;
  parameters: object;
  execute: (input: any) => Promise<any>;
}

interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export interface RuntimeResult {
  text: string;
  toolCalls: Array<{ name: string; input: any; result: any }>;
  model: string;
  steps: number;
}

// ── Agent state tracking ──

const CHECKIN_INTERVAL_MS = parseInt(process.env.CHECKIN_INTERVAL_MS || "180000"); // 3 min default, override for testing
const MAX_RETRIES = 5; // 5 retries before reporting failure

async function setAgentState(agent: string, state: string, task?: string) {
  console.log(`[State] ${agent} → ${state}${task ? ` (task: ${task})` : ""}`);
  await prisma.agentState.upsert({
    where: { agent },
    update: { state, task: task || null, lastActive: new Date() },
    create: { agent, state, task: task || null },
  });
}

async function getAgentState(agent: string): Promise<string> {
  const record = await prisma.agentState.findUnique({ where: { agent } });
  return record?.state || "idle";
}

async function updateLastCheckin(agent: string) {
  await prisma.agentState.update({
    where: { agent },
    data: { lastCheckin: new Date() },
  });
}

async function setAgentWatching(agent: string, watching: Array<{name: string; taskId?: string; retries: number}>) {
  await prisma.agentState.update({
    where: { agent },
    data: { watching: JSON.stringify(watching) },
  });
}

async function getAgentWatching(agent: string): Promise<Array<{name: string; taskId?: string; retries: number}>> {
  const record = await prisma.agentState.findUnique({ where: { agent } });
  if (!record?.watching) return [];
  try {
    return JSON.parse(record.watching);
  } catch {
    return [];
  }
}

/**
 * Watchdog — monitors a subordinate while the parent is waiting.
 *
 * Every CHECKIN_INTERVAL_MS (3 min), checks if the subordinate has responded.
 * After MAX_RETRIES (5) with no response, reports failure.
 *
 * Returns:
 *   - "done" if the subordinate's state becomes "sleeping" (finished)
 *   - "no_response" after MAX_RETRIES failed check-ins
 *   - Never returns "working" — it keeps looping until done or no_response
 */
async function watchSubordinate(
  parentName: string,
  subagentName: string,
  subagentPromise: Promise<RuntimeResult>,
): Promise<{ status: "done"; result: RuntimeResult } | { status: "no_response"; retries: number }> {
  let retries = 0;

  // Start the check-in loop
  const checkinLoop = new Promise<{ status: "no_response"; retries: number }>(async (resolve) => {
    while (retries < MAX_RETRIES) {
      // Wait 3 minutes
      await new Promise(r => setTimeout(r, CHECKIN_INTERVAL_MS));

      // Check subordinate's state
      const state = await getAgentState(subagentName);
      console.log(`[Watchdog] ${parentName} checks ${subagentName}: state=${state}, retry ${retries + 1}/${MAX_RETRIES}`);

      if (state === "sleeping" || state === "idle") {
        // Subordinate finished — don't report no_response
        return; // loop exits, subagentPromise will resolve
      }

      retries++;
      // Update watching list with retry count
      const watching = await getAgentWatching(parentName);
      const updated = watching.map(w =>
        w.name === subagentName ? { ...w, retries } : w
      );
      await setAgentWatching(parentName, updated);

      // Send a check-in mailbox message
      try {
        const msgId = await nextId("msg");
        await prisma.message.create({
          data: {
            id: msgId,
            fromAgent: parentName,
            toAgent: subagentName,
            type: "QUESTION",
            subject: `Check-in ${retries}/${MAX_RETRIES}: Are you done?`,
            body: `This is check-in #${retries} of ${MAX_RETRIES}. Please respond with your status.`,
            status: "unread",
          },
        });
        console.log(`[Watchdog] ${parentName} → ${subagentName}: check-in ${retries}/${MAX_RETRIES}`);
      } catch {}

      if (retries >= MAX_RETRIES) {
        console.log(`[Watchdog] ${parentName}: ${subagentName} NOT RESPONDING after ${MAX_RETRIES} retries`);
        // Mark subordinate as no_response
        await setAgentState(subagentName, "no_response");
        resolve({ status: "no_response", retries });
        return;
      }
    }
  });

  // Race: subagent completes vs watchdog times out
  try {
    const result = await Promise.race([
      subagentPromise.then(r => ({ status: "done" as const, result: r })),
      checkinLoop,
    ]);

    if (result.status === "done") {
      return result;
    } else {
      return result; // no_response
    }
  } catch (e: any) {
    // Subagent threw an error
    return { status: "no_response", retries: MAX_RETRIES };
  }
}

// ── API key ──

function getApiKey(): string {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY;
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

// ── Load agent config from agents.json ──

let _agents: Record<string, AgentConfig> | null = null;

function loadAgentConfig(agentName: string): AgentConfig {
  if (!_agents) {
    const path = join(__dirname, "agents.json");
    let data: string;
    try {
      data = readFileSync(path, "utf-8");
    } catch {
      data = readFileSync(join(process.cwd(), "src/lib/agent-runtime/agents.json"), "utf-8");
    }
    const parsed = JSON.parse(data);
    _agents = {};
    for (const a of parsed.agents) {
      _agents[a.name.toLowerCase()] = {
        name: a.name,
        department: a.department,
        roleTier: a.roleTier,
        title: a.title,
        model: "deepseek",
        skillFile: a.skillFile,
        tools: getToolListForAgent(a.department, a.roleTier),
        reportsTo: a.reportsTo,
        subordinates: a.subordinates || [],
      };
    }
  }

  const config = _agents[agentName.toLowerCase()];
  if (!config) throw new Error(`Agent not found: ${agentName}`);
  return config;
}

function getToolListForAgent(department: string, roleTier: string): string[] {
  const tools: string[] = [];
  if (roleTier === "director" || roleTier === "lead") {
    tools.push("task.create", "task.list", "task.show", "task.delegate", "mailbox.send", "mailbox.read");
  }
  if (roleTier === "worker") {
    if (department === "build") {
      tools.push("file.read", "file.write", "git.commit", "task.show", "task.pick", "task.done", "mailbox.send", "mailbox.read");
    } else {
      tools.push("file.read", "task.show", "mailbox.send", "mailbox.read");
    }
  }
  return Array.from(new Set(tools));
}

// ── Tool definitions ──

function buildToolDefs(config: AgentConfig): Record<string, ToolDef> {
  const defs: Record<string, ToolDef> = {};

  if (config.tools.includes("task.create")) {
    defs["task.create"] = {
      name: "task.create",
      description: "Create a new task on the Kanban board",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "What to build or fix" },
          type: { type: "string", enum: ["feature", "bugfix", "refactor", "test", "docs"] },
          area: { type: "string" },
          effort: { type: "string", enum: ["S", "M", "L"] },
        },
        required: ["title", "type"],
      },
      execute: async (input: any) => {
        const id = await nextId("task");
        const task = await prisma.task.create({
          data: { id, title: input.title, type: input.type, area: input.area || "", effort: input.effort || "M", status: "backlog" },
        });
        return { ok: true, task };
      },
    };
  }

  if (config.tools.includes("task.list")) {
    defs["task.list"] = {
      name: "task.list",
      description: "List tasks on the board",
      parameters: { type: "object", properties: { status: { type: "string", enum: ["all","backlog","todo","doing","done","blocked"] } } },
      execute: async (input: any) => {
        const tasks = input.status && input.status !== "all"
          ? await prisma.task.findMany({ where: { status: input.status }, orderBy: { createdAt: "asc" } })
          : await prisma.task.findMany({ orderBy: { createdAt: "asc" } });
        return { ok: true, tasks, count: tasks.length };
      },
    };
  }

  if (config.tools.includes("task.show")) {
    defs["task.show"] = {
      name: "task.show",
      description: "Show task details",
      parameters: { type: "object", properties: { taskId: { type: "string" } }, required: ["taskId"] },
      execute: async (input: any) => {
        const task = await prisma.task.findUnique({ where: { id: input.taskId } });
        return task ? { ok: true, task } : { ok: false, error: "Not found" };
      },
    };
  }

  if (config.tools.includes("task.pick")) {
    defs["task.pick"] = {
      name: "task.pick",
      description: "Pick up a task — assign ownership and move to DOING",
      parameters: { type: "object", properties: { taskId: { type: "string" }, agent: { type: "string" } }, required: ["taskId"] },
      execute: async (input: any) => {
        const agent = input.agent || config.name;
        const task = await prisma.task.update({ where: { id: input.taskId }, data: { owner: agent, status: "doing", startedAt: new Date() } });
        return { ok: true, task };
      },
    };
  }

  if (config.tools.includes("task.done")) {
    defs["task.done"] = {
      name: "task.done",
      description: "Mark a task as done",
      parameters: { type: "object", properties: { taskId: { type: "string" }, summary: { type: "string" } }, required: ["taskId"] },
      execute: async (input: any) => {
        const task = await prisma.task.update({ where: { id: input.taskId }, data: { status: "done", completedAt: new Date() } });
        return { ok: true, task };
      },
    };
  }

  if (config.tools.includes("mailbox.send")) {
    defs["mailbox.send"] = {
      name: "mailbox.send",
      description: "Send a message to another agent (must be direct superior or subordinate)",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string" },
          msgType: { type: "string", enum: ["TASK_ASSIGNED","TASK_ACK","TASK_PROGRESS","TASK_DONE","TASK_BLOCKED","QUESTION","ANSWER","INFO"] },
          subject: { type: "string" },
          body: { type: "string" },
          taskId: { type: "string" },
        },
        required: ["to", "msgType", "subject", "body"],
      },
      execute: async (input: any) => {
        const id = await nextId("msg");
        await prisma.message.create({
          data: { id, fromAgent: config.name, toAgent: input.to, type: input.msgType, subject: input.subject, body: input.body, taskId: input.taskId || null, status: "unread" },
        });
        return { ok: true, messageId: id };
      },
    };
  }

  if (config.tools.includes("mailbox.read")) {
    defs["mailbox.read"] = {
      name: "mailbox.read",
      description: "Read your inbox",
      parameters: { type: "object", properties: {} },
      execute: async () => {
        const messages = await prisma.message.findMany({ where: { toAgent: config.name, status: "unread" }, orderBy: { createdAt: "asc" } });
        return { ok: true, messages, count: messages.length };
      },
    };
  }

  if (config.tools.includes("file.read")) {
    defs["file.read"] = {
      name: "file.read",
      description: "Read a file from the project",
      parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
      execute: async (input: any) => {
        if (input.path.endsWith(".env")) return { ok: false, error: "Permission denied: .env" };
        try { return { ok: true, content: readFileSync(join(process.cwd(), input.path), "utf-8").slice(0, 10000) }; }
        catch (e: any) { return { ok: false, error: e.message }; }
      },
    };
  }

  if (config.tools.includes("file.write")) {
    
    
    defs["file.write"] = {
      name: "file.write",
      description: "Write content to a file",
      parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] },
      execute: async (input: any) => {
        if (input.path.endsWith(".env")) return { ok: false, error: "Permission denied: .env" };
        try {
          const fullPath = join(process.cwd(), input.path);
          mkdirSync(dirname(fullPath), { recursive: true });
          writeFileSync(fullPath, input.content, "utf-8");
          return { ok: true, path: input.path, bytes: input.content.length };
        } catch (e: any) { return { ok: false, error: e.message }; }
      },
    };
  }

  if (config.tools.includes("git.commit")) {
    
    defs["git.commit"] = {
      name: "git.commit",
      description: "Commit changes to git",
      parameters: { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
      execute: async (input: any) => {
        try {
          execSync(`git add -A && git commit -m "${input.message.replace(/"/g, '\\"')}"`, { encoding: "utf-8", timeout: 10000, cwd: process.cwd() });
          return { ok: true, message: input.message };
        } catch (e: any) { return { ok: false, error: e.message }; }
      },
    };
  }

  // task.delegate — SYNCHRONOUS (runs subagent loop, waits for result)
  if (config.roleTier === "director" || config.roleTier === "lead") {
    defs["task.delegate"] = {
      name: "task.delegate",
      description:
        "Delegate a task to a subordinate agent. Their loop runs SYNCHRONOUSLY — " +
        "your loop pauses, they do the work, their result comes back to you. " +
        "The subordinate must be one of your direct subordinates.",
      parameters: {
        type: "object",
        properties: {
          subagent: { type: "string", description: "Subordinate agent name (must be your direct subordinate)" },
          description: { type: "string", description: "Short (3-5 words) task description" },
          prompt: { type: "string", description: "The task prompt for the subordinate" },
          taskId: { type: "string", description: "Task ID being delegated (optional)" },
        },
        required: ["subagent", "description", "prompt"],
      },
      execute: async (input: any) => {
        const subagentName = input.subagent;

        // Chain-of-command check
        if (!config.subordinates.includes(subagentName)) {
          return {
            ok: false,
            error: `CHAIN VIOLATION: ${config.name} cannot delegate to ${subagentName}. ` +
                   `Direct subordinates: ${config.subordinates.join(", ")}`,
          };
        }

        console.log(`[Delegate] ${config.name} → ${subagentName}: ${input.description}`);
        console.log(`[Delegate]   Prompt: ${input.prompt.slice(0, 120)}...`);

        // PARENT LOOP PAUSES HERE — set state to waiting
        await setAgentState(config.name, "waiting", input.taskId);

        // Add subordinate to watching list
        const watching = await getAgentWatching(config.name);
        watching.push({ name: subagentName, taskId: input.taskId, retries: 0 });
        await setAgentWatching(config.name, watching);

        // Start subagent loop (returns a promise)
        const subagentPromise = agentLoop(subagentName, input.prompt);

        // Run watchdog concurrently — checks every 3 min, 5 retries max
        const watchResult = await watchSubordinate(config.name, subagentName, subagentPromise);

        // Remove subordinate from watching list
        const updatedWatching = (await getAgentWatching(config.name))
          .filter(w => w.name !== subagentName);
        await setAgentWatching(config.name, updatedWatching);

        // PARENT RESUMES
        await setAgentState(config.name, "active", input.taskId);

        if (watchResult.status === "done") {
          const subResult = watchResult.result;
          console.log(`[Delegate] ${subagentName} → ${config.name}: result received (${subResult.text.slice(0, 100)}...)`);
          return {
            ok: true,
            agent: subagentName,
            text: subResult.text,
            toolCalls: subResult.toolCalls.length,
            output: `<task agent="${subagentName}" state="completed">\n${subResult.text}\n</task>`,
          };
        } else {
          // Subordinate didn't respond after 5 retries
          console.log(`[Delegate] ${subagentName} → ${config.name}: NO RESPONSE after ${watchResult.retries} retries`);
          return {
            ok: false,
            agent: subagentName,
            error: `${subagentName} did not respond after ${watchResult.retries} check-ins (15 minutes).`,
            output: `<task agent="${subagentName}" state="no_response">\n${subagentName} did not respond after ${watchResult.retries} check-ins.\n</task>`,
          };
        }
      },
    };
  }

  return defs;
}

// ── ID generation ──

async function nextId(prefix: string): Promise<string> {
  const name = prefix.replace("-", "");
  const counter = await prisma.sequenceCounter.upsert({
    where: { name },
    update: { nextValue: { increment: 1 } },
    create: { name, nextValue: 2 },
  });
  return `${prefix}-${String(counter.nextValue - 1).padStart(3, "0")}`;
}

// ── The LLM call (raw OpenRouter API) ──

async function callLLM(
  systemPrompt: string,
  messages: LLMMessage[],
  toolDefs: Record<string, ToolDef>,
): Promise<{ content: string | null; toolCalls: any[] | null }> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set");

  // Build OpenAI-format tool definitions
  const tools = Object.values(toolDefs).map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const body = {
    model: MODEL,
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ],
    tools: tools.length > 0 ? tools : undefined,
    max_tokens: 4096,
    temperature: 0.7,
  };

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://webforge.local",
      "X-Title": "WebForge",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;

  return {
    content: message?.content || null,
    toolCalls: message?.tool_calls || null,
  };
}

// ── THE MAIN LOOP ──

async function agentLoop(
  agentName: string,
  message: string,
  maxIterations = 10,
): Promise<RuntimeResult> {
  // 1. Load config
  const config = loadAgentConfig(agentName);
  console.log(`[Loop] ${agentName} starting (role: ${config.roleTier}, dept: ${config.department})`);

  // 2. Build system prompt
  const systemPrompt = buildSystemPrompt(config);
  console.log(`[Loop] ${agentName} system prompt: ${systemPrompt.length} chars`);

  // 3. Build tools
  const toolDefs = buildToolDefs(config);
  console.log(`[Loop] ${agentName} tools: ${Object.keys(toolDefs).join(", ")}`);

  // 4. Set state to active
  await setAgentState(agentName, "active");

  // 5. Initialize messages
  let messages: LLMMessage[] = [
    { role: "user", content: message },
  ];

  const allToolCalls: Array<{ name: string; input: any; result: any }> = [];
  let steps = 0;

  // 6. THE LOOP
  while (steps < maxIterations) {
    steps++;
    console.log(`[Loop] ${agentName} iteration ${steps}`);

    // Call LLM
    const response = await callLLM(systemPrompt, messages, toolDefs);

    // Case A: LLM returned text only (no tool calls) → DONE
    if (!response.toolCalls || response.toolCalls.length === 0) {
      console.log(`[Loop] ${agentName} done — text response (no more tool calls)`);
      await setAgentState(agentName, "sleeping");
      return {
        text: response.content || "(no response)",
        toolCalls: allToolCalls,
        model: MODEL,
        steps,
      };
    }

    // Case B: LLM called tools → execute them, feed results back, CONTINUE LOOP
    // Add the assistant message (with tool calls) to message history
    messages.push({
      role: "assistant",
      content: response.content,
      tool_calls: response.toolCalls,
    });

    // Execute each tool call
    for (const tc of response.toolCalls) {
      const toolName = tc.function.name;
      let toolInput: any;
      try {
        toolInput = JSON.parse(tc.function.arguments);
      } catch {
        toolInput = {};
      }

      console.log(`[Loop] ${agentName} → tool: ${toolName}(${JSON.stringify(toolInput).slice(0, 150)})`);

      // Find the tool
      const toolDef = toolDefs[toolName];
      let result: any;

      if (!toolDef) {
        result = { ok: false, error: `Unknown tool: ${toolName}` };
      } else {
        // Execute the tool
        // For task.delegate, this SYNCHRONOUSLY runs the subagent loop
        try {
          result = await toolDef.execute(toolInput);
        } catch (e: any) {
          result = { ok: false, error: e.message };
        }
      }

      console.log(`[Loop] ${agentName} ← ${toolName}: ${JSON.stringify(result).slice(0, 200)}`);

      allToolCalls.push({ name: toolName, input: toolInput, result });

      // Add tool result to message history
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }

    // LOOP CONTINUES — go back to callLLM with updated messages
  }

  // Max iterations reached
  console.log(`[Loop] ${agentName} hit max iterations (${maxIterations})`);
  await setAgentState(agentName, "sleeping");
  return {
    text: `(reached max iterations: ${maxIterations})`,
    toolCalls: allToolCalls,
    model: MODEL,
    steps,
  };
}

// ── System prompt builder ──

function buildSystemPrompt(config: AgentConfig): string {
  let prompt = "";

  // Load skill file
  if (config.skillFile) {
    const path = join(SKILLS_DIR, config.skillFile);
    try {
      prompt += readFileSync(path, "utf-8");
    } catch {
      prompt += `You are ${config.name}, a ${config.title} in the ${config.department} department.`;
    }
  }

  // Add tool hints
  prompt += "\n\n## Available Tools\n";
  prompt += "You have these tools. Call them when needed:\n";
  for (const toolName of config.tools) {
    prompt += `- **${toolName}**: ${TOOL_DESCRIPTIONS[toolName] || toolName}\n`;
  }

  // Delegation hint for managers
  if (config.roleTier === "director" || config.roleTier === "lead") {
    prompt += `\n## Delegation\n`;
    prompt += `You have **task.delegate** — use it to assign work to subordinates.\n`;
    prompt += `Your direct subordinates: ${config.subordinates.join(", ")}\n`;
    prompt += `When you delegate, the subordinate runs SYNCHRONOUSLY — their result comes back to you.\n`;
    prompt += `You can delegate to multiple subordinates by calling task.delegate multiple times.\n`;
  }

  // Loop hint
  prompt += `\n## Important\n`;
  prompt += `- After each tool call, the result is fed back to you.\n`;
  prompt += `- You can call multiple tools in sequence — DON'T stop after one.\n`;
  prompt += `- When all work is done, respond with text (no tool call) to finish.\n`;

  return prompt;
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  "task.create": "Create a new task on the Kanban board",
  "task.list": "List tasks on the board",
  "task.show": "Show details of a specific task",
  "task.pick": "Pick up a task — assign ownership and move to DOING",
  "task.done": "Mark a task as done",
  "task.delegate": "Delegate to a subordinate — they run their loop, result comes back to you",
  "mailbox.send": "Send a message to another agent",
  "mailbox.read": "Read your inbox",
  "file.read": "Read a file from the project",
  "file.write": "Write content to a file",
  "git.commit": "Commit changes to git",
};

// ── Public API ──

export async function runAgent(options: {
  agentName: string;
  message: string;
  maxSteps?: number;
  taskId?: string;
}): Promise<RuntimeResult> {
  return agentLoop(options.agentName, options.message, options.maxSteps || 10);
}

// ── Get all agent states (for UI) ──

export async function getAgentStates(): Promise<Record<string, {
  state: string;
  task: string | null;
  retries: number;
  watching: Array<{name: string; taskId?: string; retries: number}>;
  lastActive: Date;
  lastCheckin: Date | null;
}>> {
  const states = await prisma.agentState.findMany();
  const result: Record<string, any> = {};
  for (const s of states) {
    let watching: Array<{name: string; taskId?: string; retries: number}> = [];
    try {
      watching = s.watching ? JSON.parse(s.watching) : [];
    } catch {}
    result[s.agent] = {
      state: s.state,
      task: s.task,
      retries: s.retries,
      watching,
      lastActive: s.lastActive,
      lastCheckin: s.lastCheckin,
    };
  }
  return result;
}
