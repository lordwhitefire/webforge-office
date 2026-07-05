"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, Moon, AlertCircle, Circle, Eye, ChevronRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──

interface AgentStateInfo {
  state: string;
  task: string | null;
  retries: number;
  watching: Array<{ name: string; taskId?: string; retries: number }>;
  lastActive: string;
  lastCheckin: string | null;
}

interface AgentNode {
  name: string;
  title: string;
  department: string;
  roleTier: string;
  subordinates: string[];
}

// ── State icons ──

const STATE_CONFIG: Record<string, { icon: typeof Circle; color: string; label: string; bg: string }> = {
  idle: { icon: Circle, color: "text-slate-500", label: "Idle", bg: "bg-slate-700/30" },
  active: { icon: Loader2, color: "text-yellow-300", label: "Active", bg: "bg-yellow-500/10" },
  waiting: { icon: Eye, color: "text-blue-300", label: "Watching", bg: "bg-blue-500/10" },
  sleeping: { icon: Moon, color: "text-slate-400", label: "Sleeping", bg: "bg-slate-800/40" },
  no_response: { icon: AlertCircle, color: "text-red-400", label: "No Response", bg: "bg-red-500/10" },
  done: { icon: CheckCircle2, color: "text-emerald-400", label: "Done", bg: "bg-emerald-500/10" },
};

// ── Agent Tree Component ──

export function AgentTree() {
  const [states, setStates] = useState<Record<string, AgentStateInfo>>({});
  const [hierarchy, setHierarchy] = useState<Record<string, AgentNode>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["CEO", "Hermes", "Hephaestus"]));
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Load hierarchy once
  useEffect(() => {
    fetch("/api/agent/hierarchy", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.hierarchy) {
          setHierarchy(data.hierarchy);
          // Auto-expand CEO, Hermes, and any director that has active children
          const initial = new Set(["CEO", "Hermes"]);
          for (const [name, node] of Object.entries(data.hierarchy as Record<string, AgentNode>)) {
            if (node.roleTier === "director") initial.add(name);
          }
          setExpanded(initial);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Poll for states every 2 seconds
  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/states", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.states) {
        setStates(data.states);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    void poll();
    const id = setInterval(() => void poll(), 2000);
    return () => clearInterval(id);
  }, [poll]);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Count active agents
  const activeCount = Object.values(states).filter(s => s.state === "active").length;
  const waitingCount = Object.values(states).filter(s => s.state === "waiting").length;
  const sleepingCount = Object.values(states).filter(s => s.state === "sleeping").length;
  const noResponseCount = Object.values(states).filter(s => s.state === "no_response").length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/40">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-200">Agent Tree</h3>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
            {Object.keys(hierarchy).length} agents
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          {activeCount > 0 && <span className="flex items-center gap-1 text-yellow-300"><Loader2 className="h-2.5 w-2.5 animate-spin" />{activeCount}</span>}
          {waitingCount > 0 && <span className="flex items-center gap-1 text-blue-300"><Eye className="h-2.5 w-2.5" />{waitingCount}</span>}
          {sleepingCount > 0 && <span className="flex items-center gap-1 text-slate-400"><Moon className="h-2.5 w-2.5" />{sleepingCount}</span>}
          {noResponseCount > 0 && <span className="flex items-center gap-1 text-red-400"><AlertCircle className="h-2.5 w-2.5" />{noResponseCount}</span>}
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">{lastUpdate}</span>
        </div>
      </div>

      {/* Tree */}
      <div className="wf-scroll flex-1 overflow-y-auto p-2">
        <TreeNode
          name="CEO"
          depth={0}
          hierarchy={hierarchy}
          states={states}
          expanded={expanded}
          onToggle={toggleExpand}
        />
      </div>

      {/* Legend */}
      <div className="border-t border-slate-800 px-3 py-2">
        <div className="flex flex-wrap items-center gap-3 text-[9px]">
          {Object.entries(STATE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className="flex items-center gap-1">
                <Icon className={cn("h-2.5 w-2.5", cfg.color, key === "active" && "animate-spin")} />
                <span className="text-slate-500">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tree Node ──

function TreeNode({
  name,
  depth,
  hierarchy,
  states,
  expanded,
  onToggle,
}: {
  name: string;
  depth: number;
  hierarchy: Record<string, AgentNode>;
  states: Record<string, AgentStateInfo>;
  expanded: Set<string>;
  onToggle: (name: string) => void;
}) {
  const node = hierarchy[name];
  if (!node) return null;

  const stateInfo = states[name];
  const state = stateInfo?.state || "idle";
  const stateCfg = STATE_CONFIG[state] || STATE_CONFIG.idle;
  const StateIcon = stateCfg.icon;
  const hasChildren = node.subordinates.length > 0;
  const isExpanded = expanded.has(name);

  // Check if any child is active (auto-expand indicator)
  const childActive = node.subordinates.some(childName => {
    const childState = states[childName]?.state;
    return childState === "active" || childState === "waiting" || childState === "no_response";
  });

  // For deep trees, limit display of titles
  const showTitle = depth <= 3;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors cursor-pointer",
          stateCfg.bg,
          "hover:bg-slate-800/50"
        )}
        style={{ marginLeft: `${Math.min(depth * 16, 200)}px` }}
        onClick={() => hasChildren && onToggle(name)}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button className="text-slate-500 hover:text-slate-300 shrink-0">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <div className="w-3 shrink-0" />
        )}

        {/* State icon */}
        <StateIcon
          className={cn(
            "h-3 w-3 shrink-0",
            stateCfg.color,
            state === "active" && "animate-spin"
          )}
        />

        {/* Name + title */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className={cn(
            "text-[11px] font-medium truncate",
            state === "sleeping" ? "text-slate-500" : "text-slate-200"
          )}>
            {name}
          </span>
          {showTitle && (
            <span className="text-[9px] text-slate-600 truncate hidden sm:inline">
              {node.title}
            </span>
          )}
        </div>

        {/* Watching info */}
        {stateInfo?.watching && stateInfo.watching.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {stateInfo.watching.map((w, i) => (
              <span
                key={i}
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[8px] font-medium",
                  w.retries >= 4 ? "bg-red-500/20 text-red-300" :
                  w.retries >= 2 ? "bg-orange-500/20 text-orange-300" :
                  "bg-blue-500/20 text-blue-300"
                )}
                title={`Watching ${w.name} — retry ${w.retries}/5`}
              >
                → {w.name} ({w.retries}/5)
              </span>
            ))}
          </div>
        )}

        {/* Task badge */}
        {stateInfo?.task && (
          <span className="rounded-full bg-slate-700/50 px-1.5 py-0.5 text-[8px] font-mono text-slate-400 shrink-0">
            {stateInfo.task}
          </span>
        )}

        {/* State label */}
        <span className={cn("text-[8px] font-medium uppercase tracking-wide shrink-0", stateCfg.color)}>
          {stateCfg.label}
        </span>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {node.subordinates.map((childName) => (
              <TreeNode
                key={childName}
                name={childName}
                depth={depth + 1}
                hierarchy={hierarchy}
                states={states}
                expanded={expanded}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-expand indicator when child is active but parent is collapsed */}
      {hasChildren && !isExpanded && childActive && (
        <div className="ml-4 flex items-center gap-1 py-0.5 text-[9px] text-yellow-400/70">
          <span className="animate-pulse">●</span>
          <span>{node.subordinates.filter(c => states[c]?.state === "active" || states[c]?.state === "waiting").length} active below</span>
        </div>
      )}
    </div>
  );
}
