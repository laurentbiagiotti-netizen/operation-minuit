"""Charge la base d'Opération Minuit (SQLite) dans PostgreSQL, MariaDB, Oracle et SQL Server.

Crée sur chaque moteur :
- une base de référence « minuit » (lecture seule pour le compte lecteur) ;
- N bases de travail w1..wN, copies de la référence, réinitialisées après chaque mission qui modifie les données.
Le script de structure (DDL) de chaque moteur est aussi écrit dans ddl/<moteur>.sql.
Usage : python3 load.py [pg|maria|oracle|mssql ...]
"""
import json, os, re, sqlite3, sys, time
import parametres as conf

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.environ.get('MINUIT_SQL_DIR', os.path.join(HERE, 'data'))
DATETIME = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$')
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')

def sqlite_db():
    c = sqlite3.connect(':memory:')
    for f in ['schema', 'data', 'data2', 'data3', 'data4', 'data5']:
        c.executescript(open(os.path.join(SRC, f + '.sql'), encoding='utf-8').read())
    return c

def model(c):
    """Lit le schéma SQLite et infère les types réels de chaque colonne."""
    tables = []
    for (t, sql) in c.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid"):
        cols = []
        info = c.execute(f'PRAGMA table_info("{t}")').fetchall()
        pks = [r[1] for r in sorted(info, key=lambda r: r[5]) if r[5] > 0]
        for cid, name, typ, notnull, dflt, pk in info:
            typ = (typ or '').upper()
            vals = [r[0] for r in c.execute(f'SELECT "{name}" FROM "{t}" WHERE "{name}" IS NOT NULL')]
            kind = 'text'
            if 'INT' in typ: kind = 'int'
            elif typ in ('REAL', 'FLOAT', 'DOUBLE', 'NUMERIC') or 'REAL' in typ: kind = 'real'
            else:
                sv = [v for v in vals if isinstance(v, str)]
                if vals and len(sv) == len(vals):
                    if all(DATETIME.match(v) for v in sv): kind = 'datetime'
                    elif all(DATE.match(v) for v in sv): kind = 'date'
                    elif all(v[:1] in '[{' for v in sv):
                        try:
                            for v in sv: json.loads(v)
                            kind = 'json'
                        except Exception: pass
                elif vals and all(isinstance(v, int) for v in vals): kind = 'int'
                elif vals and all(isinstance(v, (int, float)) for v in vals): kind = 'real'
            maxlen = max([len(str(v)) for v in vals] + [1])
            ident = (pk == 1 and len(pks) == 1 and 'INT' in typ)
            cols.append(dict(name=name, kind=kind, notnull=bool(notnull) or (pk > 0), dflt=dflt, maxlen=maxlen, ident=ident))
        uniques = []
        for idx in c.execute(f'PRAGMA index_list("{t}")').fetchall():
            if idx[2] and idx[3] == 'u':
                uniques.append([r[2] for r in c.execute(f'PRAGMA index_info("{idx[1]}")')])
        fks = {}
        for r in c.execute(f'PRAGMA foreign_key_list("{t}")').fetchall():
            fks.setdefault(r[0], dict(table=r[2], frm=[], to=[]))
            fks[r[0]]['frm'].append(r[3]); fks[r[0]]['to'].append(r[4])
        tables.append(dict(name=t, cols=cols, pk=pks, uniques=uniques, fks=list(fks.values())))
    idx = [(n, t, s) for (n, t, s) in c.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL")]
    views = [(n, s) for (n, s) in c.execute("SELECT name, sql FROM sqlite_master WHERE type='view'")]
    # référence des FK sans colonne cible : la clé primaire de la table cible
    pkmap = {t['name']: t['pk'] for t in tables}
    for t in tables:
        for f in t['fks']:
            if not f['to'] or f['to'][0] is None: f['to'] = pkmap.get(f['table']) or ['id']
    return tables, idx, views

# ---------- dialectes ----------
ORA_RESERVED = {'date', 'session', 'level', 'user', 'comment', 'size', 'mode', 'uid', 'number', 'file', 'access', 'rowid', 'rownum', 'start', 'resource', 'share'}

def q(engine, name):
    if engine == 'oracle':
        return f'"{name.upper()}"' if name.lower() in ORA_RESERVED else name
    if engine == 'mssql':
        return f'[{name}]' if name.lower() in ('user', 'file', 'key', 'plan', 'percent', 'top') else name
    if engine == 'maria':
        return f'`{name}`' if name.lower() in ('key', 'range', 'rank', 'groups', 'row', 'rows', 'window', 'over', 'lead', 'lag') else name
    return f'"{name}"' if name.lower() in ('user', 'order', 'group', 'table', 'window') else name

def coltype(engine, col):
    k, n = col['kind'], col['maxlen']
    if engine == 'pg':
        return {'int': 'BIGINT', 'real': 'DOUBLE PRECISION', 'datetime': 'TIMESTAMP(0)', 'date': 'DATE', 'json': 'JSONB'}.get(k, 'TEXT')
    if engine == 'maria':
        if k == 'text': return 'VARCHAR(%d)' % max(32, n * 2) if n <= 1000 else 'TEXT'
        return {'int': 'BIGINT', 'real': 'DOUBLE', 'datetime': 'DATETIME', 'date': 'DATE', 'json': 'JSON'}[k]
    if engine == 'oracle':
        if k == 'text': return 'VARCHAR2(%d CHAR)' % max(32, n * 2) if n <= 1900 else 'CLOB'
        if k == 'json': return 'JSON'
        return {'int': 'NUMBER(19)', 'real': 'NUMBER', 'datetime': 'TIMESTAMP(0)', 'date': 'DATE'}[k]
    if engine == 'mssql':
        if k in ('text', 'json'): return 'NVARCHAR(%d)' % max(32, n * 2) if n <= 1800 and k == 'text' else 'NVARCHAR(MAX)'
        return {'int': 'BIGINT', 'real': 'FLOAT', 'datetime': 'DATETIME2(0)', 'date': 'DATE'}[k]

def default(engine, col):
    d = col['dflt']
    if d is None: return ''
    u = d.upper()
    if u in ('CURRENT_TIMESTAMP', "DATETIME('NOW')", "(DATETIME('NOW'))"):
        return ' DEFAULT CURRENT_TIMESTAMP'
    if u == 'CURRENT_DATE': return ' DEFAULT CURRENT_DATE' if engine != 'mssql' else ' DEFAULT CAST(GETDATE() AS DATE)'
    if re.match(r"^-?\d+(\.\d+)?$", d) or re.match(r"^'.*'$", d): return ' DEFAULT ' + d
    return ''

def ddl(engine, tables, indexes):
    out = []
    for t in tables:
        lines = []
        for c in t['cols']:
            s = f"  {q(engine, c['name'])} {coltype(engine, c)}"
            if c['ident']:
                s = {'pg': f"  {q(engine, c['name'])} BIGINT GENERATED BY DEFAULT AS IDENTITY",
                     'maria': f"  {q(engine, c['name'])} BIGINT AUTO_INCREMENT",
                     'oracle': f"  {q(engine, c['name'])} NUMBER(19) GENERATED BY DEFAULT ON NULL AS IDENTITY",
                     'mssql': f"  {q(engine, c['name'])} BIGINT IDENTITY(1,1)"}[engine]
            else:
                s += default(engine, c)
            if c['notnull']: s += ' NOT NULL'
            if engine == 'maria' and c['kind'] == 'text' and coltype(engine, c).startswith('VARCHAR'):
                s = s.replace(coltype(engine, c), coltype(engine, c) + ' COLLATE utf8mb4_bin', 1)
            lines.append(s)
        if t['pk']: lines.append('  PRIMARY KEY (' + ', '.join(q(engine, x) for x in t['pk']) + ')')
        for u in t['uniques']:
            if u != t['pk']: lines.append('  UNIQUE (' + ', '.join(q(engine, x) for x in u) + ')')
        tail = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin' if engine == 'maria' else ''
        out.append(f"CREATE TABLE {q(engine, t['name'])} (\n" + ',\n'.join(lines) + f"\n){tail}")
    fk = []
    for t in tables:
        for i, f in enumerate(t['fks']):
            fk.append(f"ALTER TABLE {q(engine, t['name'])} ADD CONSTRAINT fk_{t['name'][:20]}_{i} FOREIGN KEY ("
                      + ', '.join(q(engine, x) for x in f['frm']) + f") REFERENCES {q(engine, f['table'])} ("
                      + ', '.join(q(engine, x) for x in f['to']) + ')')
    ix = []
    for (n, t, s) in indexes:
        m = re.match(r'CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF NOT EXISTS\s+)?"?(\w+)"?\s+ON\s+"?(\w+)"?\s*\((.*)\)\s*$', s.strip(), re.I | re.S)
        if not m: continue
        cols = ', '.join(q(engine, x.strip().strip('"')) for x in m.group(4).split(','))
        ix.append(f"CREATE {m.group(1) or ''}INDEX {m.group(2)} ON {q(engine, m.group(3))} ({cols})")
    return out, fk, ix

def conv(engine, col, v):
    if v is None: return None
    k = col['kind']
    if k == 'datetime':
        import datetime as dt
        return dt.datetime.strptime(v if len(v) == 19 else v + ':00', '%Y-%m-%d %H:%M:%S')
    if k == 'date':
        import datetime as dt
        return dt.date.fromisoformat(v)
    if k == 'int' and isinstance(v, str): return int(v)
    if k == 'real' and isinstance(v, str): return float(v)
    if engine == 'oracle' and k == 'text' and v == '': return None
    return v

# ---------- connexions administrateur ----------
def admin(engine, db=None):
    C = conf.ENGINES[engine]
    if engine == 'pg':
        import psycopg
        return psycopg.connect(host=C['host'], port=C['port'], user=C['admin_user'], password=C['admin_password'], dbname=db or 'postgres', autocommit=True)
    if engine == 'maria':
        import pymysql
        return pymysql.connect(host=C['host'], port=C['port'], user=C['admin_user'], password=C['admin_password'], database=db, autocommit=True, charset='utf8mb4')
    if engine == 'oracle':
        import oracledb
        return oracledb.connect(user=C['admin_user'], password=C['admin_password'], dsn=f"{C['host']}:{C['port']}/{C['service']}")
    if engine == 'mssql':
        import pytds
        return pytds.connect(server=C['host'], port=C['port'], user=C['admin_user'], password=C['admin_password'], database=db or 'master', autocommit=True)

def run_all(cur, stmts):
    for s in stmts: cur.execute(s)

def insert_data(engine, cur, tables, src, schema=None):
    for t in tables:
        names = [c['name'] for c in t['cols']]
        rows = src.execute('SELECT ' + ', '.join(f'"{n}"' for n in names) + f' FROM "{t["name"]}"').fetchall()
        if not rows: continue
        data = [tuple(conv(engine, c, v) for c, v in zip(t['cols'], r)) for r in rows]
        tn = q(engine, t['name']); cn = ', '.join(q(engine, n) for n in names)
        if engine == 'pg':
            ph = ', '.join(['%s'] * len(names))
            jcols = [i for i, c in enumerate(t['cols']) if c['kind'] == 'json']
            if jcols:
                from psycopg.types.json import Jsonb
                data = [tuple(Jsonb(json.loads(v)) if i in jcols and v is not None else v for i, v in enumerate(r)) for r in data]
            with cur.copy(f'COPY {tn} ({cn}) FROM STDIN') as cp:
                for r in data: cp.write_row(r)
        elif engine == 'maria':
            ph = ', '.join(['%s'] * len(names))
            for i in range(0, len(data), 2000): cur.executemany(f'INSERT INTO {tn} ({cn}) VALUES ({ph})', data[i:i + 2000])
        elif engine == 'oracle':
            ph = ', '.join(f':{i + 1}' for i in range(len(names)))
            sizes = []
            for c in t['cols']:
                if c['kind'] == 'json': sizes.append(None)
                else: sizes.append(None)
            for i in range(0, len(data), 2000): cur.executemany(f'INSERT INTO {tn} ({cn}) VALUES ({ph})', data[i:i + 2000])
        elif engine == 'mssql':
            ph = ', '.join(['%s'] * len(names))
            ident = any(c['ident'] for c in t['cols'])
            if ident: cur.execute(f'SET IDENTITY_INSERT {tn} ON')
            for i in range(0, len(data), 500): cur.executemany(f'INSERT INTO {tn} ({cn}) VALUES ({ph})', data[i:i + 500])
            if ident: cur.execute(f'SET IDENTITY_INSERT {tn} OFF')

def fix_identity(engine, cur, tables):
    for t in tables:
        for c in t['cols']:
            if not c['ident']: continue
            tn, cn = q(engine, t['name']), q(engine, c['name'])
            if engine == 'pg':
                cur.execute(f"SELECT setval(pg_get_serial_sequence('{t['name']}', '{c['name']}'), COALESCE((SELECT MAX({cn}) FROM {tn}), 0) + 1, false)")
            elif engine == 'oracle':
                cur.execute(f"ALTER TABLE {tn} MODIFY {cn} GENERATED BY DEFAULT ON NULL AS IDENTITY (START WITH LIMIT VALUE)")
            # MariaDB et SQL Server recalent l'auto-incrément tout seuls

def views_sql(engine, views):
    out = []
    for n, s in views:
        out.append(s)  # vues SQLite simples ; adaptées par moteur si besoin dans ddl/
    return out

# ---------- chargement par moteur ----------
def load(engine):
    t0 = time.time()
    src = sqlite_db(); tables, idx, views = model(src)
    create, fks, ix = ddl(engine, tables, idx)
    try:
        os.makedirs(os.path.join(HERE, 'ddl'), exist_ok=True)
        with open(os.path.join(HERE, 'ddl', engine + '.sql'), 'w', encoding='utf-8') as f:
            f.write(';\n\n'.join(create + fks + ix) + ';\n')
        with open(os.path.join(HERE, 'ddl', 'model.json'), 'w', encoding='utf-8') as f:
            json.dump(tables, f, ensure_ascii=False)
    except OSError:
        pass
    C = conf.ENGINES[engine]; N = C['workers']
    dbs = ['minuit'] + [f'w{i}' for i in range(1, N + 1)]
    if engine == 'pg':
        a = admin('pg'); cur = a.cursor()
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = 'tpl_owner'")
        if not cur.fetchone(): cur.execute("CREATE ROLE tpl_owner NOLOGIN")
        for r in ['lecteur'] + [f'ouvrier_{d}' for d in dbs[1:]]:
            cur.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (r,))
            if not cur.fetchone(): cur.execute(f"CREATE ROLE {r} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS")
        for d in dbs + ['minuit_tpl']:
            cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{d}'")
            if cur.fetchone():
                cur.execute(f"ALTER DATABASE {d} IS_TEMPLATE false")
                cur.execute(f'DROP DATABASE IF EXISTS {d} WITH (FORCE)')
        cur.execute("CREATE DATABASE minuit ENCODING 'UTF8' TEMPLATE template0")
        a.close()
        m = admin('pg', 'minuit'); mc = m.cursor()
        mc.execute('REVOKE ALL ON SCHEMA public FROM PUBLIC')
        mc.execute('ALTER SCHEMA public OWNER TO tpl_owner')
        mc.execute('SET ROLE tpl_owner')
        run_all(mc, create); insert_data('pg', mc, tables, src); run_all(mc, fks + ix); fix_identity('pg', mc, tables)
        mc.execute('RESET ROLE')
        mc.execute('VACUUM (ANALYZE)')
        for fn in ['lo_create(oid)', 'lo_creat(integer)', 'lo_from_bytea(oid, bytea)', 'lo_import(text)', 'lo_import(text, oid)', 'lo_put(oid, bigint, bytea)', 'lo_export(oid, text)']:
            try: mc.execute(f'REVOKE EXECUTE ON FUNCTION {fn} FROM PUBLIC')
            except Exception: pass
        for v in ('pg_stat_activity', 'pg_stat_get_activity(integer)'):
            try: mc.execute(f'REVOKE ALL ON {"FUNCTION " if "(" in v else ""}{v} FROM PUBLIC')
            except Exception: pass
        m.close()
        a = admin('pg'); cur = a.cursor()
        cur.execute("CREATE DATABASE minuit_tpl TEMPLATE minuit")
        cur.execute("ALTER DATABASE minuit_tpl IS_TEMPLATE true ALLOW_CONNECTIONS false")
        cur.execute('REVOKE ALL ON DATABASE minuit FROM PUBLIC'); cur.execute('GRANT CONNECT ON DATABASE minuit TO lecteur')
        a.close()
        m = admin('pg', 'minuit'); mc = m.cursor()
        mc.execute('GRANT USAGE ON SCHEMA public TO lecteur'); mc.execute('GRANT SELECT ON ALL TABLES IN SCHEMA public TO lecteur')
        m.close()
        for d in dbs[1:]: pg_make_worker(d)
        pg_heal()
    elif engine == 'maria':
        a = admin('maria'); cur = a.cursor()
        for d in dbs: cur.execute(f'DROP DATABASE IF EXISTS {d}')
        cur.execute('CREATE DATABASE minuit CHARACTER SET utf8mb4 COLLATE utf8mb4_bin')
        cur.execute('USE minuit')
        cur.execute("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'")
        run_all(cur, create); cur.execute('SET FOREIGN_KEY_CHECKS = 0'); insert_data('maria', cur, tables, src); cur.execute('SET FOREIGN_KEY_CHECKS = 1')
        run_all(cur, fks + ix)
        cur.execute(f"CREATE USER IF NOT EXISTS 'lecteur'@'%' IDENTIFIED BY '{C['reader_password']}'")
        cur.execute("GRANT SELECT, SHOW VIEW ON minuit.* TO 'lecteur'@'%'")
        cur.execute("ALTER USER 'lecteur'@'%' WITH MAX_STATEMENT_TIME 6 MAX_USER_CONNECTIONS 30")
        for i in range(1, C.get('readers', 16) + 1):
            cur.execute(f"CREATE USER IF NOT EXISTS 'lecteur_{i}'@'%' IDENTIFIED BY '{C['reader_password']}'")
            cur.execute(f"GRANT SELECT, SHOW VIEW ON minuit.* TO 'lecteur_{i}'@'%'")
            cur.execute(f"ALTER USER 'lecteur_{i}'@'%' WITH MAX_STATEMENT_TIME 6 MAX_USER_CONNECTIONS 2")
        for d in dbs[1:]:
            cur.execute(f'CREATE DATABASE {d} CHARACTER SET utf8mb4 COLLATE utf8mb4_bin')
            cur.execute(f"CREATE USER IF NOT EXISTS 'ouvrier_{d}'@'%' IDENTIFIED BY '{C['worker_password']}'")
            cur.execute(f"GRANT ALL PRIVILEGES ON {d}.* TO 'ouvrier_{d}'@'%'")
            cur.execute(f"ALTER USER 'ouvrier_{d}'@'%' WITH MAX_STATEMENT_TIME 8 MAX_USER_CONNECTIONS 3")
            maria_clone(cur, d, tables, create, fks, ix)
        a.close()
    elif engine == 'oracle':
        a = admin('oracle'); cur = a.cursor()
        for u in ['MINUIT', 'LECTEUR'] + [f'W{i}' for i in range(1, N + 1)]:
            try: cur.execute(f'DROP USER {u} CASCADE')
            except Exception: pass
        cur.execute(f'CREATE USER minuit IDENTIFIED BY "{C["worker_password"]}" QUOTA UNLIMITED ON users')
        cur.execute('GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE TRIGGER, CREATE PROCEDURE TO minuit')
        cur.execute(f'CREATE USER lecteur IDENTIFIED BY "{C["reader_password"]}"')
        cur.execute('GRANT CREATE SESSION TO lecteur')
        a.commit(); a.close()
        m = oracle_as('minuit', C['worker_password']); mc = m.cursor()
        run_all(mc, create); insert_data('oracle', mc, tables, src); m.commit(); run_all(mc, fks + ix); fix_identity('oracle', mc, tables)
        for t in tables: mc.execute(f"GRANT SELECT ON {q('oracle', t['name'])} TO lecteur")
        mc.execute("BEGIN DBMS_STATS.GATHER_SCHEMA_STATS('MINUIT'); END;")
        m.commit(); m.close()
        a = admin('oracle'); cur = a.cursor()
        for i in range(1, N + 1):
            cur.execute(f'CREATE USER w{i} IDENTIFIED BY "{C["worker_password"]}" QUOTA 200M ON users')
            cur.execute(f'GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE TRIGGER, CREATE PROCEDURE TO w{i}')
        a.commit(); a.close()
        oracle_harden()
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(4) as ex:
            list(ex.map(lambda i: oracle_clone(f'w{i}', tables, create, fks, ix), range(1, N + 1)))
    elif engine == 'mssql':
        a = admin('mssql'); cur = a.cursor()
        for d in dbs:
            cur.execute(f"IF DB_ID('{d}') IS NOT NULL BEGIN ALTER DATABASE {d} SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE {d}; END")
        cur.execute('CREATE DATABASE minuit COLLATE Latin1_General_100_CS_AS_SC_UTF8')
        cur.execute('ALTER DATABASE minuit SET RECOVERY SIMPLE')
        for lg, pw in [('lecteur', C['reader_password'])] + [(f'ouvrier_{d}', C['worker_password']) for d in dbs[1:]]:
            cur.execute(f"IF SUSER_ID('{lg}') IS NULL CREATE LOGIN {lg} WITH PASSWORD = '{pw}', CHECK_POLICY = OFF, DEFAULT_DATABASE = master")
        a.close()
        m = admin('mssql', 'minuit'); mc = m.cursor()
        run_all(mc, create); insert_data('mssql', mc, tables, src); run_all(mc, fks + ix)
        mc.execute('CREATE USER lecteur FOR LOGIN lecteur'); mc.execute('ALTER ROLE db_datareader ADD MEMBER lecteur')
        mc.execute('GRANT SHOWPLAN TO lecteur')
        m.close()
        a = admin('mssql'); cur = a.cursor()
        cur.execute(f"BACKUP DATABASE minuit TO DISK = '{C['backup']}' WITH INIT, FORMAT")
        mssql_harden(cur)
        a.close()
        for d in dbs[1:]: mssql_clone(d)
    print(engine, 'chargé en', round(time.time() - t0, 1), 's', flush=True)

