#!/usr/bin/env python3
"""
Rebuild CP3 Legacy pages from extracted MHTML templates.
Strategy: Take the original HTML (with embedded CSS/images), replace demo data
with Chris Paul data, save as static HTML pages.

This gives EXACT structural match — only the data changes.
"""

import re
import json
from pathlib import Path

TEMPLATES_DIR = Path("/home/z/my-project/download/extracted-templates")
OUTPUT_DIR = Path("/home/z/my-project/download/cp3-pages")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# CP3 data is hardcoded here since the original src/data folder is gone
# These values are used to replace demo data in the templates

# ── Replacement maps ──
# These replace demo text with CP3 text

# Player-overview replacements
OVERVIEW_REPLACEMENTS = [
    # Player name and number
    ('James', 'Chris'),
    ('Girobili', 'Paul'),
    ('Girobilli', 'Paul'),  # Note: template has a typo with double-l
    ('>38<', '>3<'),  # Player number
    ("6'9\"", "6'0\""),  # Height
    ('295 lbs', '175 lbs'),  # Weight
    ('>18<', '>40<'),  # Age
    ('Rockbell Bay College', 'Wake Forest University'),  # College
    ('Amestris, California. USA', 'Winston-Salem, North Carolina, USA'),  # Born
    ('1st Shooting Guard', 'Point Guard'),  # Position

    # Career averages
    ('9.6', '17.0'),  # PPG
    ('4.5', '9.4'),   # APG (note: 4.5 is also weight-related, be careful)
    ('2.8', '4.5'),   # RPG

    # Team names in last games log
    ('Sharks', 'Houston Rockets'),
    ('Marine College', 'Toyota Center'),
    ('L.A. Pirates', 'Phoenix Suns'),
    ('Bebop Institute', 'Footprint Center'),
    ('Lucky Clovers', 'LA Clippers'),
    ("St. Patrick's Institute", 'Crypto.com Arena'),
    ('Ocean Kings', 'LA Lakers'),
    ('Coral Reef Academy', 'Crypto.com Arena'),
    ('Red Wings', 'Dallas Mavericks'),
    ('Aviary Heights', 'American Airlines Center'),

    # URLs — point to CP3 routes
    ('https://alchemists.dan-fisher.dev/basketball-dark/index.html', '/'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/player-overview.html', '/player/overview'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/player-stats.html', '/player/stats'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/player-bio.html', '/player/bio'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/player-gallery.html', '/player/gallery'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/blog-1.html', '/news'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/shop-wishlist.html', '#'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/player-overview.html#', '#'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/player-news.html', '/news'),
]


def apply_replacements(html, replacements):
    """Apply text replacements to HTML."""
    for old, new in replacements:
        html = html.replace(old, new)
    return html


def rebuild_page(template_name, output_name, replacements, data_swaps=None):
    """Rebuild a page from template."""
    template_path = TEMPLATES_DIR / template_name / "index.html"
    if not template_path.exists():
        print(f"ERROR: Template not found: {template_path}")
        return

    html = template_path.read_text(encoding='utf-8')
    print(f"  Original: {len(html):,} chars")

    # Apply text replacements
    html = apply_replacements(html, replacements)

    # Apply data swaps (more complex, page-specific)
    if data_swaps:
        html = data_swaps(html)

    # Save
    output_path = OUTPUT_DIR / output_name
    output_path.write_text(html, encoding='utf-8')
    print(f"  Saved: {output_path} ({len(html):,} chars)")


# ── Player Overview ──
print("\n=== Rebuilding Player Overview ===")
rebuild_page(
    "Alchemists Basketball Club & Sports News HTML Template -player-overview",
    "player-overview.html",
    OVERVIEW_REPLACEMENTS
)

# ── Player Stats (Single Player) ──
print("\n=== Rebuilding Player Stats ===")
STATS_REPLACEMENTS = OVERVIEW_REPLACEMENTS.copy()
# Add stats-specific replacements (career totals, etc.)
STATS_REPLACEMENTS.extend([
    # Career totals — replace demo numbers with CP3 career totals
    # Games played
    # Points, assists, rebounds, steals, blocks
    # These will be matched by context in the template
])
rebuild_page(
    "Alchemists Basketball Club & Sports News HTML Template - Single Player",
    "player-stats.html",
    STATS_REPLACEMENTS
)

# ── Player Bio (biography) ──
print("\n=== Rebuilding Player Bio ===")
BIO_REPLACEMENTS = OVERVIEW_REPLACEMENTS.copy()
bio_data = CP3_DATA["bio"]
# Add bio-specific replacements — the demo has placeholder bio text
BIO_REPLACEMENTS.extend([
    ('James Spiegel', 'Chris Paul'),
    ('Christopher Emmanuel Paul', 'Christopher Emmanuel Paul'),  # Already correct
    # Replace demo bio text with CP3 bio (will need to find the actual demo text)
])
rebuild_page(
    "Alchemists Basketball Club & Sports News HTML Template - biography",
    "player-bio.html",
    BIO_REPLACEMENTS
)

# ── Player Gallery ──
print("\n=== Rebuilding Player Gallery ===")
GALLERY_REPLACEMENTS = OVERVIEW_REPLACEMENTS.copy()
rebuild_page(
    "Alchemists Basketball Club & Sports News HTML Template - gallery",
    "player-gallery.html",
    GALLERY_REPLACEMENTS
)

# ── News Listing (News V1) ──
print("\n=== Rebuilding News Listing ===")
NEWS_REPLACEMENTS = [
    ('https://alchemists.dan-fisher.dev/basketball-dark/index.html', '/'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/player-overview.html', '/player/overview'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/player-stats.html', '/player/stats'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/player-bio.html', '/player/bio'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/player-gallery.html', '/player/gallery'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/blog-1.html', '/news'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/blog-post-1.html', '/news/cp3-20th-season-milestone'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/blog-post-2.html', '/news/spurs-veteran-leadership'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/blog-post-3.html', '/news/all-time-assists-leader'),
    ('https://alchemists.dan-fisher.dev/basketball-dark/shop-wishlist.html', '#'),
    ('Alchemists', 'CP3 Legacy'),
    ('alchemists.dan-fisher.dev/basketball-dark/blog-1.html#', '#'),
]
rebuild_page(
    "Alchemists Basketball Club & Sports News HTML Template - News V1",
    "news.html",
    NEWS_REPLACEMENTS
)

# ── Blog Post (Post Page V1) ──
print("\n=== Rebuilding Blog Post ===")
POST_REPLACEMENTS = NEWS_REPLACEMENTS.copy()
rebuild_page(
    "Alchemists Basketball Club & Sports News HTML Template - Post Page V1",
    "blog-post.html",
    POST_REPLACEMENTS
)

print("\n=== Done ===")
print(f"Output: {OUTPUT_DIR}")
for f in sorted(OUTPUT_DIR.glob("*.html")):
    print(f"  {f.name}: {f.stat().st_size:,} bytes")
