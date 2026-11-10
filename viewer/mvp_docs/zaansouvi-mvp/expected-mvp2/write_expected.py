# The expected graph of test-source-mvp2, written by hand (mvp_docs/41_typescript_program_plan.md, section 1.1).
# Every node, edge, link, built-in and unresolved use below is decided by hand from the definition of a correct graph;
# this script only looks up the line and column of a token, so the IDs follow DATA-02 exactly. It reads the source
# text, never TypeScript. Run: python3 -I write_expected.py  (writes expected-graph.json beside it)
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "test-source-mvp2", "src")
FILES = ("shapes.ts", "app.ts", "util/numbers.ts", "report/format.ts", "report/summary.ts", "report/charts/bars.ts")
lines = {f: open(os.path.join(SRC, f)).read().split("\n") for f in FILES}

def col(f, line, token, n=1):
    """1-based column of the n-th occurrence of `token` (a whole word; '#tag' and '.x' allowed) on that line."""
    text = lines[f][line - 1]
    word = re.escape(token.lstrip("."))
    pat = (r"\." if token.startswith(".") else r"(?<![\w$#.])") + word + r"(?![\w$])"
    if token.startswith("#"):
        pat = re.escape(token) + r"(?![\w$])"
    ms = list(re.finditer(pat, text))
    if len(ms) < n:
        sys.exit(f"not found: {token} #{n} on {f}:{line}: {text}")
    m = ms[n - 1]
    return m.start() + 1 + (1 if token.startswith(".") else 0)

def at(f, line, token, n=1):
    return f"src/{f} {line}:{col(f, line, token, n)}"

ids = {}
def node(key, f, line, name, kind, parent, n=1, token=None, **extra):
    c = col(f, line, token or name, n)
    nid = f"src/{f}#{name}@{line}:{c}"
    ids[key] = nid
    rec = {"id": nid, "name": name, "kind": kind, "parent": ids.get(parent, parent)}
    rec.update(extra)
    nodes.append(rec)

nodes, edges, links, builtins, unresolved = [], [], [], [], []
S, A = "shapes.ts", "app.ts"
ids["S"] = "src/shapes.ts"; ids["A"] = "src/app.ts"

