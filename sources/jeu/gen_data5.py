import random, datetime, json, math
R = random.Random(4444)
out = []
def q(v):
    if v is None: return 'NULL'
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"
def ins(t, rows):
    for r in rows: out.append(f"INSERT INTO {t} VALUES ({', '.join(q(x) for x in r)});")
D = datetime.datetime; TD = datetime.timedelta
def ts(d): return d.strftime('%Y-%m-%d %H:%M:%S')
out.append("""
CREATE TABLE comptes_ad (login TEXT PRIMARY KEY, nom TEXT NOT NULL, service TEXT, admin INTEGER NOT NULL DEFAULT 0, actif INTEGER NOT NULL DEFAULT 1);
CREATE TABLE postes (hostname TEXT PRIMARY KEY, ip TEXT UNIQUE NOT NULL, type TEXT NOT NULL, utilisateur TEXT);
CREATE TABLE auth_logs (id INTEGER PRIMARY KEY, horodatage TEXT NOT NULL, login TEXT NOT NULL, source_ip TEXT NOT NULL, dest_host TEXT NOT NULL, methode TEXT NOT NULL, resultat TEXT NOT NULL);
CREATE TABLE mail_logs (id INTEGER PRIMARY KEY, horodatage TEXT NOT NULL, expediteur TEXT NOT NULL, destinataire TEXT NOT NULL, sujet TEXT, piece_jointe TEXT, verdict TEXT NOT NULL);
CREATE TABLE clics (id INTEGER PRIMARY KEY, horodatage TEXT NOT NULL, login TEXT NOT NULL, url TEXT NOT NULL);
CREATE TABLE process_logs (id INTEGER PRIMARY KEY, horodatage TEXT NOT NULL, host TEXT NOT NULL, pid INTEGER NOT NULL, ppid INTEGER, process TEXT NOT NULL, ligne_commande TEXT, login TEXT);
CREATE TABLE proxy_logs (id INTEGER PRIMARY KEY, horodatage TEXT NOT NULL, host TEXT NOT NULL, domaine TEXT NOT NULL, ip_dest TEXT NOT NULL, octets_out INTEGER, octets_in INTEGER);
CREATE TABLE domaines_connus (domaine TEXT PRIMARY KEY, categorie TEXT);
CREATE TABLE dns_logs (id INTEGER PRIMARY KEY, horodatage TEXT NOT NULL, host TEXT NOT NULL, requete TEXT NOT NULL, domaine TEXT NOT NULL);
CREATE TABLE capteurs (id INTEGER PRIMARY KEY, horodatage TEXT NOT NULL, site TEXT NOT NULL, valeur REAL NOT NULL);
CREATE TABLE commandes_ot (id INTEGER PRIMARY KEY, horodatage TEXT NOT NULL, site TEXT NOT NULL, parametre TEXT NOT NULL, ancienne REAL, nouvelle REAL, login TEXT, source_ip TEXT);
CREATE TABLE deplacements (id INTEGER PRIMARY KEY, login TEXT NOT NULL, lieu TEXT NOT NULL, debut TEXT NOT NULL, fin TEXT NOT NULL);
CREATE TABLE lignes_internet (ip TEXT PRIMARY KEY, abonne_siren TEXT, adresse TEXT, station TEXT);
""")
# --- comptes et postes
prenoms = ['Nadia','Paul','Lucie','Karim','Emma','Hugo','Sarah','Yanis','Chloé','Léo','Inès','Tom','Manon','Adam','Jade','Noah','Lina','Enzo','Zoé','Rayan','Alice','Mehdi','Clara','Théo','Léa','Samir','Julie','Louis','Anaïs','Bilal']
noms = ['Perrin','Martin','Durand','Leroy','Moreau','Simon','Laurent','Michel','Garcia','David','Bertrand','Roux','Vincent','Fournier','Morel','Girard','André','Mercier','Dupont','Lambert','Bonnet','François','Martinez','Legrand','Garnier','Faure','Rousseau','Blanc','Guerin','Muller']
services = ['COMPTA','RH','URBA','EAU','COM','JURI','INFO','ACCUEIL']
users = []; used = set()
for i in range(72):
    while True:
        p, n = R.choice(prenoms), R.choice(noms); lg = (p[0] + '.' + n).lower().replace('é','e').replace('ï','i').replace('ç','c')
        if lg not in used: used.add(lg); break
    users.append([lg, p + ' ' + n, services[i % len(services)], 0, 1])
