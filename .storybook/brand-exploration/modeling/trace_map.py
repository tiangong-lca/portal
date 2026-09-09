"""Author solid-cell positions from the selected light board, offline only.

Run with Python 3 and Pillow. The output contains model-space coordinates and
cell sizes; the live renderer never reads an image or a screen-space mask.
The motif is decorative artwork, not a cartographic or dataset coverage map.
"""

import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ARTWORK = json.loads((ROOT / "artwork.json").read_text())
REFERENCE = ARTWORK["references"]["light"]
SOURCE = ROOT.parent / "public" / REFERENCE["url"].removeprefix("./")
if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != REFERENCE["sha256"]:
    raise ValueError("The selected light board changed; review the trace calibration first.")

# Hand-authored regions exclude the plate edges, posts and reflected equipment.
ROI = (475, 745, 840, 890)
REGIONS = [
    [(12, 31), (60, 29), (93, 24), (132, 21), (159, 22), (174, 28),
     (163, 36), (151, 39), (139, 36), (117, 42), (146, 47), (130, 56),
     (118, 61), (110, 68), (99, 69), (109, 77), (88, 76), (72, 69),
     (64, 62), (55, 57), (55, 45), (39, 40), (12, 40)],
    [(90, 67), (127, 75), (155, 83), (188, 88), (191, 98), (181, 111),
     (166, 120), (155, 141), (137, 133), (134, 118), (124, 106),
     (113, 101), (112, 82)],
    [(178, 42), (201, 34), (241, 35), (277, 37), (310, 40), (334, 42),
     (333, 48), (320, 52), (295, 54), (302, 59), (310, 68), (298, 78),
     (321, 82), (322, 89), (295, 91), (282, 86), (282, 101), (267, 114),
     (251, 112), (244, 102), (239, 95), (233, 90), (221, 83), (216, 77),
     (203, 83), (190, 78), (187, 69), (193, 63), (192, 52)],
    [(280, 97), (285, 97), (285, 105), (280, 105)],
]


def trace_cells():
    image = Image.open(SOURCE).convert("L").crop(ROI)
    background = image.filter(ImageFilter.GaussianBlur(1.25))
    mask = Image.new("1", image.size)
    draw = ImageDraw.Draw(mask)
    for region in REGIONS:
        draw.polygon(region, fill=1)
    pixels, blurred, allowed = image.load(), background.load(), mask.load()
    signal = lambda x, y: blurred[x, y] - pixels[x, y]
    candidates = []
    for y in range(1, image.height - 1):
        for x in range(1, image.width - 1):
            peak = signal(x, y)
            if not allowed[x, y] or peak < 17:
                continue
            patch = [(a, b, signal(a, b)) for b in range(y - 1, y + 2)
                     for a in range(x - 1, x + 2)]
            if peak < max(p[2] for p in patch):
                continue
            weights = [(a, b, max(0, value - peak * 0.15)) for a, b, value in patch]
            total = sum(p[2] for p in weights)
            candidates.append((sum(a * w for a, _, w in weights) / total,
                               sum(b * w for _, b, w in weights) / total, peak))
    cells = []
    for x, y, strength in sorted(candidates, key=lambda p: -p[2]):
        if any((x - a) ** 2 + (y - b) ** 2 < 1.8 ** 2 for a, b, _ in cells):
            continue
        cells.append((x, y, strength))
    return sorted(cells, key=lambda p: (p[1], p[0]))


def project_to_plate(cells):
    # Calibration matches the fixed assembly camera, layer compensation and
    # comparison crop. Refit these together if the composition camera changes.
    camera = (30.5, 21.3, 30.5)
    distance = math.sqrt(sum(c * c for c in camera))
    horizontal = math.hypot(camera[0], camera[2])
    scale = distance / (distance - 4.36 * camera[1] / distance)
    forward = tuple(-c / distance for c in camera)
    right = (camera[2] / horizontal, 0, -camera[0] / horizontal)
    up = (-camera[0] * camera[1] / (distance * horizontal), horizontal / distance,
          -camera[2] * camera[1] / (distance * horizontal))
    crop = ARTWORK["crop"]
    tangent = 11.8 / (2 * distance)
    points = []
    for px, py, strength in cells:
        nx = 2 * ((px + ROI[0] - crop["left"]) / crop["width"] + 0.038) - 1
        ny = 1 - 2 * (py + ROI[1] - crop["top"]) / crop["height"]
        ray = [forward[i] + right[i] * nx * tangent * crop["width"] / crop["height"]
               + up[i] * ny * tangent for i in range(3)]
        reach = ((-4.36 + 0.009) * scale + 0.3 - camera[1]) / ray[1]
        x, z = ((camera[i] + ray[i] * reach) / scale for i in (0, 2))
        # A few source marks overhang the plate; retain an inset for solid cells.
        if max(abs(x), abs(z)) > 2.06:
            continue
        size = 0.8 + max(0, min(1, (strength - 35) / 100)) * 0.35
        points.append([round(x, 5), round(z, 5), round(size, 3)])
    return points


if __name__ == "__main__":
    points = project_to_plate(trace_cells())
    output = ROOT.parent.parent / "src/components/brand/lifecycle/map-points.json"
    output.write_text(json.dumps(points, separators=(",", ":")) + "\n")
    print(f"Wrote {len(points)} authored cells to {output.name}")
