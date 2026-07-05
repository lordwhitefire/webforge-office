"use client";

import { useRef, useState, useMemo, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { X, ArrowLeft } from "lucide-react";
import { BUILDINGS, type Building } from "@/data/buildings";

// ── Types ──

interface AgentStateInfo {
  state: string;
  task: string | null;
  watching: Array<{ name: string; taskId?: string; retries: number }>;
}

interface SpyCamProps {
  building: Building;
  agentStates: Record<string, AgentStateInfo>;
  onAgentClick?: (agentName: string) => void;
  onExit: () => void;
}

// ── State colors ──

const STATE_COLORS: Record<string, string> = {
  idle: "#64748b",
  active: "#fbbf24",
  waiting: "#3b82f6",
  sleeping: "#475569",
  no_response: "#ef4444",
  done: "#10b981",
};

const STATE_LABELS: Record<string, string> = {
  idle: "Idle",
  active: "Working",
  waiting: "Watching",
  sleeping: "Sleeping",
  no_response: "No Response",
  done: "Done",
};

// ── Agent figure (humanoid at desk) ──

function AgentFigure({
  name,
  state,
  position,
  onAgentClick,
}: {
  name: string;
  state: string;
  position: [number, number, number];
  onAgentClick?: (name: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isActive = state === "active";
  const isSleeping = state === "sleeping";
  const isNoResponse = state === "no_response";

  // Animation: active agents "type" (bob up and down slightly)
  useFrame((clock) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    if (isActive) {
      // Typing animation — slight up/down
      groupRef.current.position.y = position[1] + Math.sin(time * 4) * 0.02;
      // Slight head tilt
      if (groupRef.current.children[1]) {
        (groupRef.current.children[1] as THREE.Mesh).rotation.x = Math.sin(time * 3) * 0.05;
      }
    } else if (isSleeping) {
      // Sleeping — slight breathing
      groupRef.current.position.y = position[1] + Math.sin(time * 1) * 0.01;
    } else if (isNoResponse) {
      // No response — slump forward
      if (groupRef.current.children[1]) {
        (groupRef.current.children[1] as THREE.Mesh).rotation.x = 0.4;
      }
    }
  });

  const color = STATE_COLORS[state] || STATE_COLORS.idle;

  return (
    <group ref={groupRef} position={position}>
      {/* Click area (invisible) */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onAgentClick?.(name); }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "default")}
      >
        <boxGeometry args={[0.6, 1.2, 0.6]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* Body (cylinder) */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.5, 8]} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          emissive={isActive ? color : "#000000"}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>

      {/* Head (sphere) */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          emissive={isActive ? color : "#000000"}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>

      {/* Status indicator above head */}
      {!isSleeping && (
        <Html position={[0, 1.0, 0]} center distanceFactor={5} occlude>
          <div
            style={{
              background: "rgba(15,23,42,0.9)",
              color: color,
              padding: "1px 6px",
              borderRadius: "3px",
              fontSize: "8px",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              border: `1px solid ${color}40`,
              pointerEvents: "none",
            }}
          >
            {isNoResponse ? "❌" : isActive ? "⚙️" : "●"} {name}
          </div>
        </Html>
      )}

      {/* Sleeping Z's */}
      {isSleeping && (
        <Html position={[0, 1.0, 0]} center distanceFactor={5} occlude>
          <div style={{ fontSize: "12px", pointerEvents: "none" }}>💤</div>
        </Html>
      )}

      {/* Desk in front */}
      <mesh position={[0, -0.15, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.05, 0.3]} />
        <meshStandardMaterial color="#3a3a2a" roughness={0.8} />
      </mesh>
      {/* Desk legs */}
      <mesh position={[-0.2, -0.4, 0.3]}>
        <boxGeometry args={[0.04, 0.3, 0.04]} />
        <meshStandardMaterial color="#2a2a1a" />
      </mesh>
      <mesh position={[0.2, -0.4, 0.3]}>
        <boxGeometry args={[0.04, 0.3, 0.04]} />
        <meshStandardMaterial color="#2a2a1a" />
      </mesh>

      {/* Monitor on desk (glows if active) */}
      <mesh position={[0, 0.05, 0.35]}>
        <boxGeometry args={[0.3, 0.2, 0.02]} />
        <meshStandardMaterial
          color={isActive ? "#1e3a5f" : "#1a1a1a"}
          emissive={isActive ? "#3b82f6" : "#000000"}
          emissiveIntensity={isActive ? 0.5 : 0}
        />
      </mesh>

      {/* Chair */}
      <mesh position={[0, -0.25, -0.05]} castShadow>
        <boxGeometry args={[0.25, 0.04, 0.25]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.05, -0.15]}>
        <boxGeometry args={[0.25, 0.35, 0.04]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Room interior ──

function RoomInterior({ building }: { building: Building }) {
  const color = building.color;

  // Room size based on tier
  const roomSize = useMemo(() => {
    switch (building.tier) {
      case 1: return { w: 6, h: 4, d: 6 }; // CEO — large penthouse
      case 2: return { w: 8, h: 3.5, d: 6 }; // Directors — conference hall
      case 3: return { w: 6, h: 3, d: 5 }; // HQ
      case 4: return { w: 5, h: 2.8, d: 4 }; // Team
      case 5: return { w: 4, h: 2.5, d: 3.5 }; // Senior
      case 6: return { w: 3.5, h: 2.5, d: 3 }; // Junior
      default: return { w: 5, h: 3, d: 5 };
    }
  }, [building.tier]);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomSize.w, roomSize.d]} />
        <meshStandardMaterial color="#2a2520" roughness={0.9} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, roomSize.h / 2, -roomSize.d / 2]} receiveShadow>
        <planeGeometry args={[roomSize.w, roomSize.h]} />
        <meshStandardMaterial color={color + "20"} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* Left wall */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-roomSize.w / 2, roomSize.h / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomSize.d, roomSize.h]} />
        <meshStandardMaterial color={color + "15"} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* Right wall */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[roomSize.w / 2, roomSize.h / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomSize.d, roomSize.h]} />
        <meshStandardMaterial color={color + "15"} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* Ceiling */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, roomSize.h, 0]}
      >
        <planeGeometry args={[roomSize.w, roomSize.d]} />
        <meshStandardMaterial color="#1a1a15" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      {/* CEO desk (special for tier 1) */}
      {building.tier === 1 && (
        <mesh position={[0, 0.4, -1.5]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.1, 0.8]} />
          <meshStandardMaterial color="#5a3a20" roughness={0.5} metalness={0.3} />
        </mesh>
      )}

      {/* Conference table for Directors' Hall */}
      {building.tier === 2 && (
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 0.1, 1.2]} />
          <meshStandardMaterial color="#4a3525" roughness={0.6} />
        </mesh>
      )}

      {/* Ceiling lights */}
      <pointLight position={[0, roomSize.h - 0.3, 0]} intensity={0.6} color="#fff8e7" distance={8} />
      <pointLight position={[1, roomSize.h - 0.3, 1]} intensity={0.3} color="#fff8e7" distance={6} />
      <pointLight position={[-1, roomSize.h - 0.3, -1]} intensity={0.3} color="#fff8e7" distance={6} />
    </group>
  );
}