def pg_heal():
    """Remet mots de passe et réglages des rôles (un étudiant peut modifier les siens)."""
    C = conf.ENGINES['pg']; N = C['workers']
    a = admin('pg'); cur = a.cursor()
    roles = [('lecteur', C['reader_password'], '6s')] + [(f'ouvrier_w{i}', C['worker_password'], '8s') for i in range(1, N + 1)]
    for r, pw, t in roles:
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (r,))
        if not cur.fetchone(): continue
        cur.execute(f"ALTER ROLE {r} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '{pw}'")
        cur.execute(f"ALTER ROLE {r} RESET ALL")
        cur.execute(f"ALTER ROLE {r} SET statement_timeout = '{t}'")
        cur.execute(f"ALTER ROLE {r} SET work_mem = '16MB'")
        cur.execute(f"ALTER ROLE {r} SET idle_in_transaction_session_timeout = '20s'")
    for d in ['minuit', 'minuit_tpl'] + [f'w{i}' for i in range(1, N + 1)]:
        try: cur.execute(f"ALTER DATABASE {d} RESET ALL")
        except Exception: pass
    for d in ('minuit', 'minuit_tpl'):
        try:
            cur.execute(f"ALTER DATABASE {d} OWNER TO {C['admin_user']}")
            cur.execute(f"ALTER DATABASE {d} CONNECTION LIMIT -1")
        except Exception: pass
    try:
        cur.execute("ALTER DATABASE minuit_tpl IS_TEMPLATE true ALLOW_CONNECTIONS false")
        cur.execute('REVOKE ALL ON DATABASE minuit FROM PUBLIC'); cur.execute('GRANT CONNECT ON DATABASE minuit TO lecteur')
    except Exception: pass
    cur.execute("ALTER SYSTEM SET temp_file_limit = '200MB'")
    cur.execute("SELECT pg_reload_conf()")
    a.close()

