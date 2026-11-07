import random, datetime, json, math, heapq
R = random.Random(3232)
out = []
def q(v):
    if v is None: return 'NULL'
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"
def ins(t, rows):
    for r in rows: out.append(f"INSERT INTO {t} VALUES ({', '.join(q(x) for x in r)});")
D = datetime.datetime
def ts(d): return d.strftime('%Y-%m-%d %H:%M:%S')
out.append("""
CREATE TABLE carnet_delorme (page INTEGER NOT NULL, ligne INTEGER NOT NULL, texte TEXT NOT NULL, PRIMARY KEY (page, ligne));
CREATE TABLE sous_stations (nom TEXT PRIMARY KEY, station TEXT, contrat TEXT, payeur_siren TEXT);
CREATE TABLE releves_electriques (id INTEGER PRIMARY KEY, sous_station TEXT NOT NULL REFERENCES sous_stations(nom), horodatage TEXT NOT NULL, kwh REAL NOT NULL);
CREATE TABLE minotaure_checkpoints (epoch INTEGER PRIMARY KEY, horodatage TEXT NOT NULL, metriques TEXT NOT NULL);
CREATE TABLE troncons (id INTEGER PRIMARY KEY, de TEXT NOT NULL, vers TEXT NOT NULL, minutes INTEGER NOT NULL, etat TEXT NOT NULL);
CREATE TABLE antennes (antenne TEXT PRIMARY KEY, station TEXT);
CREATE TABLE abonnes (numero TEXT PRIMARY KEY, titulaire TEXT, type TEXT);
CREATE TABLE bornages (id INTEGER PRIMARY KEY, numero TEXT NOT NULL, antenne TEXT NOT NULL REFERENCES antennes(antenne), horodatage TEXT NOT NULL);
CREATE TABLE communications (id INTEGER PRIMARY KEY, appelant TEXT NOT NULL, appele TEXT NOT NULL, horodatage TEXT NOT NULL, duree_s INTEGER);
CREATE TABLE file_minotaure (id INTEGER PRIMARY KEY, compte_source TEXT NOT NULL, compte_dest TEXT NOT NULL, montant REAL NOT NULL, prevu_le TEXT NOT NULL, statut TEXT NOT NULL DEFAULT 'en_attente');
""")

# 1. carnet : la lettre n° ligne de chaque ligne, page par page, donne DEDALE0400
lines = {
 (1,1): "Dernière vérification des baies avant le transfert.",
 (1,2): "Le tunnel de service reste humide, prévoir des bâches.",
 (1,3): "Ordonner aux équipes de garder le silence radio.",
 (1,4): "Un accès discret par le quai de Bercy.",
 (1,5): "Sur la ligne 5, couper les caméras du quai.",
 (2,1): "En cas de doute, appeler P. et personne d'autre.",
 (2,2): "60 minutes de marge, pas une de plus.",
 (2,3): "J-4 : tester l'onduleur, une coupure coûterait trois jours.",
 (2,4): "N° 07 : le badge cloné ne doit servir qu'une fois.",
 (2,5): "Lot 0 : la cellule ne doit jamais appeler directement.",
}
msg = ''.join(lines[k][k[1]-1].upper() for k in sorted(lines))
assert msg == 'DEDALE0400', msg
ins('carnet_delorme', [(p, l, t) for (p, l), t in sorted(lines.items())])

# 2. sous-stations et relevés horaires
SST = [('SST Châtelet', 'Châtelet-Seine', 420), ('SST Bastille', 'Bastille-Est', 310), ('SST Gare de Lyon', 'Gare de Lyon-Sud', 380), ('SST Nation', 'Nation-Est', 260),
       ('SST Opéra', 'Opéra-Seine', 300), ('SST Bercy', 'Bercy-Quai', 220), ('SST Saint-Michel', 'Saint-Michel-Rive', 280), ('SST Dédale', 'Dédale', 2)]
ins('sous_stations', [(n, s, 'CT-' + str(7000 + i), '512003000' if n == 'SST Dédale' else '512009000') for i, (n, s, b) in enumerate(SST)])
t0 = D(2028, 2, 15); H = 35 * 24
runs = [(D(2028,3,1,2), D(2028,3,4,18)), (D(2028,3,5,3), D(2028,3,10,11)), (D(2028,3,11,22), D(2028,3,20,23))]
rid = 0; rows = []
for n, s, base in SST:
    for h in range(H):
        d = t0 + datetime.timedelta(hours=h)
        if n == 'SST Dédale':
            on = any(a <= d <= b for a, b in runs)
            v = R.uniform(55, 68) if on else R.uniform(1.2, 2.8)
        else:
            cyc = 1 + 0.35 * math.sin((d.hour - 7) / 24 * 2 * math.pi)
            v = base * cyc * R.gauss(1, 0.06)
            if n == 'SST Bercy' and d >= D(2028,3,1): v *= 1.12
        rid += 1; rows.append((rid, n, ts(d), round(v, 1)))
