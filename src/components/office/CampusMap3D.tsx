"use client";

import { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html, RoundedBox, Cylinder, Sphere, Plane } from "@react-three/drei";
import * as THREE from "three";
import { BUILDINGS, RING_RADII, polarToCartesian, DEPT_COLORS, type Building } from "@/data/buildings";

// ── Types ──

interface AgentStateInfo {
  state: string;
  task: string | null;
  watching: Array<{ name: string; taskId?: string; retries: number }>;
}

interface CampusMap3DProps {
  agentStates: Record<string, AgentStateInfo>;
  onAgentClick?: (agentName: string) => void;
  onBuildingClick?: (building: Building) => void;
}

// ── Convert polar to 3D position (top-down, y=up) ──

function polarToCartesian3D(angleDeg: number, radiusPct: number): [number, number, number] {
  const rad = (angleDeg - 90) * Math.PI / 180;
  const scale = 0.4; // scale from % to world units
  return [
    radiusPct * scale * Math.cos(rad),
    0,
    radiusPct * scale * Math.sin(rad),
  ];
}

// ── Ground Plane ──

function Ground() {
  return (
    <>
      {/* Grass plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[25, 64]} />
        <meshStandardMaterial color="#1a2e1a" roughness={0.9} />
      </mesh>

      {/* Ring paths (walkways) */}
      {RING_RADII.map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001 * (i + 1), 0]}>
          <ringGeometry args={[r * 0.4 - 0.05, r * 0.4 + 0.05, 64]} />
          <meshStandardMaterial color="#2a3a2a" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Radial paths from center to ring 2 */}
      {BUILDINGS.filter(b => b.ring === 2).map(b => {
        const [x, , z] = polarToCartesian3D(b.angle, b.radius);
        const angle = Math.atan2(z, x);
        const length = Math.sqrt(x * x + z * z);
        return (
          <mesh
            key={`path-${b.id}`}
            rotation={[-Math.PI / 2, 0, angle]}
            position={[x / 2, 0.002, z / 2]}
          >
            <planeGeometry args={[length, 0.15]} />
            <meshStandardMaterial color="#2a3a2a" transparent opacity={0.2} />
          </mesh>
        );
      })}
    </>
  );
}

// ── Building 3D ──

