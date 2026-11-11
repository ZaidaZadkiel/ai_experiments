#!/usr/bin/env python3
"""Assemble definition fragments into the three 00_definitions files.

Usage: python3 -I assemble.py <scratchpad> <viewer root>
"""
import json, re, sys, os

S, ROOT = sys.argv[1], sys.argv[2]
ids = json.load(open(f'{S}/ids.json', encoding='utf-8'))
ENTRY = re.compile(r'^- \*\*([A-Z]+-[A-Z]?\d+[a-z]?)\*\*')

TITLES = {
    'ARCH': ('Architecture', '01_architecture.md'), 'BE': ('Viewer backend', '55_viewer_backend.md'),
    'DATA': ('Data contracts', '02_data_contracts.md'), 'DEL': ('Delivery', '07_delivery.md'),
    'FND': ('Findings', '99_findings.md'), 'KIND': ('File kinds (deferred proposal)', '40_tools_fileKind.md'),
    'RUN': ('Runner', '03_runner.md'), 'TEST': ('Test plan', '06_test_plan.md'),
    'TOOL': ('Tools', '04_tools.md'), 'TPG': ('The ts-program tool', '42_tool_ts_program.md'),
    'TSP': ('Real TypeScript plan', '41_typescript_program_plan.md'), 'UI': ('Viewer page', '50_viewer_ui.md'),
    'VIEW': ('Viewer', '05_viewer.md'),
    'DOC': ('The deliverable', 'CLAUDE.md'), 'DT': ('Data topology', 'data_topology.md'),
    'MVP': ('MVP scope', 'MVP_scope.md'), 'ORG': ('Project organization', 'project_organization.md'),
    'RN': ('Runner', 'runner.md'), 'SEC': ('Security', 'security.md'),
    'TS': ('Toolset', 'toolset.md'), 'VW': ('Viewer', 'viewer.md'),
}

def parse(path):
    entries, cur = {}, None
    for ln in open(path, encoding='utf-8').read().split('\n'):
        m = ENTRY.match(ln)
        if m:
            cur = m.group(1)
            if cur in entries:
                print(f'  DUPLICATE {cur} in {os.path.basename(path)}')
            entries[cur] = [ln]
        elif cur and (ln.startswith('  ') or not ln.strip()):
            entries[cur].append(ln)
        elif cur and ln.strip():
            entries[cur].append('  ' + ln)  # tolerate unindented continuation
    return {k: '\n'.join(v).rstrip() for k, v in entries.items()}

def key(k):
    p, n = k.split('-', 1)
    m = re.match(r'([A-Z]?)(\d+)([a-z]?)', n)
    return (p, m.group(1), int(m.group(2)), m.group(3))

def build(out, title, intro, frags):
    entries = {}
    for f in frags:
        p = f'{S}/frag/{f}'
        if not os.path.exists(p):
            print(f'  MISSING fragment {f}'); continue
        for k, v in parse(p).items():
            if k in entries:
                print(f'  DUPLICATE {k} across fragments')
            entries[k] = v
    body = [f'# {title}', '', intro, '']
    prefixes = sorted({k.split('-')[0] for k in entries})
    body.append('**Prefixes:** ' + ', '.join(f'[`{p}`](#{p.lower()})' for p in prefixes) + '.')
    body.append('')
    for p in prefixes:
        name, src = TITLES[p]
        body += [f'## {p}', '', f'{name}, from `{src}`.', '']
        for k in sorted((k for k in entries if k.startswith(p + '-')), key=key):
            body.append(entries[k])
        body.append('')
    text = '\n'.join(body).rstrip() + '\n'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(text)
    strikes = text.count('~~')
    dates = re.findall(r'20\d\d-\d\d-\d\d', text)
    print(f'{out}: {len(entries)} entries, strikes={strikes}, dates={len(dates)}')
    return set(entries)

mvp_intro_common = ('Every ID {scope}, in order of ID, with its settled text only: no history, no struck wording, '
    'no "was" and "is". Each entry gives the ID, its status and the file that owns it; the owner file holds the reasons '
    'and the history. Written 2026-11-10 from the files as they stood then. Summaries: `00_where_we_are.md`, {summary}.')

m1 = build(f'{ROOT}/mvp_docs/summary/00_definitions_mvp1.md', 'Definitions: MVP 1',
    mvp_intro_common.format(scope='of MVP 1, the first implementation (2026-11-07 to 2026-11-09), as settled at the end of MVP 1',
                            summary='`10_mvp1.md`') +
    '\n\nMVP 2 changed some of these; their current text is in `00_definitions_mvp2.md`. Status words: the item\'s own marker '
    '(*Known*, *Suggested*, *Decided*, *Proposed*), or *Accepted*, since everything in `mvp_docs/` is accepted for building the MVP; '
    'for findings, their outcome.',
    ['mvp1a.md', 'mvp1b.md', 'fnd_mvp1.md'])
m2 = build(f'{ROOT}/mvp_docs/summary/00_definitions_mvp2.md', 'Definitions: MVP 2',
    mvp_intro_common.format(scope='that MVP 2 (from 2026-11-09) added or changed, with its current text',
                            summary='`20_mvp2.md`') +
    '\n\n**Every MVP 1 ID not listed here is unchanged in MVP 2, as written in `00_definitions_mvp1.md`.** '
    'Those that describe M1, M2 or M3, or MVP 1\'s test source (`test-source/`, `expected/`) and its checks, still describe those: '
    'MVP 2 keeps them but runs `ts-program` alone, on `test-source-mvp2/` (`RUN-33`, `FND-92`). '
    'An MVP 1 ID that no longer applies at all is listed here, as *Not in force*, with what applies instead. '
    'Status words: *Decided*, *Decided, built*, *Accepted*, *Open*, *Closed*, *Met*, *Deferred proposal*, *Not in force*; for findings, their outcome.',
    ['mvp1a_mvp2.md', 'mvp1b_mvp2.md', 'mvp2.md', 'mvp2_notinforce.md', 'fnd_mvp2.md'])
r = build(f'{ROOT}/summary/00_definitions.md', 'Definitions: the working files',
    'Every ID in the product design\'s working files, in order of ID, with its current settled text only: no history, '
    'no struck wording, no "was" and "is". Almost all are questions: a resolved one gives its answer, a partly answered one '
    'what is settled and what is open, an open one the question. Each entry gives the ID, its status and the file that owns it; '
    'the owner file holds the reasons and the history. Written 2026-11-10. Summary: `00_where_we_are.md`.',
    ['root.md'])

all_ids = set(ids)
root_p = {'TS', 'RN', 'VW', 'DT', 'ORG', 'SEC', 'MVP', 'DOC'}
missing = sorted((k for k in all_ids - (m1 | m2 | r)), key=key)
print('IDs in no file:', missing)
print('IDs not in the extraction:', sorted((m1 | m2 | r) - all_ids, key=key))
