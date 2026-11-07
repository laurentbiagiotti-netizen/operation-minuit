"""API du classement d'Opération Minuit (Python standard, SQLite)."""
import hashlib, hmac, json, os, re, secrets, sqlite3, threading, time, unicodedata, urllib.parse, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DB_PATH = os.environ.get('DB_PATH', '/data/classement.db')
CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '').strip()
DOMAIN = os.environ.get('ALLOWED_DOMAIN', 'votre-domaine.fr').strip().lower()
PORT = int(os.environ.get('API_PORT', '8000'))
XP_MAX = 200000
LOCK = threading.Lock()
HITS = {}

def db():
    c = sqlite3.connect(DB_PATH, timeout=10)
    c.row_factory = sqlite3.Row
    return c

def init():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with db() as c:
        c.execute("""CREATE TABLE IF NOT EXISTS joueurs (
            uid TEXT PRIMARY KEY, secret_hash TEXT NOT NULL, mode TEXT NOT NULL,
            email TEXT UNIQUE, prenom TEXT NOT NULL, nom TEXT NOT NULL, classe TEXT NOT NULL DEFAULT '',
            xp INTEGER NOT NULL DEFAULT 0, missions INTEGER NOT NULL DEFAULT 0, quetes INTEGER NOT NULL DEFAULT 0,
            boss INTEGER NOT NULL DEFAULT 0, cree_le TEXT NOT NULL, maj TEXT NOT NULL)""")
        c.execute("CREATE INDEX IF NOT EXISTS idx_xp ON joueurs(xp DESC)")
        c.execute("""CREATE TABLE IF NOT EXISTS difficile (
            uid TEXT NOT NULL, moteur TEXT NOT NULL, mission TEXT NOT NULL,
            indices INTEGER NOT NULL DEFAULT 0, solution INTEGER NOT NULL DEFAULT 0,
            xp INTEGER, resolu_le TEXT, PRIMARY KEY (uid, moteur, mission))""")
        c.execute("""CREATE TABLE IF NOT EXISTS normal (
            uid TEXT NOT NULL, mission TEXT NOT NULL, indices INTEGER NOT NULL DEFAULT 0, solution INTEGER NOT NULL DEFAULT 0,
            debut REAL, xp INTEGER, bonus INTEGER NOT NULL DEFAULT 0, resolu_le TEXT, PRIMARY KEY (uid, mission))""")
        c.execute("CREATE TABLE IF NOT EXISTS quiz (uid TEXT NOT NULL, ch INTEGER NOT NULL, score INTEGER NOT NULL, PRIMARY KEY (uid, ch))")
        c.execute("CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)")
        if not c.execute("SELECT 1 FROM meta WHERE k = 'classement_serveur'").fetchone():
            c.execute("UPDATE joueurs SET xp = 0, missions = 0, quetes = 0, boss = 0")
            c.execute("INSERT INTO meta (k, v) VALUES ('classement_serveur', ?)", (now(),))
            print('classement normal : passage au score calculé par le serveur (scores déclarés remis à zéro)', flush=True)

def h(s): return hashlib.sha256(s.encode()).hexdigest()
def now(): return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
def clean(s, n):
    s = unicodedata.normalize('NFC', str(s or '')).strip()
    s = re.sub(r'[\x00-\x1f<>"]', '', s)
    s = ''.join(ch for ch in s if unicodedata.category(ch) not in ('Cf', 'Cc', 'Co', 'Cs'))
    return re.sub(r'\s+', ' ', s)[:n]
def num(v, hi):
    try: return max(0, min(hi, int(v)))
    except Exception: return 0

