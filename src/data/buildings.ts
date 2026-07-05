/**
 * WebForge Campus — Building Configuration
 *
 * Circular campus layout: 6 concentric rings radiating from center.
 *
 * Ring 0 (center):    CEO Tower (1 building)
 * Ring 1:             Directors' Hall (1 building)
 * Ring 2:             Department HQs (6 buildings — one per department)
 * Ring 3:             Team Buildings (14 buildings)
 * Ring 4:             Senior Buildings (12 buildings)
 * Ring 5 (outer):     Junior Buildings (10 buildings — grouped clusters)
 *
 * Total: 44 buildings
 *
 * Each building has:
 *   - id: unique identifier
 *   - tier: 1-6 (1=CEO, 6=Juniors)
 *   - name: building name
 *   - manager: who runs this building
 *   - occupants: list of agent names inside
 *   - department: which department
 *   - color: hex color for the building
 *   - ring: which concentric ring (0-5)
 *   - angle: position on the ring (degrees, 0=top, clockwise)
 *   - radius: distance from center (in ring units)
 */

export type BuildingTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface Building {
  id: string;
  tier: BuildingTier;
  name: string;
  manager: string;
  occupants: string[];
  department: string;
  color: string;
  ring: number;        // 0-5
  angle: number;       // degrees, 0=top, clockwise
  radius: number;      // distance from center in % of canvas
  size: number;        // building size in % of canvas
  shape: "tower" | "hall" | "hq" | "team" | "senior" | "junior";
}

// ── Department colors ──

export const DEPT_COLORS: Record<string, string> = {
  executive: "#f59e0b",      // amber/gold
  hr: "#ec4899",             // pink
  meta: "#8b5cf6",           // purple
  intelligence: "#3b82f6",   // blue
  build: "#10b981",          // emerald
  quality: "#ef4444",        // red
  documentation: "#06b6d4",  // cyan
};

// ── Ring radii (in % from center) ──

export const RING_RADII = [0, 12, 24, 36, 44, 50];

// ── Building definitions ──

