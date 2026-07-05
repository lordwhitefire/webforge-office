#!/usr/bin/env python3
"""
Build the complete Jr-* → Sr-* assignment table.

Each Junior reports to a specific Senior based on their sub-department:
  Frontend Juniors → one of Sr-Hale, Sr-Vance, Sr-Brook, Sr-Quill2 (under Lead-Faro)
  Backend Juniors  → one of Sr-Stone, Sr-Iron, Sr-Earth, Sr-Cloud (under Lead-Terra)
  DB/Infra Juniors → one of Sr-Water, Sr-Wood, Sr-Fire, Sr-Steel (under Lead-Zen)

Distribution: round-robin within each sub-department.
"""

import sys, os
from pathlib import Path
from collections import defaultdict

sys.path.insert(0, str(Path.home() / "webforge" / "mcp"))
os.environ["WEBFORGE_PROJECT"] = "/home/z/my-project"

# Parse jr-* agent files to get sub-department + areas
agents_dir = Path.home() / "webforge" / "agents"

juniors = []
for f in sorted(agents_dir.glob("jr-*.py")):
    name = f.stem  # jr-ash
    content = f.read_text()

    # Parse role line: "Role: I am JrAsh. I am a Junior X Developer. I report to Y."
    role_line = ""
    for line in content.split("\n"):
        if line.startswith("Role:"):
            role_line = line
            break

    # Determine sub-department from 'reports to' field
    sub_dept = "Frontend"  # default
    if "Aurora" in role_line:
        sub_dept = "Frontend"
    elif "Titan" in role_line:
        sub_dept = "Backend"
    elif "Zephyr" in role_line:
        sub_dept = "Database/Infra"
    elif "Frontend" in role_line:
        sub_dept = "Frontend"
    elif "Backend" in role_line:
        sub_dept = "Backend"
    elif "Database" in role_line or "Infra" in role_line:
        sub_dept = "Database/Infra"

    # Parse areas
    areas = ""
    for line in content.split("\n"):
        if line.startswith("Areas:"):
            areas = line.replace("Areas:", "").strip()
            break

    juniors.append({
        "name": name,
        "sub_dept": sub_dept,
        "areas": areas,
        "role_line": role_line,
    })

# Seniors by sub-department
seniors = {
    "Frontend": ["Sr-Hale", "Sr-Vance", "Sr-Brook", "Sr-Quill2"],
    "Backend": ["Sr-Stone", "Sr-Iron", "Sr-Earth", "Sr-Cloud"],
    "Database/Infra": ["Sr-Water", "Sr-Wood", "Sr-Fire", "Sr-Steel"],
}

# Assign round-robin
counters = defaultdict(int)
assignments = {}
for j in juniors:
    sub = j["sub_dept"]
    if sub not in seniors:
        # Try to infer from areas or default
        sub = "Frontend"  # default for generic "Build" agents

    sr_list = seniors[sub]
    sr = sr_list[counters[sub] % len(sr_list)]
    counters[sub] += 1
    assignments[j["name"]] = {
        "senior": sr,
        "sub_dept": sub,
        "areas": j["areas"],
    }

# Print the assignment table
print("=" * 80)
print("JUNIOR → SENIOR ASSIGNMENT TABLE")
print("=" * 80)

for sub_dept in ["Frontend", "Backend", "Database/Infra"]:
    print(f"\n--- {sub_dept} ---")
    sr_list = seniors[sub_dept]
    for sr in sr_list:
        print(f"\n  {sr} (reports to Lead-{'Faro' if sub_dept == 'Frontend' else 'Terra' if sub_dept == 'Backend' else 'Zen'}):")
        for j_name, info in sorted(assignments.items()):
            if info["senior"] == sr:
                print(f"    → {j_name} (areas: {info['areas']})")

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
for sub_dept in ["Frontend", "Backend", "Database/Infra"]:
    total = sum(1 for a in assignments.values() if a["sub_dept"] == sub_dept)
    print(f"  {sub_dept}: {total} juniors across {len(seniors[sub_dept])} seniors")
print(f"  TOTAL: {len(assignments)} juniors assigned")

# Save to JSON for use by the skill file generator
import json
output_path = Path("/home/z/my-project/scripts/jr_sr_assignments.json")
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(json.dumps(assignments, indent=2))
print(f"\nSaved to: {output_path}")