def pg_make_worker(d):
    a = admin('pg'); cur = a.cursor()
    cur.execute(f"DROP DATABASE IF EXISTS {d} WITH (FORCE)")
    cur.execute(f"CREATE DATABASE {d} TEMPLATE minuit_tpl OWNER ouvrier_{d}")
    cur.execute(f"REVOKE ALL ON DATABASE {d} FROM PUBLIC"); cur.execute(f"GRANT CONNECT, TEMPORARY ON DATABASE {d} TO ouvrier_{d}")
    a.close()
    w = admin('pg', d); wc = w.cursor()
    wc.execute(f"REASSIGN OWNED BY tpl_owner TO ouvrier_{d}")
    w.close()

def maria_clone(cur, d, tables, create, fks, ix):
    cur.execute(f'DROP DATABASE IF EXISTS {d}')
    cur.execute(f'CREATE DATABASE {d} CHARACTER SET utf8mb4 COLLATE utf8mb4_bin')
    cur.execute(f'USE {d}')
    run_all(cur, create)
    cur.execute('SET FOREIGN_KEY_CHECKS = 0')
    for t in tables: cur.execute(f"INSERT INTO {d}.{q('maria', t['name'])} SELECT * FROM minuit.{q('maria', t['name'])}")
    cur.execute('SET FOREIGN_KEY_CHECKS = 1')
    run_all(cur, fks + ix)
    cur.execute('USE minuit')