ins('releves_electriques', rows)

# 3. checkpoints de MINOTAURE (run en cours), cible 0.99 vers le 21/03 à 4h
start = runs[2][0]; tgt = D(2028,3,21,4,0)
cp = []; ep = 0; d = start
total_h = (tgt - start).total_seconds() / 3600
while d <= D(2028,3,20,23):
    x = (d - start).total_seconds() / 3600
    if x < 120: acc = 0.55 + 0.33 * (1 - math.exp(-x / 30))
    else:
        a0 = 0.55 + 0.33 * (1 - math.exp(-120 / 30))
        acc = a0 + (0.99 - a0) * (x - 120) / (total_h - 120)
    acc = round(min(acc + R.gauss(0, 0.0015), 0.995), 4)
    loss = round(max(0.02, 1.6 * (1 - acc) + R.gauss(0, 0.004)), 4)
    ep += 1; cp.append((ep, ts(d), json.dumps({'acc': acc, 'loss': loss, 'gpu': 6, 'lr': 0.0003}, separators=(',', ':'))))
    d += datetime.timedelta(hours=1)
ins('minotaure_checkpoints', cp)

# 4. le labyrinthe
E = [('Préfecture','Châtelet-Seine',4,'ouvert'),('Préfecture','Saint-Michel-Rive',3,'ouvert'),('Châtelet-Seine','Saint-Michel-Rive',3,'ouvert'),
     ('Châtelet-Seine','Opéra-Seine',6,'ouvert'),('Châtelet-Seine','Bastille-Est',5,'ouvert'),('Châtelet-Seine','Gare de Lyon-Sud',7,'ferme'),
     ('Opéra-Seine','Saint-Lazare-Nord',4,'ouvert'),('Opéra-Seine','Concorde-Seine',4,'ouvert'),('Saint-Lazare-Nord','Gare du Nord-Seine',7,'ouvert'),
     ('Gare du Nord-Seine','Nation-Est',12,'ouvert'),('Bastille-Est','Gare de Lyon-Sud',3,'ouvert'),('Bastille-Est','Nation-Est',6,'ouvert'),
     ('Saint-Michel-Rive','Place d\'Italie-Sud',8,'ouvert'),('Place d\'Italie-Sud','Bercy-Quai',6,'ouvert'),('Gare de Lyon-Sud','Bercy-Quai',4,'ouvert'),
     ('Nation-Est','Porte de Vincennes',4,'ouvert'),('Montparnasse-Sud','Saint-Michel-Rive',7,'ouvert'),('Montparnasse-Sud','Place d\'Italie-Sud',6,'ouvert'),
     ('Bastille-Est','Dédale',9,'ferme'),('Gare de Lyon-Sud','Dédale',8,'ouvert'),('Bercy-Quai','Dédale',5,'ouvert'),('Nation-Est','Dédale',7,'ouvert'),
     ('Concorde-Seine','Étoile-Seine',6,'ouvert'),('Porte de Vincennes','Dédale',9,'ouvert')]
T = []; tid = 0
for a, b, m, e in E:
    for x, y in ((a, b), (b, a)):
        tid += 1; T.append((tid, x, y, m, e))
ins('troncons', T)
G = {}
for _, x, y, m, e in T:
    if e == 'ouvert': G.setdefault(x, []).append((y, m))
best = {}
def paths(n, path, tot):
    if tot > 60: return
    if n == 'Dédale': best.setdefault(tot, []).append(path); return
    for y, m in G.get(n, []):
        if y not in path: paths(y, path + [y], tot + m)
paths('Préfecture', ['Préfecture'], 0)
mn = min(best); assert len(best[mn]) == 1, best[mn]
print('plus court', mn, ' > '.join(best[mn][0]))

# 5. téléphonie
ANT = [('Fleury-Mérogis', None), ('Bercy-Souterrain', 'Dédale'), ('Châtelet-Centre', 'Châtelet-Seine'), ('Bastille-Nord', 'Bastille-Est'), ('Nation-Sud', 'Nation-Est'), ('Opéra-Haut', 'Opéra-Seine')]
ins('antennes', ANT)
ab = []; nums = {}
def num(prefix):
    while True:
        n = prefix + ''.join(R.choice('0123456789') for _ in range(8))
        if n not in nums: nums[n] = 1; return n
