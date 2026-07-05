/**
 * WebForge — helper to call WebForge Python scripts via subprocess.
 *
 * The Next.js app is a VISUALIZATION layer. The actual work is done by
 * Python scripts in ~/webforge/. These helpers run those scripts,
 * capture stdout, and parse the JSON output.
 *
 * Each call sets WEBFORGE_PROJECT to the current working directory so
 * the Python scripts write to the right .webforge/ folder.
 */

import { spawn } from "child_process";
import path from "path";
import os from "os";

const WEBFORGE_HOME = path.join(os.homedir(), "webforge");
const MCP_DIR = path.join(WEBFORGE_HOME, "mcp");
const AGENTS_DIR = path.join(WEBFORGE_HOME, "agents");

/** Project root = the Next.js app working directory. */
function projectRoot(): string {
  return process.cwd();
}

export interface RunOptions {
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
}

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

/**
 * Run a Python script and return its stdout/stderr.
 * Sets WEBFORGE_PROJECT so scripts write to the right project folder.
 */
export async function runPython(
  scriptPath: string,
  opts: RunOptions = {}
): Promise<RunResult> {
  const { args = [], cwd, timeoutMs = 60_000 } = opts;
  const env = {
    ...process.env,
    WEBFORGE_PROJECT: projectRoot(),
    OPENCODE_CWD: projectRoot(),
  };

  return new Promise((resolve) => {
    const child = spawn("python3", [scriptPath, ...args], {
      cwd: cwd ?? WEBFORGE_HOME,
      env,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        stdout,
        stderr: stderr + "\n" + err.message,
        exitCode: null,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ok: !timedOut && code === 0,
        stdout,
        stderr,
        exitCode: code,
      });
    });
  });
}

/**
 * Try to parse JSON from a Python script output.
 * The WebForge scripts sometimes print a Python dict repr (single quotes)
 * instead of strict JSON. We normalize that here.
 */
export function tryParseJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // 1. Strict JSON
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continue
  }

  // 2. Python dict repr (single quotes, True/False/None) — convert
  try {
    let normalized = trimmed
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null");
    return JSON.parse(normalized) as T;
  } catch {
    // continue
  }

  // 3. Try to extract the first {...} block
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      try {
        const normalized = match[0]
          .replace(/'/g, '"')
          .replace(/\bTrue\b/g, "true")
          .replace(/\bFalse\b/g, "false")
          .replace(/\bNone\b/g, "null");
        return JSON.parse(normalized) as T;
      } catch {
        return null;
      }
    }
  }
  return null;
}

// ── High-level WebForge operations ──────────────────────────────────

export interface WebforgeAgent {
  name: string;
  department: string;
  role: string;
  skillFile: string;
  skillFileRelative: string;
}

/**
 * List all agents — uses a small inline Python snippet to call
 * scan_agents() and dump clean JSON.
 */
export async function listAgents(): Promise<{
  agents: WebforgeAgent[];
  error?: string;
}> {
  const inline = `
import sys, json
sys.path.insert(0, "${MCP_DIR}")
from agents import scan_agents
agents = scan_agents()
out = []
for k, v in agents.items():
    out.append({
        "name": v["name"],
        "department": v["department"],
        "role": v["role"],
        "skillFile": v["skill_file"],
        "skillFileRelative": v["skill_file_relative"],
    })
print(json.dumps(out))
`;
  const result = await runPythonInline(inline);
  if (!result.ok) {
    return { agents: [], error: result.stderr || result.stdout };
  }
  const parsed = tryParseJson<WebforgeAgent[]>(result.stdout);
  if (!parsed) {
    return { agents: [], error: "Failed to parse agents JSON" };
  }
  return { agents: parsed };
}

/**
 * Talk to an agent. Calls python3 ~/webforge/agents/<name>.py "<message>".
 */