users[0] = ['n.perrin', 'Nadia Perrin', 'COMPTA', 0, 1]; used.add('n.perrin')
admins = [['adm.varenne', 'Clément Varenne', 'INFO (prestataire)', 1, 1], ['adm.lopez', 'Sofia Lopez', 'INFO', 1, 1], ['adm.ndiaye', 'Moussa Ndiaye', 'INFO', 1, 1]]
svc = [['svc_backup', 'Compte de sauvegarde', 'INFO', 1, 1], ['svc_scada', 'Compte supervision eau', 'EAU', 1, 1]]
ins('comptes_ad', users + admins + svc)
hosts = []; ipof = {}; cnt = {}
for u in users:
    s = u[2]; cnt[s] = cnt.get(s, 0) + 1
    h = f'PC-{s}-{cnt[s]:02d}'; ip = f'10.10.{services.index(s) + 1}.{cnt[s] + 10}'
    if u[0] == 'n.perrin': h, ip = 'PC-COMPTA-07', '10.10.1.7'
    elif h == 'PC-COMPTA-07': h, ip = 'PC-COMPTA-19', '10.10.1.29'
    hosts.append((h, ip, 'poste', u[0])); ipof[u[0]] = (h, ip)
srv = [('SRV-FICHIERS', '10.20.0.10', 'serveur', None), ('SRV-MAIL', '10.20.0.11', 'serveur', None), ('SRV-WEB', '10.20.0.12', 'serveur', None),
       ('DC01', '10.20.0.2', 'controleur', None), ('SRV-SCADA-GW', '10.20.0.5', 'serveur', None), ('HMI-MONTSOURIS', '10.30.0.21', 'ot', None), ('HMI-IVRY', '10.30.0.22', 'ot', None),
       ('PC-INFO-ADM1', '10.10.7.50', 'poste', 'adm.lopez'), ('PC-INFO-ADM2', '10.10.7.51', 'poste', 'adm.ndiaye')]
# collision check PC-COMPTA-07
names = [h[0] for h in hosts]; assert len(names) == len(set(names)), 'dup host'
ins('postes', hosts + srv)
H = {h[0]: h[1] for h in hosts + srv}
# --- auth logs
A = []
def au(d, lg, sip, dh, m, r): A.append([ts(d), lg, sip, dh, m, r])
day0 = D(2028, 3, 1)
for k in range(14):
    d = day0 + TD(days=k)
    if d.weekday() >= 5: continue
    for u in users:
        h, ip = ipof[u[0]]
        if u[0] == 'n.perrin' and k >= 12: continue
        au(d + TD(hours=8, minutes=R.randint(0, 70)), u[0], ip, h, 'local', 'succes')
        if R.random() < 0.06: au(d + TD(hours=8, minutes=R.randint(0, 60)), u[0], ip, h, 'local', 'echec')
        if R.random() < 0.5: au(d + TD(hours=9, minutes=R.randint(0, 400)), u[0], ip, 'SRV-FICHIERS', 'smb', 'succes')
        if R.random() < 0.08: au(d + TD(hours=19, minutes=R.randint(0, 120)), u[0], f'100.64.{R.randint(0,255)}.{R.randint(1,254)}', 'VPN', 'vpn', 'succes')
    for lg, h in [('adm.lopez', 'PC-INFO-ADM1'), ('adm.ndiaye', 'PC-INFO-ADM2')]:
        if lg == 'adm.lopez' and k in (1, 2): continue
        au(d + TD(hours=8, minutes=R.randint(0, 30)), lg, H[h], h, 'local', 'succes')
        for t in R.sample(['SRV-FICHIERS', 'SRV-MAIL', 'SRV-WEB', 'DC01', 'SRV-SCADA-GW'], 3):
            au(d + TD(hours=R.randint(9, 17), minutes=R.randint(0, 59)), lg, H[h], t, 'rdp', 'succes')
    au(d + TD(hours=7, minutes=30), 'svc_scada', H['SRV-SCADA-GW'], 'HMI-MONTSOURIS', 'smb', 'succes')
    au(d + TD(hours=7, minutes=31), 'svc_scada', H['SRV-SCADA-GW'], 'HMI-IVRY', 'smb', 'succes')