def limited(ip, cost=1, per_min=60, route=''):
    t = int(time.time() // 60)
    with LOCK:
        k = (ip, route, t); HITS[k] = HITS.get(k, 0) + cost
        if len(HITS) > 5000:
            for kk in [x for x in HITS if x[-1] < t]: HITS.pop(kk, None)
        return HITS[k] > per_min

def verify_google(credential):
    if not CLIENT_ID: return None, "Connexion Google non configurée sur ce serveur."
    url = 'https://oauth2.googleapis.com/tokeninfo?' + urllib.parse.urlencode({'id_token': credential})
    try:
        with urllib.request.urlopen(url, timeout=8) as r: info = json.loads(r.read().decode())
    except Exception:
        return None, "Google n'a pas validé la connexion. Réessaie."
    if info.get('aud') != CLIENT_ID: return None, "Jeton Google invalide."
    if info.get('iss') not in ('accounts.google.com', 'https://accounts.google.com'): return None, "Jeton Google invalide."
    if int(info.get('exp', 0)) < time.time(): return None, "Connexion expirée, réessaie."
    email = (info.get('email') or '').lower()
    if str(info.get('email_verified')).lower() != 'true': return None, "Adresse Google non vérifiée."
    if info.get('hd', '').lower() != DOMAIN or not email.endswith('@' + DOMAIN):
        return None, f"Seuls les comptes @{DOMAIN} peuvent se connecter avec Google. Sinon, entre ton prénom et ton nom."
    return {'email': email, 'prenom': info.get('given_name') or email.split('@')[0].split('.')[0].capitalize(),
            'nom': info.get('family_name') or ''}, None

HARD = None
def hard():
    """Charge le module du mode difficile si les moteurs sont configurés."""
    global HARD
    if HARD is None:
        HARD = False
        if os.environ.get('HARD_ENGINES'):
            try:
                import sys
                sys.path.insert(0, os.environ.get('HARD_DIR', '/app/hard'))
                import engine as E
                HARD = E
            except Exception as e:
                print('mode difficile indisponible :', e, flush=True)
    return HARD

READY = set()
RUNNING = set()
LOW = {}
def hard_engines():
    return [e for e in os.environ.get('HARD_ENGINES', '').split(',') if e and (e in READY or os.environ.get('HARD_NO_LOAD'))]

def hard_boot():
    """Au démarrage : attend chaque moteur, puis y charge la base de l'enquête (référence + bases de travail)."""
    H = hard()
    if not H: return
    import load
    def one(e):
        t0 = time.time()
        while time.time() - t0 < 1800:
            try:
                c = load.admin(e); c.close(); break
            except Exception: time.sleep(10)
        for k in range(3):
            try:
                load.load(e); READY.add(e); print('mode difficile prêt :', e, flush=True)
                t1 = time.time(); H.warm(e); print('résultats attendus prêts :', e, round(time.time() - t1, 1), 's', flush=True); return
            except Exception as ex:
                print('chargement', e, 'échec', ex, flush=True); time.sleep(30)
    if not all(os.environ.get(k) for k in ('PG_ADMIN_PASSWORD', 'READER_PASSWORD', 'WORKER_PASSWORD')):
        print('mode difficile désactivé : mots de passe HARD_* absents du .env', flush=True); return
    for e in [x for x in os.environ.get('HARD_ENGINES', '').split(',') if x]:
        threading.Thread(target=one, args=(e,), daemon=True).start()
    def watch():
        """Toutes les 60 s : remet les mots de passe des comptes étudiants, vérifie la base de référence et la recharge si elle a disparu."""
        while True:
            time.sleep(60)
            for e in list(READY):
                try:
                    load.heal(e)
                    c = H.connect(e, 'reader'); cur = c.cursor(); cur.execute('SELECT COUNT(*) FROM suspects'); n = cur.fetchone()[0]; c.close()
                    if not n: raise RuntimeError('base vide')
                    if e == 'pg':
                        a = load.admin('pg'); cur = a.cursor()
                        cur.execute("SELECT count(*) FROM pg_database WHERE datname = 'minuit_tpl' AND datistemplate AND NOT datallowconn")
                        ok = cur.fetchone()[0]; a.close()
                        if not ok: raise RuntimeError('modèle minuit_tpl absent ou modifié')
                    P = H.POOLS.get(e)
                    if P is not None and P.free.qsize() == 0:
                        LOW[e] = LOW.get(e, 0) + 1
                        if LOW[e] >= 5: LOW[e] = 0; raise RuntimeError('aucune base de travail libre depuis 5 minutes')
                    else: LOW[e] = 0
                except Exception as ex:
                    print('surveillance', e, ex, '-> rechargement', flush=True)
                    READY.discard(e); threading.Thread(target=one, args=(e,), daemon=True).start()
    threading.Thread(target=watch, daemon=True).start()

def player(c, d):
    uid, secret = str(d.get('uid') or ''), str(d.get('secret') or '')
    r = c.execute("SELECT * FROM joueurs WHERE uid = ?", (uid,)).fetchone()
    if not r or not hmac.compare_digest(r['secret_hash'], h(secret)): return None
    return r

def hard_row(c, uid, eng, mid):
    c.execute("INSERT OR IGNORE INTO difficile (uid, moteur, mission) VALUES (?,?,?)", (uid, eng, mid))
    return c.execute("SELECT * FROM difficile WHERE uid = ? AND moteur = ? AND mission = ?", (uid, eng, mid)).fetchone()

NORMAL = None
def normal():
    global NORMAL
    if NORMAL is None:
        import normal as N
        N.reference(); NORMAL = N
    return NORMAL

def normal_row(c, uid, mid):
    c.execute("INSERT OR IGNORE INTO normal (uid, mission) VALUES (?,?)", (uid, mid))
    return c.execute("SELECT * FROM normal WHERE uid = ? AND mission = ?", (uid, mid)).fetchone()

def recompute(c, uid):
    """L'XP du classement normal vient uniquement de ce que le serveur a corrigé."""
    N = normal(); M = N.MISSIONS
    rows = c.execute("SELECT mission, xp FROM normal WHERE uid = ? AND xp IS NOT NULL", (uid,)).fetchall()
    xp = sum(r['xp'] for r in rows) + 50 * (c.execute("SELECT COALESCE(SUM(score), 0) FROM quiz WHERE uid = ?", (uid,)).fetchone()[0])
    ids = [r['mission'] for r in rows if r['mission'] in M]
    c.execute("UPDATE joueurs SET xp = ?, missions = ?, quetes = ?, boss = ?, maj = ? WHERE uid = ?",
              (xp, sum(1 for i in ids if not M[i]['side']), sum(1 for i in ids if M[i]['side']), sum(1 for i in ids if M[i]['boss']), now(), uid))
    return xp

def progres(c, uid):
    rows = c.execute("SELECT * FROM normal WHERE uid = ?", (uid,)).fetchall()
    return {'missions': {r['mission']: {'xp': r['xp'], 'bonus': r['bonus'], 'indices': r['indices'], 'solution': r['solution'],
                                        'debut': r['debut'] and int(r['debut'] * 1000)} for r in rows},
            'quiz': {str(r['ch']): r['score'] for r in c.execute("SELECT ch, score FROM quiz WHERE uid = ?", (uid,))},
            'xp': c.execute("SELECT xp FROM joueurs WHERE uid = ?", (uid,)).fetchone()[0]}

def public_row(r, rang):
    nom = r['nom'].strip()
    return {'rang': rang, 'joueur': (r['prenom'] + (' ' + nom[0].upper() + '.' if nom else '')).strip(),
            'classe': r['classe'], 'xp': r['xp'], 'missions': r['missions'], 'quetes': r['quetes'], 'boss': r['boss'],
            'google': r['mode'] == 'google', 'uid_hash': h(r['uid'])[:12]}

class H(BaseHTTPRequestHandler):
    server_version = 'minuit-api'
    def log_message(self, *a): pass
    def ip(self): return self.headers.get('X-Real-IP') or self.client_address[0]
    def send(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers(); self.wfile.write(b)
    def body(self):
        n = int(self.headers.get('Content-Length') or 0)
        if n > 20000: raise ValueError('trop gros')
        d = json.loads(self.rfile.read(n).decode() or '{}')
        if not isinstance(d, dict): raise ValueError('objet attendu')
        return d

    def do_GET(self):
        u = urllib.parse.urlparse(self.path); q = urllib.parse.parse_qs(u.query)
        if limited(self.ip(), 1, 600, 'get'): return self.send(429, {'erreur': 'Trop de requêtes.'})
        if u.path == '/api/config':
            return self.send(200, {'google_client_id': CLIENT_ID, 'domaine': DOMAIN, 'classement': True})
        if u.path == '/api/hard/config':
            H = hard()
            if not H: return self.send(200, {'moteurs': []})
            out = []
            for e in hard_engines():
                Dd = H.DIALECTS.get(e, {})
                out.append({'id': e, 'nom': H.ENGINE_NAMES[e], 'missions': [k for k, v in Dd.items() if not v.get('skip')]})
            return self.send(200, {'moteurs': out, 'multiplicateur': 2})
        if u.path == '/api/hard/mission':
            H = hard(); e = (q.get('moteur') or [''])[0]; mid = (q.get('id') or [''])[0]
            if not H or e not in hard_engines(): return self.send(404, {'erreur': 'Mode difficile indisponible.'})
            Dd = H.DIALECTS.get(e, {}).get(mid)
            if not Dd: return self.send(200, {'disponible': False, 'raison': f"Cette mission n'est pas encore disponible sur {H.ENGINE_NAMES[e]}."})
            if Dd.get('skip'): return self.send(200, {'disponible': False, 'raison': Dd['skip']})
            return self.send(200, {'disponible': True, 'note': Dd.get('note') or '', 'indices': len(Dd.get('hints') or []), 'moteur': H.ENGINE_NAMES[e]})
        if u.path == '/api/classement' and (q.get('mode') or [''])[0] == 'difficile':
            moteur = clean((q.get('moteur') or [''])[0], 10); classe = clean((q.get('classe') or [''])[0], 60)
            sql = ("SELECT j.*, SUM(d.xp) AS hxp, COUNT(d.xp) AS hmis, GROUP_CONCAT(DISTINCT d.moteur) AS moteurs FROM difficile d JOIN joueurs j ON j.uid = d.uid "
                   "WHERE d.xp IS NOT NULL AND j.mode = 'google'" + (" AND d.moteur = ?" if moteur else "") + (" AND j.classe = ?" if classe else "") +
                   " GROUP BY j.uid HAVING SUM(d.xp) > 0 ORDER BY hxp DESC, MAX(d.resolu_le) ASC LIMIT 200")
            args = [x for x in (moteur, classe) if x]
            with db() as c:
                rows = c.execute(sql, args).fetchall()
                classes = [r[0] for r in c.execute("SELECT j.classe FROM difficile d JOIN joueurs j ON j.uid = d.uid WHERE d.xp > 0 AND j.mode = 'google' AND j.classe <> '' GROUP BY j.classe ORDER BY COUNT(DISTINCT j.uid) DESC LIMIT 30")]
            H = hard(); names = H.ENGINE_NAMES if H else {}
            out = []
            for i, r in enumerate(rows):
                p = public_row(r, i + 1); p.update(xp=r['hxp'], missions=r['hmis'], quetes=None, boss=None, moteurs=[names.get(m, m) for m in (r['moteurs'] or '').split(',') if m])
                out.append(p)
            return self.send(200, {'joueurs': out, 'classes': classes, 'total': len(out)})
        if u.path == '/api/classement':
            classe = clean((q.get('classe') or [''])[0], 60)
            with db() as c:
                if classe:
                    rows = c.execute("SELECT * FROM joueurs WHERE classe = ? AND xp > 0 ORDER BY xp DESC, maj ASC LIMIT 200", (classe,)).fetchall()
                else:
                    rows = c.execute("SELECT * FROM joueurs WHERE xp > 0 ORDER BY xp DESC, maj ASC LIMIT 200").fetchall()
                classes = [r[0] for r in c.execute("SELECT classe FROM joueurs WHERE classe <> '' AND xp > 0 GROUP BY classe ORDER BY COUNT(*) DESC LIMIT 30")]
                total = c.execute("SELECT COUNT(*) FROM joueurs WHERE xp > 0").fetchone()[0]
            return self.send(200, {'joueurs': [public_row(r, i + 1) for i, r in enumerate(rows)], 'classes': classes, 'total': total})
        return self.send(404, {'erreur': 'introuvable'})

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        try: d = self.body()
        except Exception: return self.send(400, {'erreur': 'Requête invalide.'})
        if u.path == '/api/inscription':
            if limited(self.ip(), 1, 30, 'inscription'): return self.send(429, {'erreur': 'Trop de tentatives, attends une minute.'})
            classe = clean(d.get('classe'), 60)
            if d.get('credential'):
                info, err = verify_google(str(d['credential']))
                if err: return self.send(403, {'erreur': err})
                secret = secrets.token_urlsafe(24)
                with LOCK, db() as c:
                    r = c.execute("SELECT uid FROM joueurs WHERE email = ?", (info['email'],)).fetchone()
                    if r:
                        uid = r['uid']
                        c.execute("UPDATE joueurs SET secret_hash = ?, prenom = ?, nom = ?, classe = CASE WHEN ? <> '' THEN ? ELSE classe END, maj = ? WHERE uid = ?",
                                  (h(secret), clean(info['prenom'], 40), clean(info['nom'], 60), classe, classe, now(), uid))
                    else:
                        uid = secrets.token_urlsafe(12)
                        c.execute("INSERT INTO joueurs (uid, secret_hash, mode, email, prenom, nom, classe, cree_le, maj) VALUES (?,?,?,?,?,?,?,?,?)",
                                  (uid, h(secret), 'google', info['email'], clean(info['prenom'], 40), clean(info['nom'], 60), classe, now(), now()))
                    x = c.execute("SELECT xp FROM joueurs WHERE uid = ?", (uid,)).fetchone()['xp']
                return self.send(200, {'uid': uid, 'secret': secret, 'mode': 'google', 'email': info['email'],
                                       'prenom': clean(info['prenom'], 40), 'nom': clean(info['nom'], 60), 'xp_serveur': x})
            prenom, nom = clean(d.get('prenom'), 40), clean(d.get('nom'), 60)
            if len(prenom) < 2 or len(nom) < 2: return self.send(400, {'erreur': 'Indique ton prénom et ton nom.'})
            uid, secret = secrets.token_urlsafe(12), secrets.token_urlsafe(24)
            with LOCK, db() as c:
                c.execute("INSERT INTO joueurs (uid, secret_hash, mode, prenom, nom, classe, cree_le, maj) VALUES (?,?,?,?,?,?,?,?)",
                          (uid, h(secret), 'nom', prenom, nom, classe, now(), now()))
            return self.send(200, {'uid': uid, 'secret': secret, 'mode': 'nom', 'prenom': prenom, 'nom': nom, 'xp_serveur': 0})
        if u.path == '/api/score':
            if limited(self.ip(), 1, 600, 'score'): return self.send(429, {'erreur': 'Trop de requêtes.'})
            uid, secret = str(d.get('uid') or ''), str(d.get('secret') or '')
            with LOCK, db() as c:
                r = c.execute("SELECT * FROM joueurs WHERE uid = ?", (uid,)).fetchone()
                if not r or not hmac.compare_digest(r['secret_hash'], h(secret)): return self.send(403, {'erreur': 'Joueur inconnu.'})
                classe = clean(d.get('classe'), 60) or r['classe']
                c.execute("UPDATE joueurs SET classe = ? WHERE uid = ?", (classe, uid))
                mx = c.execute("SELECT xp FROM joueurs WHERE uid = ?", (uid,)).fetchone()[0]
                rang = c.execute("SELECT COUNT(*) + 1 FROM joueurs WHERE xp > ?", (mx,)).fetchone()[0]
            return self.send(200, {'ok': True, 'rang': rang})
        if u.path.startswith('/api/normal/'):
            return self.normal_post(u, d)
        if u.path.startswith('/api/hard/'):
            H = hard(); e = str(d.get('moteur') or ''); mid = str(d.get('id') or '')
            if not H or e not in hard_engines(): return self.send(404, {'erreur': 'Mode difficile indisponible.'})
            with LOCK, db() as c:
                pl = player(c, d)
            if not pl: return self.send(403, {'erreur': 'Identifie-toi pour jouer en mode difficile.'})
            uid = pl['uid']
            if u.path in ('/api/hard/sandbox', '/api/hard/run'):
                with LOCK:
                    if uid in RUNNING: return self.send(429, {'erreur': 'Une exécution est déjà en cours : attends son résultat.'})
                    RUNNING.add(uid)
                try: return self.hard_exec(H, u, d, e, mid, uid, pl)
                finally:
                    with LOCK: RUNNING.discard(uid)
            return self.hard_exec(H, u, d, e, mid, uid, pl)
        return self.send(404, {'erreur': 'introuvable'})

    def normal_post(self, u, d):
        N = normal(); M = N.MISSIONS
        with LOCK, db() as c:
            pl = player(c, d)
        if not pl: return self.send(403, {'erreur': 'Identifie-toi pour jouer : ton score est enregistré sur le serveur.'})
        uid = pl['uid']; mid = str(d.get('id') or '')
        if limited(self.ip(), 1, 1200, 'normal'): return self.send(429, {'erreur': 'Trop de requêtes, attends un peu.'})
        if u.path == '/api/normal/progres':
            with LOCK, db() as c: return self.send(200, progres(c, uid))
        if u.path == '/api/normal/quiz':
            ch = num(d.get('ch'), 1000); key = N.NORMAL['quiz'].get(str(ch)); rep = d.get('reponses')
            if not key or not isinstance(rep, list) or len(rep) != len(key): return self.send(400, {'erreur': 'Quiz invalide.'})
            if limited(uid, 1, 20, 'quiz'): return self.send(429, {'erreur': 'Trop de requêtes, attends un peu.'})
            score = sum(1 for a, b in zip(rep, key) if isinstance(a, int) and a == b)
            with LOCK, db() as c:
                c.execute("INSERT INTO quiz (uid, ch, score) VALUES (?,?,?) ON CONFLICT(uid, ch) DO UPDATE SET score = MAX(score, excluded.score)", (uid, ch, score))
                best = c.execute("SELECT score FROM quiz WHERE uid = ? AND ch = ?", (uid, ch)).fetchone()[0]
                xp = recompute(c, uid)
            return self.send(200, {'score': score, 'meilleur': best, 'xp_total': xp})
        if u.path == '/api/normal/rattrapage':
            items = d.get('items')
            if not isinstance(items, list): return self.send(400, {'erreur': 'Requête invalide.'})
            if limited(uid, 1, 2, 'rattrapage'): return self.send(429, {'erreur': 'Trop de requêtes, attends un peu.'})
            with LOCK:
                if uid in RUNNING: return self.send(429, {'erreur': 'Une vérification est déjà en cours.'})
                RUNNING.add(uid)
            ok = 0
            try:
                for it in items[:400]:
                    if not isinstance(it, dict): continue
                    m2 = str(it.get('id') or '')
                    if m2 not in M: continue
                    with LOCK, db() as c:
                        r = normal_row(c, uid, m2)
                    if r['xp'] is not None: continue
                    if not N.check(m2, str(it.get('sql') or '')[:20000]).get('ok'): continue
                    hints = max(r['indices'], min(num(it.get('indices'), 20), len(M[m2]['hints'])))
                    sol = 1 if (r['solution'] or it.get('solution')) else 0
                    with LOCK, db() as c:
                        c.execute("UPDATE normal SET indices = ?, solution = ?, xp = ?, bonus = 0, resolu_le = ? WHERE uid = ? AND mission = ? AND xp IS NULL",
                                  (hints, sol, N.xp_for(m2, hints, sol), now(), uid, m2)); ok += 1
            finally:
                with LOCK: RUNNING.discard(uid)
            with LOCK, db() as c:
                recompute(c, uid); out = progres(c, uid)
            out['valides'] = ok
            return self.send(200, out)
        if mid not in M: return self.send(404, {'erreur': 'Mission inconnue.'})
        m = M[mid]
        if u.path == '/api/normal/boss':
            if not m['boss']: return self.send(400, {'erreur': "Ce n'est pas une mission boss."})
            with LOCK, db() as c:
                r = normal_row(c, uid, mid)
                if r['debut'] is None and r['xp'] is None:
                    c.execute("UPDATE normal SET debut = ? WHERE uid = ? AND mission = ?", (time.time(), uid, mid)); r = normal_row(c, uid, mid)
            return self.send(200, {'debut': r['debut'] and int(r['debut'] * 1000), 'timer': m['timer'], 'maintenant': int(time.time() * 1000)})
        if u.path == '/api/normal/hint':
            if limited(uid, 1, 60, 'aide'): return self.send(429, {'erreur': 'Trop de requêtes, attends un peu.'})
            hints = m['hints']
            with LOCK, db() as c:
                r = normal_row(c, uid, mid); n = r['indices']
                if not d.get('voir') and n < len(hints) and r['xp'] is None:
                    c.execute("UPDATE normal SET indices = indices + 1 WHERE uid = ? AND mission = ?", (uid, mid)); n += 1
                elif not d.get('voir') and r['xp'] is not None: n = len(hints)
            return self.send(200, {'indices': hints[:min(n, len(hints))], 'reste': max(0, len(hints) - n)})
        if u.path == '/api/normal/solution':
            if limited(uid, 1, 60, 'aide'): return self.send(429, {'erreur': 'Trop de requêtes, attends un peu.'})
            with LOCK, db() as c:
                r = normal_row(c, uid, mid)
                if r['xp'] is None: c.execute("UPDATE normal SET solution = 1 WHERE uid = ? AND mission = ?", (uid, mid))
            return self.send(200, {'solution': m['solution']})
        if u.path == '/api/normal/run':
            if limited(uid, 1, 40, 'nrun'): return self.send(429, {'erreur': 'Trop de requêtes, attends un peu.'})
            with LOCK:
                if uid in RUNNING: return self.send(429, {'erreur': 'Une exécution est déjà en cours : attends son résultat.'})
                RUNNING.add(uid)
            try: v = N.check(mid, str(d.get('sql') or ''))
            except Exception as ex:
                print('normal', mid, ex, flush=True); v = {'ok': False, 'error': True, 'msg': "Le serveur n'a pas pu corriger ta requête. Réessaie."}
            finally:
                with LOCK: RUNNING.discard(uid)
            out = {'ok': bool(v.get('ok')), 'error': bool(v.get('error')), 'msg': v.get('msg'), 'raw': v.get('raw')}
            if v.get('ok'):
                with LOCK, db() as c:
                    r = normal_row(c, uid, mid)
                    if r['xp'] is None:
                        bonus = 100 if (m['boss'] and not r['solution'] and r['debut'] and time.time() - r['debut'] <= (m['timer'] or 0)) else 0
                        c.execute("UPDATE normal SET xp = ?, bonus = ?, resolu_le = ? WHERE uid = ? AND mission = ?",
                                  (N.xp_for(mid, r['indices'], r['solution']) + bonus, bonus, now(), uid, mid))
                        r = normal_row(c, uid, mid)
                    out.update(xp=r['xp'], bonus=r['bonus'], indices=r['indices'], solution=r['solution'], xp_total=recompute(c, uid))
            return self.send(200, out)
        return self.send(404, {'erreur': 'introuvable'})

    def hard_exec(self, H, u, d, e, mid, uid, pl):
            if u.path == '/api/hard/sandbox':
                if limited(uid, 1, 30, 'sandbox') or limited(self.ip(), 1, 600, 'hard'): return self.send(429, {'erreur': 'Trop de requêtes, attends un peu.'})
                sql = str(d.get('sql') or '')[:20000]
                bad = H.forbidden_setting(e, H.strip_comments(sql))
                if bad: return self.send(200, {'ok': False, 'error': True, 'msg': f"Le réglage <code>{H.esc(bad)}</code> est réservé au serveur dans ce jeu."})
                try:
                    conn = H.connect_safe(e, 'reader')
                    try: sets, _ = H.guarded(e, conn, sql, H.READER_LIMIT)
                    finally:
                        try: conn.rollback()
                        except Exception: pass
                        conn.close()
                    res = H.last_set(sets)
                    if res: res['values'] = res['values'][:500]
                    return self.send(200, {'ok': True, 'result': res})
                except Exception as ex:
                    return self.send(200, {'ok': False, 'error': True, 'msg': H.friendly_error(e, ex)})
            if u.path == '/api/hard/progres':
                with db() as c:
                    rows = c.execute("SELECT mission, xp, indices, solution FROM difficile WHERE uid = ? AND moteur = ?", (uid, e)).fetchall()
                return self.send(200, {'missions': {r['mission']: {'xp': r['xp'], 'indices': r['indices'], 'solution': r['solution']} for r in rows}})
            m = H.EXPECTED.get(mid); Dd = H.DIALECTS.get(e, {}).get(mid)
            if not m or not Dd or Dd.get('skip'): return self.send(404, {'erreur': 'Mission indisponible sur ce moteur.'})
            if limited(uid, 1, 60, 'aide'): return self.send(429, {'erreur': 'Trop de requêtes, attends un peu.'})
            if u.path in ('/api/hard/hint', '/api/hard/solution') and pl['mode'] != 'google':
                return self.send(403, {'erreur': 'Indices et solutions du mode difficile : connecte-toi avec ton compte Cybersup (Google).'})
            if u.path == '/api/hard/hint':
                hints = Dd.get('hints') or []
                with LOCK, db() as c:
                    r = hard_row(c, uid, e, mid); n = r['indices']
                    if not d.get('voir') and n < len(hints) and r['xp'] is None: c.execute("UPDATE difficile SET indices = indices + 1 WHERE uid = ? AND moteur = ? AND mission = ?", (uid, e, mid)); n += 1
                    n = min(n, len(hints)) if d.get('voir') else max(1, min(n, len(hints)))
                return self.send(200, {'indices': hints[:n], 'reste': len(hints) - n})
            if u.path == '/api/hard/solution':
                with LOCK, db() as c:
                    r = hard_row(c, uid, e, mid)
                    if r['xp'] is None: c.execute("UPDATE difficile SET solution = 1 WHERE uid = ? AND moteur = ? AND mission = ?", (uid, e, mid))
                return self.send(200, {'solution': Dd['solution']})
            if u.path == '/api/hard/run':
                if limited(uid, 1, 30, 'run') or limited(self.ip(), 1, 600, 'hard'): return self.send(429, {'erreur': 'Trop de requêtes, attends un peu.'})
                sql = str(d.get('sql') or '')
                try: r = H.run_student(e, mid, sql)
                except H.Busy as ex: return self.send(503, {'erreur': str(ex)})
                except Exception as ex:
                    print('run', e, mid, ex, flush=True); return self.send(500, {'erreur': "Le moteur n'a pas pu exécuter la requête. Réessaie."})
                gain = None
                if r.get('ok'):
                    with LOCK, db() as c:
                        row = hard_row(c, uid, e, mid)
                        if row['xp'] is None:
                            base = int(m.get('xp') or 100)
                            gain = 0 if row['solution'] else 2 * max(round(base * 0.4), base - 20 * row['indices'])
                            c.execute("UPDATE difficile SET xp = ?, resolu_le = ? WHERE uid = ? AND moteur = ? AND mission = ?", (gain, now(), uid, e, mid))
                        else: gain = row['xp']
                res = r.get('result')
                if res: res = dict(res, values=res['values'][:500])
                return self.send(200, {'ok': bool(r.get('ok')), 'error': bool(r.get('error')), 'msg': r.get('msg'), 'result': res, 'ms': r.get('ms'), 'changes': r.get('changes'), 'xp': gain})
            return self.send(404, {'erreur': 'introuvable'})

if __name__ == '__main__':
    init()
    threading.Thread(target=normal, daemon=True).start()
    if os.environ.get('HARD_ENGINES') and not os.environ.get('HARD_NO_LOAD'): hard_boot()
    print(f'API classement sur le port {PORT}, Google {"actif" if CLIENT_ID else "inactif"}, domaine {DOMAIN}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
