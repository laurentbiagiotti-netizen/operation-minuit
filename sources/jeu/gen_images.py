import json, base64, os, sys, urllib.request, concurrent.futures as cf, io
from PIL import Image
KEY = open(os.path.expanduser('~/.secrets/openai')).read().strip()
OUT = '/home/claude/build/img'; os.makedirs(OUT, exist_ok=True)
STYLE = ("Cinematic graphic-novel illustration, painterly digital art, moody night lighting, "
         "dominant deep navy blue (#0A1047) and indigo (#303880) tones with warm orange (#FD7119) accent lights, "
         "subtle cream highlights, clean composition, no text, no letters, no logos, no watermark. ")
P = {
 'hero': "Wide shot of the La Defense business district at midnight seen from the esplanade, glass towers, one bank tower with a single lit orange floor, police car lights reflecting on wet pavement, a sense of mystery.",
 'varga': "Portrait, head and shoulders, of a French police commissioner woman in her early fifties, short silver hair, sharp intelligent eyes, dark trench coat, determined calm expression, office at night behind her, soft orange desk light.",
 'byte': "Portrait, head and shoulders, of a young female data analyst in her late twenties, curly dark hair tied up, round glasses reflecting lines of data, wireless headset around her neck, friendly confident half smile, screens glowing behind her.",
 'vasseur': "Police-file style portrait of a fifty-something man with short brown hair and a trimmed beard, rectangular glasses, a thin scar on his cheek, stern expression, neutral grey background with height chart, illustrated.",
 'lefort': "Police-file style portrait of a tall woman in her late thirties with red hair in a ponytail, visible forearm tattoo, leather jacket, defiant look, neutral background with height chart, illustrated.",
 'ferrand': "Police-file style portrait of a nervous man in his thirties in a bank security technician uniform with an access badge on a lanyard, short dark hair, avoiding eye contact, neutral background, illustrated.",
 'marchetti': "Elegant woman in her mid forties with sleek black hair and thin glasses, tailored dark suit, standing at a tall window overlooking a lake at dusk, calm and cold, seen in three quarter view, mysterious.",
 'ouali': "Portrait, head and shoulders, of a bank IT director man in his forties of North African descent, short black hair with grey temples, open-collar shirt and blazer, tired but sharp, server room lights behind him.",
 'juge': "Portrait, head and shoulders, of a French investigating judge woman in her sixties, grey hair in a bun, black judicial robe with white jabot, reading glasses, serious, wood-panelled office.",
 'ch1': "A detective's desk at night with a single lamp, a coffee cup, an open case file with many suspect photos fanned out, a laptop showing a glowing data table.",
 'ch2': "A bank vault door wide open and empty, scattered deposit boxes, a dusty boot print on the floor lit by a flashlight beam.",
 'ch3': "A black sedan speeding away down a wet street at night, motion blur, red tail lights, a witness silhouette at a window.",
 'ch4': "Close-up of an evidence table: printed timelines, a map with pins, a magnifying glass over a calendar page, warm lamp light.",
 'ch5': "A dark security operations center with large screens showing a world map and red spikes of failed login attempts, an analyst silhouette from behind.",
 'ch6': "A detective corkboard with photos connected by orange strings, linking a man, a woman, a car and a bank badge.",
 'ch7': "A dim bank corridor with a security badge reader glowing orange next to a heavy door, a shadowy figure walking away holding a badge.",
 'ch8': "Abstract map of Europe at night with glowing orange lines of money transfers hopping from Paris to Vilnius, Malta, Cyprus and Geneva.",
 'ch9': "Rows of wall clocks and a large illuminated timeline on a glass wall, minute marks, a detective pointing at a precise moment.",
 'ch10': "A courthouse records room with tall shelves of case files, a clerk's desk with a stamped dossier, morning light through high windows.",
 'ch11': "An architect's drafting table with blueprint-style diagrams of connected tables and boxes, rulers and pencils, night lamp.",
 'ch12': "A web login form shown on a monitor in a dark room, with a single apostrophe character glowing orange inside the username field, mysterious and tense.",
 'ch13': "Dawn over Lake Geneva, police officers in the foreground walking toward an elegant villa, the case is about to close, hopeful orange sunrise.",
}
SIZES = {k: '1024x1024' if k in ('varga','byte','vasseur','lefort','ferrand','ouali','juge') else '1536x1024' for k in P}
def gen(k):
    path = f"{OUT}/{k}.jpg"
    if os.path.exists(path): return k, 'skip'
    body = json.dumps({'model':os.environ.get('IMGMODEL','gpt-image-2'),'prompt':STYLE+P[k],'size':SIZES[k],'quality':'medium','n':1}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=body,
        headers={'Authorization':'Bearer '+KEY,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=240) as r: d = json.load(r)
        im = Image.open(io.BytesIO(base64.b64decode(d['data'][0]['b64_json']))).convert('RGB')
        w = 520 if SIZES[k]=='1024x1024' else 1100
        im.thumbnail((w, w)); im.save(path, 'JPEG', quality=78, optimize=True, progressive=True)
        return k, 'ok'
    except Exception as e:
        msg = e.read().decode()[:300] if hasattr(e,'read') else str(e)
        return k, 'ERR ' + msg
keys = sys.argv[1:] or list(P)
with cf.ThreadPoolExecutor(6) as ex:
    for k, s in ex.map(gen, keys): print(k, s, flush=True)
