/**
 * Tool Registry — all TypeScript, no Python.
 *
 * Tools use Prisma directly for database access.
 * Follows OpenCode's tool pattern: description + schema + execute.
 *
 * Each agent gets tools based on:
 *   - Department (build agents get file tools, quality agents get test tools)
 *   - Role tier (directors get task/mailbox/delegate, workers get file tools)
 */

import { tool, jsonSchema, type Tool } from "ai";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

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

// ── Task tools ──

export const taskCreateTool = tool({
  description: "Create a new task on the Kanban board",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      title: { type: "string", description: "What to build or fix" },
      type: { type: "string", enum: ["feature", "bugfix", "refactor", "test", "docs"] },
      area: { type: "string", description: "Area code (e.g., 'auth', 'frontend')" },
      effort: { type: "string", enum: ["S", "M", "L"] },
    },
    required: ["title", "type"],
  }),
  execute: async (input: { title: string; type: string; area?: string; effort?: string }) => {
    const id = await nextId("task");
    const task = await prisma.task.create({
      data: {
        id,
        title: input.title,
        type: input.type,
        area: input.area || "",
        effort: input.effort || "M",
        status: "backlog",
      },
    });
    return { ok: true, task };
  },
});

export const taskListTool = tool({
  description: "List tasks on the Kanban board, optionally filtered by status",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      status: { type: "string", enum: ["all", "backlog", "todo", "doing", "done", "blocked"] },
    },
  }),
  execute: async (input: { status?: string }) => {
    const status = input.status || "all";
    const tasks = status === "all"
      ? await prisma.task.findMany({ orderBy: { createdAt: "asc" } })
      : await prisma.task.findMany({ where: { status }, orderBy: { createdAt: "asc" } });
    return { ok: true, tasks, count: tasks.length };
  },
});

export const taskShowTool = tool({
  description: "Show details of a specific task",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      taskId: { type: "string", description: "Task ID (e.g., task-001)" },
    },
    required: ["taskId"],
  }),
  execute: async (input: { taskId: string }) => {
    const task = await prisma.task.findUnique({ where: { id: input.taskId } });
    if (!task) return { ok: false, error: `Task not found: ${input.taskId}` };
    return { ok: true, task };
  },
});

export const taskPickTool = tool({
  description: "Pick up a task — assign ownership and move to DOING status",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      taskId: { type: "string" },
      agent: { type: "string", description: "Agent name who is picking up the task" },
    },
    required: ["taskId", "agent"],
  }),
  execute: async (input: { taskId: string; agent: string }) => {
    const task = await prisma.task.update({
      where: { id: input.taskId },
      data: {
        owner: input.agent,
        status: "doing",
        startedAt: new Date(),
      },
    });
    return { ok: true, task };
  },
});

export const taskDoneTool = tool({
  description: "Mark a task as done",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      taskId: { type: "string" },
      summary: { type: "string", description: "Summary of what was done" },
    },
    required: ["taskId"],
  }),
  execute: async (input: { taskId: string; summary?: string }) => {
    const task = await prisma.task.update({
      where: { id: input.taskId },
      data: {
        status: "done",
        completedAt: new Date(),
      },
    });
    return { ok: true, task };
  },
});

// ── Mailbox tools ──

export const mailboxSendTool = tool({
  description: "Send a message to another agent. The recipient must be your direct superior or direct subordinate (chain of command enforced).",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient agent name" },
      msgType: { type: "string", enum: ["TASK_ASSIGNED", "TASK_ACK", "TASK_PROGRESS", "TASK_DONE", "TASK_BLOCKED", "QUESTION", "ANSWER", "INFO"] },
      subject: { type: "string" },
      body: { type: "string" },
      taskId: { type: "string" },
    },
    required: ["to", "msgType", "subject", "body"],
  }),
  execute: async (input: { to: string; msgType: string; subject: string; body: string; taskId?: string }) => {
    const id = await nextId("msg");
    const msg = await prisma.message.create({
      data: {
        id,
        fromAgent: process.env.WEBFORGE_AGENT_NAME || "Unknown",
        toAgent: input.to,
        type: input.msgType,
        subject: input.subject,
        body: input.body,
        taskId: input.taskId || null,
        status: "unread",
      },
    });
    return { ok: true, messageId: id };
  },
});

