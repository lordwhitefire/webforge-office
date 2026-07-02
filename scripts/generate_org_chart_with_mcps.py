#!/usr/bin/env python3
"""
Updated org chart with MCP ownership:
- Each agent node shows colored MCP badges (one dot per tier it owns)
- Info panel lists owned MCPs
- New toggle to filter/highlight agents by MCP
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from mcp_data import MCPS, TIER_COLORS, TIER_NAMES, mcps_for_agent

# ---------------------------------------------------------------------------
# Build the tree (same as before, but with MCP ownership attached)
# ---------------------------------------------------------------------------
SUFFIXES_17 = ["Sage","Reed","Birch","Cliff","Moss","Slate","Fern","Pike",
    "Wisp","Cove","Bramble","Talon","Marrow","Glade","Heron","Frost","Aster"]
AREAS_17 = ["01-05","06-10","11-15","16-20","21-25","26-30","31-35",
    "36-40","41-45","46-50","51-55","56-60","61-65","66-70",
    "71-75","76-80","81-82"]
PROBE_NAMES = ["Orion","Wren","Beacon","Sable","Quartz","Flint","Ridge",
    "Marsh","Coral","Vale","Thorne","Brisk","Hollow","Crag","Drift","Ember","Lyric"]
FE_JR_NAMES = ["Hawk","Finch","Wisp","Cole","Reed","Sage","Birch","Pike",
    "Moss","Cliff","Fern","Slate","Wren","Cove","Bram","Talon","Aster"]
FE_SR_GROUPS = [("Sr-Hale",["Hawk","Finch","Wisp","Cole","Reed"]),
    ("Sr-Vance",["Sage","Birch","Pike","Moss"]),
    ("Sr-Brook",["Cliff","Fern","Slate","Wren"]),
    ("Sr-Quill2",["Cove","Bram","Talon","Aster"])]
BE_JR_NAMES = ["Granite","Slate","Marble","Quartz","Copper","Bronze","Silver",
    "Gold","Oak","Pine","Cedar","Birch","Titan","Vanadium","Chromium","Nickel","Cobalt"]
BE_SR_GROUPS = [("Sr-Stone",["Granite","Slate","Marble","Quartz"]),
    ("Sr-Iron",["Copper","Bronze","Silver","Gold"]),
    ("Sr-Wood",["Oak","Pine","Cedar","Birch"]),
    ("Sr-Steel",["Titan","Vanadium","Chromium","Nickel"])]
DB_JR_NAMES = ["Sky","Storm","Rain","Wind","Mountain","Hill","Valley","Plain",
    "Flame","Ember","Ash","Coal","River","Lake","Ocean","Sea","Lake2"]
DB_SR_GROUPS = [("Sr-Cloud",["Sky","Storm","Rain","Wind"]),
    ("Sr-Earth",["Mountain","Hill","Valley","Plain"]),
    ("Sr-Fire",["Flame","Ember","Ash","Coal"]),
    ("Sr-Water",["River","Lake","Ocean","Sea"])]

def node(name, role, areas=None, function=None, dept=None, children=None):
    n = {"name": name, "role": role, "dept": dept}
    if areas: n["areas"] = areas
    if function: n["function"] = function
    if children: n["children"] = children
    # Attach MCP ownership
    mcps = mcps_for_agent(name, dept, role)
    if mcps:
        n["mcps"] = [{"id": m["id"], "name": m["name"], "tier": m["tier"],
                      "job": m["job"]} for m in mcps]
    else:
        n["mcps"] = []
    return n

def batch_children(prefix, role_template, function_template, dept):
    return [node(f"{prefix}-{s}", role_template, areas=a,
                 function=function_template.format(areas=a), dept=dept)
            for s, a in zip(SUFFIXES_17, AREAS_17)]

# 1. Intelligence
probe_team = node("Probe Team","Lead, Assets & Readiness",dept="Intelligence",
    function="Assets & readiness assessment across 82 areas",
    children=[node(f"Probe-{n}","Probe Agent",areas=a,
        function=f"Assets & readiness assessment for areas {a}",dept="Intelligence")
        for n,a in zip(PROBE_NAMES,AREAS_17)])
odin_team = node("Odin Team","Lead, Standards Research",dept="Intelligence",
    function="Standards research & selection across 82 areas",
    children=batch_children("Odin","Odin Agent",
        "Standards research & selection for areas {areas}","Intelligence"))
dorian = node("Dorian","UI Researcher",dept="Intelligence",
    function="UI research, internet reference design search, reports to Aurora")
intelligence_dept = node("Athena","Intelligence Director",dept="Intelligence",
    function="Heads Intelligence department — research, assess, set standards (38 agents)",
    children=[probe_team, odin_team, dorian])

# 2. Build
def build_subtree(head_name, head_role, lead_name, sr_groups, jr_prefix="Jr",
                  jr_function="Development for areas {areas}", dept="Build"):
    sr_nodes = []
    for sr_name, jr_names in sr_groups:
        jr_children = []
        for jn in jr_names:
            if head_name == "Aurora": idx = FE_JR_NAMES.index(jn)
            elif head_name == "Titan": idx = BE_JR_NAMES.index(jn)
            else: idx = DB_JR_NAMES.index(jn)
            areas = AREAS_17[idx]
            jr_children.append(node(f"{jr_prefix}-{jn}","Junior Developer",areas=areas,
                function=jr_function.format(areas=areas),dept=dept))
        sr_nodes.append(node(sr_name,"Senior Developer",dept=dept,
            function=f"Manages {len(jr_names)} junior developers",children=jr_children))
    if head_name == "Titan":
        cobalt = node("Jr-Cobalt","Junior Developer",areas="81-82",
            function="Backend development for areas 81-82",dept=dept)
        for sr in sr_nodes:
            if sr["name"] == "Sr-Steel": sr["children"].append(cobalt)
    elif head_name == "Zephyr":
        lake2 = node("Jr-Lake2","Junior Developer",areas="81-82",
            function="Database/Infra development for areas 81-82",dept=dept)
        for sr in sr_nodes:
            if sr["name"] == "Sr-Water": sr["children"].append(lake2)
    lead = node(lead_name,"Tech Lead",dept=dept,
        function="Manages all 4 Senior Developers",children=sr_nodes)
    head = node(head_name,head_role,dept=dept,
        function=f"Leads {head_name.lower()} sub-department",children=[lead])
    return head

aurora_subtree = build_subtree("Aurora","Frontend Head","Lead-Faro",FE_SR_GROUPS,
    jr_function="Frontend development for areas {areas}")
titan_subtree = build_subtree("Titan","Backend Head","Lead-Terra",BE_SR_GROUPS,
    jr_function="Backend development for areas {areas}")
zephyr_subtree = build_subtree("Zephyr","Database/Infra Head","Lead-Zen",DB_SR_GROUPS,
    jr_function="Database/Infra development for areas {areas}")
build_dept = node("Hephaestus","Build Director",dept="Build",
    function="Heads Build department — actually build the website/app (69 agents)",
    children=[aurora_subtree, titan_subtree, zephyr_subtree])

# 3. Quality
verdict_team = node("Verdict Team","Lead, Standards Compliance",dept="Quality",
    function="Standards compliance across 82 areas",
    children=[node(f"Verdict-{n}","Verdict Agent",areas=a,
        function=f"Standards compliance for areas {a}",dept="Quality")
        for n,a in zip(["Lance","Hazel","Onyx","Brook","Garnet","Fenn","Storm","Clove",
            "Ridley","Hawke","Wilder","Pike2","Sloane","Reign","Vance2","Knox","Wren2"],AREAS_17)])
pixel_core = node("Pixel-Core","Lead, Unit/Integration Tests",dept="Quality",
    function="Oversees Pixel batch agents",
    children=batch_children("Pixel","Pixel Agent",
        "Unit/integration test scripts for areas {areas}","Quality"))
sentry_core = node("Sentry-Core","Lead, Test Reviewer",dept="Quality",
    function="Oversees Sentry batch agents, reviews test scripts",
    children=batch_children("Sentry","Sentry Agent",
        "Test script reviewer for areas {areas}","Quality"))
scalpel_core = node("Scalpel-Core","Lead, E2E Tests",dept="Quality",
    function="Oversees Scalpel batch agents, coordinates e2e testing",
    children=batch_children("Scalpel","Scalpel Agent",
        "E2E test scripts for areas {areas}","Quality"))
patch_core = node("Patch-Core","Lead, Fixer",dept="Quality",
    function="Oversees patch operations, coordinates fix strategy")
nemesis_team = node("Nemesis Team","Lead, Functional Testing",dept="Quality",
    function="Functional testing: unit, integration, e2e, patching (55 agents)",
    children=[pixel_core, sentry_core, scalpel_core, patch_core])
janus_team = node("Janus Team","Lead, Security & Compliance",dept="Quality",
    function="Security & compliance across 82 areas (18 agents)",
    children=[node("Janus-Core","Lead, Security & Compliance",dept="Quality",
        function="Oversees all security operations, reports to Hermes",
        children=batch_children("Janus","Janus Agent",
            "Security & compliance checks for areas {areas}","Quality"))])
pulse_team = node("Pulse Team","Lead, Bug Fixing",dept="Quality",
    function="Bug fixing across 82 areas (18 agents)",
    children=[node("Pulse-Core","Lead, Bug Fixer",dept="Quality",
        function="Oversees all bug fix operations",
        children=batch_children("Pulse","Pulse Agent",
            "Bug fixing for areas {areas}, monitors error logs","Quality"))])
quality_dept = node("Minos","Quality Director",dept="Quality",
    function="Heads Quality Council — test, review, secure, and fix (108 agents)",
    children=[verdict_team, nemesis_team, janus_team, pulse_team])

# 4. Documentation
quill_team = node("Quill Team","Lead, Documentation",dept="Documentation",
    function="Core documentation team (5 agents)",
    children=[
        node("Quill","Lead, Documentation",dept="Documentation",
            function="Oversees all documentation operations"),
        node("Scroll","README + Changelog",dept="Documentation",
            function="Maintains README and changelog"),
        node("Stamp","Commit Messages + Progress",dept="Documentation",
            function="Manages commit message standards and progress tracking"),
        node("Ledger","Environment Docs",dept="Documentation",
            function="Maintains .env.example and environment documentation"),
        node("Draft","Component/API Docs",dept="Documentation",
            function="Manages component and API documentation"),
    ])
memory_team = node("Memory Team","Project Memory",dept="Documentation",
    function="Tracks project memory and decisions (3 agents)",
    children=[
        node("Memory-Architecture","Architecture Memory",dept="Documentation",
            function="Tracks architecture changes, Gen 001, Gen 002"),
        node("Memory-Choices","Non-Standard Choices",dept="Documentation",
            function="Documents non-standard technical choices"),
        node("Memory-Forgotten","Forgotten Rules",dept="Documentation",
            function="Maintains system rules, 128-line compaction"),
    ])
doc_intel = node("Doc-Intelligence","Embedded Docs (Intelligence)",dept="Documentation",
    function="Real-time documentation of Intelligence decisions (17 agents)",
    children=batch_children("Doc-Intelligence","Doc Agent",
        "Real-time documentation of Intelligence decisions for areas {areas}",
        "Documentation"))
doc_build = node("Doc-Build","Embedded Docs (Build)",dept="Documentation",
    function="Real-time documentation of Build decisions (17 agents)",
    children=batch_children("Doc-Build","Doc Agent",
        "Real-time documentation of Build decisions for areas {areas}",
        "Documentation"))
doc_quality = node("Doc-Quality","Embedded Docs (Quality)",dept="Documentation",
    function="Real-time documentation of Quality decisions (17 agents)",
    children=batch_children("Doc-Quality","Doc Agent",
        "Real-time documentation of Quality decisions for areas {areas}",
        "Documentation"))
embedded_docs = node("Embedded Documentation","Embedded Docs Lead",dept="Documentation",
    function="51 embedded doc agents across 3 departments",
    children=[doc_intel, doc_build, doc_quality])
documentation_dept = node("Thoth","Documentation Director",dept="Documentation",
    function="Heads Documentation department — write and maintain all docs (60 agents)",
    children=[quill_team, memory_team, embedded_docs])

# Executive + HR
hr_dept = node("Voss","HR Director",dept="HR",
    function="Heads HR — recruiting, termination, manages both temp and named agents",
    children=[
        node("Rook","Registry Manager",dept="HR",
            function="Maintains Agent Registry, handles additions/activations"),
        node("Weld","Assignment Officer",dept="HR",
            function="Assigns newly recruited agents to requesting departments"),
    ])
# Meta Engineering Department — maintains WebForge itself
meta_dept = node("Daedalus","Meta Engineering Director",dept="Meta",
    function="Heads Meta Engineering — maintains WebForge itself. Builds new MCPs, fixes bugs, creates agents.",
    children=[
        node("Forge","MCP Builder",dept="Meta",
            function="Builds new MCPs when WebForge needs new capabilities"),
        node("Anvil","MCP Fixer",dept="Meta",
            function="Fixes bugs in existing MCPs"),
        node("Loom","Agent Creator",dept="Meta",
            function="Creates new named agents when HR needs more (works with Rook)"),
        node("Compass","System Tester",dept="Meta",
            function="Tests the whole WebForge system to find issues before they break projects"),
    ])
hermes = node("Hermes","COO / Scheduler",dept="Executive",
    function="Automaton: wakes agents, manages handovers, monitors stalls",
    children=[hr_dept, meta_dept])
ceo = node("CEO","Chief Executive Officer",dept="Executive",
    function="Oversees all departments, coordinates strategy, final decisions",
    children=[hermes, intelligence_dept, build_dept, quality_dept, documentation_dept])

# Add SEO Agent node (referenced in MCP list but not in registry — add under Build)
# Already covered by "Build Team" ownership, so no new node needed

tree_json = json.dumps(ceo, ensure_ascii=False)

# Build MCP list for legend & filter
mcps_json = json.dumps([{
    "id": m["id"], "name": m["name"], "tier": m["tier"],
    "owner": m["owner"], "job": m["job"],
    "color": TIER_COLORS[m["tier"]],
    "tierName": TIER_NAMES[m["tier"]],
} for m in MCPS], ensure_ascii=False)

tier_colors_json = json.dumps(TIER_COLORS)
tier_names_json = json.dumps(TIER_NAMES)

# ---------------------------------------------------------------------------
# HTML
# ---------------------------------------------------------------------------
html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WebForge Org Chart — MCP Ownership</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>
  :root {
    --bg: #0F172A;
    --bg-panel: #1E293B;
    --bg-card: #334155;
    --text: #F1F5F9;
    --text-muted: #94A3B8;
    --border: #475569;
    --exec: #A78BFA; --intel: #60A5FA; --build: #34D399;
    --quality: #FB7185; --docs: #FBBF24; --hr: #22D3EE; --meta: #F472B6;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text);
    font-family: 'Inter', -apple-system, sans-serif;
    overflow: hidden; height: 100vh; }

  #topbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: var(--bg-panel); border-bottom: 1px solid var(--border);
    padding: 8px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  #topbar h1 { font-size: 15px; font-weight: 700; white-space: nowrap;
    background: linear-gradient(90deg, var(--exec), var(--intel), var(--build), var(--quality), var(--docs));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  #topbar .stats { font-size: 11px; color: var(--text-muted);
    background: var(--bg-card); padding: 4px 10px; border-radius: 6px; }
  #search { flex: 1; max-width: 240px; min-width: 120px;
    background: var(--bg-card); border: 1px solid var(--border);
    color: var(--text); padding: 5px 10px; border-radius: 6px; font-size: 12px; outline: none; }
  #search:focus { border-color: var(--intel); }
  .btn { background: var(--bg-card); color: var(--text); border: 1px solid var(--border);
    padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; transition: all 0.15s; }
  .btn:hover { background: var(--border); }
  .btn-primary { background: var(--intel); border-color: var(--intel); color: #fff; }

  /* MCP filter bar */
  #mcp-filter { position: fixed; top: 48px; left: 0; right: 0; z-index: 99;
    background: var(--bg-panel); border-bottom: 1px solid var(--border);
    padding: 6px 16px; display: flex; align-items: center; gap: 8px;
    flex-wrap: wrap; font-size: 11px; }
  #mcp-filter .label { color: var(--text-muted); font-weight: 600; margin-right: 4px; }
  .tier-chip { display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 10px; cursor: pointer;
    background: var(--bg-card); border: 1px solid var(--border); transition: all 0.15s; }
  .tier-chip:hover { background: var(--border); }
  .tier-chip.active { background: var(--bg-card); border-color: var(--text); }
  .tier-chip .dot { width: 8px; height: 8px; border-radius: 50%; }

  #legend { position: fixed; bottom: 12px; left: 12px; z-index: 100;
    background: var(--bg-panel); border: 1px solid var(--border);
    border-radius: 8px; padding: 10px 14px; font-size: 11px; }
  #legend h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
    color: var(--text-muted); margin-bottom: 6px; }
  .legend-item { display: flex; align-items: center; gap: 6px; margin: 3px 0; }
  .legend-dot { width: 10px; height: 10px; border-radius: 3px; }

  #info-panel { position: fixed; top: 90px; right: 12px; z-index: 100;
    background: var(--bg-panel); border: 1px solid var(--border);
    border-radius: 8px; padding: 14px 18px;
    width: 300px; max-height: 75vh; overflow-y: auto; display: none; }
  #info-panel.visible { display: block; }
  #info-panel h2 { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
  #info-panel .role { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }
  #info-panel .field { margin: 7px 0; }
  #info-panel .field-label { font-size: 9px; text-transform: uppercase;
    letter-spacing: 0.5px; color: var(--text-muted); }
  #info-panel .field-value { font-size: 12px; margin-top: 2px; }
  #info-panel .close { position: absolute; top: 6px; right: 10px;
    background: none; border: none; color: var(--text-muted);
    font-size: 18px; cursor: pointer; }
  #info-panel .close:hover { color: var(--text); }
  .mcp-list { margin-top: 6px; }
  .mcp-item { display: flex; align-items: center; gap: 6px;
    padding: 4px 6px; margin: 3px 0; border-radius: 4px;
    background: var(--bg-card); font-size: 11px; }
  .mcp-item .mcp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .mcp-item .mcp-name { font-weight: 600; }
  .mcp-item .mcp-job { color: var(--text-muted); font-size: 10px; margin-top: 1px; }

  #chart-container { position: fixed; top: 84px; left: 0; right: 0; bottom: 0;
    overflow: hidden; }
  svg { width: 100%; height: 100%; }

  .node circle { cursor: pointer; stroke-width: 2px; transition: r 0.15s; }
  .node circle:hover { filter: brightness(1.3); }
  .node text { font-size: 10px; fill: var(--text); pointer-events: none; text-anchor: start; }
  .node--internal text { font-weight: 600; }
  .node--leaf text { fill: var(--text-muted); font-size: 9px; }
  .link { fill: none; stroke: var(--border); stroke-width: 1px; opacity: 0.5; }

  .dept-Executive > circle { fill: var(--exec); stroke: #7C3AED; }
  .dept-HR > circle { fill: var(--hr); stroke: #0891B2; }
  .dept-Intelligence > circle { fill: var(--intel); stroke: #2563EB; }
  .dept-Build > circle { fill: var(--build); stroke: #059669; }
  .dept-Quality > circle { fill: var(--quality); stroke: #E11D48; }
  .dept-Documentation > circle { fill: var(--docs); stroke: #D97706; }
  .dept-Meta > circle { fill: var(--meta); stroke: #DB2777; }

  .node.has-mcps circle { stroke-width: 3px; }
  .node.highlighted > circle { stroke: #fff; stroke-width: 3px;
    filter: drop-shadow(0 0 6px #fff); }
  .node.search-match > circle { stroke: #FDE047; stroke-width: 3px;
    filter: drop-shadow(0 0 8px #FDE047); }
  .node.mcp-filter-match > circle {
    filter: drop-shadow(0 0 8px #fff); }

  /* MCP badges next to node text */
  .mcp-badge { display: inline-block; }

  #zoom-controls { position: fixed; bottom: 12px; right: 12px; z-index: 100;
    display: flex; flex-direction: column; gap: 4px; }
  #zoom-controls .btn { width: 34px; height: 34px; padding: 0; font-size: 16px; }

  #help { position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%);
    z-index: 99; font-size: 10px; color: var(--text-muted);
    background: var(--bg-panel); padding: 5px 12px; border-radius: 20px;
    border: 1px solid var(--border); }
</style>
</head>
<body>

<div id="topbar">
  <h1>WebForge Org Chart — MCP Ownership</h1>
  <span class="stats" id="stats">— agents</span>
  <input type="text" id="search" placeholder="Search agents..." />
  <button class="btn" onclick="expandAll()">Expand All</button>
  <button class="btn" onclick="collapseAll()">Collapse All</button>
  <button class="btn btn-primary" onclick="resetView()">Reset View</button>
</div>

<div id="mcp-filter">
  <span class="label">Filter by MCP tier:</span>
  <span class="tier-chip active" data-tier="0" onclick="filterByTier(0)">
    <span class="dot" style="background:#94A3B8"></span> All
  </span>
</div>

<div id="chart-container"><svg id="chart"></svg></div>

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
  <div class="field" id="info-mcps-field">
    <div class="field-label">MCPs Owned (<span id="info-mcp-count">0</span>)</div>
    <div class="mcp-list" id="info-mcps"></div>
  </div>
</div>

<div id="legend">
  <h3>Departments</h3>
  <div class="legend-item"><div class="legend-dot" style="background:var(--exec)"></div>Executive</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--hr)"></div>HR</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--meta)"></div>Meta Engineering (NEW)</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--intel)"></div>Intelligence</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--build)"></div>Build</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--quality)"></div>Quality Council</div>
  <div class="legend-item"><div class="legend-dot" style="background:var(--docs)"></div>Documentation</div>
</div>

<div id="zoom-controls">
  <button class="btn" onclick="zoomIn()">+</button>
  <button class="btn" onclick="zoomOut()">&minus;</button>
</div>

<div id="help">Click node = expand/collapse &nbsp;|&nbsp; Scroll = zoom &nbsp;|&nbsp; Drag = pan &nbsp;|&nbsp; Use tier filter to highlight MCP owners</div>

<script>
const treeData = __TREE_DATA__;
const ALL_MCPS = __MCPS_DATA__;
const TIER_COLORS = __TIER_COLORS__;
const TIER_NAMES = __TIER_NAMES__;

// Populate tier filter
const filterBar = document.getElementById('mcp-filter');
for (let t = 1; t <= 8; t++) {
  const chip = document.createElement('span');
  chip.className = 'tier-chip';
  chip.setAttribute('data-tier', t);
  chip.onclick = () => filterByTier(t);
  chip.innerHTML = `<span class="dot" style="background:${TIER_COLORS[t]}"></span> T${t}: ${TIER_NAMES[t]}`;
  filterBar.appendChild(chip);
}

// Parent map + count
const parentMap = {};
(function buildParentMap(node, parent = null) {
  parentMap[node.name] = parent;
  if (node.children) node.children.forEach(c => buildParentMap(c, node));
})(treeData);

function countAll(node) {
  let n = 1;
  if (node.children) node.children.forEach(c => n += countAll(c));
  return n;
}
document.getElementById('stats').textContent = countAll(treeData) + ' agents';

const container = document.getElementById('chart-container');
const svg = d3.select('#chart');
const g = svg.append('g');
const zoom = d3.zoom().scaleExtent([0.1, 3])
  .on('zoom', (event) => g.attr('transform', event.transform));
svg.call(zoom);

const root = d3.hierarchy(treeData);
root.x0 = container.clientHeight / 2;
root.y0 = 0;
root.descendants().forEach(d => {
  if (d.depth > 1 && d.children) { d._children = d.children; d.children = null; }
});

const treeLayout = d3.tree().nodeSize([20, 200]);
let i = 0;
const duration = 400;
let activeTier = 0;

function update(source) {
  treeLayout(root);
  const nodes = root.descendants();
  const links = root.links();

  const node = g.selectAll('g.node').data(nodes, d => d.id || (d.id = ++i));

  const nodeEnter = node.enter().append('g')
    .attr('class', d => 'node dept-' + (d.data.dept || 'Unknown') +
                       (d.data.mcps && d.data.mcps.length > 0 ? ' has-mcps' : ''))
    .attr('transform', d => `translate(${source.y0},${source.x0})`)
    .on('click', (event, d) => {
      event.stopPropagation();
      toggle(d); update(d); showInfo(d);
    })
    .on('mouseenter', (event, d) => d3.select(event.currentTarget).classed('highlighted', true))
    .on('mouseleave', (event, d) => d3.select(event.currentTarget).classed('highlighted', false));

  nodeEnter.append('circle')
    .attr('r', d => d.depth === 0 ? 10 : d.depth === 1 ? 8 : d.depth === 2 ? 6 : 4)
    .style('fill-opacity', d => d._children ? 0.3 : 1);

  // Name + MCP badges
  nodeEnter.append('text')
    .attr('dy', '0.31em')
    .attr('x', d => (d._children || d.children) ? 12 : 8)
    .attr('text-anchor', 'start')
    .each(function(d) {
      const text = d3.select(this);
      text.append('tspan').text(d.data.name)
        .style('font-weight', d => d.depth <= 2 ? 600 : 400)
        .style('font-size', d => d.depth === 0 ? '13px' : d.depth === 1 ? '11px' : '10px');
      // Add MCP tier dots as colored tspan
      if (d.data.mcps && d.data.mcps.length > 0) {
        const tiersOwned = [...new Set(d.data.mcps.map(m => m.tier))].sort();
        text.append('tspan').text(' ').attr('dx', 4);
        tiersOwned.forEach(t => {
          text.append('tspan')
            .text('\u25CF')  // ● filled circle
            .attr('fill', TIER_COLORS[t])
            .attr('font-size', '9px')
            .attr('dx', 1);
        });
        const count = d.data.mcps.length;
        text.append('tspan').text(` (${count})`)
          .attr('fill', '#94A3B8')
          .attr('font-size', '9px')
          .attr('dx', 2);
      }
    })
    .style('fill-opacity', 0);

  const nodeUpdate = nodeEnter.merge(node);
  nodeUpdate.transition().duration(duration)
    .attr('transform', d => `translate(${d.y},${d.x})`);
  nodeUpdate.select('circle')
    .attr('r', d => d.depth === 0 ? 10 : d.depth === 1 ? 8 : d.depth === 2 ? 6 : 4)
    .style('fill-opacity', d => d._children ? 0.3 : 1);
  nodeUpdate.select('text').transition().duration(duration).style('fill-opacity', 1);

  const nodeExit = node.exit().transition().duration(duration)
    .attr('transform', d => `translate(${source.y},${source.x})`).remove();
  nodeExit.select('circle').attr('r', 1e-6);
  nodeExit.select('text').style('fill-opacity', 1e-6);

  const link = g.selectAll('path.link').data(links, d => d.target.id);
  const linkEnter = link.enter().insert('path', 'g').attr('class', 'link')
    .attr('d', d => { const o = {x: source.x0, y: source.y0}; return diagonal(o, o); });
  linkEnter.merge(link).transition().duration(duration)
    .attr('d', d => diagonal(d.source, d.target));
  link.exit().transition().duration(duration)
    .attr('d', d => { const o = {x: source.x, y: source.y}; return diagonal(o, o); }).remove();

  root.eachBefore(d => { d.x0 = d.x; d.y0 = d.y; });
  applyTierFilter();
}

function diagonal(s, t) {
  return `M${s.y},${s.x}C${(s.y+t.y)/2},${s.x} ${(s.y+t.y)/2},${t.x} ${t.y},${t.x}`;
}

function toggle(d) {
  if (d.children) { d._children = d.children; d.children = null; }
  else if (d._children) { d.children = d._children; d._children = null; }
}

function showInfo(d) {
  const panel = document.getElementById('info-panel');
  document.getElementById('info-name').textContent = d.data.name;
  document.getElementById('info-role').textContent = d.data.role || '—';
  document.getElementById('info-dept').textContent = d.data.dept || '—';
  const areasField = document.getElementById('info-areas-field');
  if (d.data.areas) {
    areasField.style.display = 'block';
    document.getElementById('info-areas').textContent = d.data.areas;
  } else areasField.style.display = 'none';
  document.getElementById('info-function').textContent = d.data.function || '—';
  const parent = parentMap[d.data.name];
  const reportsField = document.getElementById('info-reports-field');
  if (parent) {
    reportsField.style.display = 'block';
    document.getElementById('info-reports').textContent = parent.name + ' (' + parent.role + ')';
  } else reportsField.style.display = 'none';
  const managesField = document.getElementById('info-manages-field');
  const children = d.data.children || d.data._children;
  if (children && children.length > 0) {
    managesField.style.display = 'block';
    const names = children.slice(0, 6).map(c => c.name).join(', ');
    const extra = children.length > 6 ? ` ... +${children.length - 6} more` : '';
    document.getElementById('info-manages').textContent = `${children.length} reports: ${names}${extra}`;
  } else managesField.style.display = 'none';

  // MCPs
  const mcpsField = document.getElementById('info-mcps-field');
  const mcpsList = document.getElementById('info-mcps');
  document.getElementById('info-mcp-count').textContent = d.data.mcps.length;
  if (d.data.mcps.length > 0) {
    mcpsField.style.display = 'block';
    mcpsList.innerHTML = d.data.mcps.map(m => `
      <div class="mcp-item">
        <span class="mcp-dot" style="background:${TIER_COLORS[m.tier]}"></span>
        <div>
          <div class="mcp-name">${m.name}</div>
          <div class="mcp-job">${m.job}</div>
        </div>
      </div>
    `).join('');
  } else {
    mcpsField.style.display = 'block';
    mcpsList.innerHTML = '<div style="font-size:11px;color:#94A3B8;padding:4px;">No direct MCP ownership (uses shared MCPs)</div>';
  }
  panel.classList.add('visible');
}

function closeInfo() { document.getElementById('info-panel').classList.remove('visible'); }

function expandAll() {
  root.descendants().forEach(d => { if (d._children) { d.children = d._children; d._children = null; } });
  update(root);
}
function collapseAll() {
  root.descendants().forEach(d => { if (d.depth > 1 && d.children) { d._children = d.children; d.children = null; } });
  update(root);
}
function resetView() { svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity); }
function zoomIn() { svg.transition().duration(200).call(zoom.scaleBy, 1.3); }
function zoomOut() { svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.3); }

// Filter by MCP tier
function filterByTier(tier) {
  activeTier = tier;
  document.querySelectorAll('.tier-chip').forEach(c => {
    c.classList.toggle('active', parseInt(c.getAttribute('data-tier')) === tier);
  });
  applyTierFilter();
}

function applyTierFilter() {
  d3.selectAll('.node').each(function(d) {
    const match = activeTier === 0 ||
      (d.data.mcps && d.data.mcps.some(m => m.tier === activeTier));
    d3.select(this).classed('mcp-filter-match', match && activeTier > 0)
      .style('opacity', (activeTier > 0 && !match) ? 0.25 : 1);
  });
}

// Search
document.getElementById('search').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  d3.selectAll('.node').classed('search-match', false);
  if (!q) return;
  const matches = root.descendants().filter(d =>
    d.data.name.toLowerCase().includes(q) ||
    (d.data.role && d.data.role.toLowerCase().includes(q)) ||
    (d.data.dept && d.data.dept.toLowerCase().includes(q)) ||
    (d.data.mcps && d.data.mcps.some(m => m.name.toLowerCase().includes(q)))
  );
  matches.forEach(m => {
    let p = m.parent;
    while (p) {
      if (p._children) { p.children = p._children; p._children = null; }
      p = p.parent;
    }
  });
  update(root);
  d3.selectAll('.node').each(function(d) {
    if (matches.includes(d)) d3.select(this).classed('search-match', true);
  });
});

svg.on('click', () => closeInfo());
update(root);
setTimeout(() => {
  const bbox = g.node().getBBox();
  const w = container.clientWidth, h = container.clientHeight;
  const scale = Math.min(w / (bbox.width + 100), h / (bbox.height + 100), 1);
  const tx = (w - bbox.width * scale) / 2 - bbox.x * scale;
  const ty = (h - bbox.height * scale) / 2 - bbox.y * scale + 20;
  svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}, 100);
</script>
</body>
</html>
"""

html = (html
    .replace("__TREE_DATA__", tree_json)
    .replace("__MCPS_DATA__", mcps_json)
    .replace("__TIER_COLORS__", tier_colors_json)
    .replace("__TIER_NAMES__", tier_names_json))

output_path = "/home/z/my-project/download/webforge-org-chart-with-mcps.html"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html)
print(f"Org chart with MCPs saved to: {output_path}")
print(f"File size: {os.path.getsize(output_path) / 1024:.1f} KB")
