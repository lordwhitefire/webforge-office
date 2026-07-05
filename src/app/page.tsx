"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CEOOffice } from "@/components/office/CEOOffice";
import { OfficeFloor } from "@/components/office/OfficeFloor";
import { AgentTree } from "@/components/office/AgentTree";
import { CampusMap2D } from "@/components/office/CampusMap2D";
import { ChatPanel } from "@/components/office/ChatPanel";
import { TaskBoard } from "@/components/office/TaskBoard";
import { StandupModal } from "@/components/office/StandupModal";
import { NotificationsPanel } from "@/components/office/NotificationsPanel";
import {
  useOfficeStore,
  type OfficeTask,
  type OfficeMessage,
} from "@/components/office/store";

export default function Home() {
  const initAgents = useOfficeStore((s) => s.initAgents);
  const sendToCeo = useOfficeStore((s) => s.sendToCeo);
  const setActiveAgent = useOfficeStore((s) => s.setActiveAgent);
  const activeAgent = useOfficeStore((s) => s.activeAgent);
  const setTasks = useOfficeStore((s) => s.setTasks);
  const setMessages = useOfficeStore((s) => s.setMessages);
  const setRuns = useOfficeStore((s) => s.setRuns);
  const openStandup = useOfficeStore((s) => s.openStandup);
  const standupOpen = useOfficeStore((s) => s.standupOpen);
  const closeStandup = useOfficeStore((s) => s.closeStandup);
  const setStandupOutput = useOfficeStore((s) => s.setStandupOutput);
  const setReaperSummary = useOfficeStore((s) => s.setReaperSummary);
  const messages = useOfficeStore((s) => s.messages);
  const tasks = useOfficeStore((s) => s.tasks);
  const agents = useOfficeStore((s) => s.agents);

  const prevNotifCount = useRef(0);
  const prevTaskIds = useRef<Set<string>>(new Set());

  // Initialize agents + run reaper on mount
  useEffect(() => {
    initAgents();

    // Run the reaper on startup to clean up orphaned runs
    fetch("/api/init", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.reaped) {
          const s = data.reaped as { total?: number };
          if (s.total && s.total > 0) {
            toast.info(`Reaper cleaned up ${s.total} orphaned run(s)`);
          }
          setReaperSummary(data.reaped);
        }
      })
      .catch(() => {
        // Silent — reaper failure shouldn't block the UI
      });
  }, [initAgents, setReaperSummary]);

  // ── Polling: tasks + notifications + runs every 3s ──
  const poll = useCallback(async () => {
    // Tasks
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && Array.isArray(data.tasks)) {
        const newTasks = data.tasks as OfficeTask[];

        const currentIds = new Set(newTasks.map((t) => t.id));
        for (const t of newTasks) {
          if (!prevTaskIds.current.has(t.id)) {
            if (prevTaskIds.current.size > 0) {
              toast.success("New task on the board", {
                description: `${t.id}: ${t.title}`,
              });
            }
          }
        }
        prevTaskIds.current = currentIds;
        setTasks(newTasks);

        // Derive "working" status from tasks
        const owners = new Set(
          newTasks
            .filter((t) => t.status === "doing" && t.owner)
            .map((t) => (t.owner as string).toLowerCase())
        );
        const blockedOwners = new Set(
          newTasks
            .filter((t) => t.status === "blocked" && t.owner)
            .map((t) => (t.owner as string).toLowerCase())
        );

        useOfficeStore.setState((s) => ({
          agents: s.agents.map((a) => {
            if (a.thinking) return a;
            if (blockedOwners.has(a.name.toLowerCase())) {
              return { ...a, status: "blocked" };
            }
            if (owners.has(a.name.toLowerCase())) {
              return { ...a, status: "working" };
            }
            if (
              (a.status === "working" || a.status === "blocked") &&
              !owners.has(a.name.toLowerCase()) &&
              !blockedOwners.has(a.name.toLowerCase())
            ) {
              return { ...a, status: "idle" };
            }
            return a;
          }),
        }));
      }
    } catch {
      // silent
    }

    // Notifications
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && Array.isArray(data.notifications)) {
        const unread = data.notifications as OfficeMessage[];
        if (unread.length > prevNotifCount.current && prevNotifCount.current !== -1) {
          const newest = unread[unread.length - 1];
          if (newest && prevNotifCount.current !== 0) {
            toast(`@${newest.to_agent} got a notification`, {
              description: `${newest.type}: ${newest.subject.slice(0, 80)}`,
            });
          }
        }
        prevNotifCount.current = unread.length;
        setMessages(unread);
      } else if (data.ok) {
        prevNotifCount.current = 0;
        setMessages([]);
      }
    } catch {
      // silent
    }

    // Runs (just update store, no toasts)
    try {
      const res = await fetch("/api/runs?status=running", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && Array.isArray(data.runs)) {
        setRuns(data.runs);
      }
    } catch {
      // silent
    }
  }, [setTasks, setMessages, setRuns]);

  useEffect(() => {
    void poll();
    const id = setInterval(() => void poll(), 3000);
    return () => clearInterval(id);
  }, [poll]);

  // ── Standup ──
  const fetchStandup = useCallback(async () => {
    setStandupOutput("", true);
    try {
      const res = await fetch("/api/standup", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setStandupOutput(data.output || "(no output)", false);
      } else {
        setStandupOutput(
          `Failed to load standup: ${data.error || "unknown error"}`,
          false
        );
      }
    } catch (e) {
      setStandupOutput(
        `Network error: ${e instanceof Error ? e.message : "unknown"}`,
        false
      );
    }
  }, [setStandupOutput]);

  // ── Agent click handler ──
  const handleAgentClick = useCallback(
    (name: string) => {
      if (activeAgent === name) return;
      sendToCeo(name);
      setActiveAgent(name);
      toast(`@${name} is walking to the CEO office`, {
        description: "Chat panel opened.",
      });
    },
    [activeAgent, sendToCeo, setActiveAgent]
  );

  const unreadCount = messages.length;
  const doingCount = tasks.filter((t) => t.status === "doing").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const blockedCount = tasks.filter((t) => t.status === "blocked").length;
  const workingAgents = agents.filter((a) => a.status === "working").length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top status bar */}
      <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 px-4 py-2 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg">
              <span className="text-sm font-black">W</span>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight text-amber-100">
                WebForge Office
              </h1>
              <p className="text-[10px] text-slate-500">
                AI agent organization — live (SQLite-backed)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <StatPill label="Working" value={workingAgents} color="text-yellow-300 bg-yellow-500/10" />
            <StatPill label="Doing" value={doingCount} color="text-blue-300 bg-blue-500/10" />
            <StatPill label="Done" value={doneCount} color="text-emerald-300 bg-emerald-500/10" />
            <StatPill label="Blocked" value={blockedCount} color="text-red-300 bg-red-500/10" />
            <NotificationsPanel />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 p-3 lg:p-4">
        {/* CEO office */}
        <CEOOffice onOpenStandup={openStandup} unreadCount={unreadCount} />

        {/* Office + Chat side-by-side */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_380px]">
          {/* Campus map + Agent tree */}
          <div className="flex flex-col gap-3">
            <div className="lg:h-[500px]">
              <CampusMap2D onAgentClick={handleAgentClick} />
            </div>
            <div className="lg:h-[300px]">
              <AgentTree />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-[11px] text-slate-400">
              <span className="font-semibold text-amber-300">Tip:</span>{" "}
              Scroll to zoom · Drag to pan · Right-click an agent for Call/Dismiss · Click a building for info.
              Zoom in to see agent symbols and names.
            </div>
          </div>

          {/* Chat panel */}
          <div className="lg:h-[680px]">
            {activeAgent ? (
              <ChatPanel
                agentName={activeAgent}
                onClose={() => {
                  const store = useOfficeStore.getState();
                  store.returnHome(activeAgent);
                  setActiveAgent(null);
                }}
              />
            ) : (
              <EmptyChatPanel />
            )}
          </div>
        </div>

        {/* Task board (Kanban) */}
        <div className="lg:h-[320px]">
          <TaskBoard onRefresh={() => void poll()} />
        </div>

        {/* Footer */}
        <footer className="mt-2 border-t border-slate-800 pt-3 text-center text-[11px] text-slate-500">
          WebForge Office · TypeScript Agent Runtime ·{" "}
          <a
            href="https://github.com/lordwhitefire/webforge-office"
            className="text-amber-400 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            webforge-office
          </a>
        </footer>
      </div>

      {/* Standup modal */}
      <StandupModal
        open={standupOpen}
        onClose={closeStandup}
        fetchStandup={fetchStandup}
      />
    </main>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${color}`}
    >
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-slate-100">{value}</span>
    </div>
  );
}

function EmptyChatPanel() {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 text-slate-500">
        <span className="text-2xl">💬</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-300">No agent selected</p>
        <p className="mt-1 text-xs text-slate-500">
          Click an agent on the office floor to bring them to the CEO office
          and start a conversation.
        </p>
      </div>
    </div>
  );
}
