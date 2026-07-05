"use client";

import { DEPARTMENTS } from "./types";
import { AgentCharacter } from "./AgentCharacter";
import { useOfficeStore } from "./store";

interface OfficeFloorProps {
  onAgentClick: (name: string) => void;
}

export function OfficeFloor({ onAgentClick }: OfficeFloorProps) {
  const agents = useOfficeStore((s) => s.agents);

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
      {/* Floor grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #334155 1px, transparent 1px),
            linear-gradient(to bottom, #334155 1px, transparent 1px)
          `,
          backgroundSize: "5% 5%",
        }}
      />

      {/* Department rooms */}
      {(Object.keys(DEPARTMENTS) as Array<keyof typeof DEPARTMENTS>).map((deptId) => {
        const dept = DEPARTMENTS[deptId];
        return (
          <div
            key={deptId}
            className="absolute rounded-lg border-2 border-dashed"
            style={{
              left: `${dept.room.left}%`,
              top: `${dept.room.top}%`,
              width: `${dept.room.width}%`,
              height: `${dept.room.height}%`,
              borderColor: `${dept.hex}40`,
              background: `${dept.hex}08`,
            }}
          >
            <div
              className="absolute left-2 top-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: dept.hex }}
            >
              {dept.label}
            </div>
          </div>
        );
      })}

      {/* CEO Office marker */}
      <div className="absolute z-5 left-[44%] top-[8%] flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500/60 bg-amber-500/10">
        <div className="text-center">
          <div className="text-lg">👑</div>
          <div className="text-[8px] font-bold text-amber-300">CEO</div>
        </div>
      </div>

      {/* Agents */}
      {agents.map((agent) => (
        <AgentCharacter
          key={agent.name}
          name={agent.name}
          department={agent.department}
          role={agent.role}
          x={agent.x}
          y={agent.y}
          status={agent.status}
          walking={agent.walking}
          atCeo={agent.atCeo}
          thinking={agent.thinking}
          onClick={() => onAgentClick(agent.name)}
        />
      ))}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-[9px]">
        <LegendDot color="bg-emerald-500" label="idle" />
        <LegendDot color="bg-yellow-500" label="working" />
        <LegendDot color="bg-red-500" label="blocked" />
        <LegendDot color="bg-blue-500" label="notification" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-slate-400">{label}</span>
    </div>
  );
}