export const BUILDINGS: Building[] = [
  // ── Ring 0: CEO Tower (center) ──
  {
    id: "b-ceo",
    tier: 1,
    name: "CEO Tower",
    manager: "CEO",
    occupants: ["CEO"],
    department: "executive",
    color: DEPT_COLORS.executive,
    ring: 0,
    angle: 0,
    radius: RING_RADII[0],
    size: 8,
    shape: "tower",
  },

  // ── Ring 1: Directors' Hall ──
  {
    id: "b-directors",
    tier: 2,
    name: "Directors' Hall",
    manager: "Hermes",
    occupants: ["Hermes", "Athena", "Hephaestus", "Minos", "Thoth", "Voss", "Daedalus"],
    department: "executive",
    color: "#a78bfa",
    ring: 1,
    angle: 0,
    radius: RING_RADII[1],
    size: 10,
    shape: "hall",
  },

  // ── Ring 2: Department HQs (6 buildings, evenly spaced) ──
  {
    id: "b-hq-exec",
    tier: 3,
    name: "Executive HQ",
    manager: "Hermes",
    occupants: ["Hermes"],
    department: "executive",
    color: DEPT_COLORS.executive,
    ring: 2,
    angle: 0,
    radius: RING_RADII[2],
    size: 6,
    shape: "hq",
  },
  {
    id: "b-hq-intel",
    tier: 3,
    name: "Intelligence HQ",
    manager: "Athena",
    occupants: ["Athena", "Probe-Lead", "Odin-Lead", "Dorian"],
    department: "intelligence",
    color: DEPT_COLORS.intelligence,
    ring: 2,
    angle: 60,
    radius: RING_RADII[2],
    size: 6,
    shape: "hq",
  },
  {
    id: "b-hq-build",
    tier: 3,
    name: "Build HQ",
    manager: "Hephaestus",
    occupants: ["Hephaestus", "Aurora", "Titan", "Zephyr"],
    department: "build",
    color: DEPT_COLORS.build,
    ring: 2,
    angle: 120,
    radius: RING_RADII[2],
    size: 6,
    shape: "hq",
  },
  {
    id: "b-hq-quality",
    tier: 3,
    name: "Quality HQ",
    manager: "Minos",
    occupants: ["Minos", "Scalpel-Core", "Janus-Core", "Pulse-Core", "Sentry-Core", "Pixel-Core"],
    department: "quality",
    color: DEPT_COLORS.quality,
    ring: 2,
    angle: 180,
    radius: RING_RADII[2],
    size: 6,
    shape: "hq",
  },
  {
    id: "b-hq-docs",
    tier: 3,
    name: "Documentation HQ",
    manager: "Thoth",
    occupants: ["Thoth", "Quill", "Scroll", "Stamp", "Ledger", "Draft"],
    department: "documentation",
    color: DEPT_COLORS.documentation,
    ring: 2,
    angle: 240,
    radius: RING_RADII[2],
    size: 6,
    shape: "hq",
  },
  {
    id: "b-hq-meta",
    tier: 3,
    name: "Meta Engineering HQ",
    manager: "Daedalus",
    occupants: ["Daedalus", "Forge", "Anvil", "Loom", "Compass", "Voss", "Rook", "Weld"],
    department: "meta",
    color: DEPT_COLORS.meta,
    ring: 2,
    angle: 300,
    radius: RING_RADII[2],
    size: 6,
    shape: "hq",
  },

  // ── Ring 3: Team Buildings (14 buildings) ──
  // Build: Frontend (Aurora), Backend (Titan), DB/Infra (Zephyr) + their leads
  {
    id: "b-team-frontend",
    tier: 4,
    name: "Frontend Team",
    manager: "Aurora",
    occupants: ["Aurora", "Lead-Faro"],
    department: "build",
    color: DEPT_COLORS.build,
    ring: 3,
    angle: 110,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  {
    id: "b-team-backend",
    tier: 4,
    name: "Backend Team",
    manager: "Titan",
    occupants: ["Titan", "Lead-Terra"],
    department: "build",
    color: DEPT_COLORS.build,
    ring: 3,
    angle: 120,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  {
    id: "b-team-dbinfra",
    tier: 4,
    name: "DB/Infra Team",
    manager: "Zephyr",
    occupants: ["Zephyr", "Lead-Zen"],
    department: "build",
    color: DEPT_COLORS.build,
    ring: 3,
    angle: 130,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  // Intelligence: Probe team, Odin team
  {
    id: "b-team-probe",
    tier: 4,
    name: "Probe Team",
    manager: "Probe-Lead",
    occupants: ["Probe-Lead"],
    department: "intelligence",
    color: DEPT_COLORS.intelligence,
    ring: 3,
    angle: 50,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  {
    id: "b-team-odin",
    tier: 4,
    name: "Odin Team",
    manager: "Odin-Lead",
    occupants: ["Odin-Lead"],
    department: "intelligence",
    color: DEPT_COLORS.intelligence,
    ring: 3,
    angle: 70,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  // Quality: 5 core teams + Verdict
  {
    id: "b-team-scalpel",
    tier: 4,
    name: "Code Review Team",
    manager: "Scalpel-Core",
    occupants: ["Scalpel-Core"],
    department: "quality",
    color: DEPT_COLORS.quality,
    ring: 3,
    angle: 170,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  {
    id: "b-team-pulse",
    tier: 4,
    name: "Testing Team",
    manager: "Pulse-Core",
    occupants: ["Pulse-Core"],
    department: "quality",
    color: DEPT_COLORS.quality,
    ring: 3,
    angle: 175,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  {
    id: "b-team-sentry",
    tier: 4,
    name: "Security Team",
    manager: "Sentry-Core",
    occupants: ["Sentry-Core"],
    department: "quality",
    color: DEPT_COLORS.quality,
    ring: 3,
    angle: 180,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  {
    id: "b-team-pixel",
    tier: 4,
    name: "Visual Testing Team",
    manager: "Pixel-Core",
    occupants: ["Pixel-Core"],
    department: "quality",
    color: DEPT_COLORS.quality,
    ring: 3,
    angle: 185,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  {
    id: "b-team-janus",
    tier: 4,
    name: "Compliance Team",
    manager: "Janus-Core",
    occupants: ["Janus-Core"],
    department: "quality",
    color: DEPT_COLORS.quality,
    ring: 3,
    angle: 190,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  {
    id: "b-team-verdict",
    tier: 4,
    name: "Standards Team",
    manager: "Minos",
    occupants: ["Verdict-Brook"],
    department: "quality",
    color: DEPT_COLORS.quality,
    ring: 3,
    angle: 195,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  // Documentation: 3 teams
  {
    id: "b-team-quill",
    tier: 4,
    name: "Core Docs Team",
    manager: "Quill",
    occupants: ["Quill"],
    department: "documentation",
    color: DEPT_COLORS.documentation,
    ring: 3,
    angle: 230,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  {
    id: "b-team-memory",
    tier: 4,
    name: "Memory Team",
    manager: "Thoth",
    occupants: ["Scroll", "Ledger"],
    department: "documentation",
    color: DEPT_COLORS.documentation,
    ring: 3,
    angle: 240,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },
  {
    id: "b-team-draft",
    tier: 4,
    name: "Drafting Team",
    manager: "Draft",
    occupants: ["Draft", "Stamp"],
    department: "documentation",
    color: DEPT_COLORS.documentation,
    ring: 3,
    angle: 250,
    radius: RING_RADII[3],
    size: 5,
    shape: "team",
  },

  // ── Ring 4: Senior Buildings (12 buildings — 4 frontend + 4 backend + 4 db) ──
  // Frontend seniors (near Frontend Team building)
  ...seniorBuilding("sr-hale", "Sr-Hale", "build", 100, ["Sr-Hale"]),
  ...seniorBuilding("sr-vance", "Sr-Vance", "build", 105, ["Sr-Vance"]),
  ...seniorBuilding("sr-brook", "Sr-Brook", "build", 110, ["Sr-Brook"]),
  ...seniorBuilding("sr-quill2", "Sr-Quill2", "build", 115, ["Sr-Quill2"]),
  // Backend seniors
  ...seniorBuilding("sr-stone", "Sr-Stone", "build", 120, ["Sr-Stone"]),
  ...seniorBuilding("sr-iron", "Sr-Iron", "build", 125, ["Sr-Iron"]),
  ...seniorBuilding("sr-earth", "Sr-Earth", "build", 130, ["Sr-Earth"]),
  ...seniorBuilding("sr-cloud", "Sr-Cloud", "build", 135, ["Sr-Cloud"]),
  // DB/Infra seniors
  ...seniorBuilding("sr-water", "Sr-Water", "build", 140, ["Sr-Water"]),
  ...seniorBuilding("sr-wood", "Sr-Wood", "build", 145, ["Sr-Wood"]),
  ...seniorBuilding("sr-fire", "Sr-Fire", "build", 150, ["Sr-Fire"]),
  ...seniorBuilding("sr-steel", "Sr-Steel", "build", 155, ["Sr-Steel"]),

  // ── Ring 5: Junior Buildings (10 clusters — grouped by senior) ──
  ...juniorBuilding("jr-hale", "Jr-Hale Team", "build", 98, ["Jr-Hawk", "Jr-Finch", "Jr-Wisp", "Jr-Cole", "Jr-Reed"]),
  ...juniorBuilding("jr-vance", "Jr-Vance Team", "build", 103, ["Jr-Sage", "Jr-Birch", "Jr-Pike", "Jr-Moss"]),
  ...juniorBuilding("jr-brook", "Jr-Brook Team", "build", 108, ["Jr-Cliff", "Jr-Fern", "Jr-Slate", "Jr-Wren"]),
  ...juniorBuilding("jr-quill2", "Jr-Quill2 Team", "build", 113, ["Jr-Cove", "Jr-Bram", "Jr-Talon", "Jr-Aster"]),
  ...juniorBuilding("jr-stone", "Jr-Stone Team", "build", 118, ["Jr-Granite", "Jr-Slate", "Jr-Marble", "Jr-Quartz"]),
  ...juniorBuilding("jr-iron", "Jr-Iron Team", "build", 123, ["Jr-Copper", "Jr-Bronze", "Jr-Silver", "Jr-Gold"]),
  ...juniorBuilding("jr-earth", "Jr-Earth Team", "build", 128, ["Jr-Oak", "Jr-Pine", "Jr-Cedar", "Jr-Birch"]),
  ...juniorBuilding("jr-cloud", "Jr-Cloud Team", "build", 133, ["Jr-Titan", "Jr-Vanadium", "Jr-Chromium", "Jr-Nickel", "Jr-Cobalt"]),
  ...juniorBuilding("jr-water", "Jr-Water Team", "build", 138, ["Jr-Ash", "Jr-Nickel"]),
  ...juniorBuilding("jr-wood-fire-steel", "Jr-Wood/Fire/Steel Team", "build", 148, ["Jr-Coal", "Jr-Ember", "Jr-Flame"]),
].flat();

// ── Helper functions to generate building configs ──

function seniorBuilding(
  id: string,
  name: string,
  department: string,
  angle: number,
  occupants: string[],
): Building[] {
  return [{
    id: `b-${id}`,
    tier: 5,
    name: `${name} Office`,
    manager: name,
    occupants,
    department,
    color: DEPT_COLORS[department] || "#64748b",
    ring: 4,
    angle,
    radius: RING_RADII[4],
    size: 3.5,
    shape: "senior",
  }];
}

function juniorBuilding(
  id: string,
  name: string,
  department: string,
  angle: number,
  occupants: string[],
): Building[] {
  return [{
    id: `b-${id}`,
    tier: 6,
    name: `${name}`,
    manager: occupants[0] || "Unknown",
    occupants,
    department,
    color: DEPT_COLORS[department] || "#64748b",
    ring: 5,
    angle,
    radius: RING_RADII[5],
    size: 3,
    shape: "junior",
  }];
}

// ── Helper: convert polar to cartesian ──

export function polarToCartesian(angleDeg: number, radiusPct: number, centerPct: number = 50): { x: number; y: number } {
  const rad = (angleDeg - 90) * Math.PI / 180; // -90 so 0 = top
  return {
    x: centerPct + radiusPct * Math.cos(rad),
    y: centerPct + radiusPct * Math.sin(rad),
  };
}

// ── Get building by id ──

export function getBuildingById(id: string): Building | undefined {
  return BUILDINGS.find(b => b.id === id);
}

// ── Get buildings by ring ──

export function getBuildingsByRing(ring: number): Building[] {
  return BUILDINGS.filter(b => b.ring === ring);
}

// ── Get all agents with their building ──

export function getAgentBuilding(agentName: string): Building | undefined {
  return BUILDINGS.find(b => b.occupants.includes(agentName));
}