# ---- shapes.ts: declarations (A1-A4) ----
node("Shape", S, 2, "Shape", "interface", "S")
node("Shape.area", S, 2, "area", "method", "Shape")
node("Shape.name", S, 2, "name", "property", "Shape")
node("Point", S, 3, "Point", "typeAlias", "S")
node("Point.x", S, 3, "x", "property", "Point")
node("Point.y", S, 3, "y", "property", "Point")
node("Color", S, 4, "Color", "enum", "S")
node("Color.Red", S, 4, "Red", "enumMember", "Color")
node("Color.Green", S, 4, "Green", "enumMember", "Color")
node("Flag", S, 5, "Flag", "enum", "S")
node("Flag.On", S, 5, "On", "enumMember", "Flag")
node("Flag.Off", S, 5, "Off", "enumMember", "Flag")
node("UNIT", S, 7, "UNIT", "variable", "S")
node("created", S, 8, "created", "variable", "S")
node("log", S, 10, "log", "function", "S")
node("log.target", S, 10, "target", "parameter", "log")
node("log.key", S, 10, "key", "parameter", "log")
node("Base", S, 12, "Base", "class", "S")
node("Base.count", S, 13, "count", "property", "Base")
node("Base.id", S, 14, "id", "property", "Base")
node("Base.#tag", S, 15, "#tag", "property", "Base")
node("Base.name", S, 16, "name", "property", "Base")
node("Base.ctor", S, 17, "constructor", "constructor", "Base")
node("Base.color", S, 17, "color", "property", "Base", declaredIn="constructor")
node("Base.scale", S, 17, "scale", "property", "Base", declaredIn="constructor")
node("Base.area", S, 21, "area", "method", "Base")
node("Base.label", S, 22, "label", "accessor", "Base")            # getter and setter merged (A3); ID from the getter (TPG-D6)
node("label.value", S, 23, "value", "parameter", "Base.label")
node("Base.describe", S, 24, "describe", "method", "Base")
node("Circle", S, 27, "Circle", "class", "S")
node("Circle.name", S, 28, "name", "property", "Circle")
node("Circle.ctor", S, 29, "constructor", "constructor", "Circle")
node("Circle.radius", S, 29, "radius", "property", "Circle", declaredIn="constructor")
node("Circle.ctor.color", S, 29, "color", "parameter", "Circle.ctor")
node("Circle.area", S, 30, "area", "method", "Circle")
node("Circle.unit", S, 31, "unit", "method", "Circle")
node("Rect", S, 34, "Rect", "class", "S")
node("Rect.name", S, 35, "name", "property", "Rect")
node("Rect.ctor", S, 36, "constructor", "constructor", "Rect")
node("Rect.corner", S, 36, "corner", "property", "Rect", declaredIn="constructor")
node("Rect.w", S, 36, "w", "property", "Rect", declaredIn="constructor")
node("Rect.h", S, 36, "h", "property", "Rect", declaredIn="constructor")
node("Rect.area", S, 37, "area", "method", "Rect")
node("Rect.move", S, 38, "move", "method", "Rect")
node("move.by", S, 38, "by", "parameter", "Rect.move")
node("move.x", S, 39, "x", "variable", "Rect.move")
node("move.y", S, 39, "y", "variable", "Rect.move")
node("total", S, 44, "total", "function", "S", declarations=[f"src/shapes.ts 44:{col(S,44,'total')}", f"src/shapes.ts 45:{col(S,45,'total')}", f"src/shapes.ts 46:{col(S,46,'total')}"])
node("total.shapes", S, 46, "shapes", "parameter", "total")        # the implementation's; signature parameters are not nodes
node("total.round", S, 46, "round", "parameter", "total")
node("total.sum", S, 47, "sum", "variable", "total")
node("total.acc", S, 47, "acc", "parameter", "total")              # an arrow's parameters belong to the nearest named declaration
node("total.s", S, 47, "s", "parameter", "total")
node("Geometry", S, 51, "Geometry", "namespace", "S")
node("ORIGIN", S, 52, "ORIGIN", "variable", "Geometry")
node("distance", S, 53, "distance", "function", "Geometry")
node("distance.a", S, 53, "a", "parameter", "distance")
node("distance.b", S, 53, "b", "parameter", "distance")
node("registry", S, 56, "registry", "variable", "S")
node("Anonymous", S, 57, "Anonymous", "variable", "S")
node("Anonymous.name", S, 57, "name", "property", "Anonymous")    # an anonymous class's members belong to its variable
node("Anonymous.area", S, 57, "area", "method", "Anonymous")
node("config", S, 58, "config", "variable", "S")

# ---- app.ts: declarations ----
for name, n in [("Circle", 1), ("Rect", 1), ("total", 1), ("Color", 1), ("Geometry", 1), ("UNIT", 1), ("Shape", 1)]:
    node("imp." + name, A, 1, name, "import", "A", n=n)
node("imp.all", A, 2, "all", "import", "A")
node("Scene", A, 4, "Scene", "class", "A")
node("Scene.items", A, 5, "items", "property", "Scene")
node("Scene.add", A, 6, "add", "method", "Scene")
node("add.shape", A, 6, "shape", "parameter", "Scene.add")
node("Scene.render", A, 7, "render", "method", "Scene")
node("render.s", A, 9, "s", "parameter", "Scene.render")
node("render.i", A, 9, "i", "parameter", "Scene.render")
node("render.err", A, 10, "err", "variable", "Scene.render")
node("build", A, 18, "build", "function", "A")
for key, line, name in [("scene", 19, "scene"), ("c", 20, "c"), ("r", 21, "r"), ("d", 23, "d"), ("sum", 24, "sum"), ("index", 25, "index"), ("shape", 25, "shape")]:
    node("build." + key, A, line, name, "variable", "build")

# ---- edges (B5-B9, C): every use in a value position, and type uses as kind "type" ----
def edge(frm, to, kind, f, line, token, n=1, **extra):
    rec = {"from": ids[frm], "to": ids[to], "kind": kind, "at": at(f, line, token, n)}
    rec.update(extra)
    edges.append(rec)
