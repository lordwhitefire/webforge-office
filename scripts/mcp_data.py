"""
WebForge MCP definitions and agent→MCP ownership map.
Shared by both the org chart and the MCP map.
"""

# ── All 46 MCPs grouped by tier ──
# Each: id, name, owner_agent (string or list), tier, job
MCPS = [
    # ── Tier 1 — Foundation ──
    {"id": "m01", "name": "Pipeline MCP",            "owner": "Hermes",         "tier": 1, "job": "Trigger chain — wake, pause, pass info between agents"},
    {"id": "m02", "name": "Memory MCP",              "owner": "Quill",          "tier": 1, "job": "Read/write memory files, enforce 300-line rule"},
    {"id": "m03", "name": "Skill Loader MCP",        "owner": "Hermes",         "tier": 1, "job": "Fetch correct skill MD files per agent + area"},
    {"id": "m04", "name": "File System MCP",         "owner": "Everyone",       "tier": 1, "job": "Read/write/delete files. Foundation for all agents"},
    {"id": "m05", "name": "Search MCP",              "owner": "Everyone",       "tier": 1, "job": "Search codebase (grep, glob, find)"},

    # ── Tier 2 — Core Ops ──
    {"id": "m06", "name": "Progress MCP",            "owner": "Hermes",         "tier": 2, "job": "Track what's built, enable crash recovery"},
    {"id": "m07", "name": "Registry MCP",            "owner": "Rook",           "tier": 2, "job": "Create/activate/deactivate named agents"},
    {"id": "m08", "name": "HR MCP",                  "owner": "Voss",           "tier": 2, "job": "Spawn/terminate temporary numbered workers (5-Unit Law)"},
    {"id": "m09", "name": "Git MCP",                 "owner": "Stamp",          "tier": 2, "job": "Stage, commit, generate commit messages"},
    {"id": "m10", "name": "CEO Communication MCP",   "owner": "CEO",            "tier": 2, "job": "Bridge between developer and the pipeline"},
    {"id": "m11", "name": "Code Execution MCP",      "owner": "Build Team",     "tier": 2, "job": "Run code, scripts, builds, tests on demand"},
    {"id": "m12", "name": "Linter MCP",              "owner": "Build Team",     "tier": 2, "job": "Run ESLint, Prettier, type-check. Fails build if dirty"},

    # ── Tier 3 — Documentation (the gaps) ──
    {"id": "m13", "name": "Real-Time Doc Capture MCP", "owner": "Embedded Docs",  "tier": 3, "job": "Watches agent actions, writes to memory/docs in real time (Law 6)"},
    {"id": "m14", "name": "Changelog MCP",            "owner": "Scroll",         "tier": 3, "job": "Auto-generate changelog entries from git diffs"},
    {"id": "m15", "name": "README MCP",               "owner": "Scroll",         "tier": 3, "job": "Keep README in sync with project state"},
    {"id": "m16", "name": "API Documentation MCP",    "owner": "Draft",          "tier": 3, "job": "Generate API docs from code (OpenAPI/Swagger)"},
    {"id": "m17", "name": "Component Documentation MCP","owner": "Draft",         "tier": 3, "job": "Generate component docs from code (Storybook)"},
    {"id": "m18", "name": "Environment Docs MCP",     "owner": "Ledger",         "tier": 3, "job": "Maintain .env.example, track dev/staging/prod vars"},
    {"id": "m19", "name": "Audit Log MCP",            "owner": "Janus-Core",     "tier": 3, "job": "Permanent append-only log of every agent action"},

    # ── Tier 4 — Quality & Testing ──
    {"id": "m20", "name": "Test Runner MCP",          "owner": "Pixel-Core",     "tier": 4, "job": "Run unit/integration tests (Vitest, Jest)"},
    {"id": "m21", "name": "E2E Browser MCP",          "owner": "Scalpel-Core",   "tier": 4, "job": "Run Playwright/Cypress tests in real browser"},
    {"id": "m22", "name": "Test Review MCP",          "owner": "Sentry-Core",    "tier": 4, "job": "Review test coverage, quality, missing cases"},
    {"id": "m23", "name": "Standards Compliance MCP", "owner": "Verdict Team",   "tier": 4, "job": "Check code against documented standards"},
    {"id": "m24", "name": "Security Scan MCP",        "owner": "Janus-Core",     "tier": 4, "job": "Scan for vulnerabilities, dependency issues"},
    {"id": "m25", "name": "Accessibility MCP",        "owner": "Janus-Core",     "tier": 4, "job": "WCAG checks, ARIA, keyboard nav, contrast"},
    {"id": "m26", "name": "Performance MCP",          "owner": "Verdict Team",   "tier": 4, "job": "Lighthouse, Core Web Vitals, bundle size"},
    {"id": "m27", "name": "Error Monitoring MCP",     "owner": "Pulse-Core",     "tier": 4, "job": "Read error logs (Sentry), monitor production"},
    {"id": "m28", "name": "Bug Tracker MCP",          "owner": "Pulse-Core",     "tier": 4, "job": "Track bugs found, fixed, reopened"},

    # ── Tier 5 — Research & External ──
    {"id": "m29", "name": "Standards MCP",            "owner": "Odin Team",      "tier": 5, "job": "Fetch live external docs (Vercel, Supabase, Next.js)"},
    {"id": "m30", "name": "Web Search MCP",           "owner": "Dorian",         "tier": 5, "job": "Search the internet for references and answers"},
    {"id": "m31", "name": "Image Search MCP",         "owner": "Dorian",         "tier": 5, "job": "Find UI/UX design references"},
    {"id": "m32", "name": "SEO MCP",                  "owner": "SEO Agent",      "tier": 5, "job": "Generate robots.txt, sitemap.xml, schema.org, llms.txt"},

    # ── Tier 6 — Runtime & Infrastructure ──
    {"id": "m33", "name": "Database MCP",             "owner": "Zephyr",         "tier": 6, "job": "Schema migrations, RLS policies, indexes"},
    {"id": "m34", "name": "Deployment MCP",           "owner": "Zephyr",         "tier": 6, "job": "Push to staging/prod, rollback"},
    {"id": "m35", "name": "Backup MCP",               "owner": "Zephyr",         "tier": 6, "job": "Database backups, restore"},
    {"id": "m36", "name": "Asset Storage MCP",        "owner": "Build Team",     "tier": 6, "job": "Upload/manage files in Supabase/S3/Cloudinary"},
    {"id": "m37", "name": "Notification MCP",         "owner": "Build Team",     "tier": 6, "job": "Send emails (Resend), SMS (Termii), push"},
    {"id": "m38", "name": "Webhook MCP",              "owner": "Build Team",     "tier": 6, "job": "Send/receive webhooks, retry logic"},
    {"id": "m39", "name": "Analytics MCP",            "owner": "Build Team",     "tier": 6, "job": "Posthog, GA4 event tracking"},
    {"id": "m40", "name": "Auth MCP",                 "owner": "Build Team",     "tier": 6, "job": "Manage auth flows, sessions, roles"},
    {"id": "m41", "name": "Cache MCP",                "owner": "Build Team",     "tier": 6, "job": "Redis, browser cache, invalidation"},
    {"id": "m42", "name": "Rate Limit MCP",           "owner": "Build Team",     "tier": 6, "job": "Upstash Redis, login throttling, bot protection"},

    # ── Tier 7 — Specialized Domain ──
    {"id": "m43", "name": "Payment MCP",              "owner": "Build Team",     "tier": 7, "job": "Paystack, Stripe, refunds, webhooks"},
    {"id": "m44", "name": "Form MCP",                 "owner": "Build Team",     "tier": 7, "job": "Form handling, validation, file uploads"},
    {"id": "m45", "name": "i18n MCP",                 "owner": "Build Team",     "tier": 7, "job": "Translations, locale formatting"},
    {"id": "m46", "name": "Feature Flag MCP",         "owner": "Build Team",     "tier": 7, "job": "Toggle features without deploying"},

    # ── Tier 8 — Meta Engineering (NEW) ──
    # These MCPs are owned by the Meta department — they maintain WebForge itself.
    {"id": "m47", "name": "MCP Builder MCP",          "owner": "Forge",          "tier": 8, "job": "Forge uses this to scaffold new MCPs. Generates boilerplate, info(), run(), CLI blocks."},
    {"id": "m48", "name": "MCP Fixer MCP",            "owner": "Anvil",          "tier": 8, "job": "Anvil uses this to apply targeted patches to MCP code. Patches are tested before apply."},
    {"id": "m49", "name": "Agent Creator MCP",        "owner": "Loom",           "tier": 8, "job": "Loom uses this to scaffold new agent skill MD files following the standard template."},
    {"id": "m50", "name": "System Tester MCP",        "owner": "Compass",        "tier": 8, "job": "Compass uses this to run automated tests against every MCP, skill file, and pipeline state."},
    {"id": "m51", "name": "System Memory MCP",        "owner": "Daedalus",       "tier": 8, "job": "Writes to ~/webforge/system-memory/ — Meta dept's own memory about WebForge improvements."},
]

