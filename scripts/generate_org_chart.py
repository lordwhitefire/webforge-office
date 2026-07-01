#!/usr/bin/env python3
"""
Generate an interactive HTML org chart for the WebForge Agent Registry.
- Dark mode
- Top-down collapsible tree
- All 277 agents
- D3.js powered: zoom, pan, click to expand/collapse, search, info panel
"""

import json
import os

# ---------------------------------------------------------------------------
# Build the full agent tree from the registry
# ---------------------------------------------------------------------------

# Shared suffixes for batch agents (17 slots matching areas 01-05 .. 81-82)
SUFFIXES_17 = [
    "Sage", "Reed", "Birch", "Cliff", "Moss", "Slate", "Fern", "Pike",
    "Wisp", "Cove", "Bramble", "Talon", "Marrow", "Glade", "Heron",
    "Frost", "Aster",
]
AREAS_17 = [
    "01-05", "06-10", "11-15", "16-20", "21-25", "26-30", "31-35",
    "36-40", "41-45", "46-50", "51-55", "56-60", "61-65", "66-70",
    "71-75", "76-80", "81-82",
]

# Probe team uses unique nature-names
PROBE_NAMES = [
    "Orion", "Wren", "Beacon", "Sable", "Quartz", "Flint", "Ridge",
    "Marsh", "Coral", "Vale", "Thorne", "Brisk", "Hollow", "Crag",
    "Drift", "Ember", "Lyric",
]

# Frontend Jr devs (unique names)
FE_JR_NAMES = [
    "Hawk", "Finch", "Wisp", "Cole", "Reed", "Sage", "Birch", "Pike",
    "Moss", "Cliff", "Fern", "Slate", "Wren", "Cove", "Bram", "Talon",
    "Aster",
]
FE_SR_GROUPS = [
    ("Sr-Hale",   ["Hawk", "Finch", "Wisp", "Cole", "Reed"]),
    ("Sr-Vance",  ["Sage", "Birch", "Pike", "Moss"]),
    ("Sr-Brook",  ["Cliff", "Fern", "Slate", "Wren"]),
    ("Sr-Quill2", ["Cove", "Bram", "Talon", "Aster"]),
]

# Backend Jr devs
BE_JR_NAMES = [
    "Granite", "Slate", "Marble", "Quartz", "Copper", "Bronze", "Silver",
    "Gold", "Oak", "Pine", "Cedar", "Birch", "Titan", "Vanadium",
    "Chromium", "Nickel", "Cobalt",
]
BE_SR_GROUPS = [
    ("Sr-Stone", ["Granite", "Slate", "Marble", "Quartz"]),
    ("Sr-Iron",  ["Copper", "Bronze", "Silver", "Gold"]),
    ("Sr-Wood",  ["Oak", "Pine", "Cedar", "Birch"]),
    ("Sr-Steel", ["Titan", "Vanadium", "Chromium", "Nickel"]),
]
# Note: Jr-Cobalt (areas 81-82) reports to Sr-Steel as well per the 4x4+1 pattern

# DB/Infra Jr devs
DB_JR_NAMES = [
    "Sky", "Storm", "Rain", "Wind", "Mountain", "Hill", "Valley", "Plain",
    "Flame", "Ember", "Ash", "Coal", "River", "Lake", "Ocean", "Sea",
    "Lake2",
]
DB_SR_GROUPS = [
    ("Sr-Cloud", ["Sky", "Storm", "Rain", "Wind"]),
    ("Sr-Earth", ["Mountain", "Hill", "Valley", "Plain"]),
    ("Sr-Fire",  ["Flame", "Ember", "Ash", "Coal"]),
    ("Sr-Water", ["River", "Lake", "Ocean", "Sea"]),
]
# Jr-Lake2 (areas 81-82) also under Sr-Water


def node(name, role, areas=None, function=None, dept=None, children=None):
    """Create a tree node."""
    n = {
        "name": name,
        "role": role,
        "dept": dept,
    }
    if areas:
        n["areas"] = areas
    if function:
        n["function"] = function
    if children:
        n["children"] = children
    return n