def builtin(frm, name, kind, f, line, token, n=1, member=False):
    rec = {"from": ids[frm], "name": name, "kind": kind, "at": at(f, line, token, n), "reason": "built-in"}
    if member: rec["member"] = True
    builtins.append(rec)

E = edge
E("log", "log.target", "read", S, 10, "target", 2); E("log", "log.key", "read", S, 10, "key", 2)
E("Base", "Shape", "implements", S, 12, "Shape")
E("Base.ctor", "Color", "type", S, 17, "Color", 1)
E("Base.ctor", "Color", "read", S, 17, "Color", 2)
E("Base.ctor", "Color.Red", "read", S, 17, ".Red", member=True)
E("Base.ctor", "UNIT", "read", S, 17, "UNIT")
E("Base.ctor", "Base.id", "write", S, 18, ".id", member=True)
E("Base.ctor", "Base", "read", S, 18, "Base")
E("Base.ctor", "Base.count", "write", S, 18, ".count", member=True)
E("Base.ctor", "created", "write", S, 19, "created")
E("Base.label", "Base.name", "read", S, 22, ".name", member=True)
E("Base.label", "Base.id", "read", S, 22, ".id", member=True)
E("Base.label", "Base.#tag", "read", S, 22, "#tag", member=True)
E("Base.label", "Base.#tag", "write", S, 23, "#tag", member=True)
E("Base.label", "label.value", "read", S, 23, "value", 2)
E("Base", "log", "call", S, 24, "log")                             # a decorator runs when the class is defined (C)
E("Base.describe", "Base.label", "read", S, 24, ".label", member=True)
E("Base.describe", "Base.area", "call", S, 24, ".area", member=True)
E("Base.describe", "Base.scale", "read", S, 24, ".scale", member=True)
E("Circle", "Base", "extends", S, 27, "Base")
E("Circle.ctor", "Color", "type", S, 29, "Color")
E("Circle.ctor", "Base.ctor", "call", S, 29, "super")
E("Circle.ctor", "Circle.ctor.color", "read", S, 29, "color", 2)
builtin("Circle.area", "Math", "read", S, 30, "Math"); builtin("Circle.area", "Math.PI", "read", S, 30, ".PI", member=True)
E("Circle.area", "Circle.radius", "read", S, 30, ".radius", member=True)
E("Circle.unit", "Circle", "type", S, 31, "Circle", 1)
E("Circle.unit", "Circle", "new", S, 31, "Circle", 2)
E("Circle.unit", "UNIT", "read", S, 31, "UNIT")
E("Rect", "Point", "type", S, 34, "Point", 1); E("Rect", "Point", "type", S, 34, "Point", 2)
E("Rect", "Base", "extends", S, 34, "Base")
E("Rect.ctor", "Base.ctor", "call", S, 36, "super")
E("Rect.ctor", "Color", "read", S, 36, "Color")
E("Rect.ctor", "Color.Green", "read", S, 36, ".Green", member=True)
E("Rect.area", "Rect.w", "read", S, 37, ".w", member=True); E("Rect.area", "Rect.h", "read", S, 37, ".h", member=True)
builtin("Rect.move", "Partial", "type", S, 38, "Partial")
E("Rect.move", "Point", "type", S, 38, "Point")
E("Rect.move", "Rect", "type", S, 38, "Rect")
E("Rect.move", "Point.x", "read", S, 39, "x", member=True)        # destructuring reads the properties (C)
E("Rect.move", "Point.y", "read", S, 39, "y", member=True)
E("Rect.move", "move.by", "read", S, 39, "by")
E("Rect.move", "Rect", "new", S, 40, "Rect")
E("Rect.move", "Rect.corner", "read", S, 40, ".corner", 1, member=True)
E("Rect.move", "Rect.corner", "read", S, 40, ".corner", 2, member=True)
E("Rect.move", "Point.x", "read", S, 40, ".x", member=True)
E("Rect.move", "move.x", "read", S, 40, "x", 2)                    # x: (contextual, no edge) is the 1st; + x is the 2nd
E("Rect.move", "Rect.corner", "read", S, 40, ".corner", 3, member=True)
E("Rect.move", "Point.y", "read", S, 40, ".y", member=True)
E("Rect.move", "move.y", "read", S, 40, "y", 2)
E("Rect.move", "Rect.w", "read", S, 40, ".w", member=True); E("Rect.move", "Rect.h", "read", S, 40, ".h", member=True)
for line in (44, 45, 46):
    E("total", "Shape", "type", S, line, "Shape")
