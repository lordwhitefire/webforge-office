"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOfficeStore, type OfficeTask } from "./store";

const COLUMNS: { id: OfficeTask["status"]; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "border-slate-600" },
  { id: "todo", label: "TODO", color: "border-blue-500" },
  { id: "doing", label: "DOING", color: "border-yellow-500" },
  { id: "done", label: "DONE", color: "border-emerald-500" },
  { id: "blocked", label: "Blocked", color: "border-red-500" },
];

const effortBadge: Record<string, string> = {
  S: "🟢",
  M: "🟡",
  L: "🔴",
};

export function TaskBoard({ onRefresh }: { onRefresh: () => void }) {
  const tasks = useOfficeStore((s) => s.tasks);

  const byColumn = (status: OfficeTask["status"]) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-200">Kanban Board</h3>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
            {tasks.length} tasks
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          className="h-7 gap-1 px-2 text-slate-400 hover:text-slate-200"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-5 gap-2 overflow-x-auto p-2">
        {COLUMNS.map((col) => {
          const colTasks = byColumn(col.id);
          return (
            <div
              key={col.id}
              className={cn(
                "flex flex-col rounded-lg border-t-2 bg-slate-950/40",
                col.color
              )}
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {col.label}
                </span>
                <span className="text-[10px] text-slate-500">{colTasks.length}</span>
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto px-1.5 pb-1.5">
                {colTasks.length === 0 ? (
                  <div className="rounded border border-dashed border-slate-700 px-2 py-3 text-center text-[9px] text-slate-600">
                    empty
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: OfficeTask }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1.5">
      <div className="flex items-start justify-between gap-1">
        <span className="text-[10px] font-mono text-slate-500">{task.id}</span>
        <span className="text-[10px]">{effortBadge[task.effort] ?? "⚪"}</span>
      </div>
      <p className="mt-0.5 text-[11px] font-medium text-slate-200 line-clamp-2">
        {task.title}
      </p>
      {task.owner && (
        <div className="mt-1 inline-block rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-300">
          @{task.owner}
        </div>
      )}
      {task.status === "blocked" && task.block_reason && (
        <div className="mt-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-300">
          {task.block_reason.slice(0, 50)}
        </div>
      )}
    </div>
  );
}
