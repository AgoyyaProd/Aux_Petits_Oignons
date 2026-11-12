import json, sys, pathlib, collections, re
ings = json.load(open('ingredients.json'))
MASS = {'g':1,'kg':1000,'mg':0.001}; VOL={'ml':1,'cl':10,'l':1000,'dl':100}
def norm(q,u,dim):
    if q is None or not u: return None
    u=u.strip().lower()
    if dim=='mass' and u in MASS: return round(q*MASS[u],3)
    if dim=='volume' and u in VOL: return round(q*VOL[u],3)
    return None
def target(store):
    s=(store or '').lower(); return 'leclerc' in s or re.search(r'\b(super|hyper|u express|marché) ?u\b', s) or s in ('u','super u','hyper u','u express')
res={}
for slug,dim,tags in ings:
    recs=[]
    for t in tags:
        recs+=json.load(open('raw/'+t.replace(':','_')+'.json'))
    seen=set(); rows=[]
    for r in recs:
        k=(r['code'],r['date'],r['store'])
        if k in seen: continue
        seen.add(k)
        q=norm(r['qty'],r['unit'],dim)
        if q and q>0: rows.append((q,r))
    def pick(rows):
        by=collections.defaultdict(set); obs=collections.Counter()
        for q,r in rows: by[q].add(r['code']); obs[q]+=1
        if not by: return None
        best=max(by, key=lambda q:(len(by[q]), obs[q], -q))
        return best, len(by[best]), obs[best], len({r['code'] for _,r in rows}), len(rows)
    tr=[x for x in rows if target(x[1]['store'])]
    p_t=pick(tr); p_all=pick(rows)
    res[slug]=dict(dim=dim, target=p_t, all=p_all, n=len(rows))
    print(f"{slug:26} {dim:6} n={len(rows):3}  LecU={p_t}  tous={p_all}")
json.dump(res,open('analysis.json','w'))
