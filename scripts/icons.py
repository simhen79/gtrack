#!/usr/bin/env python3
"""Draws gtrack's icons into api/public from the ring-and-dot mark and tokens.json.

The mark is the wordmark's: a 24px ring with a 5px `accent` border around an 8px `highlight`
dot. Run it from anywhere after changing those tokens, and commit what it writes.
"""
import json
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "api" / "public"
TOKENS = {t["name"]: t["value"] for t in json.loads((ROOT / "docs/design-system/tokens.json").read_text())["color"]["tokens"]}

# On a 24-unit grid, as wordmark.tsx draws it.
SIZE, RING_RADIUS, RING_WIDTH, DOT_RADIUS = 24, 9.5, 5, 4


def svg():
    """The tab icon, in the light theme's colours or the dark theme's, as the browser is."""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
<style>
.ring {{ stroke: {TOKENS["accent"]["light"]}; }}
.dot {{ fill: {TOKENS["highlight"]["light"]}; }}
@media (prefers-color-scheme: dark) {{
.ring {{ stroke: {TOKENS["accent"]["dark"]}; }}
.dot {{ fill: {TOKENS["highlight"]["dark"]}; }}
}}
</style>
<circle class="ring" cx="12" cy="12" r="{RING_RADIUS}" fill="none" stroke-width="{RING_WIDTH}"/>
<circle class="dot" cx="12" cy="12" r="{DOT_RADIUS}"/>
</svg>
"""


def rgb(hex_colour):
    return tuple(int(hex_colour[i:i + 2], 16) for i in (1, 3, 5))


def draw(size, mark_share, corner_share):
    """RGBA rows of the mark, in the dark theme's colours, on a `background` tile.

    The mark takes mark_share of the tile's width; the tile's corners round by corner_share of it.
    Each pixel averages 8×8 samples, so edges are smooth.
    """
    accent, highlight, ground = (rgb(TOKENS[name]["dark"]) for name in ("accent", "highlight", "background"))
    scale = size * mark_share / SIZE
    centre, corner = size / 2, size * corner_share
    samples = [(i + 0.5) / 8 for i in range(8)]

    def colour(x, y):
        distance = ((x - centre) ** 2 + (y - centre) ** 2) ** 0.5 / scale
        if distance <= DOT_RADIUS:
            return highlight
        if abs(distance - RING_RADIUS) <= RING_WIDTH / 2:
            return accent
        # Outside the tile's rounded corners, nothing.
        dx, dy = max(corner - x, x - (size - corner), 0), max(corner - y, y - (size - corner), 0)
        return ground if dx * dx + dy * dy <= corner * corner else None

    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            hits = [c for c in (colour(x + sx, y + sy) for sy in samples for sx in samples) if c]
            if not hits:
                row += bytes(4)
                continue
            row += bytes(round(sum(c[i] for c in hits) / len(hits)) for i in range(3))
            row.append(round(255 * len(hits) / 64))
        rows.append(bytes(row))
    return rows


def png(rows):
    size = len(rows)

    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    pixels = zlib.compress(b"".join(b"\0" + row for row in rows), 9)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", pixels) + chunk(b"IEND", b"")


def ico(images):
    """An .ico of 32-bit bitmaps, which every browser that asks for /favicon.ico can read."""
    entries, bitmaps = b"", b""
    offset = 6 + 16 * len(images)
    for rows in images:
        size = len(rows)
        mask_row = (size + 31) // 32 * 4
        bitmap = struct.pack("<IiiHHIIiiII", 40, size, size * 2, 1, 32, 0, 0, 0, 0, 0, 0)
        # Bottom to top, in blue, green, red, alpha; then an AND mask the alpha makes moot.
        for row in reversed(rows):
            bitmap += b"".join(bytes((row[i + 2], row[i + 1], row[i], row[i + 3])) for i in range(0, len(row), 4))
        bitmap += bytes(mask_row * size)
        entries += struct.pack("<BBBBHHII", size, size, 0, 0, 1, 32, len(bitmap), offset)
        bitmaps += bitmap
        offset += len(bitmap)
    return struct.pack("<HHH", 0, 1, len(images)) + entries + bitmaps


if __name__ == "__main__":
    (PUBLIC / "favicon.svg").write_text(svg())
    # A browser that ignores SVG icons can't follow the colour scheme, so the mark sits on the dark ground.
    (PUBLIC / "favicon.ico").write_bytes(ico([draw(size, 0.75, 0.2) for size in (16, 32, 48)]))
    # iOS rounds the corners itself and wants the square solid.
    (PUBLIC / "apple-touch-icon.png").write_bytes(png(draw(180, 0.6, 0)))
