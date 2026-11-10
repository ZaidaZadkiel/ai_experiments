# expected-mvp2

The expected graph of `test-source-mvp2`, the reference MVP 2 is checked against (`mvp_docs/41_typescript_program_plan.md`, section 1.1, part E; `mvp_docs/99_findings.md`, `FND-97`).

- **`write_expected.py`** holds every node, edge, link, built-in and unresolved use, **decided by hand** from the definition of a correct graph and its refinements R1 to R6. It reads the source text only to look up the line and column of each name, so IDs follow `DATA-02` (`<file ID>#<name>@<line>:<column>`); it never asks TypeScript what anything means. Run it with `python3 -I write_expected.py`.
- **`expected-graph.json`** is what it writes: `nodes` (`id`, `name`, `kind`, `parent`; `declaredIn` for a parameter property; `declarations` for merged ones), `edges` (`from`, `to`, `kind`, `at`; `member`, `union`, `viaImport` where they apply), `links` (imports), `builtins` and `unresolved` (no edge, each with its reason).

Counts on 2026-11-09: ~~87 nodes, 117 edges, 8 links, 18 built-in uses, 1 unresolved use~~ 120 nodes, 156 edges, 20 links, 25 built-in uses, 1 unresolved use, since the subfolders were added (`FND-104`). The four new files are written by hand the same way, in their own section of `write_expected.py`; they matched `ts-program` the first time they were compared.

Edge kinds: `read`, `write`, `call`, `new`, `type`, `extends`, `implements`. An edge counts one use; two uses of the same thing on one line are two edges.

The views of the graph at each level (lifted edges with counts) are not in it yet: they follow from these records and the Viewer's lifting rules, and are added when the Viewer's model is updated.
