#!/usr/bin/env python3
"""Extract each ID's definition block from the ZaAnSouVi docs into JSON.

Usage: python3 -I extract_ids.py <viewer root> <out.json>
"""
import json, re, sys, os

root, out = sys.argv[1], sys.argv[2]
OWNER = {
    'ARCH': 'mvp_docs/01_architecture.md', 'DATA': 'mvp_docs/02_data_contracts.md',
    'RUN': 'mvp_docs/03_runner.md', 'TOOL': 'mvp_docs/04_tools.md',
    'VIEW': 'mvp_docs/05_viewer.md', 'TEST': 'mvp_docs/06_test_plan.md',
    'DEL': 'mvp_docs/07_delivery.md', 'KIND': 'mvp_docs/40_tools_fileKind.md',
    'TSP': 'mvp_docs/41_typescript_program_plan.md', 'TPG': 'mvp_docs/42_tool_ts_program.md',
    'UI': 'mvp_docs/50_viewer_ui.md', 'BE': 'mvp_docs/55_viewer_backend.md',
    'FND': 'mvp_docs/99_findings.md',
    'TS': 'toolset.md', 'RN': 'runner.md', 'VW': 'viewer.md', 'DT': 'data_topology.md',
    'ORG': 'project_organization.md', 'MVP': 'MVP_scope.md', 'SEC': 'security.md',
    'DOC': 'CLAUDE.md',
}
FILES = sorted(set(OWNER.values()) | {'mvp_docs/97_second_implementation.md'})
ID = r'(?:%s)-[A-Z]?\d+[a-z]?' % '|'.join(OWNER)
# a bullet/numbered item whose first bold or code token is the ID
BULLET = re.compile(r'^(\s*)(?:[-*]|\d+\.)\s+(?:~~)?(?:\*\*|`)(' + ID + r')\b')
ROW = re.compile(r'^\|\s*(?:~~)?`?(' + ID + r')`?(?:~~)?\s*\|')
HEAD = re.compile(r'^#+\s')

def indent(s):
    return len(s) - len(s.lstrip(' '))

defs = {}
for rel in FILES:
    path = os.path.join(root, rel)
    lines = open(path, encoding='utf-8').read().split('\n')
    section, header = '', None
    i = 0
    while i < len(lines):
        ln = lines[i]
        if HEAD.match(ln):
            section = ln.strip('# ').strip()
        if ln.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:|-]+\|$', lines[i + 1].strip()):
            header = ln
        m = BULLET.match(ln)
        r = ROW.match(ln) if not m else None
        if m:
            ind = indent(ln)
            block = [ln]
            j = i + 1
            while j < len(lines):
                nx = lines[j]
                if not nx.strip():
                    k = j + 1
                    while k < len(lines) and not lines[k].strip():
                        k += 1
                    if k < len(lines) and indent(lines[k]) > ind:
                        block.extend(lines[j:k])
                        j = k
                        continue
                    break
                if HEAD.match(nx) or nx.startswith('|'):
                    break
                if indent(nx) <= ind and re.match(r'^\s*(?:[-*]|\d+\.)\s', nx):
                    break
                if indent(nx) <= ind and not re.match(r'^\s*(?:[-*]|\d+\.)\s', nx) and indent(nx) == 0:
                    break
                block.append(nx)
                j += 1
            defs.setdefault(m.group(2), []).append(
                {'file': rel, 'line': i + 1, 'section': section, 'kind': 'bullet', 'text': '\n'.join(block)})
            i = j
            continue
        if r:
            defs.setdefault(r.group(1), []).append(
                {'file': rel, 'line': i + 1, 'section': section, 'kind': 'row', 'header': header, 'text': ln})
        i += 1

def prefix(k):
    return k.split('-')[0]

result = {}
for k, ds in defs.items():
    own = [d for d in ds if d['file'] == OWNER[prefix(k)]]
    result[k] = {'owner': own[0] if own else None, 'others': [d for d in ds if d not in own[:1]]}

def sortkey(k):
    p, n = k.split('-', 1)
    m = re.match(r'([A-Z]?)(\d+)([a-z]?)', n)
    return (p, m.group(1), int(m.group(2)), m.group(3))

ordered = {k: result[k] for k in sorted(result, key=sortkey)}
json.dump(ordered, open(out, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
from collections import Counter
c = Counter(prefix(k) for k in ordered)
print(dict(sorted(c.items())))
print('no owner definition:', [k for k, v in ordered.items() if not v['owner']])
print('with strikes:', sum(1 for v in ordered.values() if v['owner'] and '~~' in v['owner']['text']))
