/**
 * Tool Registry — maps agent configs to their available tools.
 *
 * Each agent gets tools based on:
 *   - Department (build agents get file tools, quality agents get test tools)
 *   - Role tier (directors get task/mailbox tools, workers get file tools)
 *   - can_do list from the registry
 *
 * Tools are defined in tools/*.ts and use the Vercel AI SDK's tool() function.
 */

import { tool, jsonSchema } from "ai";
import { execSync } from "child_process";
import { join } from "path";
import { homedir } from "os";

const WEBFORGE_HOME = join(homedir(), "webforge");
const MCP_DIR = join(WEBFORGE_HOME, "mcp");

// ── Helper: call Python MCP ──

function callMCP(script: string, args: string[]): string {
  try {
    const cmd = `python3 ${MCP_DIR}/${script} ${args.map(a => `"${a}"`).join(" ")}`;
    return execSync(cmd, {
      encoding: "utf-8",
      timeout: 30000,
      env: { ...process.env, WEBFORGE_PROJECT: process.cwd() },
    });
  } catch (e) {
    return JSON.stringify({ ok: false, error: String(e) });
  }
}

// ── Tool definitions ──

export const taskCreateTool = tool({
  description: "Create a new task on the Kanban board and assign it to a department",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      title: { type: "string", description: "What to build or fix" },
      type: { type: "string", enum: ["feature", "bugfix", "refactor", "test", "docs"], description: "Task type" },
      area: { type: "string", description: "Area code (e.g., 'auth', 'frontend', '01-05')" },
      effort: { type: "string", enum: ["S", "M", "L"], description: "Effort estimate: Small, Medium, Large" },
    },
    required: ["title", "type"],
  }),
  execute: async (input) => {
    const result = callMCP("task.py", [
      "create",
      input.title,
      input.type,
      input.area || "",
      input.effort || "M",
    ]);
    return JSON.parse(result);
  },
});

export const taskListTool = tool({
  description: "List tasks on the Kanban board, optionally filtered by status",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      status: { type: "string", enum: ["all", "backlog", "todo", "doing", "done", "blocked"], description: "Filter by status" },
    },
  }),
  execute: async (input) => {
    const result = callMCP("task.py", ["list", input.status || "all"]);
    return JSON.parse(result);
  },
});

export const taskShowTool = tool({
  description: "Show details of a specific task",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      task_id: { type: "string", description: "Task ID (e.g., task-001)" },
    },
    required: ["task_id"],
  }),
  execute: async (input) => {
    const result = callMCP("task.py", ["show", input.task_id]);
    return JSON.parse(result);
  },
});

export const mailboxSendTool = tool({
  description: "Send a message to another agent via the mailbox system. The recipient must be your direct superior or direct subordinate (chain of command is enforced).",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient agent name" },
      msg_type: { type: "string", enum: ["TASK_ASSIGNED", "TASK_ACK", "TASK_PROGRESS", "TASK_DONE", "TASK_BLOCKED", "QUESTION", "ANSWER", "INFO"], description: "Message type" },
      subject: { type: "string", description: "Short subject line" },
      body: { type: "string", description: "Full message body" },
      task_id: { type: "string", description: "Related task ID (optional)" },
    },
    required: ["to", "msg_type", "subject", "body"],
  }),
  execute: async (input) => {
    // Call mailbox via inline Python
    const pyCode = `
import sys, os, json
sys.path.insert(0, "${MCP_DIR}")
from mailbox import Mailbox
mb = Mailbox(os.environ.get("WEBFORGE_AGENT_NAME", "Unknown"))
try:
    msg_id = mb.send(
        to="${input.to}",
        msg_type="${input.msg_type}",
        subject="${input.subject.replace(/"/g, '\\"')}",
        body="${input.body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
        task_id=${input.task_id ? `"${input.task_id}"` : "None"},
        bypass_chain=True,  # Agent runtime handles chain check
    )
    print(json.dumps({"ok": True, "msg_id": msg_id}))
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
`;
    try {
      const result = execSync(`python3 -c '${pyCode.replace(/'/g, "'\\''")}'`, {
        encoding: "utf-8",
        timeout: 10000,
        env: { ...process.env, WEBFORGE_PROJECT: process.cwd() },
      });
      return JSON.parse(result.trim());
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
});

export const mailboxReadTool = tool({
  description: "Read your inbox — list unread messages addressed to you",
  inputSchema: jsonSchema({
    type: "object",
    properties: {},
  }),
  execute: async () => {
    const pyCode = `
import sys, os, json
sys.path.insert(0, "${MCP_DIR}")
from mailbox import Mailbox
mb = Mailbox(os.environ.get("WEBFORGE_AGENT_NAME", "Unknown"))
msgs = mb.inbox(unread_only=True)
print(json.dumps([{"id": m.id, "from": m.from_agent, "type": m.type, "subject": m.subject, "body": m.body[:200], "task_id": m.task_id} for m in msgs], default=str))
`;
    try {
      const result = execSync(`python3 -c '${pyCode.replace(/'/g, "'\\''")}'`, {
        encoding: "utf-8",
        timeout: 10000,
        env: { ...process.env, WEBFORGE_PROJECT: process.cwd() },
      });
      return { ok: true, messages: JSON.parse(result.trim()) };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
});

export const fileReadTool = tool({
  description: "Read a file from the project",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      path: { type: "string", description: "File path (relative to project root)" },
    },
    required: ["path"],
  }),
  execute: async (input) => {
    try {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const content = readFileSync(join(process.cwd(), input.path), "utf-8");
      return { ok: true, content: content.slice(0, 10000) }; // limit to 10K chars
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
  execute: async (input) => {
    try {
      const { writeFileSync, mkdirSync } = await import("fs");
      const { join, dirname } = await import("path");
      const fullPath = join(process.cwd(), input.path);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, input.content, "utf-8");
      return { ok: true, path: input.path, bytes: input.content.length };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
});

export const gitCommitTool = tool({
  description: "Commit changes to git",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      message: { type: "string", description: "Commit message" },
    },
    required: ["message"],
  }),
  execute: async (input) => {
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

const ALL_TOOLS = {
  "task.create": taskCreateTool,
  "task.list": taskListTool,
  "task.show": taskShowTool,
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

  // Directors and leads: task + mailbox tools
  if (roleTier === "director" || roleTier === "lead") {
    tools.push("task.create", "task.list", "task.show");
    tools.push("mailbox.send", "mailbox.read");
  }

  // Workers: file tools + mailbox
  if (roleTier === "worker") {
    if (department === "build") {
      tools.push("file.read", "file.write");
      tools.push("git.commit");
      tools.push("task.show");
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

  return [...new Set(tools)]; // deduplicate
}

export function getAgentTools(
  config: { name: string; department: string; roleTier: string; tools: string[] },
  taskId?: string,
  runId?: string,
): Record<string, typeof taskCreateTool> {
  const result: Record<string, typeof taskCreateTool> = {};
  for (const toolName of config.tools) {
    if (ALL_TOOLS[toolName as keyof typeof ALL_TOOLS]) {
      result[toolName] = ALL_TOOLS[toolName as keyof typeof ALL_TOOLS];
    }
  }
  return result;
}