def oracle_as(user, pw):
    import oracledb
    C = conf.ENGINES['oracle']
    return oracledb.connect(user=user, password=pw, dsn=f"{C['host']}:{C['port']}/{C['service']}")

def oracle_clone(user, tables, create, fks, ix):
    C = conf.ENGINES['oracle']
    a = admin('oracle'); cur = a.cursor()
    try: cur.execute(f'DROP USER {user} CASCADE')
    except Exception: pass
    cur.execute(f'CREATE USER {user} IDENTIFIED BY "{C["worker_password"]}" QUOTA 200M ON users')
    cur.execute(f'GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE TRIGGER, CREATE PROCEDURE TO {user}')
    a.commit(); a.close()
    m = oracle_as('minuit', C['worker_password']); mc = m.cursor()
    for t in tables: mc.execute(f"GRANT SELECT ON {q('oracle', t['name'])} TO {user}")
    m.commit(); m.close()
    w = oracle_as(user, C['worker_password']); wc = w.cursor()
    run_all(wc, create)
    for t in tables: wc.execute(f"INSERT INTO {q('oracle', t['name'])} SELECT * FROM minuit.{q('oracle', t['name'])}")
    w.commit(); run_all(wc, fks + ix); fix_identity('oracle', wc, tables)
    w.commit(); w.close()
    m = oracle_as('minuit', C['worker_password']); mc = m.cursor()
    for t in tables: mc.execute(f"REVOKE SELECT ON {q('oracle', t['name'])} FROM {user}")
    m.commit(); m.close()

