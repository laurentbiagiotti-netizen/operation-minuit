"""Correction du mode normal côté serveur, sur SQLite (le même moteur que le jeu).

Le navigateur n'a plus les solutions ni les indices : il envoie la requête de l'élève,
le serveur la rejoue sur une copie neuve de la base, compare au résultat attendu et
calcule lui-même l'XP. Le classement du mode normal ne repose donc plus sur ce que
le navigateur déclare.
"""
import json, math, os, re, sqlite3, threading, time

HERE = os.environ.get('HARD_DIR', '/app/hard')
SRC = os.environ.get('MINUIT_SQL_DIR', os.path.join(HERE, 'data'))
DEADLINE_S = 5.0
MAX_ROWS, MAX_CELL, MAX_BYTES, MAX_STMTS = 2000, 4000, 3_000_000, 60
SLOTS = threading.BoundedSemaphore(int(os.environ.get('NORMAL_SLOTS', '8')))

def _json(p):
    with open(p, encoding='utf-8') as f: return json.load(f)

EXPECTED = _json(os.path.join(HERE, 'expected.json'))
NORMAL = _json(os.path.join(HERE, 'normal.json'))
MISSIONS = NORMAL['missions']

# ---------- comparaison : mêmes règles que le jeu et que le mode difficile ----------
def esc(s): return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
def _num(x):
    r = round(float(x) * 10000) / 10000
    if r == int(r) and abs(r) < 1e15: return str(int(r))
    return repr(r)
def canon(v):
    if v is None: return '∅'
    if isinstance(v, bool): v = int(v)
    if isinstance(v, (int, float)):
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)): return str(v)
        return _num(v)
    if isinstance(v, (bytes, bytearray, memoryview)): return '[blob]'
    s = str(v)
    if re.match(r'^-?\d+(\.\d+)?$', s) and len(s) < 16: return _num(float(s))
    return s

def compare(exp, got, opt):
    if not got:
        return {'ok': False, 'msg': "Ta requête s'exécute mais ne renvoie <b>aucune ligne</b>. Vérifie tes valeurs : les textes sont sensibles à la casse (<code>'H'</code> n'est pas <code>'h'</code>) et s'écrivent exactement comme dans la table." if opt.get('emptyIsSelect') else "Ta requête ne renvoie aucun résultat. Termine par un <code>SELECT</code> qui affiche ce qui est demandé."}
    E = [[canon(v) for v in r] for r in exp['values']]; G = [[canon(v) for v in r] for r in got['values']]
    k, m = len(exp['columns']), len(got['columns'])
    names = lambda cols: ', '.join('<code>' + esc(c) + '</code>' for c in cols)
    if opt.get('strictCols') and m != k:
        return {'ok': False, 'msg': f"Il faut exactement <b>{k}</b> colonne{'s' if k > 1 else ''} ({names(exp['columns'])}). Ta requête en renvoie {m}."}
    if m < k: return {'ok': False, 'msg': f"Il manque des colonnes : la réponse en attend {k} ({names(exp['columns'])}), ta requête en renvoie {m}."}
    if len(G) != len(E):
        return {'ok': False, 'msg': f"Ta requête renvoie <b>{len(G)}</b> ligne{'s' if len(G) > 1 else ''}, la réponse attendue en contient <b>{len(E)}</b>. Revois tes conditions."}
    sig = lambda rows, j: '\u0001'.join(sorted(r[j] for r in rows))
    used, mp = set(), []
    for i in range(k):
        s = sig(E, i); found = -1
        for j in range(m):
            if j not in used and got['columns'][j].lower() == exp['columns'][i].lower() and sig(G, j) == s: found = j; break
        if found < 0:
            for j in range(m):
                if j not in used and sig(G, j) == s: found = j; break
        if found < 0:
            r2 = lambda rows: [[str(round(float(v) * 100) / 100) if re.match(r'^-?\d+(\.\d+)?$', v) else v for v in r] for r in rows]
            E2, G2 = r2(E), r2(G)
            for j in range(m):
                if j not in used and sig(G2, j) == sig(E2, i) and sig(G, j) != s:
                    return {'ok': False, 'msg': f"Presque ! Ta colonne <code>{esc(got['columns'][j])}</code> a les bonnes valeurs, mais pas le bon arrondi. Pense à <code>ROUND(..., 2)</code> ou à la division décimale."}
            return {'ok': False, 'msg': f"Le bon nombre de lignes, mais aucune de tes colonnes ne correspond à <code>{esc(exp['columns'][i])}</code> attendue. Vérifie le calcul, le filtre ou la colonne choisie."}
        used.add(found); mp.append(found)
    if opt.get('colNames'):
        for i in range(k):
            if got['columns'][mp[i]].lower() != exp['columns'][i].lower():
                return {'ok': False, 'msg': f"Les valeurs sont bonnes. Renomme la colonne <code>{esc(got['columns'][mp[i]])}</code> en <code>{esc(exp['columns'][i])}</code> avec <code>AS</code>."}
    P = [[r[j] for j in mp] for r in G]
    key = lambda r: '\u0001'.join(r)
    if sorted(map(key, E)) != sorted(map(key, P)):
        return {'ok': False, 'msg': "Le bon nombre de lignes et de colonnes, mais certaines lignes ne correspondent pas. Les valeurs sont presque bonnes : vérifie chaque condition."}
    if opt.get('ordered'):
        ks = opt.get('orderKeys') or list(range(k))
        for i in range(len(E)):
            if [E[i][c] for c in ks] != [P[i][c] for c in ks]:
                return {'ok': False, 'msg': "Les bonnes lignes, mais <b>pas dans le bon ordre</b>. Vérifie ton ORDER BY (ASC, DESC, critères secondaires)."}
    return {'ok': True}

