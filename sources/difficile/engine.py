"""Exécution et correction des missions en mode difficile, sur les vrais moteurs.

- missions de lecture : compte lecteur, base de référence « minuit » (lecture seule) ;
- missions qui modifient (DML, DDL, plan) : une base de travail w1..wN, réinitialisée ensuite.
"""
import datetime as dt, decimal, json, os, queue, re, threading, time
import parametres as conf, load

HERE = os.path.dirname(os.path.abspath(__file__))
MAX_ROWS = 2000
ENGINE_NAMES = {'pg': 'PostgreSQL', 'maria': 'MariaDB', 'oracle': 'Oracle', 'mssql': 'SQL Server'}

def _json(p):
    try:
        with open(p, encoding='utf-8') as f: return json.load(f)
    except FileNotFoundError: return {}

EXPECTED = _json(os.path.join(HERE, 'expected.json'))
def _dialect(e):
    import glob
    out = {}
    for p in sorted(glob.glob(os.path.join(HERE, 'dialects', e + '*.json'))): out.update(_json(p))
    return out
DIALECTS = {e: _dialect(e) for e in ENGINE_NAMES}
MODEL = None

def model():
    global MODEL
    if MODEL is None:
        MODEL = _json(os.path.join(HERE, 'ddl', 'model.json'))
    return MODEL

def reload_dialects():
    for e in ENGINE_NAMES: DIALECTS[e] = _dialect(e)

# ---------- découpage des instructions ----------
def split_sql(engine, sql):
    """Découpe un script en instructions. Gère apostrophes, guillemets, commentaires, $$ (PG),
    blocs BEGIN ... END (triggers, procédures), le séparateur « / » d'Oracle et « GO » de SQL Server."""
    if engine == 'mssql':
        parts = re.split(r'^\s*GO\s*;?\s*$', sql, flags=re.I | re.M)
        return [p.strip() for p in parts if p.strip() and not re.fullmatch(r'(\s|--[^\n]*)*', p)]
    out, buf, i, n = [], [], 0, len(sql)
    depth = 0; block = False; pend = False
    def flush():
        s = ''.join(buf).strip()
        if s and not re.fullmatch(r'(\s|--[^\n]*|/\*.*?\*/)*', s, re.S): out.append(s)
        buf.clear()
    while i < n:
        ch = sql[i]
        if sql.startswith('--', i):
            j = sql.find('\n', i); j = n if j < 0 else j; buf.append(sql[i:j]); i = j; continue
        if sql.startswith('/*', i):
            j = sql.find('*/', i + 2); j = n if j < 0 else j + 2; buf.append(sql[i:j]); i = j; continue
        if ch in "'\"`":
            j = i + 1
            while j < n:
                if sql[j] == ch:
                    if j + 1 < n and sql[j + 1] == ch: j += 2; continue
                    break
                j += 1
            buf.append(sql[i:j + 1]); i = j + 1; continue
        if engine == 'pg' and ch == '$':
            m = re.match(r'\$[A-Za-z_]*\$', sql[i:])
            if m:
                tag = m.group(0); j = sql.find(tag, i + len(tag)); j = n if j < 0 else j + len(tag)
                buf.append(sql[i:j]); i = j; continue
        if engine == 'oracle' and ch == '/' and ''.join(buf).strip() and re.match(r'^[ \t]*/[ \t]*$', sql[sql.rfind('\n', 0, i) + 1: (sql.find('\n', i) if sql.find('\n', i) >= 0 else n)]):
            s = ''.join(buf).strip()
            buf.clear(); buf.append(s); flush(); depth = 0; block = False; i += 1; continue
        if ch.isalpha():
            m = re.match(r'[A-Za-z_][A-Za-z0-9_$#]*', sql[i:]); w = m.group(0); U = w.upper()
            head = ''.join(buf).strip().upper()
            if engine in ('oracle', 'maria') and not head and U == 'DECLARE' and not block: block = True; depth = 1; pend = True; buf.append(w); i += len(w); continue
            if engine in ('oracle', 'maria') and not head and U == 'BEGIN' and not block:
                if not re.match(r'\s*(TRAN|TRANSACTION|WORK)?\s*(;|$)', sql[i + 5:], re.I): block = True
            if engine in ('oracle', 'maria') and not block and re.match(r'^CREATE\s+(OR\s+REPLACE\s+)?(DEFINER\s*=\s*\S+\s+)?(EDITIONABLE\s+)?(TRIGGER|PROCEDURE|FUNCTION|PACKAGE|TYPE)\b', head + ' ' + U):
                block = True; depth = 1; pend = True
            if block:
                if U == 'BEGIN' and pend: pend = False; buf.append(w); i += len(w); continue
                if U in ('BEGIN', 'CASE', 'LOOP', 'IF') and not re.search(r'\bEND\s*$', head): depth += 1
                if U == 'END':
                    nxt = re.match(r'\s*(IF|LOOP|CASE)\b', sql[i + 3:], re.I)
                    if nxt: buf.append(sql[i:i + 3 + nxt.end()]); i += 3 + nxt.end(); depth -= 1; continue
                    depth -= 1
            buf.append(w); i += len(w); continue
        if ch == ';':
            if block and pend and engine == 'maria': flush(); block = False; depth = 0; pend = False; i += 1; continue
            if block and depth > 0: buf.append(ch); i += 1; continue
            if block and engine == 'oracle':
                buf.append(ch); flush(); block = False; depth = 0; pend = False; i += 1; continue
            flush(); block = False; depth = 0; pend = False; i += 1; continue
        buf.append(ch); i += 1
    flush()
    if engine == 'oracle':
        out = [x for x in (re.sub(r'^(\s*/[ \t]*(\n|$))+', '', re.sub(r'\n\s*/\s*$', '', s)).strip() for s in out) if x and x != '/']
        out = [s[:-1].rstrip() if s.endswith(';') and not re.search(r'\bEND\s*(\w+\s*)?;$', s, re.I) else s for s in out]
    return out

