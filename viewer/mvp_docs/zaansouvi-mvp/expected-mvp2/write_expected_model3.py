# The expected graph model, format 3, of test-source-mvp2, for the Inventory's data (mvp_docs/55_viewer_backend.md,
# BE-110 to BE-115; the shapes in mvp_docs/proposed_schema/26-11-10 213900 ...). Two kinds of content:
#   - MECHANICAL: the index (BE-110) and the Inventory's Files tree (INV-5, INV-34), worked out here from the
#     hand-written graph (expected-graph.json, write_expected.py) and the source's listing, by the rules stated below.
#     No Viewer code is used.
#   - BY HAND: four views (the top view, shapes.ts, Circle, total()) and the display facts of a few nodes, written out
#     literally below from the source and the Viewer's lifting rules (BE-53), each with its reasoning.
# Relations have no IDs in the hand-written graph, so a relation is named by a KEY: "<at> <kind> <to>" for a use
# (at = "file line:column"), "link <from> <to>" for an import; the check matches the model's relations by the same key.
# Run: python3 -I write_expected_model3.py  (writes expected-model3.json beside it)
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(os.path.join(HERE, "expected-graph.json")))

S = "src/shapes.ts"
def sym(name_at): return f"{S}#{name_at}"

# ---------------------------------------------------------------------------------------------------------------------
# MECHANICAL: the index (BE-110)
# ---------------------------------------------------------------------------------------------------------------------
# The source's listing (test-source-mvp2/, as the Runner lists it, RUN-34): folders and files, by path.
FOLDERS = ["src", "src/report", "src/report/charts", "src/util"]
FILES = ["README.md", "src/app.ts", "src/report/charts/bars.ts", "src/report/format.ts", "src/report/summary.ts",
         "src/shapes.ts", "src/util/numbers.ts"]
parent = {n["id"]: n["parent"] for n in G["nodes"]}
line_col = lambda i: tuple(int(x) for x in i.rsplit("@", 1)[1].split(":"))   # a symbol's own position, from its ID

def ancestors(i):  # its containers, from the top down; [] for a listed entry
    out = []
    while i in parent:
        i = parent[i]
        out.insert(0, i)
    return out

def key_edge(e): return f"{e['at']} {e['kind']} {e['to']}"
def key_link(l): return f"link {l['from']} {l['to']}"

index = {"fileOf": {}, "children": {}, "entries": {}, "folderOf": {}, "ancestors": {}, "relationsFrom": {}, "relationsTo": {}}
for f in FILES:  # every listed file is its own file, README.md included ("for a file, itself", BE-110)
    index["fileOf"][f] = f
for n in G["nodes"]:
    index["fileOf"][n["id"]] = n["id"].split("#")[0]
    index["ancestors"][n["id"]] = ancestors(n["id"])
for e in FILES + FOLDERS:
    index["ancestors"][e] = []
# children: a container's members in source order, by their own position
kids = {}
for n in G["nodes"]:
    kids.setdefault(n["parent"], []).append(n["id"])
for c, ks in kids.items():
    index["children"][c] = sorted(ks, key=line_col)
# entries: a folder's entries, folders first, then files, by name (INV-34); "" is the source root
for e in FOLDERS + FILES:
    folder = e.rsplit("/", 1)[0] if "/" in e else ""
    index["entries"].setdefault(folder, []).append(e)
    if folder: index["folderOf"][e] = folder
for k in index["entries"]:
    index["entries"][k].sort(key=lambda e: (e not in FOLDERS, e.rsplit("/", 1)[-1]))
# relations both ways, by key; built-ins and unresolved uses (to: null) only from their start
for e in G["edges"]:
    index["relationsFrom"].setdefault(e["from"], []).append(key_edge(e))
    index["relationsTo"].setdefault(e["to"], []).append(key_edge(e))
for l in G["links"]:
    index["relationsFrom"].setdefault(l["from"], []).append(key_link(l))
    index["relationsTo"].setdefault(l["to"], []).append(key_link(l))
for b in G["builtins"] + G["unresolved"]:
    index["relationsFrom"].setdefault(b["from"], []).append(f"{b['at']} {b['kind']} null")

# ---------------------------------------------------------------------------------------------------------------------
# MECHANICAL: the Inventory's Files tree (INV-5, INV-34): the root row, folders first then files by name, and in each
# file its symbols in source order, nested by container. One line per row, indented by two spaces per level.
# ---------------------------------------------------------------------------------------------------------------------
tree = ["test-source-mvp2", "  Files"]
def walk_symbols(c, depth):
    for k in index["children"].get(c, []):
        tree.append("  " * depth + k)
        walk_symbols(k, depth + 1)