export const mailboxReadTool = tool({
  description: "Read your inbox — list unread messages addressed to you",
  inputSchema: jsonSchema({
    type: "object",
    properties: {},
  }),
  execute: async () => {
    const agentName = process.env.WEBFORGE_AGENT_NAME || "Unknown";
    const messages = await prisma.message.findMany({
      where: { toAgent: agentName, status: "unread" },
      orderBy: { createdAt: "asc" },
    });
    return { ok: true, messages, count: messages.length };
  },
});

// ── File tools ──

export const fileReadTool = tool({
  description: "Read a file from the project",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      path: { type: "string", description: "File path (relative to project root)" },
    },
    required: ["path"],
  }),
  execute: async (input: { path: string }) => {
    // Permission check: never read .env
    if (input.path.endsWith(".env")) {
      return { ok: false, error: "Permission denied: cannot read .env files" };
    }
    try {
      const content = readFileSync(join(process.cwd(), input.path), "utf-8");
      return { ok: true, content: content.slice(0, 10000) };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
});

export const fileWriteTool = tool({
  description: "Write content to a file in the project",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      path: { type: "string", description: "File path (relative to project root)" },
      content: { type: "string", description: "File content" },
    },
    required: ["path", "content"],
  }),
  execute: async (input: { path: string; content: string }) => {
    // Permission check: never write .env
    if (input.path.endsWith(".env")) {
      return { ok: false, error: "Permission denied: cannot write .env files" };
    }
    try {
      const fullPath = join(process.cwd(), input.path);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, input.content, "utf-8");
      return { ok: true, path: input.path, bytes: input.content.length };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
});

// ── Git tools ──

export const gitCommitTool = tool({
  description: "Commit changes to git",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      message: { type: "string", description: "Commit message" },
    },
    required: ["message"],
  }),
  execute: async (input: { message: string }) => {
    try {
      execSync(`git add -A && git commit -m "${input.message.replace(/"/g, '\\"')}"`, {
        encoding: "utf-8",
        timeout: 10000,
        cwd: process.cwd(),
      });
      return { ok: true, message: input.message };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
});

// ── All tools map ──

const ALL_TOOLS: Record<string, Tool> = {
  "task.create": taskCreateTool,
  "task.list": taskListTool,
  "task.show": taskShowTool,
  "task.pick": taskPickTool,
  "task.done": taskDoneTool,
  "mailbox.send": mailboxSendTool,
  "mailbox.read": mailboxReadTool,
  "file.read": fileReadTool,
  "file.write": fileWriteTool,
  "git.commit": gitCommitTool,
};

// ── Get tools for an agent ──

export function getToolListForAgent(
  department: string,
  roleTier: string,
  canDo: string[],
): string[] {
  const tools: string[] = [];

  // Directors and leads: task + mailbox + delegate tools
  if (roleTier === "director" || roleTier === "lead") {
    tools.push("task.create", "task.list", "task.show", "task.delegate");
    tools.push("mailbox.send", "mailbox.read");
  }

  // Workers: file tools + mailbox
  if (roleTier === "worker") {
    if (department === "build") {
      tools.push("file.read", "file.write");
      tools.push("git.commit");
      tools.push("task.show", "task.pick", "task.done");
    }
    if (department === "intelligence") {
      tools.push("file.read");
      tools.push("task.show");
    }
    if (department === "quality") {
      tools.push("file.read");
      tools.push("task.show");
    }
    if (department === "documentation") {
      tools.push("file.read", "file.write");
      tools.push("task.show");
    }
    tools.push("mailbox.send", "mailbox.read");
  }

  return [...new Set(tools)];
}

export function getAgentTools(
  config: { name: string; department: string; roleTier: string; tools: string[] },
  taskId?: string,
  runId?: string,
): Record<string, Tool> {
  const result: Record<string, Tool> = {};
  for (const toolName of config.tools) {
    if (ALL_TOOLS[toolName]) {
      result[toolName] = ALL_TOOLS[toolName];
    }
  }
  return result;
}
