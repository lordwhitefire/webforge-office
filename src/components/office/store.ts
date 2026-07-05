"use client";

/**
 * Zustand store for the WebForge office.
 *
 * Holds:
 *   - agents: the featured roster + their runtime status & position
 *   - chat: messages per agent
 *   - notifications: unread messages (drives blue dots)
 *   - tasks: the Kanban board
 *   - runs: recent agent execution runs
 *   - ui: which agent is "at" the CEO office (active chat), standup modal, etc.
 */

import { create } from "zustand";
import {
  DEPARTMENTS,
  FEATURED_AGENTS,
  agentSlotPosition,
  CEO_OFFICE_SPOT,
  type AgentStatus,
  type DepartmentId,
} from "./types";

export interface OfficeAgent {
  name: string;
  department: DepartmentId;
  role: string;
  x: number;
  y: number;
  status: AgentStatus;
  walking: boolean;
  atCeo: boolean;
  thinking: boolean;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  agent: string;
  role: "user" | "agent" | "system";
  text: string;
  timestamp: number;
}

export interface OfficeTask {
  id: string;
  title: string;
  type: string;
  area?: string;
  effort: string;
  status: "backlog" | "todo" | "doing" | "done" | "blocked";
  owner?: string | null;
  block_reason?: string;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface OfficeMessage {
  id: string;
  parent_id?: string | null;
  from_agent: string;
  to_agent: string;
  type: string;
  subject: string;
  body: string;
  task_id?: string | null;
  priority: number;
  created_at: string;
  status: string;
}

export interface OfficeRun {
  id: string;
  task_id?: string | null;
  agent: string;
  pid?: number | null;
  status: string;
  started_at: string;
  ended_at?: string | null;
  exit_code?: number | null;
  error?: string | null;
}

interface OfficeState {
  agents: OfficeAgent[];
  chat: Record<string, ChatMessage[]>;
  tasks: OfficeTask[];
  messages: OfficeMessage[];
  runs: OfficeRun[];
  activeAgent: string | null;
  standupOpen: boolean;
  standupOutput: string;
  standupLoading: boolean;
  ceoMessage: string;
  lastPoll: number;
  reaperSummary: unknown | null;