export async function talkToAgent(
  agentName: string,
  message: string
): Promise<{
  ok: boolean;
  reply: string;
  raw?: string;
  error?: string;
}> {
  const lower = agentName.toLowerCase();

  const inline = `
import sys, os, json
sys.path.insert(0, "${AGENTS_DIR}")
sys.path.insert(0, "${MCP_DIR}")

msg = os.environ.get("WEBFORGE_TALK_MSG", "")
agent_mod = "${lower}"

try:
    mod = __import__(agent_mod)
except Exception as e:
    print(json.dumps({"ok": False, "error": "import_failed: " + str(e), "reply": ""}))
    sys.exit(0)

try:
    if hasattr(mod, "run"):
        result = mod.run(msg)
    else:
        result = {"message": "(agent has no run() function)"}
except Exception as e:
    print(json.dumps({"ok": False, "error": "run_failed: " + str(e), "reply": ""}))
    sys.exit(0)

reply = ""
if isinstance(result, dict):
    reply = result.get("message") or result.get("reply") or result.get("error") or ""
    if not reply:
        reply = json.dumps(result, indent=2, default=str)
elif isinstance(result, str):
    reply = result
else:
    reply = str(result)

print(json.dumps({"ok": True, "reply": reply, "result": result}, default=str))
`;

  const env = {
    ...process.env,
    WEBFORGE_PROJECT: projectRoot(),
    OPENCODE_CWD: projectRoot(),
    WEBFORGE_TALK_MSG: message,
  };

  const result = await runPythonInlineWithEnv(inline, env, 30_000);

  if (!result.ok) {
    const scriptPath = path.join(AGENTS_DIR, `${lower}.py`);
    const direct = await runPython(scriptPath, {
      args: [message],
      timeoutMs: 30_000,
    });
    if (direct.ok && direct.stdout.trim()) {
      return { ok: true, reply: direct.stdout.trim(), raw: direct.stdout };
    }
    return {
      ok: false,
      reply: "",
      error:
        direct.stderr.trim() ||
        result.stderr.trim() ||
        `Agent script exited with code ${result.exitCode}`,
    };
  }

  const parsed = tryParseJson<{
    ok: boolean;
    reply?: string;
    error?: string;
    result?: Record<string, unknown>;
  }>(result.stdout);

  if (!parsed) {
    return { ok: true, reply: result.stdout.trim() || "(no reply)", raw: result.stdout };
  }

  if (!parsed.ok) {
    return { ok: false, reply: "", error: parsed.error || "agent failed" };
  }

  return {
    ok: true,
    reply: parsed.reply || "(no reply)",
    raw: result.stdout,
  };
}

// ── Tasks ──

export interface WebforgeTask {
  id: string;
  title: string;
  description?: string;
  type: string;
  area?: string;
  effort: string;
  status: "backlog" | "todo" | "doing" | "done" | "blocked";
  owner?: string | null;
  blocked_by?: string[];
  block_reason?: string;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
}

/**
 * Get the full task board (all tasks across all columns).
 */
export async function getTasks(): Promise<{
  ok: boolean;
  tasks: WebforgeTask[];
  error?: string;
}> {
  const inline = `
import sys, json
sys.path.insert(0, "${MCP_DIR}")
import state
state.init_schema()
rows = state.query("SELECT * FROM tasks ORDER BY created_at ASC")
# Parse blocked_by JSON
for r in rows:
    import json as _j
    try:
        r['blocked_by'] = _j.loads(r.get('blocked_by') or '[]')
    except:
        r['blocked_by'] = []
print(json.dumps({"tasks": rows}, default=str))
`;
  const result = await runPythonInline(inline);
  if (!result.ok) {
    return { ok: false, tasks: [], error: result.stderr };
  }
  const parsed = tryParseJson<{ tasks: WebforgeTask[] }>(result.stdout);
  if (!parsed) {
    return { ok: false, tasks: [], error: "Parse error" };
  }
  return { ok: true, tasks: parsed.tasks };
}

// ── Notifications / Mailbox ──

export interface WebforgeMessage {
  id: string;
  parent_id?: string | null;
  from_agent: string;
  to_agent: string;
  type: string;
  subject: string;
  body: string;
  task_id?: string | null;
  priority: number;
  created_at: string;
  read_at?: string | null;
  acked_at?: string | null;
  status: string;
}

/**
 * Get all unread messages across all agents.
 */
export async function getNotifications(): Promise<{
  ok: boolean;
  notifications: WebforgeMessage[];
  error?: string;
}> {
  const inline = `
import sys, json
sys.path.insert(0, "${MCP_DIR}")
import state
state.init_schema()
rows = state.query("SELECT * FROM messages WHERE status='unread' ORDER BY priority DESC, created_at ASC")
print(json.dumps(rows, default=str))
`;
  const result = await runPythonInline(inline);
  if (!result.ok) {
    return { ok: false, notifications: [], error: result.stderr };
  }
  const parsed = tryParseJson<WebforgeMessage[]>(result.stdout);
  if (!parsed) {
    return { ok: false, notifications: [], error: "Parse error" };
  }
  return { ok: true, notifications: parsed };
}

