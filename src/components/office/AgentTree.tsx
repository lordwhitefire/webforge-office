"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, Moon, AlertCircle, Circle, Eye, ChevronRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──

interface AgentStateInfo {
  state: string; // idle, active, waiting, sleeping, no_response
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

// ── Hierarchy (embedded — matches agents.json) ──

const HIERARCHY: Record<string, AgentNode> = {
  CEO: { name: "CEO", title: "Chief Executive Officer", department: "executive", roleTier: "director", subordinates: ["Hermes"] },
  Hermes: { name: "Hermes", title: "COO / Coordinator", department: "executive", roleTier: "director", subordinates: ["Athena", "Hephaestus", "Minos", "Thoth", "Voss", "Daedalus"] },
  Hephaestus: { name: "Hephaestus", title: "Build Director", department: "build", roleTier: "director", subordinates: ["Aurora", "Titan", "Zephyr"] },
  Athena: { name: "Athena", title: "Intelligence Director", department: "intelligence", roleTier: "director", subordinates: ["Probe-Lead", "Odin-Lead", "Dorian"] },
  Minos: { name: "Minos", title: "Quality Director", department: "quality", roleTier: "director", subordinates: ["Verdict-Brook", "Scalpel-Core", "Janus-Core", "Pulse-Core", "Sentry-Core", "Pixel-Core"] },
  Thoth: { name: "Thoth", title: "Documentation Director", department: "documentation", roleTier: "director", subordinates: ["Quill", "Scroll", "Stamp", "Ledger", "Draft"] },
  Voss: { name: "Voss", title: "HR Director", department: "hr", roleTier: "director", subordinates: ["Rook", "Weld"] },
  Daedalus: { name: "Daedalus", title: "Meta Engineering Director", department: "meta", roleTier: "director", subordinates: ["Forge", "Anvil", "Loom", "Compass"] },
  Aurora: { name: "Aurora", title: "Frontend Lead", department: "build", roleTier: "lead", subordinates: ["Lead-Faro"] },
  Titan: { name: "Titan", title: "Backend Lead", department: "build", roleTier: "lead", subordinates: ["Lead-Terra"] },
  Zephyr: { name: "Zephyr", title: "DB/Infra Lead", department: "build", roleTier: "lead", subordinates: ["Lead-Zen"] },
  "Lead-Faro": { name: "Lead-Faro", title: "Frontend Tech Lead", department: "build", roleTier: "lead", subordinates: ["Sr-Hale", "Sr-Vance", "Sr-Brook", "Sr-Quill2"] },
  "Lead-Terra": { name: "Lead-Terra", title: "Backend Tech Lead", department: "build", roleTier: "lead", subordinates: ["Sr-Stone", "Sr-Iron", "Sr-Earth", "Sr-Cloud"] },
  "Lead-Zen": { name: "Lead-Zen", title: "DB/Infra Tech Lead", department: "build", roleTier: "lead", subordinates: ["Sr-Water", "Sr-Wood", "Sr-Fire", "Sr-Steel"] },
  "Sr-Hale": { name: "Sr-Hale", title: "Senior Frontend Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Hawk", "Jr-Finch", "Jr-Wisp", "Jr-Cole", "Jr-Reed"] },
  "Sr-Vance": { name: "Sr-Vance", title: "Senior Frontend Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Sage", "Jr-Birch", "Jr-Pike", "Jr-Moss"] },
  "Sr-Brook": { name: "Sr-Brook", title: "Senior Frontend Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Cliff", "Jr-Fern", "Jr-Slate", "Jr-Wren"] },
  "Sr-Quill2": { name: "Sr-Quill2", title: "Senior Frontend Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Cove", "Jr-Bram", "Jr-Talon", "Jr-Aster"] },
  "Sr-Stone": { name: "Sr-Stone", title: "Senior Backend Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Granite", "Jr-Slate", "Jr-Marble", "Jr-Quartz"] },
  "Sr-Iron": { name: "Sr-Iron", title: "Senior Backend Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Copper", "Jr-Bronze", "Jr-Silver", "Jr-Gold"] },
  "Sr-Earth": { name: "Sr-Earth", title: "Senior Backend Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Oak", "Jr-Pine", "Jr-Cedar", "Jr-Birch"] },
  "Sr-Cloud": { name: "Sr-Cloud", title: "Senior Backend Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Titan", "Jr-Vanadium", "Jr-Chromium", "Jr-Nickel", "Jr-Cobalt"] },
  "Sr-Water": { name: "Sr-Water", title: "Senior DB/Infra Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Ash", "Jr-Nickel"] },
  "Sr-Wood": { name: "Sr-Wood", title: "Senior DB/Infra Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Coal"] },
  "Sr-Fire": { name: "Sr-Fire", title: "Senior DB/Infra Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Ember"] },
  "Sr-Steel": { name: "Sr-Steel", title: "Senior DB/Infra Developer", department: "build", roleTier: "lead", subordinates: ["Jr-Flame"] },
  "Probe-Lead": { name: "Probe-Lead", title: "Probe Team Lead", department: "intelligence", roleTier: "lead", subordinates: [] },
  "Odin-Lead": { name: "Odin-Lead", title: "Odin Team Lead", department: "intelligence", roleTier: "lead", subordinates: [] },
  Dorian: { name: "Dorian", title: "UI/UX Researcher", department: "intelligence", roleTier: "worker", subordinates: [] },
  Quill: { name: "Quill", title: "Documentation Writer", department: "documentation", roleTier: "worker", subordinates: [] },
  Scroll: { name: "Scroll", title: "Real-time Documenter", department: "documentation", roleTier: "worker", subordinates: [] },
  Stamp: { name: "Stamp", title: "Git Committer", department: "documentation", roleTier: "worker", subordinates: [] },
  Ledger: { name: "Ledger", title: "Decision Recorder", department: "documentation", roleTier: "worker", subordinates: [] },
  Draft: { name: "Draft", title: "Documentation Drafter", department: "documentation", roleTier: "worker", subordinates: [] },
  Rook: { name: "Rook", title: "Registry Manager", department: "hr", roleTier: "worker", subordinates: [] },
  Weld: { name: "Weld", title: "Assignment Officer", department: "hr", roleTier: "worker", subordinates: [] },
  Forge: { name: "Forge", title: "MCP Builder", department: "meta", roleTier: "worker", subordinates: [] },
  Anvil: { name: "Anvil", title: "MCP Fixer", department: "meta", roleTier: "worker", subordinates: [] },
  Loom: { name: "Loom", title: "Agent Creator", department: "meta", roleTier: "worker", subordinates: [] },
  Compass: { name: "Compass", title: "System Tester", department: "meta", roleTier: "worker", subordinates: [] },
  "Scalpel-Core": { name: "Scalpel-Core", title: "Code Review Lead", department: "quality", roleTier: "lead", subordinates: [] },
  "Janus-Core": { name: "Janus-Core", title: "Compliance Lead", department: "quality", roleTier: "lead", subordinates: [] },
  "Pulse-Core": { name: "Pulse-Core", title: "Testing Lead", department: "quality", roleTier: "lead", subordinates: [] },
  "Sentry-Core": { name: "Sentry-Core", title: "Security Lead", department: "quality", roleTier: "lead", subordinates: [] },
  "Pixel-Core": { name: "Pixel-Core", title: "Visual Testing Lead", department: "quality", roleTier: "lead", subordinates: [] },
  "Verdict-Brook": { name: "Verdict-Brook", title: "Standards Compliance", department: "quality", roleTier: "worker", subordinates: [] },
};

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["CEO", "Hermes", "Hephaestus"]));
  const [lastUpdate, setLastUpdate] = useState<string>("");

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

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/40">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-200">Agent Tree</h3>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
            {Object.keys(states).length} active
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
  states,
  expanded,
  onToggle,
}: {
  name: string;
  depth: number;
  states: Record<string, AgentStateInfo>;
  expanded: Set<string>;
  onToggle: (name: string) => void;
}) {
  const node = HIERARCHY[name];
  if (!node) return null;

  const stateInfo = states[name];
  const state = stateInfo?.state || "idle";
  const stateCfg = STATE_CONFIG[state] || STATE_CONFIG.idle;
  const StateIcon = stateCfg.icon;
  const hasChildren = node.subordinates.length > 0;
  const isExpanded = expanded.has(name);

  // Check if any child is active (auto-expand)
  const childActive = node.subordinates.some(childName => {
    const childState = states[childName]?.state;
    return childState === "active" || childState === "waiting" || childState === "no_response";
  });

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
          stateCfg.bg,
          "hover:bg-slate-800/50"
        )}
        style={{ marginLeft: `${depth * 16}px` }}
        onClick={() => hasChildren && onToggle(name)}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button className="text-slate-500 hover:text-slate-300">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <div className="w-3" />
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
          {depth <= 2 && (
            <span className="text-[9px] text-slate-600 truncate hidden sm:inline">
              {node.title}
            </span>
          )}
        </div>

        {/* Watching info */}
        {stateInfo?.watching && stateInfo.watching.length > 0 && (
          <div className="flex items-center gap-1">
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
          <span className="rounded-full bg-slate-700/50 px-1.5 py-0.5 text-[8px] font-mono text-slate-400">
            {stateInfo.task}
          </span>
        )}

        {/* State label */}
        <span className={cn("text-[8px] font-medium uppercase tracking-wide", stateCfg.color)}>
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
