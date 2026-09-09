"""Author the lifecycle model assets with Blender 5.1; no external model dependencies.
Run: Blender --background --python .storybook/brand-exploration/modeling/build_models.py
All dimensions below use the web scene's X/right, Y/up, Z/front convention.
"""

import bpy
import math
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT.parent / "public" / "brand" / "lifecycle"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def material(name, color, metal=0.0, rough=0.35, transmission=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Transmission Weight"].default_value = transmission
    bsdf.inputs["Coat Weight"].default_value = 0.32
    return m


shell = material("Shell", (0.27, 0.21, 0.36), 0.65, 0.29)
trim = material("Trim", (0.58, 0.49, 0.73), 0.78, 0.21)
dark = material("Cavity", (0.045, 0.029, 0.072), 0.4, 0.3)
glass = material("Glass", (0.19, 0.12, 0.29), 0.1, 0.16, 0.38)
screen = material("Screen", (0.024, 0.018, 0.04), 0.15, 0.2)

parent = None
contact_footprints = {}


def xyz(v):
    return (v[0], -v[2], v[1])


def finish(obj, name, mat, bevel=0):
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    if bevel:
        mod = obj.modifiers.new("Machined edges", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if obj.type == "MESH":
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
        mod = obj.modifiers.new("Weighted surface normals", "WEIGHTED_NORMAL")
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def box(name, loc, dim, mat=shell, bevel=0.009):
    if parent and name in {
        "Column plinth",
        "Turbine foundation",
        "Instrumentation plinth",
        "Building plinth",
        "Manufacturing deck",
        "Process skid base",
        "Peripheral plinth",
        "Appliance housing",
    }:
        contact_footprints.setdefault(parent.name, []).append(
            [loc[0], loc[2], dim[0], dim[2]]
        )
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(loc))
    obj = bpy.context.object
    obj.dimensions = (dim[0], dim[2], dim[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, bevel)


def cylinder(name, loc, radius, depth, mat=trim, axis="y", vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=xyz(loc)
    )
    obj = bpy.context.object
    if axis == "z":
        obj.rotation_euler[0] = math.pi / 2
    if axis == "x":
        obj.rotation_euler[1] = math.pi / 2
    return finish(obj, name, mat, 0.003)


def cone(name, loc, r1, r2, height, mat=trim):
    bpy.ops.mesh.primitive_cone_add(
        vertices=48, radius1=r1, radius2=r2, depth=height, location=xyz(loc)
    )
    return finish(bpy.context.object, name, mat, 0.002)


def sphere(name, loc, scale, mat=trim):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=xyz(loc))
    obj = bpy.context.object
    obj.scale = xyz((scale[0], scale[1], -scale[2]))
    return finish(obj, name, mat)


def ring(name, loc, radius, tube, mat=trim, axis="y"):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=64,
        minor_segments=10,
        location=xyz(loc),
        major_radius=radius,
        minor_radius=tube,
    )
    obj = bpy.context.object
    if axis == "z":
        obj.rotation_euler[0] = math.pi / 2
    if axis == "x":
        obj.rotation_euler[1] = math.pi / 2
    return finish(obj, name, mat)


def pipe(name, points, radius=0.012, mat=trim):
    c = bpy.data.curves.new(name, "CURVE")
    c.dimensions = "3D"
    c.resolution_u = 12
    poly = c.splines.new("POLY")
    poly.points.add(len(points) - 1)
    for point, co in zip(poly.points, points):
        point.co = (*xyz(co), 1)
    c.bevel_depth = radius
    c.bevel_resolution = 3
    obj = bpy.data.objects.new(name, c)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    return obj