for k in range(14):
    au(day0 + TD(days=k, hours=23), 'svc_backup', H['SRV-FICHIERS'], 'SRV-FICHIERS', 'local', 'succes')
# Varenne, prestataire : vient les 2 et 4 mars, fait de la maintenance sur PC-COMPTA-07 le 4
for dd in (2, 4):
    au(D(2028,3,dd,9,5), 'adm.varenne', '10.10.7.60', 'SRV-FICHIERS', 'rdp', 'succes')
au(D(2028,3,4,14,22), 'adm.varenne', '10.10.7.60', 'PC-COMPTA-07', 'rdp', 'succes')
# tete 1 : pulverisation de mots de passe sur le VPN le 5 mars
spray = '192.0.2.150'
targets = [u[0] for u in users[1:50]] + ['adm.lopez', 'adm.ndiaye', 'svc_scada', 'svc_backup']
t = D(2028,3,5,1,2)
for rnd in range(6):
    for lg in targets:
        if lg == 'svc_backup' and rnd == 5: continue
        au(t, lg, spray, 'VPN', 'vpn', 'echec'); t += TD(seconds=R.randint(8, 16))
au(D(2028,3,5,2,11,40), 'svc_backup', spray, 'VPN', 'vpn', 'succes')
au(D(2028,3,5,2,14,3), 'svc_backup', '10.99.0.5', 'SRV-FICHIERS', 'smb', 'succes')
au(D(2028,3,9,0,52,10), 'svc_backup', spray, 'VPN', 'vpn', 'succes')
au(D(2028,3,9,0,55,30), 'svc_backup', '10.99.0.5', 'SRV-FICHIERS', 'smb', 'succes')
# un autre essai bruyant mais sans succes depuis 198.51.100.77 (bruit)
for k in range(40): au(D(2028,3,8,14,0) + TD(seconds=30 * k), R.choice(targets[:10]), '198.51.100.77', 'VPN', 'vpn', 'echec')
# tete 3 : mouvement lateral avec adm.varenne depuis PC-COMPTA-07
au(D(2028,3,7,2,31,5), 'adm.varenne', '10.10.1.7', 'SRV-FICHIERS', 'rdp', 'succes')
au(D(2028,3,7,2,29,50), 'adm.varenne', '10.10.1.7', 'SRV-FICHIERS', 'rdp', 'echec')
au(D(2028,3,7,3,12,44), 'adm.varenne', H['SRV-FICHIERS'], 'SRV-SCADA-GW', 'rdp', 'succes')
au(D(2028,3,8,1,4,9), 'adm.varenne', H['SRV-FICHIERS'], 'DC01', 'smb', 'succes')
au(D(2028,3,8,1,20,0), 'adm.varenne', H['DC01'], 'SRV-MAIL', 'smb', 'succes')
au(D(2028,3,12,2,58,30), 'adm.varenne', H['SRV-FICHIERS'], 'SRV-SCADA-GW', 'rdp', 'succes')
au(D(2028,3,12,3,0,12), 'adm.varenne', H['SRV-SCADA-GW'], 'HMI-MONTSOURIS', 'smb', 'succes')
A.sort(key=lambda r: r[0]); ins('auth_logs', [[i + 1] + r for i, r in enumerate(A)])
# deplacements : Varenne a Lyon du 6 au 13
ins('deplacements', [(1, 'adm.varenne', 'Salon Cyber Lyon', '2028-03-06 07:00:00', '2028-03-13 20:00:00'), (2, 'adm.lopez', 'Formation Lille', '2028-03-02 08:00:00', '2028-03-03 18:00:00'), (3, 'n.perrin', 'Congés', '2028-03-13 00:00:00', '2028-03-14 23:59:00')])
# --- mails
M = []
legit_dom = ['vds.fr', 'eauxdeseine.fr', 'prefecture-seine.gouv.fr', 'transseine.fr', 'fournitures-bureau.fr', 'banque-hel.fr', 'mutuelle-ville.fr', 'formations-pro.fr']
subj = ['Réunion de service', 'Planning', 'Facture de février', 'Compte rendu', 'Invitation', 'Rappel', 'Bon de commande', 'Note interne']
pj = [None, None, None, 'compte_rendu.pdf', 'planning.xlsx', 'facture_02.pdf', 'note.docx', 'photo.jpg']
for k in range(1400):
    d = day0 + TD(days=R.randint(0, 13), hours=R.randint(7, 19), minutes=R.randint(0, 59), seconds=R.randint(0, 59))
    dom = R.choice(legit_dom); ex = R.choice(['contact', 'service', 'info', 'facturation', 'rh', 'noreply']) + '@' + dom
    if dom == 'vds.fr': ex = R.choice(users)[0] + '@vds.fr'
    M.append([ts(d), ex, R.choice(users)[0] + '@vds.fr', R.choice(subj), R.choice(pj), 'livre'])