def batch_children(prefix, role_template, function_template, dept):
    """Generate 17 batch-agent children for a team."""
    children = []
    for suffix, areas in zip(SUFFIXES_17, AREAS_17):
        children.append(node(
            name=f"{prefix}-{suffix}",
            role=role_template,
            areas=areas,
            function=function_template.format(areas=areas),
            dept=dept,
        ))
    return children


# --- Build the tree ---

# 1. Intelligence Department
probe_team = node("Probe Team", "Lead, Assets & Readiness", dept="Intelligence",
    function="Assets & readiness assessment across all 82 areas",
    children=[node(f"Probe-{n}", "Probe Agent", areas=a,
                   function=f"Assets & readiness assessment for areas {a}",
                   dept="Intelligence")
              for n, a in zip(PROBE_NAMES, AREAS_17)])

odin_team = node("Odin Team", "Lead, Standards Research & Selection", dept="Intelligence",
    function="Standards research & selection across all 82 areas",
    children=batch_children(
        "Odin", "Odin Agent",
        "Standards research & selection for areas {areas}",
        "Intelligence"))

dorian = node("Dorian", "UI Researcher", dept="Intelligence",
    function="UI research, internet reference design search, reports to Aurora")

intelligence_dept = node("Athena", "Intelligence Director", dept="Intelligence",
    function="Heads the Intelligence department — research, assess, and set standards before building starts (38 agents)",
    children=[probe_team, odin_team, dorian])

# 2. Build Department
def build_subtree(head_name, head_role, lead_name, sr_groups, jr_prefix="Jr",
                  jr_function="Development for areas {areas}", dept="Build"):
    """Build a Build sub-department: Head -> Tech Lead -> 4 Sr -> Jr devs."""
    sr_nodes = []
    for sr_name, jr_names in sr_groups:
        jr_children = []
        for jn in jr_names:
            # find area for this jr name
            idx = None
            if head_name == "Aurora":
                idx = FE_JR_NAMES.index(jn)
            elif head_name == "Titan":
                idx = BE_JR_NAMES.index(jn)
            else:
                idx = DB_JR_NAMES.index(jn)
            areas = AREAS_17[idx]
            jr_children.append(node(
                name=f"{jr_prefix}-{jn}",
                role="Junior Developer",
                areas=areas,
                function=jr_function.format(areas=areas),
                dept=dept,
            ))
        sr_nodes.append(node(sr_name, "Senior Developer", dept=dept,
            function=f"Manages {len(jr_names)} junior developers",
            children=jr_children))

    # Handle the extra 17th Jr dev (areas 81-82) for Backend and DB/Infra
    # Backend: Jr-Cobalt -> Sr-Steel; DB/Infra: Jr-Lake2 -> Sr-Water
    if head_name == "Titan":
        cobalt = node("Jr-Cobalt", "Junior Developer", areas="81-82",
                      function="Backend development for areas 81-82", dept=dept)
        # Add to Sr-Steel's children
        for sr in sr_nodes:
            if sr["name"] == "Sr-Steel":
                sr["children"].append(cobalt)
    elif head_name == "Zephyr":
        lake2 = node("Jr-Lake2", "Junior Developer", areas="81-82",
                     function="Database/Infra development for areas 81-82", dept=dept)
        for sr in sr_nodes:
            if sr["name"] == "Sr-Water":
                sr["children"].append(lake2)

    lead = node(lead_name, "Tech Lead", dept=dept,
        function="Manages all 4 Senior Developers",
        children=sr_nodes)

    head = node(head_name, head_role, dept=dept,
        function=f"Leads {head_name.lower()} sub-department",
        children=[lead])
    return head


aurora_subtree = build_subtree(
    "Aurora", "Frontend Head", "Lead-Faro", FE_SR_GROUPS,
    jr_function="Frontend development for areas {areas}")

