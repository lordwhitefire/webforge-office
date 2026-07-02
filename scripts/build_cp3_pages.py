#!/usr/bin/env python3
"""
Build CP3 pages from JSON data + extracted MHTML templates.

Architecture:
- data/posts/<slug>.json  →  one JSON per blog post (contains card data + full body)
- data/news/listing.json  →  news listing page config (references post slugs)
- data/player/*.json      →  player page data

Generated HTML:
- index.html              →  homepage (TODO)
- news.html               →  news listing (reads all post JSONs to build cards)
- post-<slug>.html        →  one HTML per blog post (reads that post's JSON)
- player-overview.html    →  player overview (reads data/player/overview.json)
- player-stats.html       →  player stats
- player-bio.html         →  player bio
- player-gallery.html     →  player gallery
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
    path = TEMPLATES_DIR / name / "index.html"
    return path.read_text(encoding='utf-8')


def save_page(name, html):
    path = OUTPUT_DIR / name
    path.write_text(html, encoding='utf-8')
    print(f"  Saved: {path.name} ({len(html):,} chars)")


# ───────────────────────────────────────────────────────────────────
# Common replacements
# ───────────────────────────────────────────────────────────────────
def apply_common_replacements(html):
    """URL and brand replacements for all pages."""
    replacements = [
        # Internal nav links → CP3 routes
        ('https://alchemists.dan-fisher.dev/basketball-dark/index.html', 'index.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/player-overview.html', 'player-overview.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/player-stats.html', 'player-stats.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/player-bio.html', 'player-bio.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/player-gallery.html', 'player-gallery.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/blog-1.html', 'news.html'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/shop-wishlist.html', '#'),
        # Hash-only links
        ('https://alchemists.dan-fisher.dev/basketball-dark/player-overview.html#', '#'),
        ('https://alchemists.dan-fisher.dev/basketball-dark/blog-1.html#', '#'),
        # Brand
        ('Alchemists', 'CP3 Legacy'),
    ]
    for old, new in replacements:
        html = html.replace(old, new)
    return html


def replace_player_basics(html, player):
    """Replace player name and number."""
    html = html.replace('James', player['firstName'])
    html = html.replace('Girobili', player['lastName'])
    html = html.replace('Girobilli', player['lastName'])
    html = html.replace('>38<', f">{player['number']}<")
    return html


def replace_player_info(html, info):
    """Replace player physical info."""
    html = html.replace("6'9\"", info['height'])
    html = html.replace('295 lbs', info['weight'])
    html = html.replace('>18<', f">{info['age']}<")
    html = html.replace('Rockbell Bay College', info['college'])
    html = html.replace('Amestris, California. usa', info['born'])
    html = html.replace('Amestris, California. USA', info['born'])
    html = html.replace('1st Shooting Guard', info['position'])
    return html


# ───────────────────────────────────────────────────────────────────
# Pages 1-4: Player pages
# ───────────────────────────────────────────────────────────────────
def build_player_overview():
    print("\n=== Building Player Overview ===")
    data = load_json(DATA_DIR / "player/overview.json")
    html = load_template("Alchemists Basketball Club & Sports News HTML Template -player-overview")
    html = apply_common_replacements(html)
    html = replace_player_basics(html, data['player'])
    html = replace_player_info(html, data['info'])

    # Career averages
    avg = data['careerAverages']
    html = html.replace('9.6', str(avg['pointsPerGame']))
    html = html.replace('>4.5<', f">{avg['assistsPerGame']}<")
    html = html.replace('2.8', str(avg['reboundsPerGame']))

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

    # Related news → blog post links (full URL + relative)
    news = data['relatedNews']
    for i, n in enumerate(news, 1):
        post_link = f'post-{n["slug"]}.html'
        html = html.replace(
            f'https://alchemists.dan-fisher.dev/basketball-dark/blog-post-{i}.html',
            post_link
        )
        html = html.replace(f'blog-post-{i}.html', post_link)

    save_page('player-overview.html', html)


def build_player_stats():
    print("\n=== Building Player Stats ===")
    data = load_json(DATA_DIR / "player/stats.json")
    html = load_template("Alchemists Basketball Club & Sports News HTML Template - Single Player")
    html = apply_common_replacements(html)
    html = replace_player_basics(html, data['player'])
    info = {'height': "6'0\"", 'weight': '175 lbs', 'age': 40,
            'college': 'Wake Forest University',
            'born': 'Winston-Salem, North Carolina, USA',
            'position': 'Point Guard'}
    html = replace_player_info(html, info)
    save_page('player-stats.html', html)


def build_player_bio():
    print("\n=== Building Player Bio ===")
    data = load_json(DATA_DIR / "player/bio.json")
    html = load_template("Alchemists Basketball Club & Sports News HTML Template - biography")
    html = apply_common_replacements(html)
    html = replace_player_basics(html, data['player'])
    html = html.replace('James Spiegel', f"{data['player']['firstName']} {data['player']['lastName']}")
    save_page('player-bio.html', html)


def build_player_gallery():
    print("\n=== Building Player Gallery ===")
    data = load_json(DATA_DIR / "player/gallery.json")
    html = load_template("Alchemists Basketball Club & Sports News HTML Template - gallery")
    html = apply_common_replacements(html)
    gallery_player = {
        'firstName': data['player']['firstName'],
        'lastName': data['player']['lastName'],
        'number': 3,
    }
    html = replace_player_basics(html, gallery_player)
    save_page('player-gallery.html', html)


# ───────────────────────────────────────────────────────────────────
# Page 5: News Listing
# Reads ALL post JSONs to build the cards
# ───────────────────────────────────────────────────────────────────
def build_news_listing():
    print("\n=== Building News Listing ===")
    listing_data = load_json(DATA_DIR / "news/listing.json")

    # Load ALL blog post JSONs — these provide the card data
    posts_dir = DATA_DIR / "posts"
    all_posts = []
    for post_file in sorted(posts_dir.glob("*.json")):
        post = load_json(post_file)
        all_posts.append(post)
    print(f"  Loaded {len(all_posts)} blog posts from data/posts/")

    html = load_template("Alchemists Basketball Club & Sports News HTML Template - News V1")
    html = apply_common_replacements(html)

    # Replace blog-N.html (other news listing pages) with news.html
    # Use full URL pattern to be safe
    for i in range(1, 10):
        html = html.replace(
            f'https://alchemists.dan-fisher.dev/basketball-dark/blog-{i}.html',
            'news.html'
        )
        html = html.replace(f'blog-{i}.html', 'news.html')

    # Replace blog-post-N.html with our actual post slugs (full URL + relative)
    for i, post in enumerate(all_posts[:3], 1):
        post_link = f'post-{post["slug"]}.html'
        # Full URL replacement
        html = html.replace(
            f'https://alchemists.dan-fisher.dev/basketball-dark/blog-post-{i}.html',
            post_link
        )
        # Relative replacement (in case any remain)
        html = html.replace(f'blog-post-{i}.html', post_link)
        print(f"  Card {i} → {post_link}")

    # Fallback: any remaining blog-post-N.html → first post
    for i in range(4, 10):
        if all_posts:
            post_link = f'post-{all_posts[0]["slug"]}.html'
            html = html.replace(
                f'https://alchemists.dan-fisher.dev/basketball-dark/blog-post-{i}.html',
                post_link
            )
            html = html.replace(f'blog-post-{i}.html', post_link)

    # Replace demo card titles and excerpts with our post data
    # The template has specific demo text in the featured cards
    for i, post in enumerate(all_posts[:3], 1):
        # Replace demo titles (common demo titles in the template)
        demo_titles = [
            'The New Eco Friendly Stadium Will Be Built',
            'Michael Bryan Was Chosen For The All-Star Game',
            'The Planettrotters Will Perform In Madison Square',
            'The Alchemists Missed The Playoffs For The First Time',
            'The New Coach Is Bringing A Fresh Perspective',
        ]
        for demo_title in demo_titles:
            if demo_title in html:
                html = html.replace(demo_title, post['title'])
                break

    save_page('news.html', html)


# ───────────────────────────────────────────────────────────────────
# Page 6: Blog Post Detail Pages (one HTML per JSON)
# ───────────────────────────────────────────────────────────────────
def build_blog_posts():
    print("\n=== Building Blog Post Detail Pages ===")
    posts_dir = DATA_DIR / "posts"
    post_files = sorted(posts_dir.glob("*.json"))
    print(f"  Found {len(post_files)} blog post JSON files")

    template_html = load_template("Alchemists Basketball Club & Sports News HTML Template - Post Page V1")

    for post_file in post_files:
        post = load_json(post_file)
        print(f"  Building: post-{post['slug']}.html")
        print(f"    Title: {post['title']}")

        html = template_html
        html = apply_common_replacements(html)

        # Replace blog-N.html with news.html (full URL + relative)
        for i in range(1, 10):
            html = html.replace(
                f'https://alchemists.dan-fisher.dev/basketball-dark/blog-{i}.html',
                'news.html'
            )
            html = html.replace(f'blog-{i}.html', 'news.html')

        # Replace blog-post-N.html with other actual post slugs (for related posts section)
        other_posts = [p for p in post_files if p.stem != post['slug']]
        for i in range(1, 10):
            if other_posts:
                other = load_json(other_posts[(i-1) % len(other_posts)])
                post_link = f'post-{other["slug"]}.html'
                html = html.replace(
                    f'https://alchemists.dan-fisher.dev/basketball-dark/blog-post-{i}.html',
                    post_link
                )
                html = html.replace(f'blog-post-{i}.html', post_link)

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
