#!/usr/bin/env python3
"""
MCP Map: visualizes all 46 MCPs and the agents that own them.
Bipartite-style force-directed graph:
  - MCPs on the left (colored by tier)
  - Owning agents on the right (colored by department)
  - Click an MCP to highlight its owner(s); click an agent to highlight its MCPs
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from mcp_data import MCPS, TIER_COLORS, TIER_NAMES

# ---------------------------------------------------------------------------
# Build the bipartite graph: MCPs ↔ Agents
# ---------------------------------------------------------------------------
# Expand owner strings into specific agent nodes
# Some MCPs have multiple agents (e.g. "Build Team" → many agents), we keep
# them as a single group node to avoid 200+ edges.

# Department colors (same as org chart)
DEPT_COLORS = {
    "Executive": "#A78BFA",
    "HR": "#22D3EE",
    "Meta": "#F472B6",
    "Intelligence": "#60A5FA",
    "Build": "#34D399",
    "Quality": "#FB7185",
    "Documentation": "#FBBF24",
    "Shared": "#94A3B8",  # for "Everyone"
}

# Resolve each owner string to (display_name, dept)
def resolve_owner(owner, mcp_name):
    """Return (display_name, dept) for an owner string."""
    if owner == "Everyone":
        return ("All Agents", "Shared")
    if owner == "Build Team":
        return ("Build Team (all)", "Build")
    if owner == "Embedded Docs":
        return ("51 Embedded Doc Agents", "Documentation")
    if owner == "SEO Agent":
        return ("SEO Agent", "Build")  # SEO agent lives in Build dept
    # Specific agents → look up dept
    dept_map = {
        "Hermes": "Executive", "CEO": "Executive",
        "Voss": "HR", "Rook": "HR", "Weld": "HR",
        "Daedalus": "Meta", "Forge": "Meta", "Anvil": "Meta",
        "Loom": "Meta", "Compass": "Meta",
        "Athena": "Intelligence", "Dorian": "Intelligence",
        "Odin Team": "Intelligence",
        "Hephaestus": "Build", "Aurora": "Build", "Titan": "Build",
        "Zephyr": "Build", "Lead-Faro": "Build", "Lead-Terra": "Build",
        "Lead-Zen": "Build",
        "Minos": "Quality",
        "Verdict Team": "Quality", "Pixel-Core": "Quality",
        "Sentry-Core": "Quality", "Scalpel-Core": "Quality",
        "Pulse-Core": "Quality", "Janus-Core": "Quality", "Patch-Core": "Quality",
        "Thoth": "Documentation", "Quill": "Documentation",
        "Scroll": "Documentation", "Stamp": "Documentation",
        "Ledger": "Documentation", "Draft": "Documentation",
        "Memory-Architecture": "Documentation",
    }
    return (owner, dept_map.get(owner, "Shared"))

# Build nodes and links
mcp_nodes = []
agent_nodes = []
links = []
agent_seen = {}

for m in MCPS:
    mcp_id = m["id"]
    mcp_nodes.append({
        "id": mcp_id,
        "type": "mcp",
        "name": m["name"],
        "tier": m["tier"],
        "tierName": TIER_NAMES[m["tier"]],
        "color": TIER_COLORS[m["tier"]],
        "job": m["job"],
    })
    owner_display, dept = resolve_owner(m["owner"], m["name"])
    agent_key = "agent:" + owner_display
    if agent_key not in agent_seen:
        agent_seen[agent_key] = True
        agent_nodes.append({
            "id": agent_key,
            "type": "agent",
            "name": owner_display,
            "dept": dept,
            "color": DEPT_COLORS.get(dept, "#94A3B8"),
        })
    links.append({"source": mcp_id, "target": agent_key})

all_nodes = mcp_nodes + agent_nodes

# ---------------------------------------------------------------------------
# HTML
# ---------------------------------------------------------------------------
graph_json = json.dumps({"nodes": all_nodes, "links": links}, ensure_ascii=False)
tier_colors_json = json.dumps(TIER_COLORS)
tier_names_json = json.dumps(TIER_NAMES)
dept_colors_json = json.dumps(DEPT_COLORS)
mcps_count = len(MCPS)
agents_count = len(agent_nodes)
links_count = len(links)

html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WebForge MCP Map — MCPs ↔ Agents</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>
  :root {
    --bg: #0F172A;
    --bg-panel: #1E293B;
    --bg-card: #334155;
    --text: #F1F5F9;
    --text-muted: #94A3B8;
    --border: #475569;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text);
    font-family: 'Inter', -apple-system, sans-serif;
    overflow: hidden; height: 100vh; }

  #topbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: var(--bg-panel); border-bottom: 1px solid var(--border);
    padding: 10px 18px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  #topbar h1 { font-size: 15px; font-weight: 700; white-space: nowrap;
    background: linear-gradient(90deg, #EF4444, #FBBF24, #34D399, #22D3EE, #A78BFA);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  #topbar .stats { font-size: 11px; color: var(--text-muted);
    background: var(--bg-card); padding: 4px 10px; border-radius: 6px; }
  #search { flex: 1; max-width: 240px; min-width: 120px;
    background: var(--bg-card); border: 1px solid var(--border);
    color: var(--text); padding: 5px 10px; border-radius: 6px; font-size: 12px; outline: none; }
  #search:focus { border-color: #60A5FA; }
  .btn { background: var(--bg-card); color: var(--text); border: 1px solid var(--border);
    padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; transition: all 0.15s; }
  .btn:hover { background: var(--border); }

  /* Tier filter */
  #tier-filter { position: fixed; top: 48px; left: 0; right: 0; z-index: 99;
    background: var(--bg-panel); border-bottom: 1px solid var(--border);
    padding: 6px 16px; display: flex; align-items: center; gap: 8px;
    flex-wrap: wrap; font-size: 11px; }
  #tier-filter .label { color: var(--text-muted); font-weight: 600; margin-right: 4px; }
  .tier-chip { display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 10px; cursor: pointer;
    background: var(--bg-card); border: 1px solid var(--border); transition: all 0.15s; }
  .tier-chip:hover { background: var(--border); }
  .tier-chip.active { border-color: var(--text); }
  .tier-chip .dot { width: 8px; height: 8px; border-radius: 50%; }

  /* Side panels */
  #info-panel { position: fixed; top: 90px; right: 12px; z-index: 100;
    background: var(--bg-panel); border: 1px solid var(--border);
    border-radius: 8px; padding: 14px 18px;
    width: 300px; max-height: 75vh; overflow-y: auto; display: none; }
  #info-panel.visible { display: block; }
  #info-panel h2 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  #info-panel .meta { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }
  #info-panel .field { margin: 8px 0; }
  #info-panel .field-label { font-size: 9px; text-transform: uppercase;
    letter-spacing: 0.5px; color: var(--text-muted); }
  #info-panel .field-value { font-size: 12px; margin-top: 2px; }
  #info-panel .close { position: absolute; top: 6px; right: 10px;
    background: none; border: none; color: var(--text-muted);
    font-size: 18px; cursor: pointer; }
  #info-panel .close:hover { color: var(--text); }
  #info-panel .conn-item { display: flex; align-items: center; gap: 6px;
    padding: 4px 6px; margin: 3px 0; border-radius: 4px;
    background: var(--bg-card); font-size: 11px; cursor: pointer; }
  #info-panel .conn-item:hover { background: var(--border); }
  #info-panel .conn-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* Legend */
  #legend { position: fixed; bottom: 12px; left: 12px; z-index: 100;
    background: var(--bg-panel); border: 1px solid var(--border);
    border-radius: 8px; padding: 10px 14px; font-size: 11px; }
  #legend h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
    color: var(--text-muted); margin-bottom: 6px; }
  .legend-item { display: flex; align-items: center; gap: 6px; margin: 3px 0; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
  .legend-section { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border); }

  #chart-container { position: fixed; top: 84px; left: 0; right: 0; bottom: 0;
    overflow: hidden; }
  svg { width: 100%; height: 100%; }

  /* Graph nodes */
  .node circle { cursor: pointer; stroke: #fff; stroke-width: 1.5px; transition: r 0.15s; }
  .node:hover circle { stroke: #FDE047; stroke-width: 2.5px; }
  .node text { font-size: 10px; fill: var(--text); pointer-events: none;
    text-anchor: middle; font-weight: 500; }
  .node.mcp text { font-weight: 600; }
  .node.dimmed { opacity: 0.15; }
  .node.highlighted circle { stroke: #FDE047; stroke-width: 3px;
    filter: drop-shadow(0 0 8px #FDE047); }
  .node.mcp { }
  .node.agent { }

  .link { stroke: var(--border); stroke-opacity: 0.4; stroke-width: 1px; }
  .link.highlighted { stroke: #FDE047; stroke-opacity: 1; stroke-width: 2.5px; }
  .link.dimmed { stroke-opacity: 0.05; }

  #help { position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%);
    z-index: 99; font-size: 10px; color: var(--text-muted);
    background: var(--bg-panel); padding: 5px 12px; border-radius: 20px;
    border: 1px solid var(--border); }
</style>
</head>
<body>

<div id="topbar">
  <h1>WebForge MCP Map</h1>
  <span class="stats" id="stats">— MCPs · — agents · — links</span>
  <input type="text" id="search" placeholder="Search MCPs or agents..." />
  <button class="btn" onclick="resetHighlight()">Clear</button>
  <button class="btn" onclick="restart()">Re-layout</button>
</div>

<div id="tier-filter">
  <span class="label">Filter MCPs by tier:</span>
  <span class="tier-chip active" data-tier="0" onclick="filterByTier(0)">
    <span class="dot" style="background:#94A3B8"></span> All
  </span>
</div>

<div id="chart-container"><svg id="chart"></svg></div>

<div id="info-panel">
  <button class="close" onclick="closeInfo()">&times;</button>
  <h2 id="info-name"></h2>
  <div class="meta" id="info-meta"></div>
  <div class="field"><div class="field-label">Description</div>
    <div class="field-value" id="info-desc"></div></div>
  <div class="field" id="info-tier-field"><div class="field-label">Tier</div>
    <div class="field-value" id="info-tier"></div></div>
  <div class="field" id="info-dept-field"><div class="field-label">Department</div>
    <div class="field-value" id="info-dept"></div></div>
  <div class="field" id="info-conn-field">
    <div class="field-label" id="info-conn-label">Connected</div>
    <div id="info-connections"></div>
  </div>
</div>

<div id="legend">
  <h3>MCP Tiers</h3>
  <div class="legend-item"><div class="legend-dot" style="background:#EF4444"></div>T1 Foundation</div>
  <div class="legend-item"><div class="legend-dot" style="background:#F97316"></div>T2 Core Ops</div>
  <div class="legend-item"><div class="legend-dot" style="background:#FBBF24"></div>T3 Documentation</div>
  <div class="legend-item"><div class="legend-dot" style="background:#34D399"></div>T4 Quality</div>
  <div class="legend-item"><div class="legend-dot" style="background:#22D3EE"></div>T5 Research</div>
  <div class="legend-item"><div class="legend-dot" style="background:#A78BFA"></div>T6 Runtime</div>
  <div class="legend-item"><div class="legend-dot" style="background:#94A3B8"></div>T7 Specialized</div>
  <div class="legend-item"><div class="legend-dot" style="background:#F472B6"></div>T8 Meta Engineering (NEW)</div>
  <div class="legend-section">
    <h3>Agents (by Dept)</h3>
    <div class="legend-item"><div class="legend-dot" style="background:#A78BFA"></div>Executive</div>
    <div class="legend-item"><div class="legend-dot" style="background:#22D3EE"></div>HR</div>
    <div class="legend-item"><div class="legend-dot" style="background:#F472B6"></div>Meta Engineering (NEW)</div>
    <div class="legend-item"><div class="legend-dot" style="background:#60A5FA"></div>Intelligence</div>
    <div class="legend-item"><div class="legend-dot" style="background:#34D399"></div>Build</div>
    <div class="legend-item"><div class="legend-dot" style="background:#FB7185"></div>Quality</div>
    <div class="legend-item"><div class="legend-dot" style="background:#FBBF24"></div>Documentation</div>
    <div class="legend-item"><div class="legend-dot" style="background:#94A3B8"></div>Shared</div>
  </div>
</div>

<div id="help">Click any node to highlight its connections &nbsp;|&nbsp; Scroll = zoom &nbsp;|&nbsp; Drag = pan &nbsp;|&nbsp; Drag node = reposition</div>

<script>
const graph = __GRAPH_DATA__;
const TIER_COLORS = __TIER_COLORS__;
const TIER_NAMES = __TIER_NAMES__;
const DEPT_COLORS = __DEPT_COLORS__;

// Populate tier filter
const filterBar = document.getElementById('tier-filter');
for (let t = 1; t <= 8; t++) {
  const chip = document.createElement('span');
  chip.className = 'tier-chip';
  chip.setAttribute('data-tier', t);
  chip.onclick = () => filterByTier(t);
  chip.innerHTML = `<span class="dot" style="background:${TIER_COLORS[t]}"></span> T${t}: ${TIER_NAMES[t]}`;
  filterBar.appendChild(chip);
}

// Stats
document.getElementById('stats').textContent =
  graph.nodes.filter(n => n.type === 'mcp').length + ' MCPs · ' +
  graph.nodes.filter(n => n.type === 'agent').length + ' agents · ' +
  graph.links.length + ' links';

const container = document.getElementById('chart-container');
const width = container.clientWidth;
const height = container.clientHeight;

const svg = d3.select('#chart');
const g = svg.append('g');

const zoom = d3.zoom().scaleExtent([0.2, 3])
  .on('zoom', (event) => g.attr('transform', event.transform));
svg.call(zoom);

// Force simulation
const simulation = d3.forceSimulation(graph.nodes)
  .force('link', d3.forceLink(graph.links).id(d => d.id).distance(d => 90).strength(0.6))
  .force('charge', d3.forceManyBody().strength(d => d.type === 'mcp' ? -250 : -200))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide().radius(d => d.type === 'mcp' ? 24 : 18))
  .force('x', d3.forceX(d => d.type === 'mcp' ? width * 0.3 : width * 0.7).strength(0.08))
  .force('y', d3.forceY(height / 2).strength(0.04));

// Links
const link = g.append('g').attr('class', 'links')
  .selectAll('line').data(graph.links).enter().append('line')
  .attr('class', 'link');

// Nodes
const node = g.append('g').attr('class', 'nodes')
  .selectAll('g').data(graph.nodes).enter().append('g')
  .attr('class', d => 'node ' + d.type)
  .call(d3.drag()
    .on('start', dragStarted)
    .on('drag', dragged)
    .on('end', dragEnded));

node.append('circle')
  .attr('r', d => d.type === 'mcp' ? 12 : 9)
  .attr('fill', d => d.color);

node.append('text')
  .attr('dy', d => d.type === 'mcp' ? -18 : 16)
  .text(d => {
    if (d.type === 'mcp') {
      // Show short name
      return d.name.replace(' MCP', '');
    }
    return d.name;
  })
  .style('font-size', d => d.type === 'mcp' ? '10px' : '9px');

// Build node lookup
const nodeById = {};
graph.nodes.forEach(n => nodeById[n.id] = n);

// Build adjacency
const neighbors = {};
graph.links.forEach(l => {
  const s = typeof l.source === 'object' ? l.source.id : l.source;
  const t = typeof l.target === 'object' ? l.target.id : l.target;
  if (!neighbors[s]) neighbors[s] = new Set();
  if (!neighbors[t]) neighbors[t] = new Set();
  neighbors[s].add(t);
  neighbors[t].add(s);
});

node.on('click', (event, d) => {
  event.stopPropagation();
  highlightNode(d);
});

svg.on('click', () => { closeInfo(); resetHighlight(); });

function highlightNode(d) {
  resetHighlight();
  const ids = new Set([d.id]);
  if (neighbors[d.id]) neighbors[d.id].forEach(n => ids.add(n));

  node.classed('highlighted', n => n.id === d.id)
      .classed('dimmed', n => !ids.has(n.id));

  link.classed('highlighted', l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return s === d.id || t === d.id;
      })
      .classed('dimmed', l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return s !== d.id && t !== d.id;
      });

  showInfo(d);
}

function resetHighlight() {
  node.classed('highlighted', false).classed('dimmed', false);
  link.classed('highlighted', false).classed('dimmed', false);
}

function showInfo(d) {
  const panel = document.getElementById('info-panel');
  document.getElementById('info-name').textContent = d.name;
  document.getElementById('info-meta').textContent =
    d.type === 'mcp' ? `MCP · Tier ${d.tier}: ${d.tierName}` : `Agent · ${d.dept}`;
  document.getElementById('info-desc').textContent =
    d.type === 'mcp' ? d.job : 'Owner of one or more MCPs';

  const tierField = document.getElementById('info-tier-field');
  const deptField = document.getElementById('info-dept-field');
  if (d.type === 'mcp') {
    tierField.style.display = 'block';
    document.getElementById('info-tier').textContent = `T${d.tier} — ${d.tierName}`;
    deptField.style.display = 'none';
  } else {
    tierField.style.display = 'none';
    deptField.style.display = 'block';
    document.getElementById('info-dept').textContent = d.dept;
  }

  // Connections
  const connLabel = document.getElementById('info-conn-label');
  const connList = document.getElementById('info-connections');
  const conn = neighbors[d.id] || new Set();
  connLabel.textContent = d.type === 'mcp' ? 'Owned by' : 'Owns MCPs';
  if (conn.size === 0) {
    connList.innerHTML = '<div style="font-size:11px;color:#94A3B8;padding:4px;">No connections</div>';
  } else {
    connList.innerHTML = Array.from(conn).map(id => {
      const n = nodeById[id];
      return `<div class="conn-item" onclick="event.stopPropagation(); highlightNode(nodeById['${id}'])">
        <span class="conn-dot" style="background:${n.color}"></span>
        <div>
          <div style="font-weight:600">${n.name}</div>
          <div style="color:#94A3B8;font-size:10px">${n.type === 'mcp' ? 'T'+n.tier+': '+n.tierName : n.dept}</div>
        </div>
      </div>`;
    }).join('');
  }
  panel.classList.add('visible');
}

function closeInfo() { document.getElementById('info-panel').classList.remove('visible'); }

function filterByTier(tier) {
  document.querySelectorAll('.tier-chip').forEach(c => {
    c.classList.toggle('active', parseInt(c.getAttribute('data-tier')) === tier);
  });
  if (tier === 0) {
    node.style('display', 'block');
    link.style('display', 'block');
  } else {
    const visibleMcpIds = new Set();
    graph.nodes.forEach(n => {
      if (n.type === 'mcp' && n.tier === tier) visibleMcpIds.add(n.id);
    });
    // Show only MCPs of this tier + their connected agents
    const visibleAgentIds = new Set();
    graph.links.forEach(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      if (visibleMcpIds.has(s)) visibleAgentIds.add(t);
      if (visibleMcpIds.has(t)) visibleAgentIds.add(s);
    });
    node.style('display', n => {
      if (n.type === 'mcp') return visibleMcpIds.has(n.id) ? 'block' : 'none';
      return visibleAgentIds.has(n.id) ? 'block' : 'none';
    });
    link.style('display', l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return (visibleMcpIds.has(s) || visibleMcpIds.has(t)) ? 'block' : 'none';
    });
  }
  restart();
}

function restart() {
  simulation.alpha(0.7).restart();
}

// Search
document.getElementById('search').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) { resetHighlight(); return; }
  const matches = graph.nodes.filter(n =>
    n.name.toLowerCase().includes(q) ||
    (n.job && n.job.toLowerCase().includes(q)) ||
    (n.dept && n.dept.toLowerCase().includes(q)) ||
    (n.tierName && n.tierName.toLowerCase().includes(q))
  );
  if (matches.length === 0) return;
  const matchIds = new Set(matches.map(m => m.id));
  // Expand to include neighbors
  matches.forEach(m => {
    if (neighbors[m.id]) neighbors[m.id].forEach(n => matchIds.add(n));
  });
  node.classed('highlighted', n => matches.some(m => m.id === n.id))
      .classed('dimmed', n => !matchIds.has(n.id));
  link.classed('highlighted', l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return matches.some(m => m.id === s || m.id === t);
      })
      .classed('dimmed', l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return !matches.some(m => m.id === s || m.id === t);
      });
});

// Drag
function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x; d.fy = d.y;
}
function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null; d.fy = null;
}

// Tick
simulation.on('tick', () => {
  link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
  node.attr('transform', d => `translate(${d.x},${d.y})`);
});

// Initial zoom to fit
setTimeout(() => {
  const bbox = g.node().getBBox();
  const scale = Math.min(width / (bbox.width + 100), height / (bbox.height + 100), 1);
  const tx = (width - bbox.width * scale) / 2 - bbox.x * scale;
  const ty = (height - bbox.height * scale) / 2 - bbox.y * scale;
  svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}, 1500);

window.addEventListener('resize', () => {
  simulation.force('center', d3.forceCenter(container.clientWidth / 2, container.clientHeight / 2));
  simulation.alpha(0.3).restart();
});
</script>
</body>
</html>
"""

html = (html
    .replace("__GRAPH_DATA__", graph_json)
    .replace("__TIER_COLORS__", tier_colors_json)
    .replace("__TIER_NAMES__", tier_names_json)
    .replace("__DEPT_COLORS__", dept_colors_json))

output_path = "/home/z/my-project/download/webforge-mcp-map.html"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html)
print(f"MCP Map saved to: {output_path}")
print(f"File size: {os.path.getsize(output_path) / 1024:.1f} KB")
print(f"Graph: {len(all_nodes)} nodes ({len(mcp_nodes)} MCPs + {len(agent_nodes)} agents), {len(links)} links")