titan_subtree = build_subtree(
    "Titan", "Backend Head", "Lead-Terra", BE_SR_GROUPS,
    jr_function="Backend development for areas {areas}")

zephyr_subtree = build_subtree(
    "Zephyr", "Database/Infra Head", "Lead-Zen", DB_SR_GROUPS,
    jr_function="Database/Infra development for areas {areas}")

build_dept = node("Hephaestus", "Build Director", dept="Build",
    function="Heads the Build department — actually build the website/app (69 agents)",
    children=[aurora_subtree, titan_subtree, zephyr_subtree])

# 3. Quality Council
verdict_team = node("Verdict Team", "Lead, Standards Compliance", dept="Quality",
    function="Standards compliance across all 82 areas",
    children=[
        node(f"Verdict-{n}", "Verdict Agent", areas=a,
             function=f"Standards compliance for areas {a}", dept="Quality")
        for n, a in zip(
            ["Lance","Hazel","Onyx","Brook","Garnet","Fenn","Storm","Clove",
             "Ridley","Hawke","Wilder","Pike2","Sloane","Reign","Vance2",
             "Knox","Wren2"],
            AREAS_17)
    ])

# Nemesis team: 4 cores + their batch agents
pixel_core = node("Pixel-Core", "Lead, Unit/Integration Tests", dept="Quality",
    function="Oversees Pixel batch agents, coordinates test strategy",
    children=batch_children("Pixel", "Pixel Agent",
        "Unit/integration test scripts for areas {areas}", "Quality"))

sentry_core = node("Sentry-Core", "Lead, Test Reviewer", dept="Quality",
    function="Oversees Sentry batch agents, reviews and approves test scripts",
    children=batch_children("Sentry", "Sentry Agent",
        "Test script reviewer for areas {areas}", "Quality"))

scalpel_core = node("Scalpel-Core", "Lead, E2E Tests", dept="Quality",
    function="Oversees Scalpel batch agents, coordinates e2e testing strategy",
    children=batch_children("Scalpel", "Scalpel Agent",
        "E2E test scripts for areas {areas}", "Quality"))

patch_core = node("Patch-Core", "Lead, Fixer", dept="Quality",
    function="Oversees patch operations, coordinates fix strategy")

nemesis_team = node("Nemesis Team", "Lead, Functional Testing", dept="Quality",
    function="Functional testing: unit, integration, e2e, and patching (55 agents)",
    children=[pixel_core, sentry_core, scalpel_core, patch_core])

janus_team = node("Janus Team", "Lead, Security & Compliance", dept="Quality",
    function="Security & compliance across all 82 areas (18 agents)",
    children=[node("Janus-Core", "Lead, Security & Compliance", dept="Quality",
                function="Oversees all security operations, reports to Hermes",
                children=batch_children("Janus", "Janus Agent",
                    "Security & compliance checks for areas {areas}", "Quality"))])

pulse_team = node("Pulse Team", "Lead, Bug Fixing", dept="Quality",
    function="Bug fixing across all 82 areas (18 agents)",
    children=[node("Pulse-Core", "Lead, Bug Fixer", dept="Quality",
                function="Oversees all bug fix operations, coordinates fix strategy",
                children=batch_children("Pulse", "Pulse Agent",
                    "Bug fixing for areas {areas}, monitors error logs", "Quality"))])

quality_dept = node("Minos", "Quality Director", dept="Quality",
    function="Heads the Quality Council — test, review, secure, and fix (108 agents)",
    children=[verdict_team, nemesis_team, janus_team, pulse_team])

# 4. Documentation Department
quill_team = node("Quill Team", "Lead, Documentation", dept="Documentation",
    function="Core documentation team (5 agents)",
    children=[
        node("Quill", "Lead, Documentation", dept="Documentation",
            function="Oversees all documentation operations"),
        node("Scroll", "README + Changelog", dept="Documentation",
            function="Maintains project README and changelog"),
        node("Stamp", "Commit Messages + Progress", dept="Documentation",
            function="Manages commit message standards and progress tracking"),
        node("Ledger", "Environment Docs", dept="Documentation",
            function="Maintains .env.example and environment documentation"),
        node("Draft", "Component/API Docs", dept="Documentation",
            function="Manages component and API documentation"),
    ])