# ---------- normalisation des valeurs ----------
def norm(v):
    if v is None: return None
    if isinstance(v, bool): return int(v)
    if isinstance(v, decimal.Decimal):
        return int(v) if v == v.to_integral_value() and abs(v) < 10 ** 15 else float(v)
    if isinstance(v, dt.datetime):
        return v.strftime('%Y-%m-%d %H:%M:%S') if not v.microsecond else v.strftime('%Y-%m-%d %H:%M:%S.%f').rstrip('0')
    if isinstance(v, dt.date): return v.isoformat()
    if isinstance(v, dt.time): return v.strftime('%H:%M:%S')
    if isinstance(v, dt.timedelta): return v.total_seconds()
    if isinstance(v, (bytes, bytearray, memoryview)): return '[blob]'
    if isinstance(v, (dict, list)): return json.dumps(v, ensure_ascii=False, separators=(',', ':'))
    if hasattr(v, 'read'):
        try: return v.read(1, 4001)
        except Exception: return str(v)
    if type(v).__name__ == 'UUID': return str(v)
    return v

def canon(v):
    if v is None: return '∅'
    if isinstance(v, bool): v = int(v)
    if isinstance(v, (int, float)): return _num(v)
    s = str(v)
    if re.match(r'^-?\d+(\.\d+)?$', s) and len(s) < 16: return _num(float(s))
    if len(s) == 19 and s.endswith(' 00:00:00') and re.match(r'^\d{4}-\d{2}-\d{2} ', s): return s[:10]
    return s

def _num(x):
    r = round(float(x) * 10000) / 10000
    if r == int(r) and abs(r) < 1e15: return str(int(r))
    s = repr(r)
    return s

# ---------- exécution ----------
class Busy(Exception): pass

class Pool:
    """Bases de travail par moteur : prises pour une mission qui modifie, puis réinitialisées."""
    def __init__(self, engine):
        self.engine = engine; self.free = queue.Queue(); self.lock = threading.Lock()
        ws = os.environ.get('HARD_WORKERS')
        for w in (ws.split(',') if ws else [f'w{i}' for i in range(1, conf.ENGINES[engine]['workers'] + 1)]): self.free.put(w.strip())
    def take(self, timeout=None):
        try: return self.free.get(timeout=timeout or (40 if self.engine == 'oracle' else 15))
        except queue.Empty: raise Busy('Toutes les bases de travail sont occupées, réessaie dans quelques secondes.')
    def give(self, w):
        threading.Thread(target=self._reset, args=(w,), daemon=False).start()
    def _reset(self, w):
        k = 0
        while True:
            try: reset_worker(self.engine, w); break
            except Exception as e:
                print('reset', self.engine, w, 'échec', e, flush=True); time.sleep(min(60, 2 ** k)); k += 1
        self.free.put(w)

