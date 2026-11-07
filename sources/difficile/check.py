"""Vérifie les traductions d'un dialecte.
Usage : python3 check.py <pg|maria|oracle|mssql> [ids...]   (sans ids : toutes les missions du fichier)
         python3 check.py <moteur> --try <id> "<requête>"    (essaie une requête comme le ferait un étudiant)
Pour chaque mission :
- lecture : la solution du dialecte doit donner exactement le résultat SQLite de référence ;
- DML : après la solution du dialecte, chaque requête verify doit donner le même résultat que la verify SQLite
  (sauf si l'entrée a verify_free: "raison", pour les vérifications de structure propres au moteur) ;
- plan : la sortie doit contenir le texte attendu ;
- les règles require (héritées ou redéfinies) doivent accepter la solution.
"""
import json, os, sys, time
import engine

def main():
    e = sys.argv[1]; args = sys.argv[2:]
    engine.reload_dialects(); D = engine.DIALECTS[e]; E = engine.EXPECTED
    if args[:1] == ['--try']:
        r = engine.run_student(e, args[1], args[2]); print(json.dumps({k: v for k, v in r.items() if k != 'result'}, ensure_ascii=False))
        res = r.get('result');
        if res: print(res['columns']); [print(row) for row in res['values'][:10]]
        return
    ids = args or list(D.keys())
    bad = 0
    for mid in ids:
        if mid not in E: print('INCONNU', mid); bad += 1; continue
        d = D.get(mid)
        if not d: print('MANQUE', mid); bad += 1; continue
        if d.get('skip'): print('SKIP', mid, d['skip']); continue
        for f in ('solution',):
            if not d.get(f): print('ERR', mid, 'champ', f, 'absent'); bad += 1; continue
        engine._EXP_CACHE.pop((e, mid), None)
        try:
            r = engine.run_student(e, mid, d['solution'])
        except Exception as ex:
            print('FAIL', mid, 'exception', ex); bad += 1; continue
        if not r.get('ok'):
            print('FAIL', mid, (r.get('msg') or '')[:300]); bad += 1; continue
        if E[mid]['kind'] == 'dml' and not d.get('verify_free'):
            exp = engine.expected_for(e, mid); ref = E[mid].get('sqlite_verify') or []
            if len(exp) != len(ref): print('FAIL', mid, f'{len(exp)} verify au lieu de {len(ref)} (ou mettre verify_free)'); bad += 1; continue
            ko = [i for i, (a, b) in enumerate(zip(ref, exp)) if not engine.compare(a, b, {})['ok']]
            if ko: print('FAIL', mid, 'verify', ko, 'différent de SQLite', engine.compare(ref[ko[0]], exp[ko[0]], {})['msg'][:200]); bad += 1; continue
        if not d.get('hints') or len(d['hints']) < 2: print('WARN', mid, 'il faut 2 indices dans le dialecte')
        print('OK  ', mid, r.get('ms'), 'ms')
    print('PROBLÈMES :', bad, '/', len(ids))

if __name__ == '__main__': main()