memory_team = node("Memory Team", "Project Memory", dept="Documentation",
    function="Tracks project memory and decisions (3 agents)",
    children=[
        node("Memory-Architecture", "Architecture Memory", dept="Documentation",
            function="Tracks architecture changes, maintains Gen 001, Gen 002, etc."),
        node("Memory-Choices", "Non-Standard Choices", dept="Documentation",
            function="Documents non-standard technical choices and decisions"),
        node("Memory-Forgotten", "Forgotten Rules", dept="Documentation",
            function="Maintains system rules, 128-line compaction"),
    ])

# Embedded documentation agents (51 = 17 x 3 departments)
doc_intel = node("Doc-Intelligence", "Embedded Docs (Intelligence)", dept="Documentation",
    function="Real-time documentation of Intelligence team decisions (17 agents)",
    children=batch_children("Doc-Intelligence", "Doc Agent",
        "Real-time documentation of Intelligence decisions for areas {areas}",
        "Documentation"))

doc_build = node("Doc-Build", "Embedded Docs (Build)", dept="Documentation",
    function="Real-time documentation of Build team decisions (17 agents)",
    children=batch_children("Doc-Build", "Doc Agent",
        "Real-time documentation of Build decisions for areas {areas}",
        "Documentation"))

doc_quality = node("Doc-Quality", "Embedded Docs (Quality)", dept="Documentation",
    function="Real-time documentation of Quality team decisions (17 agents)",
    children=batch_children("Doc-Quality", "Doc Agent",
        "Real-time documentation of Quality decisions for areas {areas}",
        "Documentation"))

embedded_docs = node("Embedded Documentation", "Embedded Docs Lead", dept="Documentation",
    function="51 embedded doc agents across 3 departments",
    children=[doc_intel, doc_build, doc_quality])

documentation_dept = node("Thoth", "Documentation Director", dept="Documentation",
    function="Heads the Documentation department — write and maintain all guides, memory, and real-time docs (60 agents)",
    children=[quill_team, memory_team, embedded_docs])

# Executive
# HR Department — reports to Hermes, neutral (not part of the 4 operational departments)
hr_dept = node("Voss", "HR Director", dept="HR",
    function="Heads the HR Department — receives all recruiting and termination requests, makes final decisions, reports to Hermes. Manages both temporary numbered agents and permanent named agents.",
    children=[
        node("Rook", "Registry Manager", dept="HR",
            function="Maintains the Agent Registry file. Handles all additions, activations, and deactivations of named agents. Never creates a duplicate — always checks the registry first."),
        node("Weld", "Assignment Officer", dept="HR",
            function="Assigns newly recruited agents to the department that requested them. Tracks who is working on what."),
    ])

hermes = node("Hermes", "COO / Scheduler", dept="Executive",
    function="Automaton: wakes agents in sequence, manages handovers, monitors stalls. HR reports to Hermes.",
    children=[hr_dept])

ceo = node("CEO", "Chief Executive Officer", dept="Executive",
    function="Oversees all departments, coordinates strategy, makes final decisions",
    children=[hermes, intelligence_dept, build_dept, quality_dept, documentation_dept])


# ---------------------------------------------------------------------------
# Count total nodes
# ---------------------------------------------------------------------------
def count_nodes(n):
    total = 1
    for c in n.get("children", []):
        total += count_nodes(c)
    return total

total = count_nodes(ceo)
print(f"Total agents in tree: {total}")

tree_json = json.dumps(ceo, ensure_ascii=False)