POOLS = {}
def pool(engine):
    if engine not in POOLS: POOLS[engine] = Pool(engine)
    return POOLS[engine]

def reset_worker(engine, w):
    C = conf.ENGINES[engine]
    if engine == 'pg':
        load.pg_make_worker(w)
        heal_now('pg')
    elif engine == 'maria':
        tables = model(); create, fks, ix = _ddl('maria')
        a = load.admin('maria'); cur = a.cursor()
        cur.execute(f"SELECT id FROM information_schema.processlist WHERE user = 'ouvrier_{w}'")
        for (pid,) in cur.fetchall():
            try: cur.execute(f'KILL {pid}')
            except Exception: pass
        load.maria_clone(cur, w, tables, create, fks, ix)
        cur.execute(f"ALTER USER IF EXISTS 'ouvrier_{w}'@'%' IDENTIFIED BY '{C['worker_password']}'")
        a.close()
    elif engine == 'oracle':
        tables = model(); create, fks, ix = _ddl('oracle')
        a = load.admin('oracle'); cur = a.cursor()
        cur.execute(f"SELECT sid, serial# FROM v$session WHERE username = '{w.upper()}'")
        for sid, ser in cur.fetchall():
            try: cur.execute(f"ALTER SYSTEM KILL SESSION '{sid},{ser}' IMMEDIATE")
            except Exception: pass
        a.close()
        load.oracle_clone(w, tables, create, fks, ix)
    elif engine == 'mssql':
        load.mssql_clone(w)

_DDL = {}
def _ddl(engine):
    if engine not in _DDL:
        txt = open(os.path.join(HERE, 'ddl', engine + '.sql'), encoding='utf-8').read()
        stmts = [s.strip() for s in txt.split(';\n') if s.strip()]
        create = [s for s in stmts if s.upper().startswith('CREATE TABLE')]
        fks = [s for s in stmts if s.upper().startswith('ALTER TABLE')]
        ix = [s for s in stmts if re.match(r'CREATE\s+(UNIQUE\s+)?INDEX', s, re.I)]
        _DDL[engine] = (create, fks, ix)
    return _DDL[engine]

_READERS = {}
def _reader_slots(engine):
    """MariaDB : un compte lecteur par exécution en cours, pour qu'un élève ne voie pas les requêtes des autres (PROCESSLIST)."""
    if engine not in _READERS:
        q = queue.Queue()
        for i in range(1, conf.ENGINES[engine].get('readers', 16) + 1): q.put(i)
        _READERS[engine] = q
    return _READERS[engine]

def connect(engine, who, w=None):
    """who : 'reader' (lecture seule sur minuit) ou 'worker' (base de travail w)."""
    C = conf.ENGINES[engine]
    if engine == 'pg':
        import psycopg
        if who == 'reader':
            return psycopg.connect(host=C['host'], port=C['port'], user='lecteur', password=C['reader_password'], dbname='minuit', autocommit=False, connect_timeout=5)
        return psycopg.connect(host=C['host'], port=C['port'], user=f'ouvrier_{w}', password=C['worker_password'], dbname=w, autocommit=True, connect_timeout=5)
    if engine == 'maria':
        import pymysql
        from pymysql.constants import CLIENT
        if who == 'reader':
            slots = _reader_slots(engine)
            try: i = slots.get(timeout=15)
            except queue.Empty: raise Busy('Le serveur est très sollicité, réessaie dans quelques secondes.')
            try:
                c = pymysql.connect(host=C['host'], port=C['port'], user=f'lecteur_{i}', password=C['reader_password'], database='minuit', charset='utf8mb4', client_flag=CLIENT.MULTI_STATEMENTS, connect_timeout=5, read_timeout=15)
            except Exception:
                slots.put(i); raise
            close0, freed = c.close, []
            def close():
                try: close0()
                finally:
                    if not freed: freed.append(1); slots.put(i)
            c.close = close
        else:
            c = pymysql.connect(host=C['host'], port=C['port'], user=f'ouvrier_{w}', password=C['worker_password'], database=w, charset='utf8mb4', client_flag=CLIENT.MULTI_STATEMENTS, autocommit=True, connect_timeout=5, read_timeout=20)
        try:
            with c.cursor() as cur: cur.execute("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY'")
        except Exception:
            try: c.close()
            except Exception: pass
            raise
        return c
    if engine == 'oracle':
        import oracledb
        dsn = f"{C['host']}:{C['port']}/{C['service']}"
        if who == 'reader':
            c = oracledb.connect(user='lecteur', password=C['reader_password'], dsn=dsn)
            c.cursor().execute('ALTER SESSION SET CURRENT_SCHEMA = MINUIT')
        else:
            c = oracledb.connect(user=w, password=C['worker_password'], dsn=dsn); c.autocommit = False
        c.call_timeout = 6000 if who == 'reader' else 20000  # l'élève reste limité à WORKER_LIMIT par guarded()
        cur = c.cursor()
        cur.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD'")
        cur.execute("ALTER SESSION SET NLS_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH24:MI:SS'")
        cur.execute("ALTER SESSION SET NLS_NUMERIC_CHARACTERS = '.,'")
        return c
    if engine == 'mssql':
        import pytds
        if who == 'reader':
            c = pytds.connect(server=C['host'], port=C['port'], user='lecteur', password=C['reader_password'], database='minuit', autocommit=False, timeout=8, login_timeout=5)
            cur = c.cursor(); cur.execute('SET TEXTSIZE 16000'); cur.close()
            return c
        c = pytds.connect(server=C['host'], port=C['port'], user=f'ouvrier_{w}', password=C['worker_password'], database=w, autocommit=True, timeout=12, login_timeout=5)
        cur = c.cursor(); cur.execute('SET TEXTSIZE 16000'); cur.close()
        return c