for k in range(30):
    d = day0 + TD(days=R.randint(0, 13), hours=R.randint(0, 23), minutes=R.randint(0, 59))
    M.append([ts(d), R.choice(['promo', 'win', 'gift']) + '@' + R.choice(['bonnes-affaires.biz', 'cadeau-gratuit.info']), R.choice(users)[0] + '@vds.fr', 'Vous avez gagné', None, 'quarantaine'])
phish_dom = 'eaux-de-seine-fr.com'
victims = ['n.perrin'] + R.sample([u[0] for u in users[1:]], 39)
t = D(2028,3,6,9,10,3)
for i, v in enumerate(victims):
    M.append([ts(t + TD(seconds=4 * i)), 'factures@' + phish_dom, v + '@vds.fr', 'Facture impayée : relance avant coupure', 'facture_0306.docm', 'quarantaine' if i % 7 == 6 else 'livre'])
M.sort(key=lambda r: r[0]); ins('mail_logs', [[i + 1] + r for i, r in enumerate(M)])
C = []
for k in range(600):
    d = day0 + TD(days=R.randint(0, 13), hours=R.randint(8, 18), minutes=R.randint(0, 59))
    C.append([ts(d), R.choice(users)[0], 'https://' + R.choice(['intranet.vds.fr/actus', 'eauxdeseine.fr/espace-pro', 'transseine.fr/horaires', 'meteo-seine.fr', 'formations-pro.fr/catalogue'])])
clickers = [('n.perrin', D(2028,3,6,9,13,58)), (victims[3], D(2028,3,6,9,21,10)), (victims[8], D(2028,3,6,9,40,2)), (victims[15], D(2028,3,6,10,5,44)), (victims[22], D(2028,3,6,11,30,0))]
for lg, d in clickers: C.append([ts(d), lg, 'https://' + phish_dom + '/paiement?id=' + str(R.randint(1000, 9999))])
C.sort(key=lambda r: r[0]); ins('clics', [[i + 1] + r for i, r in enumerate(C)])
# --- processus
P = []; pid = [1000]
def pr(d, h, ppid, p, cl, lg):
    pid[0] += R.randint(3, 40); P.append([ts(d), h, pid[0], ppid, p, cl, lg]); return pid[0]
