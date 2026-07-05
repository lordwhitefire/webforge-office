"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Moon, AlertCircle, Circle, Eye, ChevronRight, ChevronDown,
  Crown, Building2, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BUILDINGS, RING_RADII, polarToCartesian, DEPT_COLORS,
  type Building,
} from "@/data/buildings";

// ── Types ──

interface AgentStateInfo {
  state: string;
  task: string | null;
  retries: number;
  watching: Array<{ name: string; taskId?: string; retries: number }>;
}

interface CampusMap2DProps {
  onAgentClick?: (agentName: string) => void;
  onBuildingClick?: (building: Building) => void;
}

// ── State config ──

const STATE_COLORS: Record<string, string> = {
  idle: "#64748b",
  active: "#fbbf24",
  waiting: "#3b82f6",
  sleeping: "#475569",
  no_response: "#ef4444",
  done: "#10b981",
};

const STATE_GLOW: Record<string, string> = {
  idle: "0 0 4px rgba(100,116,139,0.5)",
  active: "0 0 8px rgba(251,191,36,0.8)",
  waiting: "0 0 6px rgba(59,130,246,0.6)",
  sleeping: "none",
  no_response: "0 0 8px rgba(239,68,68,0.8)",
  done: "0 0 4px rgba(16,185,129,0.5)",
};

// ── Agent symbols (unique per agent type) ──

function getAgentSymbol(agentName: string): string {
  const lower = agentName.toLowerCase();
  if (lower === "ceo") return "👑";
  if (lower === "hermes") return "🪽";
  if (lower === "hephaestus") return "🔨";
  if (lower === "athena") return "🦉";
  if (lower === "minos") return "⚖️";
  if (lower === "thoth") return "📜";
  if (lower === "daedalus") return "🔧";
  if (lower === "voss") return "📋";
  if (lower.startsWith("aurora")) return "🎨";
  if (lower.startsWith("titan")) return "⚙️";
  if (lower.startsWith("zephyr")) return "🗄️";
  if (lower.startsWith("lead-")) return "📐";
  if (lower.startsWith("sr-")) return "🛡️";
  if (lower.startsWith("jr-")) return "💻";
  if (lower.startsWith("probe-")) return "🔍";
  if (lower.startsWith("odin-")) return "📖";
  if (lower.startsWith("scalpel")) return "🔬";
  if (lower.startsWith("pulse-")) return "💓";
  if (lower.startsWith("sentry-")) return "🛡️";
  if (lower.startsWith("pixel-")) return "🖼️";
  if (lower.startsWith("janus-")) return "🔐";
  if (lower.startsWith("verdict-")) return "📏";
  if (lower.startsWith("doc-")) return "📝";
  if (lower.startsWith("forge")) return "🏭";
  if (lower.startsWith("anvil")) return "🔨";
  if (lower.startsWith("loom")) return "🧵";
  if (lower.startsWith("compass")) return "🧭";
  if (lower.startsWith("quill")) return "🪶";
  if (lower.startsWith("scroll")) return "📃";
  if (lower.startsWith("stamp")) return "📬";
  if (lower.startsWith("ledger")) return "📊";
  if (lower.startsWith("draft")) return "✏️";
  if (lower.startsWith("rook")) return "♜";
  if (lower.startsWith("weld")) return "🔗";
  if (lower.startsWith("dorian")) return "🎭";
  if (lower.startsWith("probe-lead")) return "🔭";
  if (lower.startsWith("odin-lead")) return "📚";
  return "●";
}

// ── Campus Map Component ──

