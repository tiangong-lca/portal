"""Sample Natural Earth's public-domain land polygons for the sculpture's point map.
Usage: python3 .storybook/brand-exploration/modeling/sample_land.py /path/to/ne_110m_land.geojson
Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson
The source contains no runtime dependency and is never fetched by the component.
"""

import json
import sys
from pathlib import Path

source = json.loads(Path(sys.argv[1]).read_text())
polygons = []
for feature in source["features"]:
    geometry = feature["geometry"]
    polygons.extend(
        geometry["coordinates"]
        if geometry["type"] == "MultiPolygon"
        else [geometry["coordinates"]]
    )


def inside(x, y, ring):
    result = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (
            b[1] - a[1]
        ) + a[0]:
            result = not result
    return result


points = []
for row, lat in enumerate(range(-54, 82, 3)):
    for lon in range(-178, 182, 3):
        # A staggered sampling lattice keeps the projected dots separated.
        x = lon + (1.5 if row % 2 else 0)
        if any(
            inside(x, lat, polygon[0])
            and not any(inside(x, lat, hole) for hole in polygon[1:])
            for polygon in polygons
        ):
            points.append([round(x / 180 * 1.8, 5), round(-lat / 90 * 1.25, 5)])
output = Path(__file__).resolve().parents[1] / "land-points.json"
output.write_text(json.dumps(points, separators=(",", ":")) + "\n")
print(f"Wrote {len(points)} land samples to {output.name}")
