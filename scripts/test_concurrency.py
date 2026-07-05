#!/usr/bin/env python3
"""Test concurrency: 5 processes each creating 4 tasks simultaneously.
   With the old board.json, this would have caused last-writer-wins loss.
   With SQLite + WAL, all 20 tasks should be created."""
import os, sys, subprocess, time
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor

os.environ["WEBFORGE_PROJECT"] = "/home/z/my-project"
sys.path.insert(0, "/home/z/webforge/mcp")

import state
state.init_schema()

# Reset
conn = state.get_conn()
for table in ("checkpoints", "decisions", "messages", "runs", "tasks", "sequence_counters"):
    conn.execute(f"DELETE FROM {table}")
conn.execute("DELETE FROM sqlite_sequence WHERE name='decisions' OR name='checkpoints'")

def create_one(i):
    """Create one task — called from a separate process."""
    env = os.environ.copy()
    env["WEBFORGE_PROJECT"] = "/home/z/my-project"
    r = subprocess.run(
        ["python3", "/home/z/webforge/mcp/task.py", "create",
         f"Concurrency test {i}", "feature", "build", "S"],
        capture_output=True, text=True, env=env, timeout=10
    )
    return r.returncode == 0, r.stdout[:100]

if __name__ == "__main__":
    print("=== Concurrency test: 20 tasks from 20 processes ===")
    start = time.time()
    with ProcessPoolExecutor(max_workers=10) as ex:
        results = list(ex.map(create_one, range(20)))
    elapsed = time.time() - start

    ok_count = sum(1 for ok, _ in results if ok)
    fail_count = 20 - ok_count
    print(f"\nCreated {ok_count}/20 tasks in {elapsed:.2f}s ({fail_count} failed)")

    # Check the actual count in the DB
    n = state.query_one("SELECT COUNT(*) AS n FROM tasks")["n"]
    print(f"Database has {n} task rows")
    if n == 20:
        print("\n✅ CONCURRENCY TEST PASSED — all 20 tasks persisted")
    else:
        print(f"\n❌ CONCURRENCY TEST FAILED — expected 20, got {n}")
        # Show which ones failed
        for i, (ok, out) in enumerate(results):
            if not ok:
                print(f"  Task {i} failed: {out}")