ORACLE_REVOKE = ['UTL_FILE', 'UTL_HTTP', 'UTL_TCP', 'UTL_SMTP', 'UTL_INADDR', 'DBMS_LDAP', 'HTTPURITYPE', 'DBMS_ADVISOR',
                 'DBMS_XMLGEN', 'DBMS_XMLQUERY', 'DBMS_XMLSTORE', 'DBMS_JOB']
def oracle_harden():
    """Retire à PUBLIC (donc aux comptes des élèves) les paquets qui touchent aux fichiers, au réseau ou aux tâches.
    Les comptes internes d'Oracle qui s'en servent gardent un droit direct."""
    import oracledb
    C = conf.ENGINES['oracle']
    try:
        a = oracledb.connect(user='sys', password=C['admin_password'], dsn=f"{C['host']}:{C['port']}/{C['service']}", mode=oracledb.AUTH_MODE_SYSDBA)
    except Exception as e:
        print('oracle : durcissement impossible (connexion SYS)', e, flush=True); return
    cur = a.cursor()
    names = ', '.join(f"'{n}'" for n in ORACLE_REVOKE)
    cur.execute(f"SELECT DISTINCT owner, referenced_name FROM dba_dependencies WHERE referenced_owner IN ('SYS', 'PUBLIC') AND referenced_name IN ({names}) AND owner NOT IN ('SYS', 'PUBLIC')")
    for owner, obj in cur.fetchall():
        try: cur.execute(f'GRANT EXECUTE ON SYS.{obj} TO {owner}')
        except Exception: pass
    for obj in ORACLE_REVOKE:
        try: cur.execute(f'REVOKE EXECUTE ON SYS.{obj} FROM PUBLIC')
        except Exception: pass
    a.close()

