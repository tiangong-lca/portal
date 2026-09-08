"""Author the lifecycle model assets with Blender 5.1; no external model dependencies.
Run: Blender --background --python .storybook/brand-exploration/modeling/build_models.py
All dimensions below use the web scene's X/right, Y/up, Z/front convention.
"""

import bpy
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "brand-exploration"
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
    for i, (x, z, h) in enumerate([(-0.585, 1.48, 0.78), (-0.238, 0.95, 1.10)]):
        box("Column plinth", (x, 0.032, z), (0.29, 0.065, 0.28), trim, 0.014)
        cone("Process column", (x, h / 2 + 0.06, z), 0.084, 0.064, h, shell)
        cylinder("Column cap", (x, h + 0.07, z), 0.07, 0.025, trim)
        for j in range(4):
            ring("Column flange", (x, 0.11 + j * h / 4, z), 0.086, 0.01)
        pipe(
            "Service pipe",
            [
                (x + 0.105, 0.07, z + 0.04),
                (x + 0.105, h + 0.02, z + 0.04),
                (x, h + 0.02, z + 0.04),
            ],
            0.011,
        )
        for j in range(3):
            cylinder(
                "Valve",
                (x + 0.103, 0.21 + j * 0.18, z + 0.085),
                0.025,
                0.025,
                trim,
                "z",
                24,
            )
        # A tiny ladder makes the columns read as fabricated equipment.
        for dx in [-0.034, 0.034]:
            pipe(
                "Ladder rail",
                [(x + dx, 0.08, z + 0.091), (x + dx, h, z + 0.091)],
                0.004,
            )
        for j in range(10):
            pipe(
                "Ladder rung",
                [
                    (x - 0.034, 0.12 + j * h / 11, z + 0.091),
                    (x + 0.034, 0.12 + j * h / 11, z + 0.091),
                ],
                0.003,
            )

    for i, (x, z, h) in enumerate([(0.382, -0.297, 0.66), (0.877, -0.594, 0.49)]):
        box("Turbine foundation", (x, 0.025, z), (0.13, 0.05, 0.14), trim)
        cone("Wind tower", (x, h / 2, z), 0.028, 0.017, h, shell)
        sphere("Nacelle", (x, h, z), (0.052, 0.04, 0.085))
        rotor = group("Rotor" + str(i))
        rotor.parent = parent
        rotor.location = xyz((x, h, z + 0.075))
        rotor.scale = (0.65, 0.65, 0.65)
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
    box("Instrumentation plinth", (0.95, 0.022, 0.95), (0.35, 0.044, 0.35), trim, 0.008)
    box(
        "Instrumentation housing", (0.95, 0.125, 0.95), (0.17, 0.18, 0.17), shell, 0.012
    )
    box("Instrument face", (0.95, 0.14, 1.039), (0.11, 0.072, 0.006), glass, 0.004)
    box("Auxiliary cabinet", (1.31, 0.084, -1.02), (0.18, 0.168, 0.18), shell, 0.006)
    box("Auxiliary top", (1.31, 0.174, -1.02), (0.19, 0.018, 0.19), trim, 0.004)


def build_factory():
    global parent
    # MANUFACTURING: multi-storey buildings, curtain wall glazing, pipes and vessels.
    parent = group("FactoryModels")
    for index, (x, z, w, h, d) in enumerate(
        [
            (-0.884, 0.813, 0.23, 0.71, 0.29),
            (-0.424, 0.82, 0.24, 0.42, 0.30),
            (-0.134, 0.757, 0.21, 0.46, 0.27),
            (0.389, -0.389, 0.28, 0.5, 0.32),
            (0.919, -0.354, 0.23, 0.38, 0.28),
            (1.266, -0.417, 0.24, 0.32, 0.30),
        ]
    ):
        box("Building plinth", (x, 0.025, z), (w + 0.04, 0.05, d + 0.04), trim, 0.006)
        box("Building frame", (x, 0.05 + h / 2, z), (w, h, d), shell, 0.007)
        box("Parapet", (x, 0.05 + h, z), (w + 0.015, 0.025, d + 0.015), trim, 0.003)
        box("Roof inset", (x, 0.067 + h, z), (w - 0.035, 0.008, d - 0.035), dark, 0.002)
        for floor in range(max(2, int(h / 0.105))):
            y = 0.12 + floor * 0.102
            for bay in range(2):
                bx = x - w * 0.25 + bay * w * 0.5
                box(
                    "Front recessed glazing",
                    (bx, y, z + d / 2 + 0.002),
                    (w * 0.37, 0.064, 0.008),
                    glass,
                    0.001,
                )
                box(
                    "Window lintel",
                    (bx, y + 0.035, z + d / 2 + 0.005),
                    (w * 0.41, 0.005, 0.012),
                    trim,
                    0.001,
                )
            for bay in range(2):
                bz = z - d * 0.25 + bay * d * 0.5
                box(
                    "Side recessed glazing",
                    (x + w / 2 + 0.002, y, bz),
                    (0.008, 0.064, d * 0.37),
                    glass,
                    0.001,
                )
        for post in [-1, 0, 1]:
            box(
                "Facade mullion",
                (x + post * w * 0.44, 0.06 + h / 2, z + d / 2 + 0.009),
                (0.008, h - 0.045, 0.012),
                trim,
                0.001,
            )
        box("Rooftop plant", (x + 0.02, h + 0.11, z), (0.09, 0.08, 0.12), shell, 0.003)
        for fin in range(4):
            box(
                "Plant grille",
                (x + 0.02, h + 0.153, z - 0.045 + fin * 0.028),
                (0.085, 0.004, 0.004),
                trim,
                0.001,
            )
    for i in range(2):
        x = -0.49 + i * 0.18
        z = 0.12
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
            (-1.35, 0.075, 0.6),
            (-1.35, 0.15, 0.6),
            (-1.35, 0.15, -0.2),
            (0.8, 0.15, -0.2),
            (0.8, 0.04, -0.2),
        ],
        0.013,
    )
    for x in [-1.25, -0.5, 0.4]:
        pipe("Pipe riser", [(x, 0.03, -0.2), (x, 0.15, -0.2)], 0.008)
    for i in range(6):
        box(
            "Access stair",
            (0.6, 0.025 + i * 0.024, 0.42 - i * 0.035),
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
        radius=0.253,
        depth=0.2,
        location=xyz((0, 0.455, 0.335)),
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
    box("Front control fascia", (0, 0.801, 0.381), (0.763, 0.129, 0.027), trim, 0.006)
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
    ring("Door chrome outer", (0, 0.455, 0.382), 0.266, 0.021, trim, "z")
    ring("Door gasket", (0, 0.455, 0.357), 0.242, 0.023, dark, "z")
    cylinder("Drum back", (0, 0.455, 0.23), 0.226, 0.01, trim, "z")
    for n in range(32):
        a = n * math.tau / 32
        cylinder(
            "Drum perforation",
            (math.cos(a) * 0.193, 0.455 + math.sin(a) * 0.193, 0.24),
            0.008,
            0.002,
            dark,
            "z",
            12,
        )
    ring("Door glass edge", (0, 0.455, 0.384), 0.224, 0.01, glass, "z")
    cylinder("Door smoked glass", (0, 0.455, 0.389), 0.217, 0.008, glass, "z")
    box("Door latch", (0.238, 0.457, 0.419), (0.033, 0.102, 0.032), trim, 0.007)
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
            (0.419, 0.33 + k * 0.027, -0.19),
            (0.006, 0.008, 0.15),
            dark,
            0.001,
        )
    for x, z in [(-1.22, 0.28), (1.16, -0.48)]:
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