MAX_CELL, MAX_BYTES, MAX_STMTS, MAX_COLS = 4000, 3_000_000, 60, 200
class TooBig(Exception): pass
def session_id(engine, conn):
    try:
        if engine == 'pg': return conn.info.backend_pid
        if engine == 'maria': return conn.thread_id()
        cur = conn.cursor()
        if engine == 'mssql': cur.execute('SELECT @@SPID'); return cur.fetchone()[0]
        if engine == 'oracle':
            cur.execute("SELECT SYS_CONTEXT('USERENV','SID') FROM dual"); return int(cur.fetchone()[0])
    except Exception: return None

def hard_kill(engine, sid):
    if sid is None: return
    try:
        a = load.admin(engine); cur = a.cursor()
        if engine == 'pg': cur.execute('SELECT pg_terminate_backend(%s)', (sid,))
        elif engine == 'maria': cur.execute(f'KILL CONNECTION {int(sid)}')
        elif engine == 'mssql': cur.execute(f'KILL {int(sid)}')
        elif engine == 'oracle':
            cur.execute('SELECT serial# FROM v$session WHERE sid = :1', [int(sid)]); r = cur.fetchone()
            if r: cur.execute(f"ALTER SYSTEM KILL SESSION '{int(sid)},{int(r[0])}' IMMEDIATE")
        a.close()
    except Exception as e: print('kill', engine, sid, e, flush=True)

def guarded(engine, conn, sql, limit):
    """Exécute avec un minuteur qui tue la session côté serveur si la limite est dépassée."""
    sid = session_id(engine, conn); fired = []
    t = threading.Timer(limit, lambda: (fired.append(1), hard_kill(engine, sid))); t.daemon = True; t.start()
    try: return execute(engine, conn, sql)
    except Exception as e:
        if fired: raise TimeoutError('timeout') from e
        raise
    finally: t.cancel()

def _rows(cur):
    cols = [str(d[0]) for d in cur.description][:MAX_COLS]
    vals, budget = [], MAX_BYTES
    for r in cur.fetchmany(MAX_ROWS + 1):
        row = []
        for v in list(r)[:MAX_COLS]:
            v = norm(v)
            if isinstance(v, str) and len(v) > MAX_CELL: v = v[:MAX_CELL] + ' [tronqué]'
            budget -= len(str(v)) + 2; row.append(v)
        vals.append(row)
        if budget < 0: raise TooBig('Résultat trop volumineux : affine ta requête (moins de lignes ou de colonnes).')
    return {'columns': cols, 'values': vals[:MAX_ROWS], 'truncated': len(vals) > MAX_ROWS}

