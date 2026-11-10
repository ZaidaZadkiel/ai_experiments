#!/usr/bin/env python3
"""Write a steps file that adds each source to the Viewer, runs it and waits for its graph; the last one stays current.

The browser steps that name no source use the current one, so run-all.sh seeds the sources they need first.
Usage: python3 -I seed.py <out steps.json> <source root> [<source root> ...]
"""
import json, sys

out, roots = sys.argv[1], sys.argv[2:]
RUN = ("return (async()=>{ const a=await fetch('/api/sources',{method:'POST',credentials:'same-origin',"
       "headers:{'Content-Type':'application/json'},body:JSON.stringify({sourceRoot:%s})}); const s=await a.json();"
       " for(let t=0;t<40;t++){ const rr=await fetch('/api/run',{method:'POST',credentials:'same-origin',"
       "headers:{'Content-Type':'application/json'},body:JSON.stringify({source:s.sourceKey})}); if(rr.status===202) break;"
       " await new Promise(r=>setTimeout(r,500)); }"
       " for(let i=0;i<60;i++){ await new Promise(r=>setTimeout(r,500)); const g=await (await fetch('/api/graph?source='+s.sourceKey+'&which=auto',"
       "{credentials:'same-origin'})).json(); if(g.model && g.status==='latest') return 'seeded '+%s+': '+g.model.nodes.length+' nodes'; }"
       " throw new Error('no graph for '+%s); })()")
CURRENT = ("return (async()=>{ const a=await fetch('/api/sources',{method:'POST',credentials:'same-origin',"
           "headers:{'Content-Type':'application/json'},body:JSON.stringify({sourceRoot:%s})}); const s=await a.json();"
           " for(let t=0;t<40;t++){ const r=await fetch('/api/sources/current',{method:'POST',credentials:'same-origin',"
           "headers:{'Content-Type':'application/json'},body:JSON.stringify({source:s.sourceKey})}); if(r.status!==409) return 'current: '+%s;"
           " await new Promise(x=>setTimeout(x,500)); } throw new Error('still busy'); })()")
steps = [["go", "<the Viewer's URL, filled in by browse.sh>"],
         ["wait", "window.zaansouvi && document.querySelector('#cy') && window.zaansouvi.state.sources !== undefined", 15],
         ["sleep", 1]]
for r in roots:
    q = json.dumps(r)
    steps.append(["js", RUN % (q, q, q)])
q = json.dumps(roots[-1])
steps.append(["js", CURRENT % (q, q)])
json.dump(steps, open(out, 'w'), indent=1)
