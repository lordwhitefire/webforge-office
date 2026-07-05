"use client";

/**
 * Types for the WebForge office.
 * Departments, featured agents, room positions.
 */

export type AgentStatus =
  | "idle"
  | "working"
  | "blocked"
  | "has_notification";

export type DepartmentId =
  | "executive"
  | "hr"
  | "meta"
  | "intelligence"
  | "build"
  | "quality"
  | "documentation";

export interface Department {
  id: DepartmentId;
  label: string;
  hex: string;
  /** Room rect on the floor, in % of total floor. */
  room: { left: number; top: number; width: number; height: number };
}

export const DEPARTMENTS: Record<DepartmentId, Department> = {
  executive: {
    id: "executive",
    label: "Executive",
    hex: "#f59e0b",
    room: { left: 35, top: 2, width: 30, height: 20 },
  },
  hr: {
    id: "hr",
    label: "HR",
    hex: "#ec4899",
    room: { left: 2, top: 2, width: 28, height: 20 },
  },
  meta: {
    id: "meta",
    label: "Meta Engineering",
    hex: "#8b5cf6",
    room: { left: 70, top: 2, width: 28, height: 20 },
  },
  intelligence: {
    id: "intelligence",
    label: "Intelligence",
    hex: "#3b82f6",
    room: { left: 2, top: 30, width: 28, height: 25 },
  },
  build: {
    id: "build",
    label: "Build",
    hex: "#10b981",
    room: { left: 35, top: 30, width: 30, height: 25 },
  },
  quality: {
    id: "quality",
    label: "Quality",
    hex: "#ef4444",
    room: { left: 70, top: 30, width: 28, height: 25 },
  },
  documentation: {
    id: "documentation",
    label: "Documentation",
    hex: "#06b6d4",
    room: { left: 25, top: 65, width: 50, height: 20 },
  },
};

export interface FeaturedAgent {
  name: string;
  department: DepartmentId;
  role: string;
}

/** The agents shown on the office floor (directors + key leads). */
export const FEATURED_AGENTS: FeaturedAgent[] = [
  { name: "Hermes", department: "executive", role: "COO / Coordinator" },
  { name: "Voss", department: "hr", role: "HR Director" },
  { name: "Daedalus", department: "meta", role: "Meta Engineering Director" },
  { name: "Athena", department: "intelligence", role: "Intelligence Director" },
  { name: "Hephaestus", department: "build", role: "Build Director" },
  { name: "Minos", department: "quality", role: "Quality Director" },
  { name: "Thoth", department: "documentation", role: "Documentation Director" },
];

/** CEO office position — where agents walk to when talked to. */
export const CEO_OFFICE_SPOT = { x: 50, y: 12 };

/**
 * Slot position for an agent inside their department room.
 * i=0 → top-left, spreads in a small cluster.
 */
export function agentSlotPosition(i: number, total: number) {
  if (total <= 1) return { x: 50, y: 50 };
  const cols = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const xSpacing = 80 / Math.max(cols - 1, 1);
  const ySpacing = 60 / Math.max(rows - 1, 1);
  return {
    x: 15 + col * xSpacing,
    y: 25 + row * ySpacing,
  };
}