def execute(engine, conn, sql):
    """Exécute un script et renvoie (liste des jeux de résultats, nb lignes modifiées)."""
    sets, changes = [], 0
    stmts = split_sql(engine, sql)
    if len(stmts) > MAX_STMTS: raise TooBig(f'Trop d\'instructions dans un seul envoi (maximum {MAX_STMTS}).')
    cur = conn.cursor()
    try:
        for s in stmts:
            if engine == 'oracle':
                cur.execute(s)
                if cur.description: sets[:] = [_rows(cur)]; sets[0]['_stmt'] = s
                elif cur.rowcount and cur.rowcount > 0: changes += cur.rowcount
                continue
            cur.execute(s)
            while True:
                if cur.description: sets[:] = [_rows(cur)]; sets[0]['_stmt'] = s
                elif cur.rowcount and cur.rowcount > 0: changes += cur.rowcount
                if engine == 'pg':
                    if not cur.nextset(): break
                elif engine == 'maria':
                    if not cur.nextset(): break
                else:
                    try:
                        if not cur.nextset(): break
                    except Exception: break
    finally:
        try: cur.close()
        except Exception: pass
    return sets, changes

def last_set(sets):
    return sets[-1] if sets else None

def friendly_error(engine, e):
    if isinstance(e, TooBig): return str(e)
    if isinstance(e, TimeoutError): return "Ta requête a dépassé le temps maximum (quelques secondes). Vérifie tes jointures : une condition manque peut-être."
    if isinstance(e, ConnectionError) or type(e).__name__ in ('OperationalError', 'InterfaceError') and re.search(r'connect|authentication|password|Login failed|closed', str(e), re.I):
        return "Le moteur ne répond pas pour le moment. Réessaie dans quelques secondes."
    msg = str(e).strip().split('\n')[0][:400]
    low = msg.lower()
    if any(k in low for k in ('statement timeout', 'canceling statement', 'max_statement_time', 'dpi-1067', 'call timeout', 'timeout', 'query execution was interrupted')):
        return "Ta requête a dépassé le temps maximum (quelques secondes). Vérifie tes jointures : une condition manque peut-être."
    if any(k in low for k in ('permission denied', 'access denied', 'insufficient privileges', 'ora-01031', 'denied')):
        return "Cette opération n'est pas autorisée pour cette mission (lecture seule ou droit manquant). " + msg
    return msg

