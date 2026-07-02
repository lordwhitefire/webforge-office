#!/usr/bin/env python3
"""
Build CP3 pages from JSON data + extracted MHTML templates.

For each page:
1. Read the JSON data file
2. Read the template HTML (with embedded CSS/images)
3. Replace demo data in the template with JSON data
4. Save the final HTML

For blog posts:
- One template (Post Page V1)
- Multiple JSON files in data/posts/
- Generates one HTML file per post: post-<slug>.html
"""

import json
import re
from pathlib import Path

TEMPLATES_DIR = Path("/home/z/my-project/download/extracted-templates")
DATA_DIR = Path("/home/z/my-project/download/cp3-pages/data")
OUTPUT_DIR = Path("/home/z/my-project/download/cp3-pages")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_json(path):
    return json.loads(Path(path).read_text())


def load_template(name):
    """Load template HTML by folder name."""
    path = TEMPLATES_DIR / name / "index.html"
    return path.read_text(encoding='utf-8')


def save_page(name, html):
    """Save final HTML page."""
    path = OUTPUT_DIR / name
    path.write_text(html, encoding='utf-8')
    print(f"  Saved: {path.name} ({len(html):,} chars)")


# ───────────────────────────────────────────────────────────────────
# Common replacements applied to ALL pages
# ───────────────────────────────────────────────────────────────────
def apply_common_replacements(html):
    """Apply URL replacements that all pages need."""
    replacements = [
        # Internal navigation links → CP3 routes
        ('https://alchemists.dan-fisher.dev/basketball-dark/index.html', 'index.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/player-overview.html', 'player-overview.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/player-stats.html', 'player-stats.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/player-bio.html', 'player-bio.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/player-gallery.html', 'player-gallery.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/blog-1.html', 'news.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/shop-wishlist.html', '#'),
        # Remove hash-only links to alchemists
        ('https://alchemists.dan-fisher.dev/basketball-dark/player-overview.html#', '#'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/blog-1.html#', '#'),
        # Brand
        ('Alchemists', 'CP3 Legacy'),
    ]
    for old, new in replacements:
        html = html.replace(old, new)
    return html


def replace_player_basics(html, player):
    """Replace player name, number, basic info."""
    # Player name (replace common demo names)
    html = html.replace('James', player['firstName'])
    html = html.replace('Girobili', player['lastName'])
    html = html.replace('Girobilli', player['lastName'])  # template typo
    # Player number
    html = html.replace('>38<', f">{player['number']}<")
    return html


# ───────────────────────────────────────────────────────────────────
# Page 1: Player Overview
# ───────────────────────────────────────────────────────────────────
def build_player_overview():
    print("\n=== Building Player Overview ===")
    data = load_json(DATA_DIR / "player/overview.json")
    html = load_template("Alchemists Basketball Club & Sports News HTML Template -player-overview")

    # Common replacements
    html = apply_common_replacements(html)

    # Player basics
    html = replace_player_basics(html, data['player'])

    # Player info details
    info = data['info']
    html = html.replace("6'9\"", info['height'])
    html = html.replace('295 lbs', info['weight'])
    html = html.replace('>18<', f">{info['age']}<")
    html = html.replace('Rockbell Bay College', info['college'])
    html = html.replace('Amestris, California. usa', info['born'])
    html = html.replace('Amestris, California. USA', info['born'])
    html = html.replace('1st Shooting Guard', info['position'])

    # Career averages (circular bars)
    avg = data['careerAverages']
    html = html.replace('9.6', str(avg['pointsPerGame']))  # PPG
    html = html.replace('>4.5<', f">{avg['assistsPerGame']}<")  # APG (use > < to avoid weight clash)
    html = html.replace('2.8', str(avg['reboundsPerGame']))  # RPG

    # Last games — replace team names
    games = data['lastGames']
    team_replacements = [
        ('Sharks', games[0]['opponent']),
        ('Marine College', games[0]['place']),
        ('L.A. Pirates', games[1]['opponent']),
        ('Bebop Institute', games[1]['place']),
        ('Lucky Clovers', games[2]['opponent']),
        ("St. Patrick's Institute", games[2]['place']),
        ('Ocean Kings', games[3]['opponent']),
        ('Coral Reef Academy', games[3]['place']),
        ('Red Wings', games[4]['opponent']),
        ('Aviary Heights', games[4]['place']),
    ]
    for old, new in team_replacements:
        html = html.replace(old, new)

    # Related news links → blog posts
    news = data['relatedNews']
    html = html.replace('blog-post-1.html', f'post-{news[0]["slug"]}.html')
    html = html.replace('blog-post-2.html', f'post-{news[1]["slug"]}.html')
    html = html.replace('blog-post-3.html', f'post-{news[2]["slug"]}.html')

    save_page('player-overview.html', html)


# ───────────────────────────────────────────────────────────────────
# Page 2: Player Stats (Single Player template)
# ───────────────────────────────────────────────────────────────────
def build_player_stats():
    print("\n=== Building Player Stats ===")
    data = load_json(DATA_DIR / "player/stats.json")
    html = load_template("Alchemists Basketball Club & Sports News HTML Template - Single Player")

    html = apply_common_replacements(html)
    html = replace_player_basics(html, data['player'])

    # The Single Player template has the same player info structure
    # Apply same info replacements
    info = {'height': "6'0\"", 'weight': '175 lbs', 'age': 40,
            'college': 'Wake Forest University',
            'born': 'Winston-Salem, North Carolina, USA',
            'position': 'Point Guard'}
    html = html.replace("6'9\"", info['height'])
    html = html.replace('295 lbs', info['weight'])
    html = html.replace('>18<', f">{info['age']}<")
    html = html.replace('Rockbell Bay College', info['college'])
    html = html.replace('Amestris, California. usa', info['born'])
    html = html.replace('Amestris, California. USA', info['born'])
    html = html.replace('1st Shooting Guard', info['position'])

    save_page('player-stats.html', html)


# ───────────────────────────────────────────────────────────────────
# Page 3: Player Bio
# ───────────────────────────────────────────────────────────────────
def build_player_bio():
    print("\n=== Building Player Bio ===")
    data = load_json(DATA_DIR / "player/bio.json")
    html = load_template("Alchemists Basketball Club & Sports News HTML Template - biography")

    html = apply_common_replacements(html)
    html = replace_player_basics(html, data['player'])

    # Replace "James Spiegel" if present
    html = html.replace('James Spiegel', f"{data['player']['firstName']} {data['player']['lastName']}")

    save_page('player-bio.html', html)


# ───────────────────────────────────────────────────────────────────
# Page 4: Player Gallery
# ───────────────────────────────────────────────────────────────────
def build_player_gallery():
    print("\n=== Building Player Gallery ===")
    data = load_json(DATA_DIR / "player/gallery.json")
    html = load_template("Alchemists Basketball Club & Sports News HTML Template - gallery")

    html = apply_common_replacements(html)
    # Gallery JSON doesn't have number — use a default
    gallery_player = {
        'firstName': data['player']['firstName'],
        'lastName': data['player']['lastName'],
        'number': 3,
    }
    html = replace_player_basics(html, gallery_player)

    save_page('player-gallery.html', html)


# ───────────────────────────────────────────────────────────────────
# Page 5: News Listing
# ───────────────────────────────────────────────────────────────────
def build_news_listing():
    print("\n=== Building News Listing ===")
    data = load_json(DATA_DIR / "news/listing.json")
    html = load_template("Alchemists Basketball Club & Sports News HTML Template - News V1")

    html = apply_common_replacements(html)

    # Replace blog post links with CP3 post slugs
    posts = data['posts']
    # The template has links to blog-post-1.html, blog-post-2.html, blog-post-3.html
    # Map them to our actual post slugs
    if len(posts) >= 3:
        html = html.replace('blog-post-1.html', f'post-{posts[0]["slug"]}.html')
        html = html.replace('blog-post-2.html', f'post-{posts[1]["slug"]}.html')
        html = html.replace('blog-post-3.html', f'post-{posts[2]["slug"]}.html')

    save_page('news.html', html)


# ───────────────────────────────────────────────────────────────────
# Page 6: Blog Posts (one HTML per JSON)
# ───────────────────────────────────────────────────────────────────
def build_blog_posts():
    print("\n=== Building Blog Posts ===")
    posts_dir = DATA_DIR / "posts"
    post_files = sorted(posts_dir.glob("*.json"))
    print(f"  Found {len(post_files)} blog post JSON files")

    template_html = load_template("Alchemists Basketball Club & Sports News HTML Template - Post Page V1")

    for post_file in post_files:
        post = load_json(post_file)
        print(f"  Building: post-{post['slug']}.html")

        html = template_html
        html = apply_common_replacements(html)

        # Replace demo post title with this post's title
        # The template has a demo title — replace it
        # Also replace author, date, etc.

        # Save
        save_page(f"post-{post['slug']}.html", html)


# ───────────────────────────────────────────────────────────────────
# Main
# ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("Building CP3 Pages from JSON Data")
    print("=" * 60)

    build_player_overview()
    build_player_stats()
    build_player_bio()
    build_player_gallery()
    build_news_listing()
    build_blog_posts()

    print("\n" + "=" * 60)
    print("Build Complete")
    print("=" * 60)
    print(f"\nOutput: {OUTPUT_DIR}")
    print("\nFiles generated:")
    for f in sorted(OUTPUT_DIR.glob("*.html")):
        print(f"  {f.name}: {f.stat().st_size:,} bytes")
    print(f"\nJSON data files:")
    for f in sorted(OUTPUT_DIR.rglob("*.json")):
        print(f"  {f.relative_to(OUTPUT_DIR)}: {f.stat().st_size:,} bytes")
