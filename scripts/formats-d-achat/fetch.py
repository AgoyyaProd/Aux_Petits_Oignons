import json, sys, time, urllib.request, urllib.parse, pathlib
ings = json.load(open(sys.argv[1]))
out = pathlib.Path('raw'); out.mkdir(exist_ok=True)
tags = sorted({t for _, _, ts in ings for t in ts})
UA = "AuxPetitsOignons/1.0 (+https://aux-petits-oignons-azure.vercel.app)"
for t in tags:
    f = out / (t.replace(':','_') + '.json')
    if f.exists(): continue
    items = []
    for page in (1, 2):
        q = urllib.parse.urlencode(dict(type='PRODUCT', product__categories_tags__contains=t, currency='EUR',
            date__gte='2024-11-01', order_by='-date', size=100, page=page, lat='46.6', lon='2.5', radius_km='650'))
        req = urllib.request.Request('https://prices.openfoodfacts.org/api/v1/prices?' + q, headers={'User-Agent': UA})
        for attempt in range(3):
            try:
                d = json.load(urllib.request.urlopen(req, timeout=30)); break
            except Exception as e:
                time.sleep(3); d = None
        if not d: break
        for it in d['items']:
            p = it.get('product') or {}; l = it.get('location') or {}
            if (l.get('osm_address_country_code') or '').upper() != 'FR': continue
            items.append(dict(code=it.get('product_code'), name=p.get('product_name'), brands=p.get('brands'),
              qty=p.get('product_quantity'), unit=p.get('product_quantity_unit'), store=l.get('osm_brand') or l.get('osm_name'), date=it.get('date')))
        if len(d['items']) < 100: break
        time.sleep(0.5)
    f.write_text(json.dumps(items, ensure_ascii=False))
    print(t, len(items), flush=True)
    time.sleep(0.5)