def run_student(engine, mission_id, sql, reveal_rows=True):
    """Exécute la requête de l'étudiant et la corrige. Renvoie un dict prêt pour l'API."""
    E = EXPECTED.get(mission_id)
    D = DIALECTS.get(engine, {}).get(mission_id)
    if not E: return {'ok': False, 'error': True, 'msg': 'Mission inconnue.'}
    if not D or D.get('skip'):
        return {'ok': False, 'error': True, 'msg': (D or {}).get('skip') or f"Cette mission n'est pas encore disponible sur {ENGINE_NAMES[engine]}."}
    if len(sql) > 20000: return {'ok': False, 'error': True, 'msg': 'Requête trop longue.'}
    no_comments = strip_comments(sql)
    bad = forbidden_setting(engine, no_comments)
    if bad: return {'ok': False, 'error': True, 'msg': f"Le réglage <code>{esc(bad)}</code> est réservé au serveur dans ce jeu."}
    for rq in (D['require'] if 'require' in D else E.get('require') or []):
        if not re.search(rq['re'], sql if '--' in rq['re'] else no_comments, re.I):
            return {'ok': False, 'msg': rq['msg']}
    kind = E['kind']
    t0 = time.time()
    exp = expected_for(engine, mission_id) if kind != 'plan' else None
    if kind == 'select' and not D.get('worker'):
        conn = connect_safe(engine, 'reader')
        try:
            try: sets, ch = guarded(engine, conn, sql, READER_LIMIT)
            except Exception as e: return {'ok': False, 'error': True, 'msg': friendly_error(engine, e), 'ms': _ms(t0)}
            finally:
                try: conn.rollback()
                except Exception: pass
        finally:
            try: conn.close()
            except Exception: pass
        got = last_set(sets)
        v = compare(exp, got, dict(E['opts'], emptyIsSelect=bool(re.search(r'\bSELECT\b', sql, re.I))))
        return dict(v, result=got if reveal_rows else None, ms=_ms(t0), changes=ch)
    # mission qui modifie, ou lecture dans une base de travail (setup)
    P = pool(engine); w = P.take()
    quick = []  # Oracle : script fait seulement de lignes (sans DDL ni COMMIT) => un ROLLBACK suffit à remettre la base à zéro
    try:
        conn = connect_safe(engine, 'worker', w)
        try:
            if D.get('setup'): execute(engine, conn, D['setup'])
            try: sets, ch = guarded(engine, conn, sql, WORKER_LIMIT)
            except Exception as e: return {'ok': False, 'error': True, 'msg': friendly_error(engine, e), 'ms': _ms(t0)}
            if engine == 'oracle' and not D.get('setup') and kind != 'plan' and rollback_only(engine, sql): quick.append(conn)
            got = last_set(sets)
            if kind == 'plan':
                stmt = (got or {}).get('_stmt') or ''
                if not is_plan_stmt(engine, stmt, sql):
                    return {'ok': False, 'msg': "Termine par l'instruction qui affiche le plan d'exécution du moteur (EXPLAIN, EXPLAIN PLAN puis DBMS_XPLAN, ou SHOWPLAN).", 'result': got, 'ms': _ms(t0)}
                txt = plan_text(engine, got)
                need = D.get('contains') or E['sqlite']['contains']
                ok = bool(got) and need.lower() in txt.lower() and index_ok(engine, w, need)
                return {'ok': ok, 'msg': None if ok else f"Le plan obtenu ne mentionne pas <code>{esc(need)}</code>. Vérifie ton index et termine par l'instruction qui affiche le plan.", 'result': got, 'ms': _ms(t0)}
            if kind == 'select':
                v = compare(exp, got, dict(E['opts'], emptyIsSelect=True))
                return dict(v, result=got, ms=_ms(t0), changes=ch)
            # dml : on compare l'état de la base après coup
            for i, vq in enumerate(D.get('verify') or []):
                try: gs, _ = guarded(engine, conn, vq, VERIFY_LIMIT); g = last_set(gs) or {'columns': exp[i]['columns'], 'values': []}
                except Exception: return {'ok': False, 'msg': dml_hint(D, i), 'result': got, 'ms': _ms(t0), 'changes': ch}
                c = compare(exp[i], g, {})
                if not c['ok']: return {'ok': False, 'msg': dml_hint(D, i), 'result': got, 'ms': _ms(t0), 'changes': ch}
            return {'ok': True, 'result': got, 'ms': _ms(t0), 'changes': ch}
        finally:
            if quick:
                try: quick_reset(engine, conn, sql)
                except Exception as e:
                    print('remise à zéro rapide', engine, w, 'échec', e, flush=True); quick.clear()
            try: conn.close()
            except Exception: pass
    finally:
        if quick: P.free.put(w)
        else: P.give(w)

_ROW_ONLY = re.compile(r'(SELECT|WITH|INSERT|UPDATE|DELETE|MERGE|SAVEPOINT|ROLLBACK)\b', re.I)
def rollback_only(engine, sql):
    """Vrai si chaque instruction ne touche qu'aux lignes (pas de DDL, de COMMIT, de PL/SQL) : annulable par ROLLBACK."""
    txt = re.sub(r"'(?:[^']|'')*'", "''", strip_comments(sql))
    if re.search(r'\b(COMMIT|BEGIN|DECLARE|EXEC|EXECUTE|CALL|AUTONOMOUS_TRANSACTION|LOCK)\b', txt, re.I): return False
    stmts = [x.strip() for x in split_sql(engine, sql) if x.strip()]
    return bool(stmts) and len(stmts) <= MAX_STMTS and all(_ROW_ONLY.match(strip_comments(x).strip()) for x in stmts)

def quick_reset(engine, conn, sql):
    """Annule le travail de l'élève, puis recale les identifiants auto-incrémentés des tables où il a inséré."""
    conn.rollback()
    if not re.search(r'\b(INSERT|MERGE)\b', sql, re.I): return
    words = set(w.lower() for w in re.findall(r'[A-Za-z_][A-Za-z0-9_]*', sql))
    tabs = [t for t in model() if t['name'].lower() in words and any(c['ident'] for c in t['cols'])]
    if tabs:
        cur = conn.cursor(); load.fix_identity(engine, cur, tabs); cur.close()