E("total", "total.shapes", "read", S, 47, "shapes")
builtin("total", "ReadonlyArray.reduce", "call", S, 47, ".reduce", member=True)   # shapes is a readonly Shape[]
E("total", "total.acc", "read", S, 47, "acc", 2)
E("total", "total.s", "read", S, 47, "s", 2)
E("total", "Shape.area", "call", S, 47, ".area", member=True)
E("total", "total.round", "read", S, 48, "round")
builtin("total", "Math", "read", S, 48, "Math"); builtin("total", "Math.round", "call", S, 48, ".round", member=True)
E("total", "total.sum", "read", S, 48, "sum", 1); E("total", "total.sum", "read", S, 48, "sum", 2)
E("ORIGIN", "Point", "type", S, 52, "Point")
E("distance", "Point", "type", S, 53, "Point", 1); E("distance", "Point", "type", S, 53, "Point", 2)
E("distance", "ORIGIN", "read", S, 53, "ORIGIN")
builtin("distance", "Math", "read", S, 53, "Math"); builtin("distance", "Math.hypot", "call", S, 53, ".hypot", member=True)
E("distance", "distance.a", "read", S, 53, "a", 2); E("distance", "Point.x", "read", S, 53, ".x", 1, member=True)
E("distance", "distance.b", "read", S, 53, "b", 2); E("distance", "Point.x", "read", S, 53, ".x", 2, member=True)
E("distance", "distance.a", "read", S, 53, "a", 3); E("distance", "Point.y", "read", S, 53, ".y", 1, member=True)
E("distance", "distance.b", "read", S, 53, "b", 3); E("distance", "Point.y", "read", S, 53, ".y", 2, member=True)
builtin("registry", "Map", "new", S, 56, "Map")
E("registry", "Shape", "type", S, 56, "Shape")
E("registry", "Circle", "read", S, 56, "Circle")
E("registry", "Circle.unit", "call", S, 56, ".unit", member=True)
E("Anonymous", "Base", "extends", S, 57, "Base")
builtin("config", "Record", "type", S, 58, "Record")

# app.ts
def EI(frm, to, kind, line, token, n=1, via=None, **extra):
    if via: extra["viaImport"] = ids["imp." + via]
    edge(frm, to, kind, A, line, token, n, **extra)
