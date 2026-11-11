# Summary tools

Scripts and rules used to build the summaries in `mvp_docs/summary/` and `summary/` (2026-11-10). Each reads the docs only; run them with `python3 -I`.

| File | What | When |
|---|---|---|
| `make_definitions.py` | Writes `mvp_docs/summary/00_definitions_mvp2.md`: every ID defined in the MVP docs, in order, with its current text. The MVP docs hold no history, so the text is taken as it is | **After any change to `mvp_docs/`.** Never edit the output by hand |
| `rewrite_rules.md` | The rules the MVP docs were rewritten clean by: current text only, no history, every ID kept, IDs not in force with a pointer, M1 to M3's requirements in a pointer list, *To update for MVP 2* where the docs don't say and the code can't establish it | When rewriting an MVP doc, or briefing someone to |
| `extract_ids.py` | Pulls every ID's definition block, from the file that owns its prefix, out of the working files and the MVP docs into one JSON file, struck wording included: `python3 -I extract_ids.py <viewer folder> <out.json>` | To rebuild a definitions file from docs that still carry history |
| `assemble.py` | Assembles definition fragments (one `- **ID** · *status* · \`file\`` entry each, written by hand or by an agent from `extract_ids.py`'s output) into `summary/00_definitions.md`, `00_definitions_mvp1.md` and `00_definitions_mvp2.md`, and checks every extracted ID is placed: `python3 -I assemble.py <folder with ids.json and frag/> <viewer folder>` | Kept for reference: the fragments of 2026-11-10 are gone, and the MVP 2 definitions are now made by `make_definitions.py` |

**`summary/00_definitions.md`** (the working files' questions) and **`00_definitions_mvp1.md`** (frozen) were written from cleaned fragments, since the working files keep struck wording. Update `summary/00_definitions.md` by hand when a working-file question changes, or rebuild it: `extract_ids.py`, then a cleaned fragment per question following `rewrite_rules.md`, then `assemble.py`.
