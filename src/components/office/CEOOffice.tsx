"use client";

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useOfficeStore } from "./store";

export function CEOOffice({ onOpenStandup }: { onOpenStandup: () => void; unreadCount: number }) {
  const setStandupOutput = useOfficeStore((s) => s.setStandupOutput);

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-2xl shadow-lg">
            👑
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-100">CEO Office</h2>
            <p className="text-[11px] text-slate-400">
              You are the CEO. Talk to Hermes to coordinate work.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenStandup}
            className="gap-1.5 border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
          >
            <Bell className="h-3.5 w-3.5" />
            Standup
          </Button>
        </div>
      </div>
    </div>
  );
}