EI("Scene", "Shape", "type", 5, "Shape", via="Shape")
EI("Scene.add", "Shape", "type", 6, "Shape", via="Shape")
EI("Scene.add", "Scene.items", "read", 6, ".items", member=True)
builtin("Scene.add", "Array.push", "call", A, 6, ".push", member=True)
EI("Scene.add", "add.shape", "read", 6, "shape", 2)
builtin("Scene.render", "Promise", "type", A, 7, "Promise")
EI("Scene.render", "Scene.items", "read", 9, ".items", member=True)
builtin("Scene.render", "Array.map", "call", A, 9, ".map", member=True)
EI("Scene.render", "render.i", "read", 9, "i", 2)
EI("Scene.render", "render.s", "read", 9, "s", 2)
EI("Scene.render", "Shape.area", "call", 9, ".area", member=True)  # s: Shape, from an imported interface: across files
builtin("Scene.render", "Array.join", "call", A, 9, ".join", member=True)
builtin("Scene.render", "String", "call", A, 11, "String")
EI("Scene.render", "render.err", "read", 11, "err")
EI("build", "Scene", "type", 18, "Scene")
EI("build", "Scene", "new", 19, "Scene")
EI("build", "Circle", "new", 20, "Circle", via="Circle")          # the default import, through export default Circle
EI("build", "Color", "read", 20, "Color", via="Color")
EI("build", "Color.Green", "read", 20, ".Green", member=True)
EI("build", "Rect", "new", 21, "Rect", via="Rect")
EI("build", "Rect.move", "call", 21, ".move", member=True)
EI("build", "UNIT", "read", 21, "UNIT", via="UNIT")
EI("build", "build.scene", "read", 22, "scene")
EI("build", "Scene.add", "call", 22, ".add", 1, member=True)
EI("build", "build.c", "read", 22, "c")
EI("build", "Scene.add", "call", 22, ".add", 2, member=True)
EI("build", "build.r", "read", 22, "r")
EI("build", "Scene.add", "call", 22, ".add", 3, member=True)
EI("build", "S", "read", 22, "all", via="all")                     # a namespace import reads the module, the file (B8)
EI("build", "Circle", "read", 22, ".Circle", member=True)
EI("build", "Circle.unit", "call", 22, ".unit", member=True)
EI("build", "Geometry", "read", 23, "Geometry", via="Geometry")
EI("build", "distance", "call", 23, ".distance", member=True)
EI("build", "total", "call", 24, "total", via="total")
EI("build", "build.c", "read", 24, "c"); EI("build", "build.r", "read", 24, "r")
EI("build", "build.c", "read", 25, "c"); EI("build", "build.r", "read", 25, "r")
builtin("build", "Array.entries", "call", A, 25, ".entries", member=True)
EI("build", "build.shape", "read", 25, "shape", 2)
EI("build", "Circle.area", "call", 25, ".area", member=True, union=True)   # shape: Circle | Rect, one edge each (C)
EI("build", "Rect.area", "call", 25, ".area", member=True, union=True)
EI("build", "build.sum", "read", 25, "sum"); EI("build", "build.d", "read", 25, "d")
builtin("build", "console", "read", A, 25, "console"); builtin("build", "Console.log", "call", A, 25, ".log", member=True)   # the library declares log on interface Console
EI("build", "build.index", "read", 25, "index", 2)
EI("build", "build.scene", "read", 26, "scene")

# ---- links (B8): every import to what it names, re-exports followed ----
for name, target in [("Circle", "Circle"), ("Rect", "Rect"), ("total", "total"), ("Color", "Color"), ("Geometry", "Geometry"), ("UNIT", "UNIT"), ("Shape", "Shape"), ("all", "S")]:
    links.append({"from": ids["imp." + name], "to": ids[target], "kind": "import"})

# ---- the subfolders (added 2026-11-09, FND-104): functions imported from shapes.ts, app.ts and between the folders ----
N, F, SU, B = "util/numbers.ts", "report/format.ts", "report/summary.ts", "report/charts/bars.ts"
for f in (N, F, SU, B):
    ids[f] = f"src/{f}"
def imports(prefix, f, line, names):
    for name in names:
        node(f"{prefix}.imp.{name}", f, line, name, "import", f)
def EF(f, prefix):
    def e(frm, to, kind, line, token, n=1, via=None, **extra):
        if via: extra["viaImport"] = ids[f"{prefix}.imp.{via}"]
        edge(frm, to, kind, f, line, token, n, **extra)
    return e

# util/numbers.ts
imports("N", N, 2, ["total", "Shape"])
node("round2", N, 4, "round2", "function", N)
node("round2.value", N, 4, "value", "parameter", "round2")
node("percent", N, 8, "percent", "function", N)
node("percent.part", N, 8, "part", "parameter", "percent")
node("percent.whole", N, 8, "whole", "parameter", "percent")
node("share", N, 12, "share", "function", N)
node("share.shapes", N, 12, "shapes", "parameter", "share")
node("share.one", N, 12, "one", "parameter", "share")
e = EF(N, "N")
builtin("round2", "Math", "read", N, 5, "Math"); builtin("round2", "Math.round", "call", N, 5, ".round", member=True)
e("round2", "round2.value", "read", 5, "value")
e("percent", "percent.whole", "read", 9, "whole", 1)
e("percent", "round2", "call", 9, "round2")                        # same file: no import
e("percent", "percent.part", "read", 9, "part")
e("percent", "percent.whole", "read", 9, "whole", 2)
e("share", "Shape", "type", 12, "Shape", 1, via="Shape"); e("share", "Shape", "type", 12, "Shape", 2, via="Shape")
e("share", "percent", "call", 13, "percent")
e("share", "share.one", "read", 13, "one")
e("share", "Shape.area", "call", 13, ".area", member=True)         # one: Shape, an interface in shapes.ts
e("share", "total", "call", 13, "total", via="total")
e("share", "share.shapes", "read", 13, "shapes")