# ---------------------------------------------------------------------------
# HTML template
# ---------------------------------------------------------------------------
html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WebForge Agent Registry — Org Chart</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>
  :root {
    --bg: #0F172A;
    --bg-panel: #1E293B;
    --bg-card: #334155;
    --text: #F1F5F9;
    --text-muted: #94A3B8;
    --border: #475569;
    --exec: #A78BFA;
    --intel: #60A5FA;
    --build: #34D399;
    --quality: #FB7185;
    --docs: #FBBF24;
    --hr: #22D3EE;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden;
    height: 100vh;
  }

  /* ── Top bar ── */
  #topbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
    padding: 10px 20px;
    display: flex; align-items: center; gap: 16px;
    flex-wrap: wrap;
  }
  #topbar h1 {
    font-size: 16px; font-weight: 700; white-space: nowrap;
    background: linear-gradient(90deg, var(--exec), var(--intel), var(--build), var(--quality), var(--docs));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  #topbar .stats {
    font-size: 12px; color: var(--text-muted);
    background: var(--bg-card); padding: 4px 10px; border-radius: 6px;
  }
  #search {
    flex: 1; max-width: 280px; min-width: 140px;
    background: var(--bg-card); border: 1px solid var(--border);
    color: var(--text); padding: 6px 12px; border-radius: 6px;
    font-size: 13px; outline: none;
  }
  #search:focus { border-color: var(--intel); }
  #search::placeholder { color: var(--text-muted); }
  .btn {
    background: var(--bg-card); color: var(--text);
    border: 1px solid var(--border); padding: 6px 12px;
    border-radius: 6px; cursor: pointer; font-size: 12px;
    transition: all 0.15s;
  }
  .btn:hover { background: var(--border); }
  .btn-primary { background: var(--intel); border-color: var(--intel); color: #fff; }
  .btn-primary:hover { background: #3B82F6; }

  /* ── Legend ── */
  #legend {
    position: fixed; bottom: 16px; left: 16px; z-index: 100;
    background: var(--bg-panel); border: 1px solid var(--border);
    border-radius: 8px; padding: 12px 16px;
    font-size: 12px;
  }
  #legend h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
               color: var(--text-muted); margin-bottom: 8px; }
  .legend-item { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
  .legend-dot { width: 12px; height: 12px; border-radius: 3px; }

  /* ── Info panel ── */
  #info-panel {
    position: fixed; top: 64px; right: 16px; z-index: 100;
    background: var(--bg-panel); border: 1px solid var(--border);
    border-radius: 8px; padding: 16px 20px;
    width: 280px; max-height: 70vh; overflow-y: auto;
    display: none;
  }
  #info-panel.visible { display: block; }
  #info-panel h2 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  #info-panel .role { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
  #info-panel .field { margin: 8px 0; }
  #info-panel .field-label { font-size: 10px; text-transform: uppercase;
                             letter-spacing: 0.5px; color: var(--text-muted); }
  #info-panel .field-value { font-size: 13px; margin-top: 2px; }
  #info-panel .close {
    position: absolute; top: 8px; right: 12px;
    background: none; border: none; color: var(--text-muted);
    font-size: 18px; cursor: pointer;
  }
  #info-panel .close:hover { color: var(--text); }

  /* ── Chart ── */
  #chart-container {
    position: fixed; top: 56px; left: 0; right: 0; bottom: 0;
    overflow: hidden;
  }
  svg { width: 100%; height: 100%; }

  /* ── Tree nodes ── */
  .node circle {
    cursor: pointer;
    stroke-width: 2px;
    transition: r 0.15s;
  }
  .node circle:hover { filter: brightness(1.3); }
  .node text {
    font-size: 11px;
    fill: var(--text);
    pointer-events: none;
    text-anchor: start;
  }
  .node--internal text { font-weight: 600; }
  .node--leaf text { fill: var(--text-muted); font-size: 10px; }

  .link {
    fill: none;
    stroke: var(--border);
    stroke-width: 1px;
    opacity: 0.5;
  }

  /* Department colors */
  .dept-Executive > circle { fill: var(--exec); stroke: #7C3AED; }
  .dept-Intelligence > circle { fill: var(--intel); stroke: #2563EB; }
  .dept-Build > circle { fill: var(--build); stroke: #059669; }
  .dept-Quality > circle { fill: var(--quality); stroke: #E11D48; }
  .dept-Documentation > circle { fill: var(--docs); stroke: #D97706; }
  .dept-HR > circle { fill: var(--hr); stroke: #0891B2; }

  .node.highlighted > circle {
    stroke: #fff; stroke-width: 3px;
    filter: drop-shadow(0 0 6px #fff);
  }
  .node.search-match > circle {
    stroke: #FDE047; stroke-width: 3px;
    filter: drop-shadow(0 0 8px #FDE047);
  }

  /* Zoom controls */
  #zoom-controls {
    position: fixed; bottom: 16px; right: 16px; z-index: 100;
    display: flex; flex-direction: column; gap: 4px;
  }
  #zoom-controls .btn { width: 36px; height: 36px; padding: 0; font-size: 16px; }

  /* Help text */
  #help {
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    z-index: 99; font-size: 11px; color: var(--text-muted);
    background: var(--bg-panel); padding: 6px 14px; border-radius: 20px;
    border: 1px solid var(--border);
  }
</style>
</head>
<body>

<div id="topbar">
  <h1>WebForge Agent Registry</h1>
  <span class="stats" id="stats">— agents</span>
  <input type="text" id="search" placeholder="Search agents (e.g. Probe, Sr-Hale, Jr-Cobalt)..." />
  <button class="btn" onclick="expandAll()">Expand All</button>
  <button class="btn" onclick="collapseAll()">Collapse All</button>
  <button class="btn btn-primary" onclick="resetView()">Reset View</button>
</div>

<div id="chart-container">
  <svg id="chart"></svg>
</div>

<div id="info-panel">
  <button class="close" onclick="closeInfo()">&times;</button>
  <h2 id="info-name"></h2>
  <div class="role" id="info-role"></div>
  <div class="field"><div class="field-label">Department</div>
    <div class="field-value" id="info-dept"></div></div>
  <div class="field" id="info-areas-field"><div class="field-label">Areas</div>
    <div class="field-value" id="info-areas"></div></div>
  <div class="field"><div class="field-label">Function</div>
    <div class="field-value" id="info-function"></div></div>
  <div class="field" id="info-reports-field"><div class="field-label">Reports To</div>
    <div class="field-value" id="info-reports"></div></div>
  <div class="field" id="info-manages-field"><div class="field-label">Direct Reports</div>
    <div class="field-value" id="info-manages"></div></div>
</div>

<div id="legend">
  <h3>Departments</h3>
  <div class="legend-item"><div class="legend-dot" style="background:var(--exec)"></div>Executive (CEO, Hermes)</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--hr)"></div>HR (Voss, Rook, Weld)</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--intel)"></div>Intelligence (38)</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--build)"></div>Build (69)</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--quality)"></div>Quality Council (108)</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--docs)"></div>Documentation (60)</div>
</div>

<div id="zoom-controls">
  <button class="btn" onclick="zoomIn()">+</button>
  <button class="btn" onclick="zoomOut()">&minus;</button>
</div>

<div id="help">Click a node to expand/collapse &nbsp;|&nbsp; Scroll to zoom &nbsp;|&nbsp; Drag to pan &nbsp;|&nbsp; Click info-panel to close</div>

<script>
// ── Tree data (injected from Python) ──
const treeData = __TREE_DATA__;

// ── Department colors ──
const deptColors = {
  Executive: "#A78BFA",
  HR: "#22D3EE",
  Intelligence: "#60A5FA",
  Build: "#34D399",
  Quality: "#FB7185",
  Documentation: "#FBBF24",
};

// ── Build parent map and count ──
const parentMap = {};
let totalAgents = 0;
(function buildParentMap(node, parent = null) {
  parentMap[node.name] = parent;
  if (!node.children || node.children.length === 0) totalAgents++;
  if (node.children) {
    node.children.forEach(c => buildParentMap(c, node));
  }
})(treeData);

// Count ALL nodes (internal + leaf)
function countAll(node) {
  let n = 1;
  if (node.children) node.children.forEach(c => n += countAll(c));
  return n;
}
const allNodes = countAll(treeData);
document.getElementById('stats').textContent = allNodes + ' agents';

// ── Set up SVG ──
const container = document.getElementById('chart-container');
const width = container.clientWidth;
const height = container.clientHeight;

const svg = d3.select('#chart');
const g = svg.append('g');

// Zoom
const zoom = d3.zoom()
  .scaleExtent([0.1, 3])
  .on('zoom', (event) => g.attr('transform', event.transform));
svg.call(zoom);

// ── Tree layout ──
const root = d3.hierarchy(treeData);
root.x0 = height / 2;
root.y0 = 0;

// Collapse all initially except first 2 levels
root.descendants().forEach((d, i) => {
  if (d.depth > 1 && d.children) {
    d._children = d.children;
    d.children = null;
  }
});

const treeLayout = d3.tree().nodeSize([22, 220]);

let i = 0;
const duration = 400;

function update(source) {
  treeLayout(root);
  const nodes = root.descendants();
  const links = root.links();

  // ── Nodes ──
  const node = g.selectAll('g.node')
    .data(nodes, d => d.id || (d.id = ++i));

  const nodeEnter = node.enter().append('g')
    .attr('class', d => 'node dept-' + (d.data.dept || 'Unknown') +
                        (d._children ? ' collapsed' : ''))
    .attr('transform', d => `translate(${source.y0},${source.x0})`)
    .on('click', (event, d) => {
      event.stopPropagation();
      toggle(d);
      update(d);
      showInfo(d);
    })
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).classed('highlighted', true);
    })
    .on('mouseleave', (event, d) => {
      d3.select(event.currentTarget).classed('highlighted', false);
    });

  nodeEnter.append('circle')
    .attr('r', d => d.depth === 0 ? 10 : d.depth === 1 ? 8 : d.depth === 2 ? 6 : 4)
    .style('fill-opacity', d => d._children ? 0.3 : 1);

  nodeEnter.append('text')
    .attr('dy', '0.31em')
    .attr('x', d => (d._children || d.children) ? 12 : 8)
    .attr('text-anchor', 'start')
    .text(d => d.data.name)
    .style('fill-opacity', 0)
    .style('font-weight', d => d.depth <= 2 ? 600 : 400)
    .style('font-size', d => d.depth === 0 ? '14px' : d.depth === 1 ? '12px' : '11px');

  // Update
  const nodeUpdate = nodeEnter.merge(node);
  nodeUpdate.transition().duration(duration)
    .attr('transform', d => `translate(${d.y},${d.x})`);
  nodeUpdate.select('circle')
    .attr('r', d => d.depth === 0 ? 10 : d.depth === 1 ? 8 : d.depth === 2 ? 6 : 4)
    .style('fill-opacity', d => d._children ? 0.3 : 1);
  nodeUpdate.select('text')
    .transition().duration(duration)
    .style('fill-opacity', 1)
    .style('font-weight', d => d.depth <= 2 ? 600 : 400);

  // Exit
  const nodeExit = node.exit().transition().duration(duration)
    .attr('transform', d => `translate(${source.y},${source.x})`)
    .remove();
  nodeExit.select('circle').attr('r', 1e-6);
  nodeExit.select('text').style('fill-opacity', 1e-6);

  // ── Links ──
  const link = g.selectAll('path.link')
    .data(links, d => d.target.id);

  const linkEnter = link.enter().insert('path', 'g')
    .attr('class', 'link')
    .attr('d', d => {
      const o = { x: source.x0, y: source.y0 };
      return diagonal(o, o);
    });

  linkEnter.merge(link).transition().duration(duration)
    .attr('d', d => diagonal(d.source, d.target));

  link.exit().transition().duration(duration)
    .attr('d', d => {
      const o = { x: source.x, y: source.y };
      return diagonal(o, o);
    })
    .remove();

  // Save positions
  root.eachBefore(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

function diagonal(s, t) {
  return `M${s.y},${s.x}
          C${(s.y + t.y) / 2},${s.x}
           ${(s.y + t.y) / 2},${t.x}
           ${t.y},${t.x}`;
}

function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else if (d._children) {
    d.children = d._children;
    d._children = null;
  }
}

// ── Info panel ──
function showInfo(d) {
  const panel = document.getElementById('info-panel');
  document.getElementById('info-name').textContent = d.data.name;
  document.getElementById('info-role').textContent = d.data.role || '—';
  document.getElementById('info-dept').textContent = d.data.dept || '—';

  const areasField = document.getElementById('info-areas-field');
  if (d.data.areas) {
    areasField.style.display = 'block';
    document.getElementById('info-areas').textContent = d.data.areas;
  } else {
    areasField.style.display = 'none';
  }

  document.getElementById('info-function').textContent = d.data.function || '—';

  const parent = parentMap[d.data.name];
  const reportsField = document.getElementById('info-reports-field');
  if (parent) {
    reportsField.style.display = 'block';
    document.getElementById('info-reports').textContent = parent.name + ' (' + parent.role + ')';
  } else {
    reportsField.style.display = 'none';
  }

  const managesField = document.getElementById('info-manages-field');
  const children = d.data.children || d.data._children;
  if (children && children.length > 0) {
    managesField.style.display = 'block';
    const names = children.slice(0, 8).map(c => c.name).join(', ');
    const extra = children.length > 8 ? ` ... +${children.length - 8} more` : '';
    document.getElementById('info-manages').textContent =
      `${children.length} direct reports: ${names}${extra}`;
  } else {
    managesField.style.display = 'none';
  }

  panel.classList.add('visible');
}

function closeInfo() {
  document.getElementById('info-panel').classList.remove('visible');
}

// ── Controls ──
function expandAll() {
  root.descendants().forEach(d => {
    if (d._children) { d.children = d._children; d._children = null; }
  });
  update(root);
}

function collapseAll() {
  root.descendants().forEach(d => {
    if (d.depth > 1 && d.children) {
      d._children = d.children;
      d.children = null;
    }
  });
  update(root);
}

function resetView() {
  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
}

function zoomIn() {
  svg.transition().duration(200).call(zoom.scaleBy, 1.3);
}
function zoomOut() {
  svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.3);
}