/**
 * Mark a message as read.
 */
export async function markMessageRead(
  msgId: string
): Promise<{ ok: boolean; error?: string }> {
  const inline = `
import sys, json
sys.path.insert(0, "${MCP_DIR}")
import state
state.init_schema()
from datetime import datetime, timezone
now = datetime.now(timezone.utc).isoformat()
state.execute("UPDATE messages SET status='read', read_at=? WHERE id=?", (now, "${msgId}"))
print(json.dumps({"ok": True}))
`;
  const result = await runPythonInline(inline);
  if (!result.ok) {
    return { ok: false, error: result.stderr };
  }
  return { ok: true };
}

// ── Runs ──

export interface WebforgeRun {
  id: string;
  task_id?: string | null;
  agent: string;
  pid?: number | null;
  trigger?: string | null;
  status: string;
  started_at: string;
  ended_at?: string | null;
  exit_code?: number | null;
  error?: string | null;
  run_dir?: string | null;
}

/**
 * List runs, optionally filtered by status.
 */
export async function getRuns(
  status: string = "all"
): Promise<{ ok: boolean; runs: WebforgeRun[]; error?: string }> {
  const inline = `
import sys, json
sys.path.insert(0, "${MCP_DIR}")
import state
state.init_schema()
status = "${status}"
if status == "all":
    rows = state.query("SELECT * FROM runs ORDER BY started_at DESC LIMIT 50")
else:
    rows = state.query("SELECT * FROM runs WHERE status=? ORDER BY started_at DESC LIMIT 50", (status,))
print(json.dumps(rows, default=str))
`;
  const result = await runPythonInline(inline);
  if (!result.ok) {
    return { ok: false, runs: [], error: result.stderr };
  }
  const parsed = tryParseJson<WebforgeRun[]>(result.stdout);
  if (!parsed) {
    return { ok: false, runs: [], error: "Parse error" };
  }
  return { ok: true, runs: parsed };
}

/**
 * Run the reaper to clean up orphaned runs.
 */
export async function reapOrphans(
  resume: boolean = false
): Promise<{ ok: boolean; summary?: unknown; error?: string }> {
  const inline = `
import sys, json
sys.path.insert(0, "${MCP_DIR}")
from runs import reap_orphans
summary = reap_orphans(resume=${resume ? "True" : "False"})
print(json.dumps(summary, default=str))
`;
  const result = await runPythonInline(inline, { timeoutMs: 30_000 });
  if (!result.ok) {
    return { ok: false, error: result.stderr };
  }
  const parsed = tryParseJson(result.stdout);
  return { ok: true, summary: parsed };
}

// ── Standup ──

export async function runStandup(): Promise<{
  ok: boolean;
  output: string;
  error?: string;
}> {
  const inline = `
import sys, json
sys.path.insert(0, "${MCP_DIR}")
from standup import standup_run
r = standup_run()
print(json.dumps({"ok": r.ok, "output": r.data.get("output", ""), "error": r.error}))
`;
  const result = await runPythonInline(inline);
  if (!result.ok) {
    return { ok: false, output: "", error: result.stderr };
  }
  const parsed = tryParseJson<{ ok: boolean; output: string; error?: string }>(
    result.stdout
  );
  if (!parsed) {
    return { ok: false, output: result.stdout, error: "Parse error" };
  }
  return parsed;
}

// ── Internal: run inline Python ──

async function runPythonInline(
  code: string,
  opts: { timeoutMs?: number } = {}
): Promise<RunResult> {
  const { timeoutMs = 30_000 } = opts;
  const env = {
    ...process.env,
    WEBFORGE_PROJECT: projectRoot(),
    OPENCODE_CWD: projectRoot(),
  };

  return new Promise((resolve) => {
    const child = spawn("python3", ["-c", code], {
      cwd: WEBFORGE_HOME,
      env,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr: stderr + err.message, exitCode: null });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ok: !timedOut && code === 0,
        stdout,
        stderr,
        exitCode: code,
      });
    });
  });
}

async function runPythonInlineWithEnv(
  code: string,
  env: NodeJS.ProcessEnv,
  timeoutMs = 30_000
): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn("python3", ["-c", code], {
      cwd: WEBFORGE_HOME,
      env,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr: stderr + err.message, exitCode: null });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ok: !timedOut && code === 0,
        stdout,
        stderr,
        exitCode: code,
      });
    });
  });
}