def mssql_harden(cur):
    for xp in ('xp_dirtree', 'xp_fileexist', 'xp_subdirs', 'xp_getnetname', 'xp_msver', 'xp_enumgroups', 'xp_logininfo', 'xp_regread', 'xp_instance_regread'):
        try: cur.execute(f"USE master; DENY EXECUTE ON {xp} TO public")
        except Exception: pass
    for db in ('msdb', 'tempdb'):
        try: cur.execute(f"USE {db}; REVOKE CONNECT FROM guest")
        except Exception: pass
    cur.execute('USE master')

def heal(engine):
    """Remet les mots de passe des comptes étudiants (ils peuvent changer le leur)."""
    C = conf.ENGINES[engine]; N = C['workers']
    if engine == 'pg': return pg_heal()
    if engine == 'maria':
        a = admin('maria'); cur = a.cursor()
        cur.execute(f"ALTER USER IF EXISTS 'lecteur'@'%' IDENTIFIED BY '{C['reader_password']}'")
        for i in range(1, C.get('readers', 16) + 1): cur.execute(f"ALTER USER IF EXISTS 'lecteur_{i}'@'%' IDENTIFIED BY '{C['reader_password']}'")
        for i in range(1, N + 1): cur.execute(f"ALTER USER IF EXISTS 'ouvrier_w{i}'@'%' IDENTIFIED BY '{C['worker_password']}'")
        a.close()
    if engine == 'oracle':
        a = admin('oracle'); cur = a.cursor()
        try: cur.execute(f'ALTER USER lecteur IDENTIFIED BY "{C["reader_password"]}" ACCOUNT UNLOCK')
        except Exception: pass
        a.close()
    if engine == 'mssql':
        a = admin('mssql'); cur = a.cursor()
        cur.execute(f"ALTER LOGIN lecteur WITH PASSWORD = '{C['reader_password']}', CHECK_POLICY = OFF")
        cur.execute("ALTER LOGIN lecteur ENABLE")
        a.close()