# ---------- base de référence ----------
_REF = None
_REF_LOCK = threading.Lock()
def _fns(c):
    cache = {}
    def regexp(p, v):
        if p is None or v is None: return None
        try:
            r = cache.get(p) or cache.setdefault(p, re.compile(p))
            return 1 if r.search(str(v)) else 0
        except Exception: return 0
    c.create_function('regexp', 2, regexp, deterministic=True)
    c.create_function('ln', 1, lambda x: None if x is None or not isinstance(x, (int, float)) or x <= 0 else math.log(x), deterministic=True)
    c.create_function('sqrt', 1, lambda x: None if x is None or not isinstance(x, (int, float)) else (0.0 if -1e-6 < x < 0 else (None if x < 0 else math.sqrt(x))), deterministic=True)

def reference():
    """Octets de la base de l'enquête, construite une fois au démarrage."""
    global _REF
    with _REF_LOCK:
        if _REF is None:
            c = sqlite3.connect(':memory:')
            c.execute(f"PRAGMA hard_heap_limit = {int(os.environ.get('NORMAL_HEAP', '1200000000'))}")
            for f in ['schema', 'data', 'data2', 'data3', 'data4', 'data5']:
                with open(os.path.join(SRC, f + '.sql'), encoding='utf-8') as fh: c.executescript(fh.read())
            _REF = c.serialize(); c.close()
    return _REF

_DENY = {getattr(sqlite3, n) for n in ('SQLITE_ATTACH', 'SQLITE_DETACH') if hasattr(sqlite3, n)}
def _authorizer(action, a1, a2, db, src):
    if action in _DENY: return sqlite3.SQLITE_DENY
    if action == sqlite3.SQLITE_PRAGMA and (a1 or '').lower() in ('temp_store_directory', 'data_store_directory', 'journal_mode', 'mmap_size', 'cache_size', 'hard_heap_limit', 'soft_heap_limit', 'threads', 'max_page_count', 'page_size'):
        return sqlite3.SQLITE_DENY
    return sqlite3.SQLITE_OK

def fresh():
    c = sqlite3.connect(':memory:', isolation_level=None, check_same_thread=False)
    c.deserialize(reference())
    _fns(c)
    for name, val in (('SQLITE_LIMIT_ATTACHED', 0), ('SQLITE_LIMIT_LENGTH', 5_000_000), ('SQLITE_LIMIT_SQL_LENGTH', 100_000)):
        if hasattr(sqlite3, name): c.setlimit(getattr(sqlite3, name), val)
    c.execute('PRAGMA foreign_keys = ON')
    c.execute('PRAGMA temp_store = MEMORY')
    c.set_authorizer(_authorizer)
    return c

# ---------- exécution ----------
class TooLong(Exception): pass
class TooBig(Exception): pass

def split_sql(sql):
    out, buf = [], ''
    for ch in sql:
        buf += ch
        if ch == ';' and sqlite3.complete_statement(buf):
            if buf.strip().strip(';').strip(): out.append(buf.strip())
            buf = ''
    if buf.strip():
        rest = re.sub(r'(--[^\n]*|/\*.*?\*/|\s)+', '', buf, flags=re.S)
        if rest: out.append(buf.strip())
    return out

def _rows(cur):
    cols = [str(d[0]) for d in cur.description][:200]
    vals, budget = [], MAX_BYTES
    while True:
        part = cur.fetchmany(500)
        if not part: break
        for r in part:
            row = []
            for v in list(r)[:200]:
                if isinstance(v, (bytes, bytearray, memoryview)): v = '[blob]'
                if isinstance(v, str) and len(v) > MAX_CELL: v = v[:MAX_CELL] + ' [tronqué]'
                budget -= len(str(v)) + 2; row.append(v)
            vals.append(row)
            if budget < 0: raise TooBig('Résultat trop volumineux : affine ta requête (moins de lignes ou de colonnes).')
        if len(vals) > 20000: raise TooBig('Résultat trop volumineux : affine ta requête (moins de lignes ou de colonnes).')
    return {'columns': cols, 'values': vals}

