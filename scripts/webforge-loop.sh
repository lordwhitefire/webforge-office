#!/bin/bash
#
# WebForge Autonomous Loop (Ralph Loop pattern)
# Keeps re-launching Hermes until the plan is 100% complete.
#
# Usage:
#   bash webforge-loop.sh
#
# Then walk away. The loop will:
#   1. Launch Hermes with a continuation prompt
#   2. Hermes runs (35 tool calls), recruits agents, delegates, updates plan
#   3. Hermes exits
#   4. Loop checks .webforge/plan.md for "PROJECT COMPLETE"
#   5. If not done — re-launches Hermes (fresh 35 calls)
#   6. Repeats until complete or max iterations reached
#
# The plan file (.webforge/plan.md) is the shared memory between iterations.
#

set -euo pipefail

# Configurable opencode command — defaults to "opencode". Override with:
#   OPENCODE_CMD=webforge bash webforge-loop.sh
# Useful when webforge is an alias that points to an isolated XDG config dir.
OPENCODE_CMD="${OPENCODE_CMD:-opencode}"

PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
PLAN_FILE="$PROJECT_DIR/.webforge/plan.md"
MAX_ITERATIONS="${MAX_ITERATIONS:-50}"
SLEEP_BETWEEN="${SLEEP_BETWEEN:-5}"
LOG_FILE="$PROJECT_DIR/.webforge/loop.log"

mkdir -p "$PROJECT_DIR/.webforge"

log() {
  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$ts] $*" | tee -a "$LOG_FILE"
}

is_complete() {
  if [ -f "$PLAN_FILE" ]; then
    if grep -q "## PROJECT COMPLETE" "$PLAN_FILE"; then
      return 0
    fi
  fi
  return 1
}

log "=== WebForge Ralph Loop starting ==="
log "Project dir: $PROJECT_DIR"
log "Plan file:   $PLAN_FILE"
log "Max iters:   $MAX_ITERATIONS"
log "Sleep:       ${SLEEP_BETWEEN}s between iterations"
log ""

if [ ! -f "$PLAN_FILE" ]; then
  log "No plan file found. First iteration will create one."
fi

for i in $(seq 1 "$MAX_ITERATIONS"); do
  log "=== Iteration $i / $MAX_ITERATIONS ==="

  if is_complete; then
    log "✅ PROJECT COMPLETE — stopping loop."
    exit 0
  fi

  log "Launching Hermes..."
  "$OPENCODE_CMD" run "Continue the WebForge project. Read .webforge/plan.md to see what's done and what's left. Recruit agents via Voss if needed (task subagent_type=voss). Update the plan as you go via the update_plan tool. Say PROJECT COMPLETE (set project_complete=true in update_plan) only when everything is verified done." 2>&1 | tee -a "$LOG_FILE"

  if is_complete; then
    log "✅ PROJECT COMPLETE — stopping loop."
    exit 0
  fi

  if [ "$i" -lt "$MAX_ITERATIONS" ]; then
    log "Work remains. Sleeping ${SLEEP_BETWEEN}s before re-launching..."
    sleep "$SLEEP_BETWEEN"
  fi
done

log "⚠️  Reached max iterations ($MAX_ITERATIONS). Stopping."
log "Check $PLAN_FILE for remaining work."
log "To resume: bash webforge-loop.sh"
exit 1
