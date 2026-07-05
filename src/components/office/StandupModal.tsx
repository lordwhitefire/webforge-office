"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOfficeStore } from "./store";

interface StandupModalProps {
  open: boolean;
  onClose: () => void;
  fetchStandup: () => void;
}

export function StandupModal({ open, onClose, fetchStandup }: StandupModalProps) {
  const output = useOfficeStore((s) => s.standupOutput);
  const loading = useOfficeStore((s) => s.standupLoading);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 Daily Standup
            <Button
              size="sm"
              variant="outline"
              onClick={fetchStandup}
              disabled={loading}
              className="ml-auto gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] rounded-md border border-slate-800 bg-slate-950/40 p-4">
          {loading && !output ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-[11px] font-mono text-slate-300">
              {output || "(no output)"}
            </pre>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