// ── Main Spy Cam Component ──

export function SpyCam({ building, agentStates, onAgentClick, onExit }: SpyCamProps) {
  const occupants = building.occupants;

  // Calculate desk positions in a grid
  const deskPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const cols = Math.min(Math.ceil(Math.sqrt(occupants.length)), 4);
    const rows = Math.ceil(occupants.length / cols);
    const spacing = 1.2;
    const startX = -(cols - 1) * spacing / 2;
    const startZ = -(rows - 1) * spacing / 2;

    for (let i = 0; i < occupants.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push([
        startX + col * spacing,
        0,
        startZ + row * spacing,
      ]);
    }
    return positions;
  }, [occupants.length]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      {/* Header */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800 backdrop-blur"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Exit
        </button>
        <div className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] backdrop-blur">
          <span className="font-bold" style={{ color: building.color }}>
            📹 Spy Cam: {building.name}
          </span>
          <span className="ml-2 text-slate-500">
            {occupants.length} agents · Manager: {building.manager}
          </span>
        </div>
      </div>

      {/* Exit X */}
      <button
        onClick={onExit}
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-slate-400 hover:bg-slate-800"
      >
        <X className="h-4 w-4" />
      </button>

      {/* 3D Interior */}
      <Canvas
        shadows
        camera={{ position: [0, 2.5, 4], fov: 60 }}
        gl={{ antialias: true }}
        style={{ background: `linear-gradient(180deg, #0f172a 0%, ${building.color}10 100%)` }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[2, 5, 2]}
          intensity={0.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-map-size-height={1024}
        />

        <Suspense fallback={null}>
          <RoomInterior building={building} />

          {/* Agent figures at desks */}
          {occupants.map((agentName, i) => {
            const pos = deskPositions[i] || [0, 0, 0];
            const state = agentStates[agentName]?.state || "idle";
            return (
              <AgentFigure
                key={agentName}
                name={agentName}
                state={state}
                position={pos}
                onAgentClick={onAgentClick}
              />
            );
          })}

          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={8}
            maxPolarAngle={Math.PI / 2 - 0.1}
            target={[0, 0.5, 0]}
            makeDefault
          />
        </Suspense>
      </Canvas>

      {/* Status legend */}
      <div className="absolute bottom-3 left-3 z-10 flex gap-3 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 backdrop-blur">
        {Object.entries(STATE_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1 text-[9px]">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: STATE_COLORS[key],
                boxShadow: key === "active" ? `0 0 4px ${STATE_COLORS[key]}` : "none",
              }}
            />
            <span className="text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Agent count summary */}
      <div className="absolute bottom-3 right-3 z-10 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[10px] backdrop-blur">
        {(() => {
          const counts: Record<string, number> = {};
          occupants.forEach(name => {
            const s = agentStates[name]?.state || "idle";
            counts[s] = (counts[s] || 0) + 1;
          });
          return Object.entries(counts).map(([state, count]) => (
            <span key={state} className="mr-2" style={{ color: STATE_COLORS[state] }}>
              {STATE_LABELS[state]}: {count}
            </span>
          ));
        })()}
      </div>
    </div>
  );
}