READER_LIMIT, WORKER_LIMIT, VERIFY_LIMIT = 7, 11, 20
_FORBID = {
    'pg': r'work_mem|hash_mem_multiplier|maintenance_work_mem|temp_buffers|statement_timeout|lock_timeout|idle_\w+timeout|max_parallel\w*|temp_file_limit|session_authorization|\brole\b|jit\w*|effective_cache_size|transaction_timeout',
    'maria': r'max_statement_time|\w*buffer_size|tmp_table_size|max_heap_table_size|max_allowed_packet|net_\w+|max_session_mem_used|max_join_size|sql_big_selects|wait_timeout|interactive_timeout|lock_wait_timeout|innodb_\w+|max_execution_time',
    'mssql': r'textsize|query_governor_cost_limit|lock_timeout|deadlock_priority',
    'oracle': r'_area_size|workarea_size_policy|resource_\w+|ddl_lock_timeout|events\b',
}
def strip_comments(sql): return re.sub(r'/\*.*?\*/', ' ', re.sub(r'--[^\n]*', ' ', sql), flags=re.S)
def forbidden_setting(engine, sql):
    pat = _FORBID.get(engine)
    if not pat: return None
    for m in re.finditer(r"(?:^|;|\bGO\b|\bBEGIN\b|\bTHEN\b|\bELSE\b)\s*(SET|RESET|ALTER\s+SESSION|EXECUTE\s+IMMEDIATE)\b(.{0,120})", sql, re.I | re.S):
        mm = re.search(pat, m.group(2), re.I)
        if mm: return mm.group(0)
    if engine == 'pg':
        mm = re.search(r"set_config\s*\(\s*'([^']+)'", sql, re.I)
        if mm and re.search(pat, mm.group(1), re.I): return mm.group(1)
    return None
def is_plan_stmt(engine, stmt, script):
    """Le dernier résultat doit venir d'une vraie instruction de plan (pas d'un SELECT de texte)."""
    s = re.sub(r'^(\s|--[^\n]*\n|/\*.*?\*/)+', '', stmt or '', flags=re.S).upper()
    if engine in ('pg', 'maria'): return s.startswith('EXPLAIN')
    if engine == 'oracle': return bool(re.match(r'SELECT\s+(\*|PLAN_TABLE_OUTPUT)\s+FROM\s+TABLE\s*\(\s*DBMS_XPLAN\.DISPLAY\b', s))
    if engine == 'mssql':
        batches = split_sql('mssql', script); on = False
        for b in batches:
            u = re.sub(r'(\s|--[^\n]*\n)+', ' ', b).strip().upper().rstrip(';').strip()
            if re.fullmatch(r'SET SHOWPLAN_(TEXT|ALL) ON', u): on = True
            elif re.fullmatch(r'SET SHOWPLAN_(TEXT|ALL) OFF', u): on = False
            if b.strip() == (stmt or '').strip(): return on
        return False
    return False

def index_ok(engine, w, need):
    """Si le texte attendu est un nom d'index, cet index doit exister vraiment dans la base de travail."""
    m = re.search(r'\b(idx_\w+)', need, re.I)
    if not m: return True
    n = m.group(1)
    q = {'pg': "SELECT 1 FROM pg_indexes WHERE indexname = %s",
         'maria': "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND index_name = %s",
         'oracle': "SELECT 1 FROM user_indexes WHERE index_name = UPPER(:1)",
         'mssql': "SELECT 1 FROM sys.indexes WHERE name = %s"}[engine]
    try:
        conn = connect(engine, 'worker', w)
        try:
            cur = conn.cursor(); cur.execute(q, [n.lower()] if engine != 'oracle' else [n]); r = cur.fetchone(); cur.close()
            return bool(r)
        finally: conn.close()
    except Exception as e:
        print('index_ok', engine, e, flush=True); return False

def plan_text(engine, got):
    """Texte du plan, sans les littéraux de la requête (qu'on pourrait y glisser pour tricher)."""
    lines = []
    for r in (got or {}).get('values', []):
        t = ' '.join(str(x) for x in r if x is not None)
        if engine == 'mssql' and '|--' not in t: continue
        t = re.sub(r"N?'(?:[^']|'')*'", "''", t)
        if engine == 'pg': t = re.sub(r'"(?:[^"]|"")*"', '""', t)
        t = re.sub(r'\\"(?:[^"\\]|\\.)*?\\"', '', t) if engine == 'maria' else t
        lines.append(t)
    return ' | '.join(lines)

_HEAL = {}
def heal_now(engine):
    t = _HEAL.get(engine, 0)
    if time.time() - t < 5: return
    _HEAL[engine] = time.time()
    try: load.heal(engine)
    except Exception as e: print('heal', engine, e, flush=True)