def mssql_clone(d):
    C = conf.ENGINES['mssql']
    a = admin('mssql'); cur = a.cursor()
    cur.execute(f"IF DB_ID('{d}') IS NOT NULL ALTER DATABASE {d} SET SINGLE_USER WITH ROLLBACK IMMEDIATE")
    cur.execute("RESTORE FILELISTONLY FROM DISK = %s", (C['backup'],))
    files = cur.fetchall()
    moves = ', '.join(f"MOVE '{f[0]}' TO '{C['data_dir']}/{d}_{i}.{'mdf' if i == 0 else 'ldf'}'" for i, f in enumerate(files))
    cur.execute(f"RESTORE DATABASE {d} FROM DISK = '{C['backup']}' WITH REPLACE, {moves}")
    cur.execute(f"ALTER DATABASE {d} SET MULTI_USER")
    cur.execute(f"SELECT name FROM sys.master_files WHERE database_id = DB_ID('{d}')")
    for (fn,) in cur.fetchall():
        try: cur.execute(f"ALTER DATABASE {d} MODIFY FILE (NAME = [{fn}], MAXSIZE = 400MB)")
        except Exception: pass
    a.close()
    w = admin('mssql', d); wc = w.cursor()
    wc.execute(f"IF USER_ID('lecteur') IS NOT NULL DROP USER lecteur")
    wc.execute(f"CREATE USER ouvrier_{d} FOR LOGIN ouvrier_{d}")
    for r in ('db_ddladmin', 'db_datareader', 'db_datawriter'):
        wc.execute(f"ALTER ROLE {r} ADD MEMBER ouvrier_{d}")
    wc.execute(f"GRANT EXECUTE, VIEW DEFINITION, ALTER ON SCHEMA::dbo TO ouvrier_{d}")
    wc.execute(f"GRANT SHOWPLAN TO ouvrier_{d}")
    wc.execute(f"DENY BACKUP DATABASE, BACKUP LOG TO ouvrier_{d}")
    w.close()

if __name__ == '__main__':
    for e in (sys.argv[1:] or ['pg', 'maria', 'oracle', 'mssql']): load(e)