function Building3D({
  building,
  states,
  onBuildingClick,
}: {
  building: Building;
  states: Record<string, AgentStateInfo>;
  onBuildingClick?: (b: Building) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [x, y, z] = polarToCartesian3D(building.angle, building.radius);

  // Building dimensions based on tier
  const dims = useMemo(() => {
    switch (building.tier) {
      case 1: return { w: 1.5, h: 4, d: 1.5, color: building.color }; // CEO Tower — tall
      case 2: return { w: 3, h: 2.5, d: 2, color: building.color };   // Directors' Hall — wide
      case 3: return { w: 1.8, h: 2, d: 1.5, color: building.color }; // HQ
      case 4: return { w: 1.3, h: 1.5, d: 1, color: building.color };  // Team
      case 5: return { w: 0.9, h: 1, d: 0.7, color: building.color };  // Senior
      case 6: return { w: 0.7, h: 0.8, d: 0.5, color: building.color }; // Junior
      default: return { w: 1, h: 1, d: 1, color: building.color };
    }
  }, [building.tier, building.color]);

  // Count active agents
  const activeAgents = building.occupants.filter(a => states[a]?.state === "active").length;
  const sleepingAgents = building.occupants.filter(a => states[a]?.state === "sleeping").length;

  return (
    <group position={[x, 0, z]}>
      {/* Building body */}
      <mesh
        position={[0, dims.h / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onBuildingClick?.(building); }}
      >
        <boxGeometry args={[dims.w, dims.h, dims.d]} />
        <meshStandardMaterial
          color={hovered ? dims.color : dims.color + "80"}
          roughness={0.6}
          metalness={0.2}
          emissive={activeAgents > 0 ? dims.color : "#000000"}
          emissiveIntensity={activeAgents > 0 ? 0.15 : 0}
        />
      </mesh>

      {/* CEO Tower — spire on top */}
      {building.tier === 1 && (
        <>
          <mesh position={[0, dims.h + 0.8, 0]}>
            <coneGeometry args={[0.3, 1.5, 4]} />
            <meshStandardMaterial color={building.color} emissive={building.color} emissiveIntensity={0.3} />
          </mesh>
          {/* Beacon light */}
          <pointLight position={[0, dims.h + 1.5, 0]} color={building.color} intensity={2} distance={8} />
        </>
      )}

      {/* Directors' Hall — dome */}
      {building.tier === 2 && (
        <mesh position={[0, dims.h, 0]}>
          <sphereGeometry args={[dims.w / 2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={building.color + "60"} metalness={0.5} roughness={0.3} />
        </mesh>
      )}

      {/* Windows (glow if agents active) */}
      {activeAgents > 0 && (
        <mesh position={[0, dims.h * 0.6, dims.d / 2 + 0.01]}>
          <planeGeometry args={[dims.w * 0.7, dims.h * 0.4]} />
          <meshStandardMaterial
            color={building.color}
            emissive={building.color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Building label (hover or close) */}
      <Html
        position={[0, dims.h + 0.5, 0]}
        center
        distanceFactor={10}
        occlude
      >
        <div
          style={{
            background: "rgba(15,23,42,0.9)",
            color: building.color,
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: "bold",
            whiteSpace: "nowrap",
            border: `1px solid ${building.color}40`,
            pointerEvents: "none",
          }}
        >
          {building.name}
          {activeAgents > 0 && <span style={{ color: "#fbbf24", marginLeft: "4px" }}>●{activeAgents}</span>}
          {sleepingAgents > 0 && <span style={{ color: "#64748b", marginLeft: "4px" }}>💤{sleepingAgents}</span>}
        </div>
      </Html>

      {/* Agent figures inside (visible when close — represented as small spheres) */}
      {building.occupants.slice(0, 8).map((agentName, i) => {
        const agentState = states[agentName]?.state || "idle";
        const stateColors: Record<string, string> = {
          idle: "#64748b",
          active: "#fbbf24",
          waiting: "#3b82f6",
          sleeping: "#475569",
          no_response: "#ef4444",
          done: "#10b981",
        };
        const col = i % 4;
        const row = Math.floor(i / 4);
        const ax = (col - 1.5) * 0.25;
        const az = (row - 0.5) * 0.25;
        return (
          <mesh key={agentName} position={[ax, 0.15, az]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color={stateColors[agentState] || stateColors.idle}
              emissive={agentState === "active" ? stateColors.active : "#000000"}
              emissiveIntensity={agentState === "active" ? 0.5 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Camera Controller (WASD + mouse) ──

function CameraController() {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const speed = 0.08;

  // Keyboard input
  useMemo(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame(() => {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    if (keys.current["w"] || keys.current["arrowup"]) {
      camera.position.addScaledVector(forward, speed);
    }
    if (keys.current["s"] || keys.current["arrowdown"]) {
      camera.position.addScaledVector(forward, -speed);
    }
    if (keys.current["a"] || keys.current["arrowleft"]) {
      camera.position.addScaledVector(right, -speed);
    }
    if (keys.current["d"] || keys.current["arrowright"]) {
      camera.position.addScaledVector(right, speed);
    }

    // Keep camera at walking height
    camera.position.y = 1.5;

    // Boundary
    const maxDist = 12;
    const dist = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
    if (dist > maxDist) {
      camera.position.x = (camera.position.x / dist) * maxDist;
      camera.position.z = (camera.position.z / dist) * maxDist;
    }
  });

  return null;
}

// ── Trees and decorations ──

function Trees() {
  const treePositions = useMemo(() => {
    const positions: [number, number][] = [];
    // Place trees between buildings
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const radius = 3 + (i % 3) * 2;
      positions.push([
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
      ]);
    }
    return positions;
  }, []);

  return (
    <>
      {treePositions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Trunk */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.08, 0.6, 6]} />
            <meshStandardMaterial color="#4a3520" roughness={0.9} />
          </mesh>
          {/* Foliage */}
          <mesh position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#2d5a2d" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ── Main 3D Campus Component ──

export function CampusMap3D({
  agentStates,
  onAgentClick,
  onBuildingClick,
}: CampusMap3DProps) {
  const [enteredBuilding, setEnteredBuilding] = useState<Building | null>(null);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      {/* Instructions overlay */}
      <div className="absolute left-3 top-3 z-10 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[10px] text-slate-400 backdrop-blur">
        <span className="font-semibold text-amber-300">3D Mode</span> · WASD to walk · Mouse to look · Click building to inspect
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 3, 8], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 15, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={30}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <hemisphereLight args={["#4a6fa5", "#1a2e1a", 0.3]} />

        <Suspense fallback={null}>
          <Ground />
          <Trees />

          {BUILDINGS.map(building => (
            <Building3D
              key={building.id}
              building={building}
              states={agentStates}
              onBuildingClick={(b) => {
                setEnteredBuilding(b);
                onBuildingClick?.(b);
              }}
            />
          ))}

          {/* Camera controls */}
          <CameraController />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2 - 0.1}
            target={[0, 1, 0]}
            makeDefault
          />
        </Suspense>
      </Canvas>

      {/* Building interior panel (when entered) */}
      {enteredBuilding && (
        <div className="absolute bottom-3 left-3 z-10 w-72 rounded-xl border border-slate-700 bg-slate-900/95 p-3 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold" style={{ color: enteredBuilding.color }}>
              {enteredBuilding.name}
            </h4>
            <button
              onClick={() => setEnteredBuilding(null)}
              className="text-slate-500 hover:text-slate-300 text-sm"
            >✕</button>
          </div>
          <div className="space-y-1 text-[10px] text-slate-400">
            <div>Tier {enteredBuilding.tier} · {enteredBuilding.department}</div>
            <div>Manager: {enteredBuilding.manager}</div>
            <div className="pt-1">Occupants ({enteredBuilding.occupants.length}):</div>
            <div className="flex flex-wrap gap-1">
              {enteredBuilding.occupants.map(name => {
                const state = agentStates[name]?.state || "idle";
                const colors: Record<string, string> = {
                  idle: "#64748b", active: "#fbbf24", waiting: "#3b82f6",
                  sleeping: "#475569", no_response: "#ef4444", done: "#10b981",
                };
                return (
                  <button
                    key={name}
                    onClick={() => onAgentClick?.(name)}
                    className="rounded-full px-1.5 py-0.5 text-[8px] hover:opacity-80"
                    style={{
                      backgroundColor: (colors[state] || colors.idle) + "20",
                      color: colors[state] || colors.idle,
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