def connect_safe(engine, who, w=None):
    try: return connect(engine, who, w)
    except Busy: raise
    except Exception as e:
        heal_now(engine)
        try: return connect(engine, who, w)
        except Exception:
            if who == 'worker':
                reset_worker(engine, w); return connect(engine, who, w)
            raise ConnectionError('moteur')

def dml_hint(D, i):
    v = (D.get('verify') or [''])[i]
    if re.search(r'information_schema|all_tab|user_tab|user_cons|sys\.|pg_catalog|pg_index|user_ind|all_ind|user_triggers', v, re.I):
        return "La structure obtenue ne correspond pas à la demande : vérifie les noms de colonnes, les types, les contraintes (PRIMARY KEY, NOT NULL, REFERENCES, DEFAULT) et l'orthographe."
    return "L'état de la base après ton code ne correspond pas à l'attendu. Vérifie les valeurs, le WHERE (trop de lignes touchées ? pas assez ?) et que l'instruction s'exécute bien."

_EXP_CACHE = {}
def expected_for(engine, mid):
    """Lecture : résultat SQLite de référence (sauf si le dialecte impose le sien).
    DML : état obtenu en exécutant la solution du dialecte puis ses requêtes de vérification."""
    key = (engine, mid)
    if key in _EXP_CACHE: return _EXP_CACHE[key]
    E = EXPECTED[mid]; D = DIALECTS[engine][mid]
    if E['kind'] == 'select' and not D.get('expected_from_solution'):
        out = E['expected']
    else:
        P = pool(engine); w = P.take(60); quick = False
        try:
            try: conn = connect(engine, 'worker', w)
            except Exception:
                reset_worker(engine, w); conn = connect(engine, 'worker', w)
            try:
                if D.get('setup'): execute(engine, conn, D['setup'])
                sets, _ = execute(engine, conn, D['solution'])
                if E['kind'] == 'select': out = last_set(sets)
                else:
                    out = []
                    for vq in D.get('verify') or []:
                        gs, _ = execute(engine, conn, vq); out.append(last_set(gs) or {'columns': ['x'], 'values': []})
                if engine == 'oracle' and not D.get('setup') and rollback_only(engine, D['solution']):
                    try: quick_reset(engine, conn, D['solution']); quick = True
                    except Exception: quick = False
            finally: conn.close()
        finally:
            if quick: P.free.put(w)
            else: P.give(w)
    _EXP_CACHE[key] = out
    return out

def warm(engine):
    """Au démarrage : calcule d'avance le résultat attendu des missions qui modifient la base."""
    for mid, E in EXPECTED.items():
        D = DIALECTS.get(engine, {}).get(mid)
        if not D or D.get('skip') or E['kind'] == 'plan': continue
        if E['kind'] == 'select' and not D.get('expected_from_solution'): continue
        try: expected_for(engine, mid)
        except Exception as e: print('préchauffage', engine, mid, e, flush=True)

def _ms(t0): return round((time.time() - t0) * 1000)

# ---------- comparaison (portage de compareSets du jeu) ----------
def esc(s): return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def compare(exp, got, opt):
    if not got:
        return {'ok': False, 'msg': "Ta requête s'exécute mais ne renvoie <b>aucune ligne</b>. Attention : selon le moteur, les textes peuvent être sensibles à la casse." if opt.get('emptyIsSelect') else "Ta requête ne renvoie aucun résultat : termine par un SELECT."}
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
                return {'ok': False, 'msg': f"Les valeurs sont bonnes. Renomme la colonne <code>{esc(got['columns'][mp[i]])}</code> en <code>{esc(exp['columns'][i])}</code> (avec AS)."}
    P = [[r[j] for j in mp] for r in G]
    key = lambda r: '\u0001'.join(r)
    if sorted(map(key, E)) != sorted(map(key, P)):
        return {'ok': False, 'msg': "Le bon nombre de lignes et de colonnes, mais certaines lignes ne correspondent pas. Vérifie chaque condition."}
    if opt.get('ordered'):
        ks = opt.get('orderKeys') or list(range(k))
        for i in range(len(E)):
            if [E[i][c] for c in ks] != [P[i][c] for c in ks]:
                return {'ok': False, 'msg': "Les bonnes lignes, mais <b>pas dans le bon ordre</b>. Vérifie ton ORDER BY (ASC, DESC, critères secondaires)."}
    return {'ok': True}