fleury = [num('06') for _ in range(14)]
others = [num('06') for _ in range(60)]
cellule = '0759000013'; relais = '0759000044'; ricci = '0612400666'
for i, n in enumerate(fleury): ab.append((n, ['Surveillant', 'Infirmier', 'Visiteur', 'Agent technique'][i % 4] + ' ' + str(i + 1), 'forfait'))
for i, n in enumerate(others): ab.append((n, 'Abonné ' + str(100 + i), 'forfait'))
ab += [(ricci, 'Paul Ricci', 'forfait'), (relais, None, 'prépayé'), (cellule, None, 'prépayé')]
ins('abonnes', ab)
B = []; bid = 0; night = D(2028, 3, 20, 21)
def bor(n, a, d):
    global bid; bid += 1; B.append((bid, n, a, ts(d)))
for n in fleury + [cellule]:
    for k in range(R.randint(2, 5)): bor(n, 'Fleury-Mérogis', night + datetime.timedelta(minutes=R.randint(0, 170)))
for n in others:
    a = R.choice(['Châtelet-Centre', 'Bastille-Nord', 'Nation-Sud', 'Opéra-Haut'])
    for k in range(R.randint(1, 4)): bor(n, a, night + datetime.timedelta(minutes=R.randint(0, 170)))
workers = others[:3]
for n in workers: bor(n, 'Bercy-Souterrain', night + datetime.timedelta(minutes=R.randint(10, 160)))
for k in range(6): bor(ricci, 'Bercy-Souterrain', night + datetime.timedelta(minutes=20 + 25 * k))
for k in range(3): bor(relais, 'Châtelet-Centre', night + datetime.timedelta(minutes=30 + 40 * k))
B.sort(key=lambda r: r[3]); B = [(i + 1,) + r[1:] for i, r in enumerate(B)]
ins('bornages', B)
C = []; cid = 0
def call(a, b, d, s):
    global cid; cid += 1; C.append((cid, a, b, ts(d), s))
safe = others[10:]
for n in fleury:
    for k in range(R.randint(1, 3)): call(n, R.choice(safe), night + datetime.timedelta(minutes=R.randint(0, 170)), R.randint(20, 600))
for k in range(200):
    a, b = R.sample(safe, 2); call(a, b, night + datetime.timedelta(minutes=R.randint(0, 170)), R.randint(10, 900))
for n in workers:
    call(n, R.choice(others[3:10]), night + datetime.timedelta(minutes=R.randint(0, 170)), R.randint(30, 300))
call(cellule, relais, D(2028,3,20,22,4), 41); call(relais, ricci, D(2028,3,20,22,9), 66)
call(ricci, relais, D(2028,3,20,23,31), 23); call(relais, cellule, D(2028,3,20,23,36), 18)
C.sort(key=lambda r: r[3]); C = [(i + 1,) + r[1:] for i, r in enumerate(C)]
ins('communications', C)

# 6. le payeur de l'électricité
out.append("INSERT INTO societes VALUES ('512003000', 'Labyrinthe Énergie', 'Paris', 'FR', '2028-02-02');")
out.append("INSERT INTO societes VALUES ('512009000', 'TransSeine Énergie', 'Paris', 'FR', '2003-06-01');")
out.append("INSERT INTO participations VALUES ('512000666', '512003000', 60.0);")
out.append("INSERT INTO participations VALUES ('512000999', '512003000', 40.0);")

# 7. la file de virements
import sqlite3
c = sqlite3.connect(':memory:'); c.executescript(open('/home/claude/build/schema.sql').read() + open('/home/claude/build/data.sql').read())
hel = [r[0] for r in c.execute("SELECT numero FROM comptes WHERE banque = 'Hélios' AND numero NOT LIKE 'HEL-COFFRE%'")]
autres = [r[0] for r in c.execute("SELECT numero FROM comptes WHERE banque <> 'Hélios'")]
mules = ['LT60-MNT-' + str(1000 + i) for i in range(8)]
F = []; fid = 0
for src in hel:
    for k in range(R.randint(1, 3)):
        fid += 1; F.append([fid, src, R.choice(mules), round(R.uniform(940, 999.99), 2), ts(D(2028,3,21,4,0) + datetime.timedelta(seconds=R.randint(0, 1800))), 'en_attente'])
for k in range(260):
    fid += 1; F.append([fid, R.choice(hel + autres), R.choice(autres), round(R.uniform(20, 4000), 2), ts(D(2028,3,21,0,0) + datetime.timedelta(minutes=R.randint(0, 1400))), 'en_attente'])
R.shuffle(F); F.sort(key=lambda r: r[4]); F = [[i + 1] + r[1:] for i, r in enumerate(F)]
ins('file_minotaure', F)
fan = {}
for r in F: fan.setdefault(r[2], set()).add(r[1])
print('fan-in max legit', max(len(v) for k, v in fan.items() if k not in mules), 'min mule', min(len(fan[m]) for m in mules))
open('/home/claude/build/data4.sql', 'w').write('\n'.join(out) + '\n')
print('ok', len(out))