common = [('chrome.exe', 'chrome.exe'), ('outlook.exe', 'outlook.exe'), ('winword.exe', 'winword.exe /n'), ('excel.exe', 'excel.exe'), ('teams.exe', 'teams.exe'), ('acrord32.exe', 'acrord32.exe facture.pdf'), ('notepad.exe', 'notepad.exe')]
for k in range(14):
    d = day0 + TD(days=k)
    if d.weekday() >= 5: continue
    for u in users[:40]:
        h = ipof[u[0]][0]
        ex = pr(d + TD(hours=8, minutes=R.randint(0, 60)), h, 4, 'explorer.exe', 'explorer.exe', u[0])
        for c in R.sample(common, 3): pr(d + TD(hours=R.randint(9, 17), minutes=R.randint(0, 59)), h, ex, c[0], c[1], u[0])
    for hh in ['SRV-FICHIERS', 'DC01', 'SRV-SCADA-GW']:
        pr(d + TD(hours=3), hh, 600, 'svchost.exe', 'svchost.exe -k netsvcs', 'SYSTEM')
        pr(d + TD(hours=3, minutes=5), hh, 600, 'backup_agent.exe', 'backup_agent.exe --nightly', 'svc_backup')
for h in ['PC-INFO-ADM1', 'PC-INFO-ADM2']:
    pr(D(2028,3,3,10), h, 900, 'powershell.exe', 'powershell.exe -File inventaire.ps1', 'adm.lopez')
# la chaine malveillante sur PC-COMPTA-07
h = 'PC-COMPTA-07'; t = D(2028,3,6,9,14,40)
pid[0] = 90000
ow = pr(t - TD(minutes=20), h, 89990, 'outlook.exe', 'outlook.exe', 'n.perrin')
pid[0] = 90100; wd = pr(t, h, ow, 'winword.exe', 'winword.exe /n facture_0306.docm', 'n.perrin')
cm = pr(t + TD(seconds=9), h, wd, 'cmd.exe', 'cmd.exe /c powershell -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA', 'n.perrin')
ps = pr(t + TD(seconds=10), h, cm, 'powershell.exe', 'powershell -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA', 'n.perrin')
r1 = pr(t + TD(seconds=31), h, ps, 'rundll32.exe', 'rundll32.exe C:\\Users\\Public\\upd.dll,Start', 'n.perrin')
pr(t + TD(seconds=35), h, ps, 'schtasks.exe', 'schtasks /create /tn MAJ_Adobe /sc minute /mo 30 /tr "rundll32.exe C:\\Users\\Public\\upd.dll,Start"', 'n.perrin')
pr(t + TD(minutes=3), h, r1, 'whoami.exe', 'whoami /all', 'n.perrin')
pr(t + TD(minutes=4), h, r1, 'net.exe', 'net group "Admins du domaine" /domain', 'n.perrin')
pr(t + TD(minutes=5), h, r1, 'nltest.exe', 'nltest /dclist:vds.fr', 'n.perrin')
pr(D(2028,3,7,1,58), h, r1, 'procdump.exe', 'procdump.exe -ma lsass.exe C:\\Users\\Public\\l.dmp', 'n.perrin')
# executions planifiees de la persistance
for k in range(1, 60):
    pr(t + TD(minutes=30 * k + 1), h, 89812, 'rundll32.exe', 'rundll32.exe C:\\Users\\Public\\upd.dll,Start', 'n.perrin')
# SRV-FICHIERS infecte apres le mouvement lateral
t2 = D(2028,3,7,2,36)
pid[0] = 97300
c2 = pr(t2, 'SRV-FICHIERS', 97100, 'cmd.exe', 'cmd.exe /c copy \\\\10.10.1.7\\C$\\Users\\Public\\upd.dll C:\\ProgramData\\upd.dll', 'adm.varenne')
pr(t2 + TD(seconds=20), 'SRV-FICHIERS', c2, 'rundll32.exe', 'rundll32.exe C:\\ProgramData\\upd.dll,Start', 'adm.varenne')
pr(D(2028,3,9,1,0), 'SRV-FICHIERS', 97100, 'powershell.exe', 'powershell -nop -c "Get-ChildItem D:\\Partages\\Projets -Recurse"', 'adm.varenne')
P.sort(key=lambda r: r[0]); ins('process_logs', [[i + 1] + r for i, r in enumerate(P)])
# --- proxy
known = [('intranet.vds.fr', 'interne'), ('eauxdeseine.fr', 'partenaire'), ('transseine.fr', 'partenaire'), ('meteo-seine.fr', 'information'), ('cloud-docs.com', 'bureautique'),
         ('maj.editeur-os.com', 'mises à jour'), ('antivirus-cloud.com', 'sécurité'), ('formations-pro.fr', 'formation'), ('visio-pro.com', 'bureautique')]