def walk_entries(folder, depth):
    for e in index["entries"].get(folder, []):
        tree.append("  " * depth + e)
        if e in FOLDERS: walk_entries(e, depth + 1)
        else: walk_symbols(e, depth + 1)
walk_entries("", 2)

# ---------------------------------------------------------------------------------------------------------------------
# BY HAND: four views
# ---------------------------------------------------------------------------------------------------------------------
A, BARS, SUM, FMT, NUM = "src/app.ts", "src/report/charts/bars.ts", "src/report/summary.ts", "src/report/format.ts", "src/util/numbers.ts"
CIRCLE, TOTAL, BASE = sym("Circle@27:14"), sym("total@44:17"), sym("Base@12:23")

views = {}

# The top view. Every listed entry is a node (UI-47); the six .ts files are connected (11 file pairs with uses or
# imports between them, one edge per pair and direction); README.md and the four folders are connected to nothing,
# so they are the "Not connected" entries. Each file has symbols, so each has a view one level inside; folders have
# no view (M2Q-1), README.md none (no tool reads it).
views[""] = {
    "render": {e: "node" for e in FILES + FOLDERS},
    "unconnected": ["README.md", "src", "src/report", "src/report/charts", "src/util"],
    "path": [], "reachable": True,
    "inside": [A, BARS, FMT, SUM, S, NUM],
    "edgeCount": 11,
    "edges": [  # (from, to): which file uses which
        [A, S], [BARS, FMT], [BARS, SUM], [BARS, S], [BARS, NUM], [FMT, NUM],
        [SUM, A], [SUM, FMT], [SUM, S], [SUM, NUM], [NUM, S],
    ],
}

# The view of shapes.ts: its 15 top-level symbols are its nodes. A node whose members all have no members of their own
# gets them written into its label (FND-69): Shape, Point, Color, Flag, log, total, Anonymous. Base, Circle, Rect and
# Geometry hold a constructor or a function with parameters, so they are drawn without member rows. The four files that
# use something of shapes.ts are its stubs; format.ts uses nothing of it. The title is shapes.ts itself.
TOP15 = ["Shape@2:18", "Point@3:13", "Color@4:13", "Flag@5:19", "UNIT@7:14", "created@8:5", "log@10:10", "Base@12:23",
         "Circle@27:14", "Rect@34:14", "total@44:17", "Geometry@51:18", "registry@56:14", "Anonymous@57:14", "config@58:14"]
ROWS = {  # the members written into each label, in the order the Graph draws them today: by ID (FND-102)
    "Shape@2:18": ["area@2:26", "name@2:51"], "Point@3:13": ["x@3:23", "y@3:34"],
    "Color@4:13": ["Green@4:34", "Red@4:21"], "Flag@5:19": ["Off@5:34", "On@5:26"],
    "log@10:10": ["key@10:31", "target@10:14"],
    "total@44:17": ["acc@47:30", "round@46:49", "s@47:35", "shapes@46:23", "sum@47:9"],
    "Anonymous@57:14": ["area@57:71", "name@57:56"],
}
r = {S: "title"}
r.update({sym(x): "node" for x in TOP15})
for owner, ms in ROWS.items():
    r.update({sym(m): "member" for m in ms})
r.update({f: "stub" for f in [A, BARS, SUM, NUM]})
views[S] = {
    "render": r,
    "memberOf": {sym(m): sym(o) for o, ms in ROWS.items() for m in ms},
    "memberRows": {sym(o): [sym(m) for m in ms] for o, ms in ROWS.items()},
    "path": [""], "reachable": True,
    # its own nodes that have a view: every one with members
    "inside": [sym(x) for x in ["Anonymous@57:14", "Base@12:23", "Circle@27:14", "Color@4:13", "Flag@5:19",
                                "Geometry@51:18", "Point@3:13", "Rect@34:14", "Shape@2:18", "log@10:10", "total@44:17"]],
}

