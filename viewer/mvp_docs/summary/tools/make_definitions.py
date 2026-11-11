#!/usr/bin/env python3
"""Write summary/00_definitions_mvp2.md from the MVP docs, which hold current text only.

Every ID defined in the docs (a list item or table row starting with the ID), in order of ID,
with the text of its definition, taken from the file that owns its prefix. Run from anywhere:

    python3 -I mvp_docs/summary/tools/make_definitions.py

It only reads the docs and writes the one output file. Rerun it after any change to the docs.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(os.path.dirname(HERE))          # mvp_docs/
OUT = os.path.join(DOCS, 'summary', '00_definitions_mvp2.md')

OWNER = {  # prefix: (file, title)
    'ARCH': ('01_architecture.md', 'Architecture'), 'DATA': ('02_data_contracts.md', 'Data contracts'),
    'RUN': ('03_runner.md', 'Runner'), 'TOOL': ('04_tools.md', 'Tools'), 'VIEW': ('05_viewer.md', 'Viewer'),
    'TEST': ('06_test_plan.md', 'Test plan'), 'DEL': ('07_delivery.md', 'Delivery'),
    'KIND': ('40_tools_fileKind.md', 'File kinds (deferred proposal)'),
    'TSP': ('41_typescript_program_plan.md', 'The plan for MVP 2'),
    'TPG': ('42_tool_ts_program.md', 'The ts-program tool'), 'UI': ('50_viewer_ui.md', 'Viewer page'), 'INV': ('51_viewer_inventory.md', 'The Inventory'),
    'BE': ('55_viewer_backend.md', 'Viewer backend'), 'M2Q': ('97_second_implementation.md', 'Open questions of MVP 2'),
}
EXTRA = {'97_second_implementation.md'}  # also searched for IDs defined only in its decisions table
ID = r'(?:%s)-[A-Z]?\d+[a-z]?' % '|'.join(OWNER)
BULLET = re.compile(r'^(\s*)(?:[-*]|\d+\.)\s+(?:\*\*|`)(' + ID + r')\b')
ROW = re.compile(r'^\|\s*`?(' + ID + r')`?(?:,\s*`[^`]+`)*\s*\|')
HEAD = re.compile(r'^#+\s')


def indent(s):
    return len(s) - len(s.lstrip(' '))


def blocks(path):
    lines = open(path, encoding='utf-8').read().split('\n')
    header, i = None, 0
    while i < len(lines):
        ln = lines[i]
        if ln.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:|-]+\|$', lines[i + 1].strip()):
            header = [c.strip() for c in ln.strip('|').split('|')]
        m = BULLET.match(ln)
        if m:
            ind, out, j = indent(ln), [ln], i + 1
            while j < len(lines):
                nx = lines[j]
                if not nx.strip():
                    k = j + 1
                    while k < len(lines) and not lines[k].strip():
                        k += 1
                    if k < len(lines) and indent(lines[k]) > ind:
                        out.extend(lines[j:k]); j = k; continue
                    break
                if HEAD.match(nx) or nx.startswith('|') or indent(nx) <= ind:
                    break
                out.append(nx); j += 1
            yield m.group(2), 'bullet', out, None
            for m2 in re.finditer(r'\*\*(' + ID + r')\*\*\s*([^;*]+)', ln):
                if m2.group(1) != m.group(2):
                    yield m2.group(1), 'inline', [m2.group(2).strip().rstrip('.')], ln
            i = j; continue
        r = ROW.match(ln)
        if r:
            first = ln.strip().strip('|').split('|')[0]
            for k in re.findall(ID, first):
                yield k, 'row', [ln], header
        else:
            # several IDs named inline in one item: **TOOL-10** title; **TOOL-11** title; ...
            for m2 in re.finditer(r'\*\*(' + ID + r')\*\*\s*([^;*]+)', ln):
                yield m2.group(1), 'inline', [m2.group(2).strip().rstrip('.')], ln
        i += 1


def entry_text(kind, lines, header, key):
    if kind == 'inline':
        src = re.sub(r'^\s*(?:[-*]|\d+\.)\s+', '', header)
        if src.startswith('**') or src.startswith('`'):
            label = 'listed with `' + re.search(ID, src).group(0) + '`'
        else:
            label = 'listed under ' + re.sub(r'\s+', ' ', src.split(':')[0])
        return lines[0] + ' (' + label + ')'
    if kind == 'row':
        cells = [c.strip() for c in lines[0].strip().strip('|').split('|')]
        pairs = [f'**{h}:** {c}' for h, c in zip(header or [], cells) if c and h and h != 'ID']
        return ' · '.join(pairs) if pairs else ' | '.join(cells[1:])
    first = re.sub(r'^\s*(?:[-*]|\d+\.)\s+', '', lines[0])
    first = re.sub(r'^(?:\*\*|`)' + re.escape(key) + r'(?:\*\*|`)\s*', '', first)
    first = re.sub(r'^\*\*' + re.escape(key) + r'\s+(\[[^\]]+\])\*\*\s*', r'**\1** ', first)
    base = indent(lines[1]) if len(lines) > 1 and lines[1].strip() else 0
    rest = [('  ' + l[min(base, indent(l)):]) if l.strip() else '' for l in lines[1:]]
    return '\n'.join([first] + rest).rstrip()


def key(k):
    p, n = k.split('-', 1)
    m = re.match(r'([A-Z]?)(\d+)([a-z]?)', n)
    return (p, m.group(1), int(m.group(2)), m.group(3))


found = {}
for fname in sorted({f for f, _ in OWNER.values()} | EXTRA):
    for k, kind, lines, header in blocks(os.path.join(DOCS, fname)):
        own = OWNER[k.split('-')[0]][0]
        rank = 0 if kind != 'inline' else 1
        if k in found and (found[k][2], found[k][0] != own) <= (rank, fname != own):
            continue  # a full definition beats an inline one; the owner file beats others
        found[k] = (fname, entry_text(kind, lines, header, k), rank)

out = ['# Definitions: MVP 2', '',
       '**Generated by `summary/tools/make_definitions.py` from the MVP docs; do not edit by hand, rerun it.** '
       'Every ID the docs define, in order of ID, with its current text, which is all the docs hold: no history, '
       'no struck wording. Each entry names the file that owns it; that file holds the context. '
       'MVP 1\'s IDs as settled at its end: `00_definitions_mvp1.md`. Findings: `../99_findings.md`. Summary: `20_mvp2.md`.', '']
prefixes = sorted({k.split('-')[0] for k in found})
out += ['**Prefixes:** ' + ', '.join(f'[`{p}`](#{p.lower()})' for p in prefixes) + '.', '']
for p in prefixes:
    f, title = OWNER[p]
    out += [f'## {p}', '', f'{title}, from `{f}`.', '']
    for k in sorted((k for k in found if k.split('-')[0] == p), key=key):
        src, text, _ = found[k]
        note = '' if src == f else f' (defined in `{src}`)'
        out.append(f'- **{k}**{note} · ' + text)
    out.append('')
open(OUT, 'w', encoding='utf-8').write('\n'.join(out).rstrip() + '\n')
print(f'{OUT}: {len(found)} IDs')
