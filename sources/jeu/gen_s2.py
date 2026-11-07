import json, base64, os, sys, urllib.request, concurrent.futures as cf, io
from PIL import Image
from scenes2 import CHARS, CHAP, MIS
KEY = open(os.path.expanduser('~/.secrets/openai')).read().strip()
OUT = '/home/claude/build/img2'
STYLE = ("Single comic book panel, Franco-Belgian bande dessinee style mixed with modern comics: bold black ink outlines, flat colors, halftone dot shading, "
 "expressive cinematic composition. Strict palette: deep navy blue, indigo, bright orange, light orange, warm cream paper, black ink. "
 "Absolutely no text, no letters, no numbers, no speech bubbles, no captions, no logos. Fictional French police comic about cyber investigations. Scene: ")
jobs=[(k,v,'1024x1024',560) for k,v in CHARS.items()]
for c,l in CHAP.items():
    for i,p in enumerate(l): jobs.append((f'ch{c}_{i}',p,'1536x1024' if i==0 else '1024x1024', 900 if i==0 else 560))
for k,p in MIS.items(): jobs.append(('m'+k.replace('.','_'),p,'1536x1024',760))
def gen(j):
    k,p,size,w=j; path=f'{OUT}/{k}.jpg'
    if os.path.exists(path): return k,'skip'
    body=json.dumps({'model':'gpt-image-2','prompt':STYLE+p,'size':size,'quality':'medium','n':1}).encode()
    req=urllib.request.Request('https://api.openai.com/v1/images/generations',data=body,headers={'Authorization':'Bearer '+KEY,'Content-Type':'application/json'})
    err=''
    for a in range(3):
        try:
            with urllib.request.urlopen(req,timeout=300) as r: d=json.load(r)
            im=Image.open(io.BytesIO(base64.b64decode(d['data'][0]['b64_json']))).convert('RGB'); im.thumbnail((w,w))
            im.save(path,'JPEG',quality=72,optimize=True,progressive=True); return k,'ok'
        except Exception as e: err=e.read().decode()[:160] if hasattr(e,'read') else str(e)
    return k,'ERR '+err.replace('\n',' ')
with cf.ThreadPoolExecutor(10) as ex:
    for k,s in ex.map(gen,jobs): print(k,s,flush=True)