# The view of Circle. Its members are its nodes; color is the constructor's only member and has none of its own, so it
# is written into the constructor's label. Every relation touching Circle's subtree, placed by BE-53:
#   Circle extends Base                         -> title -> Base (stub: Base is a child of shapes.ts, outside Circle)
#   constructor: type Color; call Base's constructor (lifted to Base); read color (inside the constructor: not drawn)
#   area reads radius; unit: type Circle, new Circle (both to the title), reads UNIT (stub)
#   registry: reads Circle (to the title), calls unit
#   app.ts: new Circle, reads Circle, and its import of Circle (to the title: 3, mixed); calls unit; calls area
#   bars.ts: new Circle and its import of Circle (to the title: 2, mixed); calls area
# Built-ins from area: Math (the receiver) and Math.PI; the group keeps PI only (FND-100).
U = lambda e: f"{e[0]} {e[1]} {e[2]}"
CE = [  # [from, to, kind, [relation keys]]
    [CIRCLE, BASE, "extends", [f"{S} 27:29 extends {BASE}"]],
    [sym("constructor@29:3"), sym("Color@4:13"), "type", [f"{S} 29:47 type {sym('Color@4:13')}"]],
    [sym("constructor@29:3"), BASE, "call", [f"{S} 29:56 call {sym('constructor@17:3')}"]],
    [sym("area@30:3"), sym("radius@29:23"), "read", [f"{S} 30:42 read {sym('radius@29:23')}"]],
    [sym("unit@31:10"), CIRCLE, "mixed", [f"{S} 31:18 type {CIRCLE}", f"{S} 31:38 new {CIRCLE}"]],
    [sym("unit@31:10"), sym("UNIT@7:14"), "read", [f"{S} 31:45 read {sym('UNIT@7:14')}"]],
    [sym("registry@56:14"), CIRCLE, "read", [f"{S} 56:70 read {CIRCLE}"]],
    [sym("registry@56:14"), sym("unit@31:10"), "call", [f"{S} 56:77 call {sym('unit@31:10')}"]],
    [A, CIRCLE, "mixed", [f"{A} 20:17 new {CIRCLE}", f"{A} 22:31 read {CIRCLE}", f"link {A}#Circle@1:8 {CIRCLE}"]],
    [A, sym("unit@31:10"), "call", [f"{A} 22:38 call {sym('unit@31:10')}"]],
    [A, sym("area@30:3"), "call", [f"{A} 25:62 call {sym('area@30:3')}"]],
    [BARS, CIRCLE, "mixed", [f"{BARS} 8:43 new {CIRCLE}", f"link {BARS}#Circle@2:8 {CIRCLE}"]],
    [BARS, sym("area@30:3"), "call", [f"{BARS} 10:55 call {sym('area@30:3')}"]],
]
views[CIRCLE] = {
    "render": {CIRCLE: "title", **{sym(x): "node" for x in ["name@28:12", "constructor@29:3", "radius@29:23", "area@30:3", "unit@31:10"]},
               sym("color@29:39"): "member",
               **{x: "stub" for x in [A, BARS, BASE, sym("Color@4:13"), sym("UNIT@7:14"), sym("registry@56:14")]}},
    "memberOf": {sym("color@29:39"): sym("constructor@29:3")},
    "memberRows": {sym("constructor@29:3"): [sym("color@29:39")]},
    "path": ["", S], "reachable": True,
    "inside": [sym("constructor@29:3")],
    "edges": CE, "edgeCount": 13, "relationCount": 17,
    "notDrawn": [f"{S} 29:62 read {sym('color@29:39')}"],  # both ends on the constructor at this level (UI-34)
    "builtinGroups": [{"type": "Math", "members": [{"name": "PI", "relations": [f"{S} 30:32 read null"]}]}],
}

