import json, base64, os, re, sys, urllib.request, concurrent.futures as cf, io, subprocess
from PIL import Image
KEY = open(os.path.expanduser('~/.secrets/openai')).read().strip()
OUT = '/home/claude/build/img2'
STYLE = ("Single comic book panel, Franco-Belgian bande dessinee style mixed with modern comics: bold black ink outlines, flat colors, halftone dot shading, "
 "expressive cinematic composition. Strict palette: deep navy blue, indigo, bright orange, light orange, warm cream paper, black ink. "
 "Absolutely no text, no letters, no numbers, no speech bubbles, no captions, no logos. Fictional scene from a French police comic about a bank heist investigated with databases. Scene: ")
GL = {
 'Byte':"Byte is a young female data analyst with curly dark hair in a high bun, round glasses, orange hoodie, headset.",
 'Varga':"Commissioner Varga is a woman in her fifties with short spiky silver hair and a dark navy trench coat.",
 'Vasseur':"Vasseur is a grumpy fifty-something man with brown beard, rectangular glasses, cheek scar, black beanie.",
 'Lefort':"Lefort is a tall woman with a red ponytail, tattooed forearms, leather jacket.",
 'Ferrand':"Ferrand is a nervous bank security technician man in his thirties, navy uniform, badge lanyard.",
 'Marchetti':"Marchetti is an elegant woman in her forties with a sleek black bob and thin glasses, dark suit.",
 'Ouali':"Ouali is a bank IT director man in his forties with grey temples and a blazer.",
 'juge':"The judge is a woman in her sixties with a grey bun, black robe and white jabot."}
js = open('missions1.js').read() + open('missions2.js').read()
ids = re.findall(r"mis\(\{ id:'([\d.]+)'.*?story:`(.*?)`", js, re.S)
def clean(h): return re.sub(r'\s+',' ', re.sub(r'<[^>]+>','', h)).strip()
import importlib.util
from mission_scenes import S as SC
jobs=[]
for mid, story in ids:
    s = clean(story)
    extra = ' '.join(v for k,v in GL.items() if k.lower() in s.lower())
    if not extra: extra = GL['Byte'] + ' She works at night in the police data office with screens.'
    jobs.append((mid, s, extra))
def gen(j):
    mid, s, extra = j
    path = f"{OUT}/m{mid.replace('.','_')}.jpg"
    if os.path.exists(path): return mid, 'skip'
    prompt = STYLE + SC[mid]
    body = json.dumps({'model':'gpt-image-2','prompt':prompt,'size':'1536x1024','quality':'medium','n':1}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=body, headers={'Authorization':'Bearer '+KEY,'Content-Type':'application/json'})
    err=''
    for a in range(2):
        try:
            with urllib.request.urlopen(req, timeout=300) as r: d=json.load(r)
            im=Image.open(io.BytesIO(base64.b64decode(d['data'][0]['b64_json']))).convert('RGB'); im.thumbnail((760,760))
            im.save(path,'JPEG',quality=70,optimize=True,progressive=True); return mid,'ok'
        except Exception as e: err = e.read().decode()[:200] if hasattr(e,'read') else str(e)
    return mid,'ERR '+err
with cf.ThreadPoolExecutor(10) as ex:
    for k,s in ex.map(gen, jobs): print(k,s,flush=True)