  initAgents: () => void;
  setActiveAgent: (name: string | null) => void;
  sendToCeo: (name: string) => void;
  returnHome: (name: string) => void;
  setAgentStatus: (name: string, status: AgentStatus) => void;
  setThinking: (name: string, thinking: boolean) => void;
  addChatMessage: (agent: string, msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearChat: (agent: string) => void;
  setTasks: (tasks: OfficeTask[]) => void;
  setMessages: (messages: OfficeMessage[]) => void;
  setRuns: (runs: OfficeRun[]) => void;
  setCeoMessage: (msg: string) => void;
  openStandup: () => void;
  closeStandup: () => void;
  setStandupOutput: (out: string, loading: boolean) => void;
  setLastPoll: (t: number) => void;
  setReaperSummary: (s: unknown | null) => void;
}

function buildInitialAgents(): OfficeAgent[] {
  const byDept: Record<DepartmentId, typeof FEATURED_AGENTS> = {
    executive: [],
    hr: [],
    meta: [],
    intelligence: [],
    build: [],
    quality: [],
    documentation: [],
  };
  for (const a of FEATURED_AGENTS) {
    byDept[a.department].push(a);
  }

  const agents: OfficeAgent[] = [];
  for (const deptId of Object.keys(byDept) as DepartmentId[]) {
    const deptAgents = byDept[deptId];
    const room = DEPARTMENTS[deptId].room;
    for (let i = 0; i < deptAgents.length; i++) {
      const slot = agentSlotPosition(i, deptAgents.length);
      const x = room.left + (slot.x / 100) * room.width;
      const y = room.top + (slot.y / 100) * room.height;
      agents.push({
        name: deptAgents[i].name,
        department: deptId,
        role: deptAgents[i].role,
        x,
        y,
        status: "idle",
        walking: false,
        atCeo: false,
        thinking: false,
        updatedAt: Date.now(),
      });
    }
  }
  return agents;
}

let msgCounter = 0;
function nextId(): string {
  msgCounter += 1;
  return `m-${Date.now()}-${msgCounter}`;
}

export const useOfficeStore = create<OfficeState>((set, get) => ({
  agents: [],
  chat: {},
  tasks: [],
  messages: [],
  runs: [],
  activeAgent: null,
  standupOpen: false,
  standupOutput: "",
  standupLoading: false,
  ceoMessage: "",
  lastPoll: 0,
  reaperSummary: null,

  initAgents: () => {
    if (get().agents.length > 0) return;
    set({ agents: buildInitialAgents() });
  },

  setActiveAgent: (name) => set({ activeAgent: name }),

  sendToCeo: (name) => {
    set((s) => ({
      agents: s.agents.map((a) =>
        a.name === name
          ? {
              ...a,
              x: CEO_OFFICE_SPOT.x + (Math.random() * 6 - 3),
              y: CEO_OFFICE_SPOT.y + 6,
              walking: true,
              atCeo: true,
              status: a.status === "blocked" ? "blocked" : "idle",
            }
          : a
      ),
      activeAgent: name,
    }));
    setTimeout(() => {
      set((s) => ({
        agents: s.agents.map((a) =>
          a.name === name ? { ...a, walking: false } : a
        ),
      }));
    }, 550);
  },

  returnHome: (name) => {
    const agent = get().agents.find((a) => a.name === name);
    if (!agent) return;
    const deptAgents = FEATURED_AGENTS.filter((f) => f.department === agent.department);
    const idx = deptAgents.findIndex((f) => f.name === name);
    if (idx < 0) return;
    const slot = agentSlotPosition(idx, deptAgents.length);
    const room = DEPARTMENTS[agent.department].room;
    const x = room.left + (slot.x / 100) * room.width;
    const y = room.top + (slot.y / 100) * room.height;

    set((s) => ({
      agents: s.agents.map((a) =>
        a.name === name
          ? { ...a, x, y, walking: true, atCeo: false, thinking: false }
          : a
      ),
    }));
    setTimeout(() => {
      set((s) => ({
        agents: s.agents.map((a) =>
          a.name === name ? { ...a, walking: false } : a
        ),
      }));
    }, 550);
  },

  setAgentStatus: (name, status) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.name === name ? { ...a, status, updatedAt: Date.now() } : a
      ),
    })),

  setThinking: (name, thinking) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.name === name ? { ...a, thinking, status: thinking ? "working" : a.status === "working" ? "idle" : a.status } : a
      ),
    })),

  addChatMessage: (agent, msg) =>
    set((s) => {
      const list = s.chat[agent] ?? [];
      return {
        chat: {
          ...s.chat,
          [agent]: [...list, { ...msg, id: nextId(), timestamp: Date.now() }],
        },
      };
    }),

  clearChat: (agent) =>
    set((s) => ({
      chat: { ...s.chat, [agent]: [] },
    })),

  setTasks: (tasks) => set({ tasks }),

  setMessages: (messages) => {
    const agentNames = new Set(messages.map((m) => m.to_agent));
    set((s) => ({
      messages,
      agents: s.agents.map((a) => {
        const hasNotif = agentNames.has(a.name);
        let status: AgentStatus = a.status;
        if (a.thinking) status = "working";
        else if (hasNotif) status = "has_notification";
        else if (a.status === "has_notification") status = "idle";
        return { ...a, status };
      }),
    }));
  },

  setRuns: (runs) => set({ runs }),

  setCeoMessage: (msg) => set({ ceoMessage: msg }),

  openStandup: () => set({ standupOpen: true }),
  closeStandup: () => set({ standupOpen: false }),
  setStandupOutput: (out, loading) =>
    set({ standupOutput: out, standupLoading: loading }),

  setLastPoll: (t) => set({ lastPoll: t }),

  setReaperSummary: (s) => set({ reaperSummary: s }),
}));