# ── Tier colors (for badges) ──
TIER_COLORS = {
    1: "#EF4444",  # red — must-build
    2: "#F97316",  # orange — core ops
    3: "#FBBF24",  # amber — documentation
    4: "#34D399",  # green — quality
    5: "#22D3EE",  # cyan — research
    6: "#A78BFA",  # purple — runtime
    7: "#94A3B8",  # gray — specialized
    8: "#F472B6",  # pink — meta engineering (NEW)
}

TIER_NAMES = {
    1: "Foundation",
    2: "Core Ops",
    3: "Documentation",
    4: "Quality & Testing",
    5: "Research & External",
    6: "Runtime & Infra",
    7: "Specialized",
    8: "Meta Engineering",
}

# ── Map owner string → list of MCPs ──
def mcps_for_owner(owner_name):
    """Return list of MCP dicts owned by a given agent/team."""
    result = []
    for m in MCPS:
        if m["owner"] == owner_name:
            result.append(m)
    return result


def mcps_for_agent(agent_name, agent_dept=None, agent_role=None):
    """
    Resolve which MCPs an agent owns.
    Handles 'Everyone', 'Build Team', team-level ownership, and specific agents.
    """
    owned = []

    for m in MCPS:
        owner = m["owner"]

        # Direct ownership
        if owner == agent_name:
            owned.append(m)
            continue

        # Everyone owns these
        if owner == "Everyone":
            owned.append(m)
            continue

        # Build Team — all Build dept agents (Frontend/Backend/DB sub-leads and devs)
        if owner == "Build Team" and agent_dept == "Build":
            owned.append(m)
            continue

        # Embedded Docs — all 51 doc-agents (Doc-Intelligence-*, Doc-Build-*, Doc-Quality-*)
        if owner == "Embedded Docs" and agent_name.startswith("Doc-"):
            owned.append(m)
            continue

        # Team-level ownership — applies to the team lead only (not batch agents)
        # Verdict Team → Verdict-Lance (lead) and the team node
        if owner == "Verdict Team" and (agent_name == "Verdict Team" or agent_name == "Verdict-Lance"):
            owned.append(m)
            continue
        # Odin Team → team node and Odin-Sage (lead)
        if owner == "Odin Team" and (agent_name == "Odin Team" or agent_name == "Odin-Sage"):
            owned.append(m)
            continue

    return owned


# ── Summary stats ──
if __name__ == "__main__":
    print(f"Total MCPs: {len(MCPS)}")
    for tier in range(1, 9):
        count = sum(1 for m in MCPS if m["tier"] == tier)
        print(f"  Tier {tier} ({TIER_NAMES[tier]}): {count}")

    print("\nOwners:")
    owners = {}
    for m in MCPS:
        owners.setdefault(m["owner"], []).append(m["name"])
    for owner, mcps in sorted(owners.items()):
        print(f"  {owner}: {len(mcps)}")