# report/format.ts
imports("F", F, 2, ["round2"])
node("formatArea", F, 4, "formatArea", "function", F)
node("formatArea.area", F, 4, "area", "parameter", "formatArea")
e = EF(F, "F")
e("formatArea", "round2", "call", 5, "round2", via="round2")        # from a sibling folder
e("formatArea", "formatArea.area", "read", 5, "area")

# report/summary.ts
imports("SU", SU, 2, ["build"]); imports("SU", SU, 3, ["Geometry"]); imports("SU", SU, 4, ["formatArea"]); imports("SU", SU, 5, ["percent"])
node("summarize", SU, 7, "summarize", "function", SU)
for key, line in [("scene", 8), ("text", 9), ("far", 10)]:
    node("summarize." + key, SU, line, key, "variable", "summarize")
e = EF(SU, "SU")
builtin("summarize", "Promise", "type", SU, 7, "Promise")
e("summarize", "build", "call", 8, "build", via="build")            # a function of app.ts
e("summarize", "summarize.scene", "read", 9, "scene")
e("summarize", "Scene.render", "call", 9, ".render", member=True)   # build() returns app.ts's Scene, a class it doesn't export
e("summarize", "Geometry", "read", 10, "Geometry", via="Geometry")
e("summarize", "distance", "call", 10, ".distance", member=True)
e("summarize", "formatArea", "call", 11, "formatArea", via="formatArea")
e("summarize", "summarize.far", "read", 11, "far")
e("summarize", "percent", "call", 11, "percent", via="percent")
e("summarize", "summarize.text", "read", 11, "text")

# report/charts/bars.ts
imports("B", B, 2, ["Circle", "total"]); imports("B", B, 3, ["formatArea"]); imports("B", B, 4, ["summarize"]); imports("B", B, 5, ["share"])
node("bars", B, 7, "bars", "function", B)
node("bars.sizes", B, 7, "sizes", "parameter", "bars")
node("bars.circles", B, 8, "circles", "variable", "bars")
node("bars.size", B, 8, "size", "parameter", "bars")               # an arrow's parameters belong to the nearest named declaration
node("bars.whole", B, 9, "whole", "variable", "bars")
node("bars.circle", B, 10, "circle", "parameter", "bars")
node("report", B, 13, "report", "function", B)
e = EF(B, "B")
e("bars", "bars.sizes", "read", 8, "sizes")
builtin("bars", "Array.map", "call", B, 8, ".map", member=True)
e("bars", "Circle", "new", 8, "Circle", via="Circle")               # the default import, through export default Circle
e("bars", "bars.size", "read", 8, "size", 2)
e("bars", "total", "call", 9, "total", via="total")
e("bars", "bars.circles", "read", 9, "circles")
e("bars", "bars.circles", "read", 10, "circles", 1)
builtin("bars", "Array.map", "call", B, 10, ".map", member=True)
e("bars", "formatArea", "call", 10, "formatArea", 1, via="formatArea")
e("bars", "bars.circle", "read", 10, "circle", 2)
e("bars", "Circle.area", "call", 10, ".area", member=True)
e("bars", "formatArea", "call", 10, "formatArea", 2, via="formatArea")
e("bars", "bars.whole", "read", 10, "whole")
e("bars", "share", "call", 10, "share", via="share")
e("bars", "bars.circles", "read", 10, "circles", 2)
e("bars", "bars.circle", "read", 10, "circle", 3)
builtin("report", "Promise", "type", B, 13, "Promise")
e("report", "summarize", "call", 14, "summarize", via="summarize")   # from the parent folder
e("report", "bars", "call", 14, "bars")
builtin("report", "Array.join", "call", B, 14, ".join", member=True)