def group(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    return obj


def build_energy():
    global parent
    # ENERGY: flanged process columns, tapered wind towers and an instrument pedestal.
    parent = group("EnergyModels")
    for i, (x, z, h) in enumerate([(-0.553, 1.504, 0.64), (-0.422, 0.625, 0.72)]):
        radius = 0.1 if i == 0 else 0.09
        box("Column plinth", (x, 0.032, z), (0.31, 0.065, 0.29), trim, 0.01)
        box("Column footing", (x, 0.076, z), (0.23, 0.035, 0.22), shell, 0.006)
        cylinder("Process column", (x, h / 2 + 0.085, z), radius, h, shell)
        if i == 0:
            sphere(
                "Dished vessel head", (x, h + 0.082, z), (radius, 0.057, radius), shell
            )
            # A rounded return pipe sits behind the dished head, with a clean front contour.
            arch = []
            for step in range(17):
                angle = math.pi - step * math.pi / 16
                offset = 0.045 + math.cos(angle) * 0.10
                arch.append(
                    (
                        x + offset / math.sqrt(2),
                        h + 0.27 + math.sin(angle) * 0.10,
                        z - offset / math.sqrt(2),
                    )
                )
            pipe(
                "Top service loop",
                [
                    (arch[0][0], h + 0.09, arch[0][2]),
                    *arch,
                    (arch[-1][0], h + 0.09, arch[-1][2]),
                ],
                0.0035,
            )
        else:
            sphere(
                "Elliptical vessel head",
                (x, h + 0.085, z),
                (radius, 0.105, radius),
                shell,
            )
            cylinder("Cap breather", (x, h + 0.2, z), 0.01, 0.025, trim)
        bands = [0, 0.4, 0.9] if i == 0 else [0, 0.36, 0.7, 0.95]
        for fraction in bands:
            ring("Column flange", (x, 0.1 + fraction * h, z), radius + 0.004, 0.0045)
        pipe(
            "Service pipe",
            [
                (x + 0.105, 0.07, z + 0.04),
                (x + 0.105, h + 0.02, z + 0.04),
                (x, h + 0.02, z + 0.04),
            ],
            0.006,
        )
        for j in range(3):
            cylinder(
                "Valve",
                (x + 0.103, 0.18 + j * h / 4, z + 0.055),
                0.016,
                0.017,
                trim,
                "z",
                24,
            )
        # Retain service detail on the rear so it does not dominate the vessel silhouette.
        for dx in [-0.034, 0.034]:
            pipe(
                "Ladder rail",
                [(x + dx, 0.08, z - radius - 0.009), (x + dx, h, z - radius - 0.009)],
                0.0025,
            )
        for j in range(10):
            pipe(
                "Ladder rung",
                [
                    (x - 0.034, 0.12 + j * h / 11, z - radius - 0.009),
                    (x + 0.034, 0.12 + j * h / 11, z - radius - 0.009),
                ],
                0.002,
            )

    for i, (x, z, h) in enumerate([(0.472, -0.227, 0.66), (0.877, -0.594, 0.49)]):
        base_radius = 0.13 if i == 0 else 0.072
        contact_footprints.setdefault(parent.name, []).append(
            [x, z, base_radius * 2, base_radius * 2]
        )
        cylinder("Turbine foundation", (x, 0.026, z), base_radius, 0.052, trim)
        cone(
            "Flared tower footing",
            (x, 0.088, z),
            base_radius * 0.75,
            0.028,
            0.075,
            shell,
        )
        cone("Wind tower", (x, h / 2 + 0.035, z), 0.024, 0.014, h - 0.07, shell)
        sphere("Nacelle", (x, h, z), (0.052, 0.04, 0.085))
        rotor = group("Rotor" + str(i))
        rotor.parent = parent
        rotor.location = xyz((x, h, z + 0.075))
        rotor_scale = 0.36 if i == 0 else 0.30
        rotor.scale = (rotor_scale, rotor_scale, rotor_scale)
        saved = parent
        parent = rotor
        sphere("Rotor nose", (0, 0, 0.02), (0.027, 0.027, 0.045))
        # Curved tapered airfoil profile, extruded with actual thickness.
        for blade in range(3):
            verts = []
            profile = [
                (-0.013, 0.025),
                (-0.032, 0.08),
                (-0.035, 0.16),
                (-0.013, 0.29),
                (0.008, 0.36),
                (0.019, 0.355),
                (0.015, 0.2),
                (0.016, 0.09),
                (0.015, 0.035),
            ]
            angle = blade * math.tau / 3
            for dep in [-0.006, 0.006]:
                for px, py in profile:
                    verts.append(
                        xyz(
                            (
                                px * math.cos(angle) - py * math.sin(angle),
                                px * math.sin(angle) + py * math.cos(angle),
                                dep,
                            )
                        )
                    )
            n = len(profile)
            faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, n * 2))] + [
                (j, (j + 1) % n, (j + 1) % n + n, j + n) for j in range(n)
            ]
            mesh = bpy.data.meshes.new("Airfoil")
            mesh.from_pydata(verts, [], faces)
            mesh.update()
            obj = bpy.data.objects.new("Tapered blade", mesh)
            bpy.context.collection.objects.link(obj)
            finish(obj, "Tapered blade", trim, 0.003)
        parent = saved
    # Front instrumentation pedestal and compact auxiliary unit.
    box(
        "Instrumentation plinth", (1.538, 0.022, 1.538), (0.32, 0.044, 0.3), trim, 0.008
    )
    box("Pedestal inset", (1.538, 0.055, 1.538), (0.25, 0.033, 0.24), shell, 0.006)
    cylinder("Instrumentation mast", (1.538, 0.21, 1.538), 0.008, 0.31, shell)
    for dx, dz in [(-0.11, -0.11), (-0.11, 0.11), (0.11, -0.11), (0.11, 0.11)]:
        pipe(
            "Instrument support",
            [(1.538 + dx, 0.076, 1.538 + dz), (1.538, 0.415, 1.538)],
            0.005,
        )
    box("Auxiliary cabinet", (1.49, 0.066, -0.965), (0.23, 0.132, 0.23), glass, 0.003)
    box("Auxiliary top", (1.49, 0.137, -0.965), (0.24, 0.008, 0.24), glass, 0.003)


