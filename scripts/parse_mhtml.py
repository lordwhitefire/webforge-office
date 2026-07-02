#!/usr/bin/env python3
"""
Parse MHTML files and extract:
- HTML body
- CSS stylesheets
- Image assets (as base64 data URIs)

Output: one folder per MHTML file with extracted content
"""

import os
import re
import base64
import email
from email import policy
from pathlib import Path

UPLOAD_DIR = Path("/home/z/my-project/upload")
OUTPUT_DIR = Path("/home/z/my-project/download/extracted-templates")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def parse_mhtml(mhtml_path: Path, output_dir: Path):
    """Parse an MHTML file and extract HTML, CSS, and assets."""
    name = mhtml_path.stem
    page_dir = output_dir / name
    page_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n=== Parsing: {name} ===")

    # Read MHTML
    with open(mhtml_path, 'rb') as f:
        msg = email.message_from_binary_file(f, policy=policy.default)

    html_content = None
    css_parts = []
    assets = {}  # content_location -> data URI

    # Walk through parts
    for part in msg.walk():
        content_type = part.get_content_type()
        content_location = part.get('Content-Location', '')
        if not content_location:
            content_location = part.get('Content-ID', f'part-{len(assets)}')

        if content_type == 'text/html':
            # Skip if no content_location (likely an empty wrapper)
            if not part.get('Content-Location'):
                continue
            # Use the FIRST real HTML part, not later wrappers
            if html_content is not None:
                continue
            # Get charset
            charset = part.get_content_charset() or 'utf-8'
            try:
                html_content = part.get_content().decode(charset, errors='replace')
            except Exception:
                payload = part.get_payload(decode=True)
                html_content = payload.decode(charset, errors='replace') if payload else ''
            # Skip if too small (likely empty wrapper)
            if len(html_content) < 500:
                print(f"  Skipping small HTML part ({len(html_content)} chars) — likely wrapper")
                html_content = None
                continue
            print(f"  HTML: {len(html_content)} chars")

        elif content_type == 'text/css':
            charset = part.get_content_charset() or 'utf-8'
            try:
                css_text = part.get_content().decode(charset, errors='replace')
            except Exception:
                payload = part.get_payload(decode=True)
                css_text = payload.decode(charset, errors='replace') if payload else ''
            css_parts.append((content_location, css_text))
            print(f"  CSS: {len(css_text)} chars ({content_location[-40:]})")

        elif content_type.startswith('image/'):
            payload = part.get_payload(decode=True)
            if payload:
                data_uri = f"data:{content_type};base64,{base64.b64encode(payload).decode()}"
                assets[content_location] = data_uri
                # Save image too
                ext = content_type.split('/')[-1].replace('jpeg', 'jpg')
                img_filename = f"asset_{len(assets):03d}.{ext}"
                with open(page_dir / img_filename, 'wb') as f:
                    f.write(payload)
                assets[content_location] = (data_uri, img_filename)

    if not html_content:
        print(f"  ERROR: No HTML found in {name}")
        return

    # Replace asset URLs with data URIs in HTML and CSS
    print(f"  Replacing {len(assets)} asset URLs...")

    # Sort by length descending to avoid partial matches
    sorted_assets = sorted(assets.items(), key=lambda x: -len(x[0]))

    for url, (data_uri, _) in sorted_assets:
        # Replace in HTML
        html_content = html_content.replace(url, data_uri)
        # Replace in CSS
        css_parts = [(loc, css.replace(url, data_uri)) for loc, css in css_parts]

    # Inline CSS into HTML
    # Find all <link rel="stylesheet"> tags and replace with <style>
    for css_url, css_text in css_parts:
        # Pattern: <link rel="stylesheet" href="css_url">
        pattern = re.compile(
            r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']' +
            re.escape(css_url) + r'["\'][^>]*>',
            re.IGNORECASE
        )
        html_content = pattern.sub(f'<style>\n{css_text}\n</style>', html_content)
        # Also handle reverse order
        pattern2 = re.compile(
            r'<link[^>]*href=["\']' + re.escape(css_url) + r'["\'][^>]*rel=["\']stylesheet["\'][^>]*>',
            re.IGNORECASE
        )
        html_content = pattern2.sub(f'<style>\n{css_text}\n</style>', html_content)

    # Also handle any remaining <link rel="stylesheet"> with relative paths
    # (these would have been replaced if the URL matched)
    # For remaining ones, try to find by filename
    remaining_links = re.findall(r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\']', html_content, re.IGNORECASE)
    for link_url in remaining_links:
        # Find matching CSS by filename
        link_filename = link_url.split('/')[-1].split('?')[0]
        for css_url, css_text in css_parts:
            if css_url.split('/')[-1].split('?')[0] == link_filename:
                pattern = re.compile(
                    r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']' +
                    re.escape(link_url) + r'["\'][^>]*>',
                    re.IGNORECASE
                )
                html_content = pattern.sub(f'<style>\n{css_text}\n</style>', html_content)
                break

    # Save the extracted HTML
    html_path = page_dir / "index.html"
    html_path.write_text(html_content, encoding='utf-8')
    print(f"  Saved: {html_path} ({len(html_content)} chars)")

    # Save metadata
    meta = {
        'name': name,
        'html_size': len(html_content),
        'css_count': len(css_parts),
        'asset_count': len(assets),
    }
    (page_dir / "meta.json").write_text(
        __import__('json').dumps(meta, indent=2)
    )

    return html_content


# Process all MHTML files
mhtml_files = sorted(UPLOAD_DIR.glob("*.mhtml"))
print(f"Found {len(mhtml_files)} MHTML files")

for mhtml_file in mhtml_files:
    try:
        parse_mhtml(mhtml_file, OUTPUT_DIR)
    except Exception as e:
        print(f"  ERROR parsing {mhtml_file.name}: {e}")
        import traceback
        traceback.print_exc()

print("\n=== Done ===")
print(f"Extracted to: {OUTPUT_DIR}")
for d in sorted(OUTPUT_DIR.iterdir()):
    if d.is_dir():
        html_size = (d / "index.html").stat().st_size if (d / "index.html").exists() else 0
        asset_count = len(list(d.glob("asset_*")))
        print(f"  {d.name}: HTML={html_size:,} chars, assets={asset_count}")