for prefix, name, target in [("N", "total", "total"), ("N", "Shape", "Shape"), ("F", "round2", "round2"),
                             ("SU", "build", "build"), ("SU", "Geometry", "Geometry"), ("SU", "formatArea", "formatArea"), ("SU", "percent", "percent"),
                             ("B", "Circle", "Circle"), ("B", "total", "total"), ("B", "formatArea", "formatArea"), ("B", "summarize", "summarize"), ("B", "share", "share")]:
    links.append({"from": ids[f"{prefix}.imp.{name}"], "to": ids[target], "kind": "import"})

# ---- each node's short facts (FND-110, ts-program 0.2.0), by hand: exported (the export keyword, on the declaration
# or its statement), defaultExport (what the file's "default" names), declaredWith (a variable's const, let or var;
# none for a catch clause's), modifiers (as written, export and default apart), and the merged declarations ----
EX, CONST = {"exported": True}, {"declaredWith": "const"}
def mods(*m): return {"modifiers": list(m)}
FACTS = {
    "Shape": EX, "Shape.name": mods("readonly"), "Point": EX, "Color": EX, "Flag": {**EX, **mods("const")},
    "UNIT": {**EX, **CONST}, "created": {"declaredWith": "let"},
    "Base": {**EX, **mods("abstract")}, "Base.count": mods("static"), "Base.id": mods("protected", "readonly"),
    "Base.name": mods("abstract", "readonly"), "Base.color": mods("public"), "Base.scale": mods("private"), "Base.area": mods("abstract"),
    "Base.label": {"declarations": [f"src/shapes.ts 22:{col(S,22,'label')}", f"src/shapes.ts 23:{col(S,23,'label')}"]},   # getter and setter
    "Circle": {**EX, "defaultExport": True}, "Circle.name": mods("readonly"), "Circle.radius": mods("private"), "Circle.unit": mods("static"),
    "Rect": EX, "Rect.name": mods("readonly"), "Rect.corner": mods("public"), "Rect.w": mods("private"), "Rect.h": mods("private"),
    "move.x": CONST, "move.y": CONST,                                  # const { x = 0, y = 0 } = by
    "total": EX, "total.sum": CONST, "Geometry": EX, "ORIGIN": {**EX, **CONST}, "distance": EX,
    "registry": {**EX, **CONST}, "Anonymous": {**EX, **CONST}, "Anonymous.name": mods("readonly"), "config": {**EX, **CONST},
    "Scene.items": mods("private"), "Scene.render": mods("async"), "build": EX,   # render.err: a catch clause, no declaredWith
    **{f"build.{k}": CONST for k in ("scene", "c", "r", "d", "sum", "index", "shape")},   # index, shape: for (const [index, shape] of …)
    "round2": EX, "percent": EX, "share": EX, "formatArea": EX,
    "summarize": {**EX, **mods("async")}, **{f"summarize.{k}": CONST for k in ("scene", "text", "far")},
    "bars": EX, "bars.circles": CONST, "bars.whole": CONST, "report": {**EX, **mods("async")},
}
by_id = {n["id"]: n for n in nodes}
for key, facts in FACTS.items():
    by_id[ids[key]].update(facts)

# ---- unresolved (B10) ----
unresolved.append({"from": ids["S"], "name": "./extra", "kind": "re-export", "at": at(S, 59, "export"), "reason": "missing module"})

out = {
    "about": "Expected graph of test-source-mvp2, written by hand from mvp_docs/41_typescript_program_plan.md, section 1.1 (the definition of a correct graph, as refined on 2026-11-09). Positions are file line:column, 1-based, of the name. Edges are uses (one per use); links are imports; built-ins and unresolved uses have no edge.",
    "counts": {"nodes": len(nodes), "edges": len(edges), "links": len(links), "builtins": len(builtins), "unresolved": len(unresolved)},
    "nodes": nodes, "edges": edges, "links": links, "builtins": builtins, "unresolved": unresolved,
}
json.dump(out, open(os.path.join(HERE, "expected-graph.json"), "w"), indent=1)
print(json.dumps(out["counts"]))