def execute(c, sql, deadline):
    stmts = split_sql(sql)
    if len(stmts) > MAX_STMTS: raise TooBig(f'Trop d\'instructions dans un même envoi (maximum {MAX_STMTS}).')
    def guard():
        return 1 if time.time() > deadline else 0
    c.set_progress_handler(guard, 2000)
    sets, changes = [], 0
    try:
        for s in stmts:
            before = c.total_changes
            try: cur = c.execute(s)
            except sqlite3.OperationalError as e:
                if 'interrupted' in str(e).lower(): raise TooLong()
                raise
            if cur.description:
                try: rs = _rows(cur)
                except sqlite3.OperationalError as e:
                    if 'interrupted' in str(e).lower(): raise TooLong()
                    raise
                rs['_stmt'] = s; sets.append(rs)
            changes += c.total_changes - before
    finally:
        c.set_progress_handler(None, 0)
    return sets, changes

def last_set(sets): return sets[-1] if sets else None

def strip_comments(sql): return re.sub(r'/\*.*?\*/', ' ', re.sub(r'--[^\n]*', ' ', sql), flags=re.S)

def dml_hint(mid, i):
    v = (EXPECTED[mid]['sqlite'].get('verify') or [''])[i]
    if re.search(r'pragma_table_info|pragma_foreign|pragma_index|sqlite_master', v):
        return "La structure obtenue ne correspond pas à la demande : vérifie les noms de colonnes, les contraintes (PRIMARY KEY, NOT NULL, REFERENCES, DEFAULT) et l'orthographe."
    return "L'état de la base après ton code ne correspond pas à l'attendu. Vérifie les valeurs, le WHERE (trop de lignes touchées ? pas assez ?) et que l'instruction s'exécute bien."

def check(mid, sql):
    """Corrige la requête d'un élève. Renvoie {'ok', 'msg', 'error'} (jamais le résultat attendu)."""
    E = EXPECTED.get(mid)
    if not E: return {'ok': False, 'msg': 'Mission inconnue.'}
    sql = str(sql or '')[:20000]
    if not sql.strip(): return {'ok': False, 'msg': "Écris d'abord ta requête."}
    nc = strip_comments(sql)
    for rq in E.get('require') or []:
        if not re.search(rq['re'], sql if '--' in rq['re'] else nc, re.I): return {'ok': False, 'msg': rq['msg']}
    if not SLOTS.acquire(timeout=20): return {'ok': False, 'error': True, 'msg': 'Le serveur est très sollicité, réessaie dans quelques secondes.'}
    try:
        c = fresh()
        try:
            dl = time.time() + DEADLINE_S
            if E['sqlite'].get('setup'): execute(c, E['sqlite']['setup'], time.time() + 30)
            try: sets, _ = execute(c, sql, dl)
            except TooLong: return {'ok': False, 'error': True, 'msg': 'Ta requête a dépassé le temps maximum (quelques secondes). Vérifie tes jointures : une condition manque peut-être.'}
            except TooBig as e: return {'ok': False, 'error': True, 'msg': str(e)}
            except sqlite3.Error as e: return {'ok': False, 'error': True, 'raw': str(e)}
            got = last_set(sets); kind = E['kind']
            if kind == 'plan':
                need = E['sqlite'].get('contains') or ''
                stmt = re.sub(r'^(\s|--[^\n]*\n|/\*.*?\*/)+', '', (got or {}).get('_stmt') or '', flags=re.S).upper()
                if not got or 'detail' not in got['columns'] or not re.match(r'EXPLAIN\s+QUERY\s+PLAN\b', stmt):
                    return {'ok': False, 'msg': "Termine ton code par une instruction <code>EXPLAIN QUERY PLAN SELECT ...</code>."}
                txt = ' | '.join(' '.join(str(v) for v in r) for r in got['values'])
                ok = need in txt
                mi = re.search(r'\b(idx_\w+)', need)
                if ok and mi:
                    ok = bool(c.execute("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?", (mi.group(1),)).fetchone())
                return {'ok': ok, 'msg': None if ok else f"Le plan obtenu ne contient pas <code>{esc(need)}</code>. Vérifie ton index et la requête analysée."}
            if kind == 'dml':
                for i, vq in enumerate(E['sqlite'].get('verify') or []):
                    exp = E['sqlite_verify'][i]
                    try: gs, _ = execute(c, vq, time.time() + 10)
                    except Exception: return {'ok': False, 'msg': dml_hint(mid, i)}
                    g = last_set(gs) or {'columns': exp['columns'], 'values': []}
                    if not compare(exp, g, {})['ok']: return {'ok': False, 'msg': dml_hint(mid, i)}
                return {'ok': True}
            o = dict(E['opts'], emptyIsSelect=bool(re.match(r'^\s*(WITH|SELECT|--)', sql, re.I) or re.search(r'\bSELECT\b', sql, re.I)))
            return compare(E['expected'], got, o)
        finally:
            c.close()
    finally:
        SLOTS.release()

def xp_for(mid, hints, sol):
    base = int(MISSIONS[mid]['xp'])
    return 0 if sol else max(round(base * 0.4), base - 20 * hints)
