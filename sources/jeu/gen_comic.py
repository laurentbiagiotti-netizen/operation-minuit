import json, base64, os, sys, urllib.request, concurrent.futures as cf, io
from PIL import Image
KEY = open(os.path.expanduser('~/.secrets/openai')).read().strip()
OUT = '/home/claude/build/img2'; os.makedirs(OUT, exist_ok=True)
STYLE = ("Comic book panel in Franco-Belgian bande dessinee style mixed with modern American comics: bold black ink outlines, "
         "flat colors with visible halftone dot shading, dynamic composition, expressive faces. Strict limited palette: "
         "deep navy blue (#0A1047), indigo (#303880), bright orange (#FD7119), light orange (#FFA364) and warm cream paper (#F6E9E0), black ink. "
         "Absolutely no text, no letters, no speech bubbles, no captions, no logos. ")
CH = {
 'varga': "Close-up of a French police commissioner woman in her fifties, short spiky silver hair, dark trench coat, confident determined look, arms crossed, plain halftone background.",
 'varga2': "French police commissioner woman in her fifties with short spiky silver hair and dark trench coat, pointing her finger forward energetically, giving orders, speed lines background.",
 'byte': "Close-up of a young female data analyst, curly dark hair in a high bun, round glasses, headset around her neck, orange hoodie, friendly smile, plain halftone background.",
 'byte2': "Young female data analyst with curly dark hair in a bun, round glasses, orange hoodie, explaining with one finger raised like a teacher, a laptop in her other hand, cheerful, halftone background.",
 'vasseur': "Close-up mugshot of a grumpy fifty-something burglar, short brown hair, trimmed beard, rectangular glasses, small scar on cheek, black beanie, height chart behind.",
 'lefort': "Close-up mugshot of a tall defiant woman getaway driver, red ponytail, tattooed forearms crossed, leather jacket, height chart behind.",
 'ferrand': "Close-up of a sweating nervous bank security technician man in his thirties, uniform with badge on lanyard, eyes looking sideways, drops of sweat.",
 'marchetti': "Close-up of an elegant cold woman crime boss in her forties, sleek black bob haircut, thin glasses, dark suit, sly smile, villa window behind.",
 'ouali': "Close-up of a bank IT director man in his forties, short black hair grey temples, blazer, holding a tablet, worried, server racks behind.",
 'juge': "Close-up of a strict French investigating judge woman in her sixties, grey bun, black robe with white jabot, reading glasses, holding a file.",
 'cover': "Comic book cover composition: a commissioner woman with silver hair and a young analyst woman with round glasses and a laptop stand back to back in the foreground, behind them the La Defense business towers at night, a bank vault door, flying banknotes, police lights, dramatic.",
}
SC = {
 1: ["Night, police cars with flashing lights in front of a glass bank tower at La Defense, crowd of onlookers behind tape.",
     "A young analyst with round glasses in an orange hoodie typing on a laptop full of glowing tables, a coffee cup, police office at night.",
     "A huge pile of suspect file folders falling off a desk, photos flying everywhere, comic chaos."],
 2: ["A burglar silhouette with a heavy bag running out of a bank emergency exit at night, a security guard pointing.",
     "A bank vault door wide open, the vault empty, a big boot footprint on the floor under a flashlight beam.",
     "Police breaking down an apartment door at dawn, a grumpy man in pyjamas with glasses being handcuffed."],
 3: ["A black car screeching away down a wet street at night, a red-haired woman at the wheel, tire smoke.",
     "An old man witness at his window in pyjamas, eyes wide, holding binoculars, night.",
     "Close-up of a partially visible car license plate in headlights, mysterious."],
 4: ["A detective desk with a timeline, calendar pages, stamps and a magnifying glass over documents.",
     "A street camera on a pole flashing as a car passes at night.",
     "A judge woman in black robe reading a thick file, raising an eyebrow."],
 5: ["A dark room full of computer screens showing red alert warnings and a world map with attack lines.",
     "Hundreds of padlock icons breaking under a hammer of a hooded shadow on a screen, symbolic brute force attack.",
     "A nervous technician man sweating under a single light bulb in a police interview room."],
 6: ["A detective corkboard with photos linked by orange strings: a burglar, a red-haired woman, a car, a badge.",
     "Two phones linked by a lightning bolt, a phone call at night between two shadowy men.",
     "A commissioner woman slamming a folder on an interview table in front of a sweating man."],
 7: ["A badge reader glowing orange next to a heavy vault door in a dim bank corridor.",
     "A shadowy hand holding a cloned badge, a red light on the reader refusing access.",
     "A bank IT director and an analyst looking at access logs on a big screen, shocked."],
 8: ["Banknotes flying across a stylized map of Europe with orange arrows from Paris to Vilnius, Malta, Cyprus and Geneva.",
     "A chain of bank buildings connected by arrows of money like dominoes.",
     "An elegant villa on the shore of Lake Geneva at dusk, one lit window."],
 9: ["A big wall clock at 23:31 with a detective analyst drawing a timeline on a glass wall.",
     "A sequence of doors opening one after another along a corridor, footprints, clock icons.",
     "A commissioner and an analyst pointing at a glowing timeline, eureka moment."],
 10: ["A courthouse records room with tall shelves of case files and a big rubber stamp.",
      "An analyst pressing a big orange UNDO-like button, sparks, comic effect.",
      "A clerk adding new pages to a thick case file with a stapler."],
 11: ["An architect desk with blueprint diagrams of connected boxes and keys, rulers and pencils.",
     "Construction workers building a big tidy bookshelf of labeled drawers, symbolic database design.",
     "A giant index book being opened by an analyst, glowing pages, speed."],
 12: ["A hooded shadowy hacker silhouette typing a single apostrophe on a keyboard, the key glowing orange.",
     "A web login form on a screen cracking like glass.",
     "A shield made of padlocks protecting a server, an analyst giving thumbs up."],
 13: ["Dawn over Lake Geneva, Swiss and French police walking toward an elegant villa.",
     "An elegant woman boss with black bob hair being handcuffed in a luxurious living room, cold expression.",
     "The commissioner and the young analyst giving a high five in the police office, confetti, celebration."],
}
JOBS = [(k, CH[k], '1024x1024') for k in CH]
for c, lst in SC.items():
    for i, p in enumerate(lst): JOBS.append((f'ch{c}_{i}', p, '1536x1024' if i == 0 else '1024x1024'))
def gen(job):
    k, prompt, size = job
    path = f"{OUT}/{k}.jpg"
    if os.path.exists(path): return k, 'skip'
    body = json.dumps({'model':'gpt-image-2','prompt':STYLE+prompt,'size':size,'quality':'medium','n':1}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=body,
        headers={'Authorization':'Bearer '+KEY,'Content-Type':'application/json'})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=300) as r: d = json.load(r)
            im = Image.open(io.BytesIO(base64.b64decode(d['data'][0]['b64_json']))).convert('RGB')
            im.thumbnail((900, 900) if size != '1024x1024' else (560, 560)); im.save(path, 'JPEG', quality=76, optimize=True, progressive=True)
            return k, 'ok'
        except Exception as e:
            err = e.read().decode()[:200] if hasattr(e,'read') else str(e)
    return k, 'ERR ' + err
only = sys.argv[1:]
jobs = [j for j in JOBS if not only or j[0] in only]
with cf.ThreadPoolExecutor(8) as ex:
    for k, s in ex.map(gen, jobs): print(k, s, flush=True)