def build_factory():
    global parent
    # MANUFACTURING: multi-storey buildings, curtain wall glazing, pipes and vessels.
    parent = group("FactoryModels")
    for x, z, w, d in [(-0.07, 1.02, 0.76, 0.52), (1.09, 0.12, 0.65, 0.53)]:
        box("Manufacturing deck", (x, 0.03, z), (w, 0.06, d), trim, 0.005)
    for x, z, w, h, d in [
        (-0.606, 1.139, 0.20, 0.82, 0.235),
        (-0.281, 0.899, 0.23, 0.49, 0.255),
        (0.055, 0.871, 0.185, 0.48, 0.22),
        (0.918, 0.002, 0.27, 0.60, 0.275),
        (1.699, -0.003, 0.26, 0.49, 0.295),
    ]:
        box("Building plinth", (x, 0.025, z), (w + 0.11, 0.05, d + 0.10), trim, 0.006)
        # Thin structure sits behind continuous glazing to keep the silhouette light.
        for dx in [-w / 2 + 0.01, w / 2 - 0.01]:
            for dz in [-d / 2 + 0.01, d / 2 - 0.01]:
                box(
                    "Structural pier",
                    (x + dx, 0.05 + h / 2, z + dz),
                    (0.02, h, 0.02),
                    shell,
                    0.003,
                )
        floor_count = max(2, round(h / 0.25))
        floor_height = h / floor_count
        box(
            "Recessed service core",
            (x - w * 0.12, 0.055 + h / 2, z - d * 0.12),
            (w * 0.18, h - 0.04, d * 0.22),
            shell,
            0.004,
        )
        for floor in range(floor_count + 1):
            box(
                "Structural floor",
                (x, 0.062 + floor * floor_height, z),
                (w, 0.016, d),
                shell,
                0.003,
            )
        for dx in [-w / 2, w / 2]:
            box("Roof rim", (x + dx, h + 0.067, z), (0.009, 0.02, d), trim, 0.002)
        for dz in [-d / 2, d / 2]:
            box("Roof rim", (x, h + 0.067, z + dz), (w, 0.02, 0.009), trim, 0.002)
        box("Roof inset", (x, 0.067 + h, z), (w - 0.028, 0.004, d - 0.028), dark, 0.001)
        for floor in range(floor_count):
            y = 0.062 + (floor + 0.5) * floor_height
            box(
                "Facade spandrel",
                (x, y - floor_height * 0.43, z + d / 2 - 0.006),
                (w - 0.02, floor_height * 0.08, 0.009),
                shell,
                0.002,
            )
            for bay in range(2):
                bx = x - w * 0.25 + bay * w * 0.5
                box(
                    "Front recessed glazing",
                    (bx, y, z + d / 2 - 0.006),
                    (w * 0.46, floor_height * 0.86, 0.006),
                    glass,
                    0.001,
                )
                box(
                    "Window lintel",
                    (bx, y + floor_height * 0.44, z + d / 2 - 0.002),
                    (w * 0.46, 0.006, 0.012),
                    trim,
                    0.001,
                )
                box(
                    "Glazed service panel",
                    (bx, y - floor_height * 0.09, z + d / 2 - 0.023),
                    (w * 0.19, floor_height * 0.31, 0.009),
                    dark,
                    0.001,
                )
                box(
                    "Service panel header",
                    (bx, y + floor_height * 0.07, z + d / 2 - 0.017),
                    (w * 0.20, 0.005, 0.004),
                    trim,
                    0.001,
                )
                box(
                    "Service panel handle",
                    (bx + w * 0.06, y - floor_height * 0.1, z + d / 2 - 0.017),
                    (0.003, floor_height * 0.1, 0.004),
                    trim,
                    0.0005,
                )
            for bay in range(2):
                bz = z - d * 0.25 + bay * d * 0.5
                box(
                    "Side recessed glazing",
                    (x + w / 2 - 0.006, y, bz),
                    (0.006, floor_height * 0.86, d * 0.46),
                    glass,
                    0.001,
                )
            box(
                "Rear glazing",
                (x, y, z - d / 2 + 0.006),
                (w - 0.02, floor_height * 0.86, 0.006),
                glass,
                0.001,
            )
            box(
                "Left glazing",
                (x - w / 2 + 0.006, y, z),
                (0.006, floor_height * 0.86, d - 0.02),
                glass,
                0.001,
            )
            pipe(
                "Floor service run",
                [
                    (x + w * 0.15, y, z + d * 0.15),
                    (x + w * 0.15, y + floor_height * 0.24, z + d * 0.15),
                    (x + w / 2, y + floor_height * 0.24, z + d * 0.15),
                ],
                0.005,
            )
        for post in [-1, 0, 1]:
            box(
                "Facade mullion",
                (x + post * w * 0.46, 0.06 + h / 2, z + d / 2 + 0.003),
                (0.006, h - 0.045, 0.01),
                trim,
                0.001,
            )
        box(
            "Rooftop plant", (x + 0.02, h + 0.081, z), (0.065, 0.028, 0.08), shell, 0.003
        )
        for fin in range(4):
            box(
                "Plant grille",
                (x + 0.02, h + 0.096, z - 0.028 + fin * 0.018),
                (0.059, 0.002, 0.003),
                trim,
                0.001,
            )
    for x, z, w, d in [(-0.10, 1.16, 0.20, 0.14), (1.21, 0.20, 0.20, 0.16)]:
        box(
            "Process skid base", (x, 0.018, z), (w + 0.04, 0.036, d + 0.04), trim, 0.004
        )
        box("Process equipment casing", (x, 0.078, z), (w, 0.11, d), shell, 0.006)
        for n in range(3):
            box(
                "Process case vent",
                (x - w * 0.28 + n * w * 0.28, 0.09, z + d / 2 + 0.002),
                (w * 0.13, 0.045, 0.004),
                dark,
                0.001,
            )
        cylinder("Skid feed valve", (x, 0.15, z), 0.026, 0.032, trim)
        pipe(
            "Skid service outlet",
            [(x + w * 0.4, 0.11, z), (x + w * 0.7, 0.11, z), (x + w * 0.7, 0.035, z)],
            0.008,
        )
    for i in range(2):
        x = -0.48 + i * 0.18
        z = 1.26
        cylinder("Storage vessel", (x, 0.125, z), 0.053, 0.18, shell)
        sphere("Tank dome", (x, 0.22, z), (0.053, 0.032, 0.053), trim)
        ring("Tank rim", (x, 0.045, z), 0.056, 0.006)
        pipe(
            "Tank outlet",
            [(x, 0.1, z + 0.08), (x, 0.1, z + 0.17), (x, 0.04, z + 0.17)],
            0.009,
        )
    pipe(
        "Feed main",
        [
            (-0.606, 0.075, 1.139),
            (-0.606, 0.15, 1.139),
            (-0.606, 0.15, 0.68),
            (0.30, 0.15, 0.68),
            (0.30, 0.04, 0.68),
        ],
        0.013,
    )
    for x in [-0.5, -0.1, 0.3]:
        pipe("Pipe riser", [(x, 0.03, 0.68), (x, 0.15, 0.68)], 0.008)
    for i in range(6):
        box(
            "Access stair",
            (0.918, 0.025 + i * 0.024, 0.38 - i * 0.035),
            (0.2, 0.045, 0.04),
            trim,
            0.002,
        )