# The view of total(). Its parameters and its local are its nodes, none with members. Placed by BE-53:
#   three type uses of Shape and the call of Shape.area (lifted to Shape): title -> Shape (stub), 4, mixed
#   reads of shapes, acc, s, round: one edge each; two reads of sum: one edge of 2
#   app.ts, numbers.ts, bars.ts: each an import of total and a call of it: stub -> title, 2, mixed
# Built-ins: ReadonlyArray.reduce, Math (receiver, dropped from its group), Math.round.
SHAPE = sym("Shape@2:18")
TE = [
    [TOTAL, SHAPE, "mixed", [f"{S} 44:40 type {SHAPE}", f"{S} 45:40 type {SHAPE}", f"{S} 46:40 type {SHAPE}", f"{S} 47:49 call {sym('area@2:26')}"]],
    [TOTAL, sym("shapes@46:23"), "read", [f"{S} 47:15 read {sym('shapes@46:23')}"]],
    [TOTAL, sym("acc@47:30"), "read", [f"{S} 47:41 read {sym('acc@47:30')}"]],
    [TOTAL, sym("s@47:35"), "read", [f"{S} 47:47 read {sym('s@47:35')}"]],
    [TOTAL, sym("round@46:49"), "read", [f"{S} 48:10 read {sym('round@46:49')}"]],
    [TOTAL, sym("sum@47:9"), "read", [f"{S} 48:29 read {sym('sum@47:9')}", f"{S} 48:36 read {sym('sum@47:9')}"]],
    [A, TOTAL, "mixed", [f"{A} 24:15 call {TOTAL}", f"link {A}#total@1:24 {TOTAL}"]],
    [NUM, TOTAL, "mixed", [f"{NUM} 13:30 call {TOTAL}", f"link {NUM}#total@2:10 {TOTAL}"]],
    [BARS, TOTAL, "mixed", [f"{BARS} 9:17 call {TOTAL}", f"link {BARS}#total@2:18 {TOTAL}"]],
]
views[TOTAL] = {
    "render": {TOTAL: "title", **{sym(x): "node" for x in ["shapes@46:23", "round@46:49", "sum@47:9", "acc@47:30", "s@47:35"]},
               **{x: "stub" for x in [SHAPE, A, NUM, BARS]}},
    "memberOf": {}, "memberRows": {},
    "path": ["", S], "reachable": True, "inside": [],
    "edges": TE, "edgeCount": 9, "relationCount": 16,  # 4 + 1 + 1 + 1 + 1 + 2 + 2 + 2 + 2
    "builtinGroups": [
        {"type": "Math", "members": [{"name": "round", "relations": [f"{S} 48:23 call null"]}]},
        {"type": "ReadonlyArray", "members": [{"name": "reduce", "relations": [f"{S} 47:22 call null"]}]},
    ],
}
for v in (CIRCLE, TOTAL):  # relationEdge: the same facts, from each relation's side
    views[v]["relationEdge"] = {k: f"{e[0]}->{e[1]}" for e in views[v]["edges"] for k in e[3]}

# ---------------------------------------------------------------------------------------------------------------------
# BY HAND: display facts of a few nodes (BE-114), as the page shows them today
# ---------------------------------------------------------------------------------------------------------------------
display = {
    S: {"name": "shapes.ts", "title": "file shapes.ts", "notes": [], "label": "shapes.ts · .ts"},
    "README.md": {"name": "README.md", "title": "file README.md", "notes": [], "label": "README.md · .md"},
    "src": {"name": "src", "title": "folder src", "notes": [], "label": "src/ · 6 files"},
    "src/report": {"name": "report", "title": "folder report", "notes": [], "label": "report/ · 3 files"},
    "src/report/charts": {"name": "charts", "title": "folder charts", "notes": [], "label": "charts/ · 1 file"},
    CIRCLE: {"name": "Circle", "title": "class Circle", "notes": ["exported", "default"]},
    BASE: {"name": "Base", "title": "class Base", "notes": ["exported", "abstract"]},
    TOTAL: {"name": "total()", "title": "ƒ total()", "notes": ["exported", "3 declarations"]},
    sym("Anonymous@57:14"): {"name": "Anonymous", "title": "variable Anonymous", "notes": ["exported", "const"]},
    sym("constructor@29:3"): {"name": "constructor()", "title": "ƒ constructor()", "notes": []},
    sym("radius@29:23"): {"name": "radius", "title": "property radius", "notes": ["private", "declared in constructor"]},
    sym("unit@31:10"): {"name": "unit()", "title": "ƒ unit()", "notes": ["static"]},
    sym("name@28:12"): {"name": "name", "title": "property name", "notes": ["readonly"]},
    sym("sum@47:9"): {"name": "sum", "title": "variable sum", "notes": ["const"]},
}

out = {
    "about": "The expected graph model, format 3, of test-source-mvp2 (mvp_docs/55_viewer_backend.md, BE-110 to BE-115). "
             "index and inventoryFiles are mechanical, from the hand-written graph and the listing; views and display are written "
             "by hand. Relations are named by key: '<at> <kind> <to>' for a use, 'link <from> <to>' for an import. "
             "A view's edges are [from, to, kind, [relation keys]] where given; edgeCount and relationCount where given.",
    "formatVersion": 3,
    "index": index,
    "views": views,
    "display": display,
    "dropped": [],
    "inventoryFiles": tree,
}
path = os.path.join(HERE, "expected-model3.json")
with open(path, "w") as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
    f.write("\n")
print(f"wrote {path}: index of {len(index['fileOf'])} nodes, {len(views)} views by hand, {len(display)} display facts, "
      f"{len(tree)} rows in the Files tree")
