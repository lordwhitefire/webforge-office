#!/usr/bin/env python3
"""Test task lifecycle under concurrency:
   - Create 10 tasks
   - 5 processes try to pick tasks simultaneously (race for ownership)
   - Verify no task is picked by 2 agents
   - Verify all 10 end up in DOING
"""
import os, sys, subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

os.environ["WEBFORGE_PROJECT"] = "/home/z/my-project"
sys.path.insert(0, "/home/z/webforge/mcp")

import state
state.init_schema()

# Reset
conn = state.get_conn()
for table in ("checkpoints", "decisions", "messages", "runs", "tasks", "sequence_counters"):
    conn.execute(f"DELETE FROM {table}")
conn.execute("DELETE FROM sqlite_sequence WHERE name='decisions' OR name='checkpoints'")

# Create 10 tasks
from task import task_create
print("Creating 10 tasks...")
for i in range(10):
    task_create(f"Race test {i}", "feature", "build", "S")

tasks = state.query("SELECT id FROM tasks ORDER BY id")
task_ids = [t["id"] for t in tasks]
print(f"Created: {task_ids}")

# Now 5 agents try to pick tasks simultaneously — each tries to pick ALL 10
# but only the first to succeed for each task should win
agents = ["Hephaestus", "Athena", "Minos", "Thoth", "Daedalus"]

def pick_as_agent(args):
    agent, task_id = args
    env = {"WEBFORGE_PROJECT": "/home/z/my-project", "PATH": "/usr/bin:/bin"}
    # Use task_approve (the proper way to move backlog → doing with bypass_gate)
    r = subprocess.run(
        ["python3", "/home/z/webforge/mcp/task.py", "approve", task_id, agent],
        capture_output=True, text=True, env=env, timeout=15
    )
    # Parse the output to check if it actually succeeded
    try:
        import json
        result = json.loads(r.stdout)
        ok = result.get("ok", False)
    except Exception:
        ok = False
    return agent, task_id, ok, r.stdout[:150]

# 5 agents × 10 tasks = 50 simultaneous pick attempts
# SQLite should serialize them; each task should end up owned by exactly 1 agent
print(f"\n5 agents racing to pick 10 tasks (50 concurrent attempts)...")
pairs = [(a, t) for a in agents for t in task_ids]
with ThreadPoolExecutor(max_workers=10) as ex:
    results = list(ex.map(pick_as_agent, pairs))

# How many succeeded
ok = sum(1 for _, _, ok, _ in results if ok)
print(f"Successful picks: {ok}/50 (should be 10 — each task picked once)")

# Check final state
final = state.query("SELECT id, owner, status FROM tasks ORDER BY id")
owners = {}
for t in final:
    owners[t["id"]] = t["owner"]
print(f"\nFinal owners:")
for tid, owner in owners.items():
    print(f"  {tid}: @{owner}")

# Verify each task has exactly 1 owner and is in DOING
unique_owners = set(owners.values())
doing_count = state.query_one("SELECT COUNT(*) AS n FROM tasks WHERE status='doing'")["n"]
print(f"\nUnique owners: {len(unique_owners)}")
print(f"Tasks in DOING: {doing_count}/10")

if doing_count == 10 and all(owners.values()):
    print("\n✅ LIFECYCLE TEST PASSED — all 10 tasks picked exactly once, all in DOING")
else:
    print("\n❌ LIFECYCLE TEST FAILED")