def build_product():
    global parent
    # PRODUCT: bevelled housing, deep door cavity, nested machined rings and controls.
    parent = group("ProductModels")
    body = box("Appliance housing", (0, 0.46, 0), (0.83, 0.88, 0.75), shell, 0.025)
    # Boolean cut gives an actual opening, not a circle pasted on a cube.
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=64,
        radius=0.213,
        depth=0.2,
        location=xyz((0, 0.505, 0.335)),
        rotation=(math.pi / 2, 0, 0),
    )
    cutter = bpy.context.object
    mod = body.modifiers.new("Door cavity", "BOOLEAN")
    mod.object = cutter
    mod.operation = "DIFFERENCE"
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    box("Top lid", (0, 0.913, -0.004), (0.838, 0.035, 0.765), trim, 0.014)
    box("Front control fascia", (0, 0.801, 0.381), (0.763, 0.129, 0.027), shell, 0.006)
    box("Detergent drawer", (-0.208, 0.802, 0.4), (0.272, 0.085, 0.013), shell, 0.004)
    box("Drawer handle", (-0.208, 0.829, 0.409), (0.22, 0.009, 0.015), trim, 0.002)
    box("Display", (0.154, 0.806, 0.402), (0.21, 0.065, 0.015), screen, 0.004)
    for n in range(3):
        box(
            "Display segment",
            (0.099 + n * 0.048, 0.806, 0.413),
            (0.025, 0.027, 0.002),
            glass,
            0.001,
        )
    cylinder("Control dial", (0.307, 0.805, 0.416), 0.031, 0.025, trim, "z")
    ring("Door chrome outer", (0, 0.505, 0.382), 0.225, 0.018, trim, "z")
    ring("Door gasket", (0, 0.505, 0.357), 0.203, 0.02, dark, "z")
    cylinder("Drum back", (0, 0.505, 0.23), 0.19, 0.01, dark, "z")
    for n in range(32):
        a = n * math.tau / 32
        cylinder(
            "Drum perforation",
            (math.cos(a) * 0.163, 0.505 + math.sin(a) * 0.163, 0.24),
            0.008,
            0.002,
            dark,
            "z",
            12,
        )
    ring("Door glass edge", (0, 0.505, 0.384), 0.188, 0.008, glass, "z")
    cylinder("Door smoked glass", (0, 0.505, 0.389), 0.182, 0.008, glass, "z")
    box("Door latch", (0.205, 0.505, 0.419), (0.028, 0.085, 0.029), trim, 0.007)
    box("Lower kick panel", (0, 0.081, 0.381), (0.72, 0.06, 0.016), trim, 0.004)
    for x in [-0.32, 0.32]:
        for z in [-0.29, 0.29]:
            cylinder("Levelling foot", (x, 0.018, z), 0.041, 0.035, dark)
    box("Side service panel", (0.42, 0.475, 0.015), (0.008, 0.65, 0.57), shell, 0.009)
    for h in [0.26, 0.69]:
        cylinder("Panel hinge", (0.432, h, 0.225), 0.012, 0.052, trim)
    for k in range(9):
        box(
            "Side ventilation",
            (0.427, 0.33 + k * 0.027, -0.19),
            (0.004, 0.008, 0.15),
            dark,
            0.001,
        )
    for x, z in [(-1.323, 0.167), (0.269, -1.387)]:
        box("Peripheral plinth", (x, 0.02, z), (0.22, 0.04, 0.2), trim, 0.005)
        box("Peripheral cabinet", (x, 0.102, z), (0.15, 0.145, 0.15), shell, 0.006)
        box("Peripheral lid", (x, 0.18, z), (0.16, 0.015, 0.16), trim, 0.003)
        for n in range(3):
            box(
                "Peripheral ventilation",
                (x - 0.04 + n * 0.038, 0.116, z + 0.078),
                (0.018, 0.044, 0.005),
                dark,
                0.001,
            )


build_energy()
build_factory()
build_product()

for name, footprints in contact_footprints.items():
    bpy.data.objects[name]["contactFootprints"] = json.dumps(footprints)

# Keep the editable source, then consolidate the export by parent/material.
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(
    filepath=str(Path(__file__).with_name("lifecycle-models.blend"))
)
for container in [obj for obj in bpy.context.scene.objects if obj.type == "EMPTY"]:
    buckets = {}
    for obj in list(container.children):
        if obj.type != "MESH":
            continue
        for slot in obj.material_slots:
            if slot.material is None:
                slot.material = shell
        key = tuple(slot.material.name for slot in obj.material_slots)
        buckets.setdefault(key, []).append(obj)
    for key, objects in buckets.items():
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects) > 1:
            bpy.ops.object.join()
        bpy.context.object.name = container.name + "_" + "_".join(key)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=str(OUT / "lifecycle-models.glb"),
    export_format="GLB",
    export_apply=True,
    export_extras=True,
    export_copyright="Tiangong LCA, authored for Portal brand exploration",
)
print("EXPORTED", OUT / "lifecycle-models.glb")
