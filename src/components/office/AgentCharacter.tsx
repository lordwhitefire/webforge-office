"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DEPARTMENTS, type AgentStatus } from "./types";

interface AgentCharacterProps {
  name: string;
  department: keyof typeof DEPARTMENTS;
  role: string;
  x: number;
  y: number;
  status: AgentStatus;
  walking: boolean;
  atCeo: boolean;
  thinking: boolean;
  onClick: () => void;
}

const statusColors: Record<AgentStatus, string> = {
  idle: "bg-emerald-500",
  working: "bg-yellow-500 animate-pulse",
  blocked: "bg-red-500",
  has_notification: "bg-blue-500",
};

const statusRing: Record<AgentStatus, string> = {
  idle: "ring-emerald-500/40",
  working: "ring-yellow-500/50",
  blocked: "ring-red-500/50",
  has_notification: "ring-blue-500/50",
};

export function AgentCharacter({
  name,
  department,
  role,
  x,
  y,
  status,
  walking,
  atCeo,
  thinking,
  onClick,
}: AgentCharacterProps) {
  const dept = DEPARTMENTS[department];

  return (
    <motion.div
      className="absolute z-10 cursor-pointer select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ left: `${x}%`, top: `${y}%` }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      onClick={onClick}
      whileHover={{ scale: 1.15, zIndex: 20 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative flex flex-col items-center">
        {/* Status dot */}
        <div
          className={cn(
            "absolute -right-1 -top-1 z-10 h-3 w-3 rounded-full ring-2 ring-slate-950",
            statusColors[status],
            statusRing[status]
          )}
        />

        {/* Avatar */}
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg transition-shadow",
            walking && "animate-bounce",
            thinking && "ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-950"
          )}
          style={{
            background: `linear-gradient(135deg, ${dept.hex}cc, ${dept.hex}66)`,
            border: `2px solid ${dept.hex}`,
          }}
        >
          {name.charAt(0)}
        </div>

        {/* Name + role */}
        <div className="mt-1 max-w-[80px] text-center">
          <div className="text-[10px] font-semibold text-slate-200 leading-tight">
            {name}
          </div>
          <div className="text-[8px] text-slate-500 leading-tight truncate">
            {role}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