ins('domaines_connus', known)
ipd = {'intranet.vds.fr': '10.20.0.12', 'eauxdeseine.fr': '203.0.113.20', 'transseine.fr': '203.0.113.21', 'meteo-seine.fr': '203.0.113.22', 'cloud-docs.com': '203.0.113.23',
       'maj.editeur-os.com': '203.0.113.24', 'antivirus-cloud.com': '203.0.113.25', 'formations-pro.fr': '203.0.113.26', 'visio-pro.com': '203.0.113.27', 'cdn-update-check.net': '192.0.2.66',
       'eaux-de-seine-fr.com': '192.0.2.80', 'actu-insolite.net': '203.0.113.90'}
X = []
for k in range(3600):
    d = day0 + TD(days=R.randint(0, 13), hours=R.randint(8, 18), minutes=R.randint(0, 59), seconds=R.randint(0, 59))
    u = R.choice(users[:40]); dom = R.choice([k2 for k2, _ in known if k2 not in ('maj.editeur-os.com', 'antivirus-cloud.com')] + ['actu-insolite.net'])
    X.append([ts(d), ipof[u[0]][0], dom, ipd[dom], R.randint(300, 5000), R.randint(2000, 900000)])
for hh in ['PC-COMPTA-07', 'PC-RH-01', 'SRV-FICHIERS', 'DC01']:
    d = day0 + TD(minutes=R.randint(0, 59))
    while d < day0 + TD(days=14):
        X.append([ts(d), hh, 'antivirus-cloud.com', ipd['antivirus-cloud.com'], 420, 1800]); d += TD(seconds=3600)
for hh, start in [('PC-COMPTA-07', D(2028,3,6,9,15,20)), ('SRV-FICHIERS', D(2028,3,7,2,36,30))]:
    d = start
    while d < D(2028,3,14,23):
        X.append([ts(d), hh, 'cdn-update-check.net', '192.0.2.66', R.randint(380, 520), R.randint(200, 400)]); d += TD(seconds=600 + R.randint(-5, 5))
for lg, dd in clickers: X.append([ts(dd + TD(seconds=2)), ipof[lg][0], phish_dom, '192.0.2.80', 900, 14000])
X.sort(key=lambda r: r[0]); ins('proxy_logs', [[i + 1] + r for i, r in enumerate(X)])
# --- dns
N = []
for k in range(2600):
    d = day0 + TD(days=R.randint(0, 13), hours=R.randint(0, 23), minutes=R.randint(0, 59), seconds=R.randint(0, 59))
    dom = R.choice([k2 for k2, _ in known])
    sub = R.choice(['www', 'api', 'static', 'mail', 'cdn', 'login'])
    N.append([ts(d), R.choice(list(H.keys())), sub + '.' + dom, dom])
secret = "HYDRE>MINOTAURE | lot 1 : transseine_plan_reseau_complet.zip | lot 2 : vigie_dataset_v2_annote.csv | lot 3 : helios_regles_antifraude_2028.xlsx | fin"
raw = secret.encode('utf-8'); chunks = [raw[i:i + 20] for i in range(0, len(raw), 20)]
t = D(2028,3,9,1,2,0); order = list(range(len(chunks)))
for i in order:
    N.append([ts(t + TD(seconds=37 * i + R.randint(0, 20))), 'SRV-FICHIERS', f'{i + 1}.{chunks[i].hex()}.t.tunnel-meteo.net', 'tunnel-meteo.net'])
