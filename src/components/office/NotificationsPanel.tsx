"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOfficeStore, type OfficeMessage } from "./store";

const typeEmoji: Record<string, string> = {
  TASK_CREATED: "📝",
  TASK_ASSIGNED: "📤",
  TASK_ACK: "✅",
  TASK_PROGRESS: "🔄",
  TASK_DONE: "🎉",
  TASK_BLOCKED: "🚫",
  REVIEW_NEEDED: "🔍",
  QUESTION: "❓",
  ANSWER: "💬",
  ESCALATION: "⚠️",
  INFO: "ℹ️",
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const messages = useOfficeStore((s) => s.messages);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-300 hover:bg-blue-500/20"
      >
        <Bell className="h-3.5 w-3.5" />
        <span>Notifications</span>
        {messages.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {messages.length > 99 ? "99+" : messages.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-12 flex max-h-[70vh] w-[400px] flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  Notifications ({messages.length})
                </h3>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-slate-500">
                  <div>
                    <Bell className="mx-auto h-10 w-10 opacity-30" />
                    <p className="mt-2 text-xs">No unread notifications</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => <NotificationItem key={msg.id} msg={msg} />)
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NotificationItem({ msg }: { msg: OfficeMessage }) {
  const emoji = typeEmoji[msg.type] ?? "🔔";
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2">
      <div className="flex items-start gap-2">
        <span className="text-base">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono rounded bg-slate-700 px-1 py-0.5 text-slate-400">
              {msg.type}
            </span>
            <span className="text-[10px] text-slate-500">
              @{msg.from_agent} → @{msg.to_agent}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-200">
            {msg.subject}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-2">
            {msg.body}
          </p>
          {msg.task_id && (
            <span className="mt-1 inline-block text-[9px] font-mono text-slate-500">
              {msg.task_id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