export function CampusMap2D({ onAgentClick, onBuildingClick }: CampusMap2DProps) {
  const [states, setStates] = useState<Record<string, AgentStateInfo>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ agent: string; x: number; y: number } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Poll for states every 2 seconds
  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/states", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.states) setStates(data.states);
    } catch {}
  }, []);

  useEffect(() => {
    void poll();
    const id = setInterval(() => void poll(), 2000);
    return () => clearInterval(id);
  }, [poll]);

  // Zoom on wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.3), 8));
  };

  // Pan on drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart(pan);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: panStart.x + (e.clientX - dragStart.x),
        y: panStart.y + (e.clientY - dragStart.y),
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Right-click agent → context menu
  const handleAgentContextMenu = (e: React.MouseEvent, agentName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ agent: agentName, x: e.clientX, y: e.clientY });
  };

  // Close context menu on any click
  useEffect(() => {
    const close = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", close);
      window.addEventListener("contextmenu", close);
      return () => {
        window.removeEventListener("click", close);
        window.removeEventListener("contextmenu", close);
      };
    }
  }, [contextMenu]);

  // Call/Dismiss actions
  const handleCall = (agentName: string) => {
    onAgentClick?.(agentName);
    setContextMenu(null);
  };

  const handleDismiss = (agentName: string) => {
    console.log(`Dismiss ${agentName}`);
    setContextMenu(null);
  };

  // Building click
  const handleBuildingClick = (building: Building) => {
    setSelectedBuilding(building);
    onBuildingClick?.(building);
  };

  // Determine if names should show (based on zoom)
  const showNames = zoom > 2;
  const showSymbols = zoom > 1.2;
  const showAgents = zoom > 0.8;

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Zoom indicator */}
      <div className="absolute left-3 top-3 z-20 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400 backdrop-blur">
        Zoom: {zoom.toFixed(1)}x {showNames ? "· Names" : showSymbols ? "· Symbols" : "· Overview"}
      </div>

      {/* Zoom controls */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
          onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z * 1.3, 8)); }}
        >+</button>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
          onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z / 1.3, 0.3)); }}
        >−</button>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-[9px] text-slate-300 hover:bg-slate-800"
          onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
        >⌂</button>
      </div>

      {/* SVG Campus */}
      <svg
        ref={svgRef}
        className="h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="campus-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        <rect width="100" height="100" fill="url(#campus-bg)" />

        {/* Transform group for zoom/pan */}
        <g
          transform={`translate(${50 + pan.x / 10}, ${50 + pan.y / 10}) scale(${zoom}) translate(${-50}, ${-50})`}
        >
          {/* Concentric ring guides */}
          {RING_RADII.map((r, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={i === 0 ? "#f59e0b30" : "#33415530"}
              strokeWidth={0.15}
              strokeDasharray={i === 0 ? "none" : "0.5,0.5"}
            />
          ))}

          {/* Walkway lines from center to each ring-2 building */}
          {BUILDINGS.filter(b => b.ring === 2).map(b => {
            const pos = polarToCartesian(b.angle, b.radius);
            return (
              <line
                key={`path-${b.id}`}
                x1="50" y1="50"
                x2={pos.x} y2={pos.y}
                stroke="#33415520"
                strokeWidth={0.1}
              />
            );
          })}

          {/* Buildings */}
          {BUILDINGS.map(building => (
            <BuildingShape
              key={building.id}
              building={building}
              states={states}
              showAgents={showAgents}
              showSymbols={showSymbols}
              showNames={showNames}
              onAgentContextMenu={handleAgentContextMenu}
              onBuildingClick={handleBuildingClick}
            />
          ))}
        </g>
      </svg>

      {/* Context menu (Call/Dismiss) */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 min-w-[120px] rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="border-b border-slate-800 px-3 py-1 text-[10px] font-medium text-slate-400">
              @{contextMenu.agent}
            </div>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-amber-300 hover:bg-amber-500/10"
              onClick={() => handleCall(contextMenu.agent)}
            >
              📞 Call to CEO Office
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-slate-400 hover:bg-slate-800"
              onClick={() => handleDismiss(contextMenu.agent)}
            >
              ↩️ Dismiss to desk
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Building info panel */}
      <AnimatePresence>
        {selectedBuilding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-3 left-3 z-20 w-64 rounded-xl border border-slate-700 bg-slate-900/95 p-3 backdrop-blur"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-200">{selectedBuilding.name}</h4>
              <button onClick={() => setSelectedBuilding(null)} className="text-slate-500 hover:text-slate-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1 text-[10px] text-slate-400">
              <div>Tier {selectedBuilding.tier} · {selectedBuilding.department}</div>
              <div>Manager: {selectedBuilding.manager}</div>
              <div>Occupants ({selectedBuilding.occupants.length}):</div>
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedBuilding.occupants.map(name => {
                  const state = states[name]?.state || "idle";
                  return (
                    <span
                      key={name}
                      className="rounded-full px-1.5 py-0.5 text-[8px]"
                      style={{
                        backgroundColor: STATE_COLORS[state] + "20",
                        color: STATE_COLORS[state],
                      }}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Building Shape ──

function BuildingShape({
  building,
  states,
  showAgents,
  showSymbols,
  showNames,
  onAgentContextMenu,
  onBuildingClick,
}: {
  building: Building;
  states: Record<string, AgentStateInfo>;
  showAgents: boolean;
  showSymbols: boolean;
  showNames: boolean;
  onAgentContextMenu: (e: React.MouseEvent, agent: string) => void;
  onBuildingClick: (building: Building) => void;
}) {
  const pos = polarToCartesian(building.angle, building.radius);
  const size = building.size;

  // Shape based on tier
  const shapeProps: Record<string, any> = {
    tower: { rx: size * 0.6, ry: size, strokeWidth: 0.3 },
    hall: { rx: size * 0.9, ry: size * 0.7, strokeWidth: 0.25 },
    hq: { rx: size * 0.8, ry: size * 0.6, strokeWidth: 0.2 },
    team: { rx: size * 0.7, ry: size * 0.5, strokeWidth: 0.15 },
    senior: { rx: size * 0.6, ry: size * 0.4, strokeWidth: 0.1 },
    junior: { rx: size * 0.5, ry: size * 0.35, strokeWidth: 0.08 },
  };

  const sp = shapeProps[building.shape] || shapeProps.hq;

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y})`}
      onClick={(e) => { e.stopPropagation(); onBuildingClick(building); }}
      style={{ cursor: "pointer" }}
    >
      {/* Building outline */}
      <ellipse
        rx={sp.rx}
        ry={sp.ry}
        fill={building.color + "15"}
        stroke={building.color + "80"}
        strokeWidth={sp.strokeWidth}
      />

      {/* Building label (visible at higher zoom) */}
      {showSymbols && (
        <text
          x="0"
          y={sp.ry + 1.5}
          textAnchor="middle"
          fontSize={size * 0.3}
          fill={building.color + "cc"}
          className="pointer-events-none select-none"
        >
          {building.name}
        </text>
      )}

      {/* Agents inside the building */}
      {showAgents && building.occupants.map((agentName, i) => {
        const agentState = states[agentName]?.state || "idle";
        const agentColor = STATE_COLORS[agentState] || STATE_COLORS.idle;
        const symbol = getAgentSymbol(agentName);

        // Position agents in a small grid inside the building
        const cols = Math.ceil(Math.sqrt(building.occupants.length));
        const col = i % cols;
        const row = Math.floor(i / cols);
        const spacing = Math.max(sp.rx / (cols + 1), 0.8);
        const ax = (col - (cols - 1) / 2) * spacing;
        const ay = (row - (Math.ceil(building.occupants.length / cols) - 1) / 2) * spacing;

        return (
          <g
            key={agentName}
            transform={`translate(${ax}, ${ay})`}
            onContextMenu={(e) => onAgentContextMenu(e, agentName)}
            style={{ cursor: "pointer" }}
          >
            {/* Agent dot/symbol */}
            {showSymbols ? (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size * 0.35}
                className="pointer-events-none select-none"
                style={{ filter: STATE_GLOW[agentState] || "none" }}
              >
                {symbol}
              </text>
            ) : (
              <circle
                r={Math.max(size * 0.08, 0.3)}
                fill={agentColor}
                style={{ filter: STATE_GLOW[agentState] || "none" }}
                className={agentState === "active" ? "animate-pulse" : ""}
              />
            )}

            {/* Agent name (visible at high zoom) */}
            {showNames && (
              <text
                x="0"
                y={size * 0.4}
                textAnchor="middle"
                fontSize={size * 0.15}
                fill="#94a3b8"
                className="pointer-events-none select-none"
              >
                {agentName}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