for k in range(20):
    N.append([ts(D(2028,3,9,1,0) + TD(seconds=R.randint(0, 2400))), 'SRV-FICHIERS', 'www.meteo-seine.fr', 'meteo-seine.fr'])
N.sort(key=lambda r: r[0]); ins('dns_logs', [[i + 1] + r for i, r in enumerate(N)])
print('chunks', len(chunks))
# --- capteurs (pression, bar, toutes les 10 min du 10 au 13 mars)
sites = {'Réservoir Montsouris': 4.2, 'Usine Ivry': 5.1, 'Réservoir Ménilmontant': 3.9, 'Usine Joinville': 4.8, 'Réservoir Belleville': 4.0, 'Station Austerlitz': 3.6}
S = []; d = D(2028,3,10)
while d < D(2028,3,14):
    for s, b in sites.items():
        v = b * (1 + 0.03 * math.sin((d.hour + d.minute / 60) / 24 * 2 * math.pi)) + R.gauss(0, 0.04)
        if s == 'Réservoir Montsouris' and D(2028,3,12,3,10) <= d < D(2028,3,12,6,40): v = 1.1 + R.gauss(0, 0.05)
        if s == 'Réservoir Montsouris' and D(2028,3,12,6,40) <= d < D(2028,3,12,7,30): v = 2.6 + R.gauss(0, 0.05)
        if s == 'Usine Ivry' and d in (D(2028,3,10,14,20), D(2028,3,11,9,0), D(2028,3,12,22,50), D(2028,3,13,5,10)): v = 0.0
        S.append([ts(d), s, round(v, 2)])
    d += TD(minutes=10)
ins('capteurs', [[i + 1] + r for i, r in enumerate(S)])
O = []
for k in range(40):
    d = D(2028,3,10) + TD(days=R.randint(0, 3), hours=R.randint(8, 17), minutes=R.randint(0, 59))
    s = R.choice(list(sites)); b = sites[s]
    O.append([ts(d), s, 'consigne_pression', b, round(b + R.choice([-0.1, 0.1, 0.05, -0.05]), 2), R.choice(['adm.lopez', 'svc_scada', 'adm.ndiaye']), R.choice([H['PC-INFO-ADM1'], H['SRV-SCADA-GW']])])
O.append(['2028-03-12 03:02:41', 'Réservoir Montsouris', 'seuil_alarme', 3.0, 0.5, 'adm.varenne', H['SRV-SCADA-GW']])
O.append(['2028-03-12 03:04:05', 'Réservoir Montsouris', 'consigne_pression', 4.2, 1.0, 'adm.varenne', H['SRV-SCADA-GW']])
O.append(['2028-03-12 06:38:00', 'Réservoir Montsouris', 'consigne_pression', 1.0, 4.2, 'adm.lopez', H['PC-INFO-ADM1']])
O.append(['2028-03-12 06:39:00', 'Réservoir Montsouris', 'seuil_alarme', 0.5, 3.0, 'adm.lopez', H['PC-INFO-ADM1']])
O.sort(key=lambda r: r[0]); ins('commandes_ot', [[i + 1] + r for i, r in enumerate(O)])
# --- lignes internet (pour la fin de saison et la finale)
ins('lignes_internet', [('192.0.2.150', '512003000', 'Local technique, voie de service, Paris 12e', 'Dédale'), ('192.0.2.66', '512003000', 'Local technique, voie de service, Paris 12e', 'Dédale'),
                        ('192.0.2.80', '512007700', 'Hébergeur, Roubaix', None), ('198.51.100.77', '512007800', 'Box résidentielle, Créteil', None)])
out.append("INSERT INTO societes VALUES ('512007700', 'NordHost', 'Roubaix', 'FR', '2019-04-01');")
out.append("INSERT INTO societes VALUES ('512007800', 'Fibre Est', 'Créteil', 'FR', '2012-01-01');")
open('/home/claude/build/data5.sql', 'w').write('\n'.join(out) + '\n')
print('ok', len(out), 'auth', len(A), 'proxy', len(X), 'proc', len(P), 'dns', len(N), 'mails', len(M))