// ── Search ──
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  d3.selectAll('.node').classed('search-match', false);

  if (!query) return;

  // Find matching nodes
  const matches = root.descendants().filter(d =>
    d.data.name.toLowerCase().includes(query) ||
    (d.data.role && d.data.role.toLowerCase().includes(query)) ||
    (d.data.dept && d.data.dept.toLowerCase().includes(query))
  );

  // Expand path to matches
  matches.forEach(m => {
    let parent = m.parent;
    while (parent) {
      if (parent._children) {
        parent.children = parent._children;
        parent._children = null;
      }
      parent = parent.parent;
    }
  });
  update(root);

  // Highlight matches
  d3.selectAll('.node').each(function(d) {
    if (matches.includes(d)) {
      d3.select(this).classed('search-match', true);
    }
  });
});

// Click background to close info
svg.on('click', () => closeInfo());

// ── Initial render ──
update(root);

// Center the tree initially
setTimeout(() => {
  const bbox = g.node().getBBox();
  const scale = Math.min(width / (bbox.width + 100), height / (bbox.height + 100), 1);
  const tx = (width - bbox.width * scale) / 2 - bbox.x * scale;
  const ty = (height - bbox.height * scale) / 2 - bbox.y * scale + 30;
  svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}, 100);

// Handle window resize
window.addEventListener('resize', () => {
  // SVG is 100% so it auto-resizes; no action needed
});
</script>

</body>
</html>
"""

html = html.replace("__TREE_DATA__", tree_json)

output_path = "/home/z/my-project/download/webforge-org-chart.html"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"\nOrg chart saved to: {output_path}")
print(f"File size: {os.path.getsize(output_path) / 1024:.1f} KB")
