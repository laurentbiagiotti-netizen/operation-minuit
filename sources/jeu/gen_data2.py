import random, datetime, json, sys
R = random.Random(2027)
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
CREATE TABLE incidents (id INTEGER PRIMARY KEY, ligne TEXT NOT NULL, station TEXT NOT NULL, type TEXT NOT NULL, debut TEXT NOT NULL, fin TEXT);
CREATE TABLE saisies (id INTEGER PRIMARY KEY, appareil TEXT NOT NULL, contenu TEXT NOT NULL);
CREATE TABLE mouvements_port (id INTEGER PRIMARY KEY, conteneur TEXT NOT NULL, navire TEXT, quai INTEGER, evenement TEXT NOT NULL, horodatage TEXT NOT NULL);
CREATE TABLE conteneurs (code TEXT PRIMARY KEY, importateur_siren TEXT, contenu_declare TEXT, poids_kg INTEGER);
CREATE TABLE societes (siren TEXT PRIMARY KEY, nom TEXT NOT NULL, ville TEXT, pays TEXT, creation TEXT);
CREATE TABLE participations (detenteur TEXT NOT NULL, detenue TEXT NOT NULL REFERENCES societes(siren), pct REAL, PRIMARY KEY (detenteur, detenue));
CREATE TABLE trafic (id INTEGER PRIMARY KEY, horodatage TEXT NOT NULL, poste TEXT NOT NULL, ip_src TEXT, ip_dst TEXT NOT NULL, port INTEGER, octets INTEGER);
CREATE TABLE sessions_postes (id INTEGER PRIMARY KEY, poste TEXT NOT NULL, login TEXT NOT NULL, debut TEXT NOT NULL, fin TEXT NOT NULL);
CREATE TABLE wallets (adresse TEXT PRIMARY KEY, type TEXT CHECK (type IN ('perso','mixeur','exchange')), plateforme TEXT, kyc_nom TEXT);
CREATE TABLE tx_crypto (id INTEGER PRIMARY KEY, de TEXT NOT NULL, vers TEXT NOT NULL, montant REAL NOT NULL, horodatage TEXT NOT NULL);
CREATE TABLE pieces (id INTEGER PRIMARY KEY, affaire TEXT NOT NULL, description TEXT NOT NULL, ajoutee_le TEXT);
CREATE TABLE journal_brigade (id INTEGER PRIMARY KEY, login TEXT NOT NULL, action TEXT NOT NULL, table_cible TEXT, ligne_id INTEGER, ancienne_valeur TEXT, horodatage TEXT NOT NULL);
CREATE TABLE consultants (login TEXT PRIMARY KEY, nom_complet TEXT NOT NULL, societe_siren TEXT, mission TEXT);
CREATE TABLE compteurs_alertes (station TEXT PRIMARY KEY, nb INTEGER NOT NULL DEFAULT 0);
CREATE TABLE temoignages_bruts (id INTEGER PRIMARY KEY, recu_le TEXT, temoin TEXT, telephone TEXT, description TEXT, plaque TEXT);
CREATE TABLE cartes_grises (immatriculation TEXT PRIMARY KEY, marque TEXT, couleur TEXT, titulaire TEXT);
""")

# ---------- INCIDENTS TransSeine ----------
LIGNES = ['L1','L2','L3','L4','L5','T1','T2']
STATIONS = {'L1':['Grande Arche','Esplanade','Pont de Neuilly','Étoile-Seine','Concorde-Seine','Châtelet-Seine'],
 'L2':['Châtelet-Seine','Bastille-Est','Nation-Est','Porte de Vincennes'],
 'L3':['Saint-Lazare-Nord','Opéra-Seine','Châtelet-Seine','Gare de Lyon-Sud'],
 'L4':['Gare du Nord-Seine','Châtelet-Seine','Saint-Michel-Rive','Montparnasse-Sud'],
 'L5':['Bobigny-Pont','Gare du Nord-Seine','Bastille-Est','Place d\'Italie-Sud'],
 'T1':['Courbevoie-Tram','Puteaux-Tram','Grande Arche'],
 'T2':['Issy-Val','Puteaux-Tram','Pont de Bezons']}
TYPES = ['Panne','Malaise voyageur','Signalisation','Colis suspect','Cyber']
inc=[]; iid=1
for _ in range(420):
    l=R.choice(LIGNES); st=R.choice(STATIONS[l]); t=R.choices(TYPES,[40,20,25,10,5])[0]
    d=D(2027,4,1)+datetime.timedelta(minutes=R.randint(0,60*24*40))
    if D(2027,5,12) <= d < D(2027,5,13) and t=='Cyber': t='Panne'
    inc.append([iid,l,st,t,ts(d),ts(d+datetime.timedelta(minutes=R.randint(5,180)))]); iid+=1
attack=D(2027,5,12,6,2,0)
for k,(l,st) in enumerate([('L1','Châtelet-Seine'),('L4','Châtelet-Seine'),('L3','Châtelet-Seine'),('L2','Châtelet-Seine'),('L1','Grande Arche'),('T1','Grande Arche'),('L5','Gare du Nord-Seine'),('L4','Gare du Nord-Seine'),('L2','Bastille-Est'),('L5','Bastille-Est'),('L3','Opéra-Seine'),('T2','Puteaux-Tram'),('T1','Puteaux-Tram')]):
    d=attack+datetime.timedelta(minutes=k*3+R.randint(0,2))
    inc.append([iid,l,st,'Cyber',ts(d),ts(d+datetime.timedelta(hours=R.randint(5,14)))]); iid+=1
inc.sort(key=lambda r:r[4])
for i,r in enumerate(inc): r[0]=i+1
ins('incidents',inc)

# ---------- SAISIES (ordinateur de Marchetti) ----------
sz=[]; sid=1
def add(app, obj):
    global sid; sz.append([sid, app, json.dumps(obj, ensure_ascii=False)]); sid+=1
CONTACTS=['vasseur','lefort','ferrand','avocat','banque_leman','majordome','soeur','coiffeur']
for _ in range(70):
    d=D(2026,9,1)+datetime.timedelta(minutes=R.randint(0,60*24*75))
    de='solene' if R.random()<0.6 else R.choice(CONTACTS)
    a=R.sample(CONTACTS,R.randint(1,2)) if de=='solene' else ['solene']
    txt=R.choice(["On se voit jeudi ?","Rien à signaler.","Le dossier avance.","Ne m'appelle plus sur ce numéro.","Les papiers sont prêts.","Réservation confirmée.","Il faut être patients.","Tout est en ordre à Genève."])
    add('portable', {'type':'message','date':ts(d),'de':de,'a':a,'texte':txt})
for _ in range(25):
    d=D(2026,9,1)+datetime.timedelta(minutes=R.randint(0,60*24*75))
    add('portable', {'type':'agenda','date':ts(d),'titre':R.choice(['Coiffeur','Dîner','Avocat','Golf','Conseil Le Cercle']),'lieu':R.choice(['Genève','Paris','Neuilly','Lausanne'])})
plant=[
 (D(2026,10,2,22,10),{'type':'message','de':'solene','a':['cartographe'],'texte':"Ton plan pour Hélios est parfait. Tu connais leur système mieux que personne."}),
 (D(2026,10,20,23,5),{'type':'message','de':'cartographe','a':['solene'],'texte':"Le technicien est acheté. Mot de passe le 13. Après, on passe à beaucoup plus gros."}),
 (D(2026,11,10,19,30),{'type':'message','de':'solene','a':['cartographe','vasseur'],'texte':"Rappel : vendredi 13, 23h30. Ne vous ratez pas."}),
 (D(2026,11,15,9,0),{'type':'message','de':'cartographe','a':['solene'],'texte':"Si tu tombes, je continue. Projet Éclipse : le matériel arrive à Marseille, quai 4, conteneur MSCU-449120."}),
 (D(2026,11,15,9,4),{'type':'message','de':'solene','a':['cartographe'],'texte':"Compris. Je paierai la suite depuis Genève."}),
]
for d,o in plant: o['date']=ts(d); add('portable',o)
wallets_pay=[('bc1q-eclipse-7f3a',[60000,45000,90000,30000]),('bc1q-golf-22aa',[1200,800]),('bc1q-coiffe-91bb',[300,250,400]),('bc1q-avocat-0c0d',[15000,9000])]
for w,ms in wallets_pay:
    for m in ms:
        d=D(2026,9,1)+datetime.timedelta(minutes=R.randint(0,60*24*76))
        add('portable',{'type':'paiement','date':ts(d),'wallet':w,'montant':m,'devise':'EUR'})
R.shuffle(sz)
for i,r in enumerate(sz): r[0]=i+1
ins('saisies',sz)

# ---------- PORT ----------
NAVIRES=['Stella Maris','Cap Canaille','Ionian Star','Atlas Breeze','Nordkap']
mv=[]; conts=[]
def code(): return R.choice(['MSCU','CMAU','TGHU','MRKU','HLXU'])+str(R.randint(100000,999999))
allc=[code() for _ in range(60)]
if 'MSCU-449120' in allc: pass
allc=[c[:4]+'-'+c[4:] for c in allc]
TARGET='MSCU-449120'
allc.append(TARGET)
SOC=[('512000111','Kartograf SARL','Marseille','FR','2026-11-20'),('512000222','Nordlicht Holding','Luxembourg','LU','2024-06-18'),('512000333','Meridian Trust','Genève','CH','2019-02-11'),
     ('512000444','Provence Import','Marseille','FR','2011-05-09'),('512000555','Seine Logistique','Paris','FR','2008-03-21'),('512000666','Calanques Fret','Marseille','FR','2015-09-30'),
     ('512000777','Baltic Wind','Riga','LV','2020-01-15'),('512000888','Helvetia Partners','Zurich','CH','2016-07-07'),('512000999','Ouali Conseil','Puteaux','FR','2027-01-05'),
     ('512001000','Lumière Négoce','Lyon','FR','2012-10-10')]
ins('societes',SOC)
ins('participations',[('512000222','512000111',100.0),('512000333','512000222',85.0),('512000777','512000222',15.0),('PERSONNE:Farid Ouali','512000333',100.0),
  ('PERSONNE:Inge Larsen','512000777',100.0),('512000888','512000444',60.0),('PERSONNE:Marc Dubreuil','512000888',100.0),('PERSONNE:Farid Ouali','512000999',100.0),
  ('PERSONNE:Claire Neuville','512000555',100.0),('512000444','512000666',51.0),('PERSONNE:Paul Ricci','512000666',49.0),('PERSONNE:Lina Morel','512001000',100.0)])
imps=['512000444','512000555','512000666','512001000']
for c in allc:
    conts.append((c,'512000111' if c==TARGET else R.choice(imps), 'Matériel informatique' if c==TARGET else R.choice(['Textile','Pièces auto','Électroménager','Jouets','Café','Huile d\'olive']), R.randint(4000,26000)))
ins('conteneurs',conts)
for c in allc:
    nav=R.choice(NAVIRES); d=D(2027,4,20)+datetime.timedelta(hours=R.randint(0,24*10))
    seq=['Déchargement','Contrôle','Stockage','Stockage','Stockage','Chargement camion','Sortie'] if c!=TARGET else None
    if c!=TARGET:
        qq=R.randint(1,6)
        for e in seq:
            mv.append([0,c,nav,qq,e,ts(d)]); d+=datetime.timedelta(hours=R.randint(4,30))
            if R.random()<0.3: qq=R.randint(1,6)
    else:
        for e,dt,qq in [('Déchargement',D(2027,4,28,7,15),4),('Contrôle',D(2027,4,28,15,40),4),('Stockage',D(2027,4,29,8,0),4),('Stockage',D(2027,4,30,8,5),4),
                        ('Stockage',D(2027,5,4,9,10),4),('Stockage',D(2027,5,5,8,0),4),('Stockage',D(2027,5,6,8,2),4),('Chargement camion',D(2027,5,6,22,50),4),('Sortie',D(2027,5,6,23,30),4)]:
            mv.append([0,c,'Stella Maris',qq,e,ts(dt)])
# extra daily stockage scans for quai 4 to give a moving average
for day in range(30):
    for _ in range(R.randint(3,12)):
        dt=D(2027,4,15)+datetime.timedelta(days=day,hours=R.randint(6,20),minutes=R.randint(0,59))
        mv.append([0,R.choice(allc[:-1]),R.choice(NAVIRES),4,'Inventaire',ts(dt)])
mv.sort(key=lambda r:r[5])
for i,r in enumerate(mv): r[0]=i+1
ins('mouvements_port',mv)

# ---------- TRAFIC RÉSEAU ----------
POSTES=[f'PCC-{i:02d}' for i in range(1,21)]+[f'MAINT-{i:02d}' for i in range(1,11)]+['SRV-SIGNAL-1','SRV-SIGNAL-2','SRV-BILLET']
ipof={p:f'10.20.{i//250}.{i%250+10}' for i,p in enumerate(POSTES)}
DST=['10.20.9.1','10.20.9.2','10.20.9.3','192.0.2.10','192.0.2.20','203.0.113.5']
C2='198.51.100.200'
tr=[]
for _ in range(6000):
    p=R.choice(POSTES); d=D(2027,5,11,0,0)+datetime.timedelta(seconds=R.randint(0,2*24*3600))
    tr.append([0,ts(d),p,ipof[p],R.choice(DST),R.choice([443,80,53,22,3389]),int(R.lognormvariate(8,0.8))])
pz=D(2027,5,12,5,47,12)
tr.append([0,ts(pz),'MAINT-07',ipof['MAINT-07'],C2,443,4120])
infected=['MAINT-07','SRV-SIGNAL-1','PCC-03','PCC-11','SRV-SIGNAL-2','PCC-07','MAINT-02','SRV-BILLET','PCC-15']
t=pz
for k,p in enumerate(infected):
    if k>0: t=t+datetime.timedelta(minutes=R.randint(2,7))
    for j in range(R.randint(6,14)):
        tt=t+datetime.timedelta(minutes=j*R.randint(3,9))
        tr.append([0,ts(tt),p,ipof[p],C2,443,R.randint(2000,9000)])
# exfiltration énorme
for p,oc in [('SRV-BILLET',48000000),('SRV-SIGNAL-1',36500000),('PCC-03',29000000)]:
    tr.append([0,ts(D(2027,5,12,6,40)+datetime.timedelta(minutes=R.randint(0,30))),p,ipof[p],C2,443,oc])
# derniers contacts le soir
for p in ['SRV-BILLET','PCC-11','MAINT-07']:
    tr.append([0,ts(D(2027,5,12,23,R.randint(25,48),R.randint(0,59))),p,ipof[p],C2,443,R.randint(3000,6000)])
tr.sort(key=lambda r:r[1])
for i,r in enumerate(tr): r[0]=i+1
ins('trafic',tr)
ss=[]; k=1
for p in POSTES:
    d=D(2027,5,11,6,0)
    while d<D(2027,5,13):
        fin=d+datetime.timedelta(hours=R.randint(2,8))
        login=('agent.'+p.lower().replace('-','')) if not p.startswith('MAINT') else R.choice(['tech.durand','tech.benali','tech.morin','tech.leclerc'])
        if p=='MAINT-07' and d<=pz<fin: login='ext.kartograf'
        ss.append([k,p,login,ts(d),ts(fin)]); k+=1
        d=fin+datetime.timedelta(minutes=R.randint(10,120))
# s'assurer qu'une session couvre pz pour MAINT-07
if not any(s[1]=='MAINT-07' and s[3]<=ts(pz)<s[4] for s in ss):
    ss.append([k,'MAINT-07','ext.kartograf',ts(pz-datetime.timedelta(minutes=20)),ts(pz+datetime.timedelta(minutes=50))]); k+=1
else:
    for s in ss:
        if s[1]=='MAINT-07' and s[3]<=ts(pz)<s[4]: s[2]='ext.kartograf'
ins('sessions_postes',ss)

# ---------- CRYPTO ----------
W=[('bc1q-eclipse-7f3a','perso',None,None)]
mix=[f'bc1q-mix-{i:02d}' for i in range(1,13)]
pers=[f'bc1q-p-{i:03d}' for i in range(1,40)]
exch=[('EXCH-NEO-5521','exchange','NeoCoin','F. OUALI'),('EXCH-NEO-1180','exchange','NeoCoin','J. MARTIN'),('EXCH-ALP-0042','exchange','AlpenX','A. KELLER'),('EXCH-ALP-0777','exchange','AlpenX','S. MARCHETTI'),('EXCH-BLT-3030','exchange','BalticEx','I. LARSEN')]
W+= [(m,'mixeur','TumbleNet',None) for m in mix]+[(p,'perso',None,None) for p in pers]+exch
W+= [('bc1q-golf-22aa','perso',None,None),('bc1q-coiffe-91bb','perso',None,None),('bc1q-avocat-0c0d','perso',None,None)]
ins('wallets',W)
tx=[]
def addtx(a,b,m,d): tx.append([0,a,b,round(m,4),ts(d)])
d0=D(2027,5,12,10,0)
addtx('bc1q-eclipse-7f3a','bc1q-mix-03',12.5,d0); addtx('bc1q-eclipse-7f3a','bc1q-mix-07',8.0,d0+datetime.timedelta(minutes=20)); addtx('bc1q-eclipse-7f3a','bc1q-p-011',0.4,d0+datetime.timedelta(hours=1))
addtx('bc1q-mix-03','bc1q-mix-05',6.2,d0+datetime.timedelta(hours=2)); addtx('bc1q-mix-03','bc1q-mix-09',6.1,d0+datetime.timedelta(hours=2,minutes=5))
addtx('bc1q-mix-07','bc1q-mix-05',7.9,d0+datetime.timedelta(hours=3))
addtx('bc1q-mix-05','bc1q-mix-03',1.0,d0+datetime.timedelta(hours=4))  # cycle
addtx('bc1q-mix-05','bc1q-mix-11',12.9,d0+datetime.timedelta(hours=5))
addtx('bc1q-mix-09','bc1q-p-020',6.0,d0+datetime.timedelta(hours=6))
addtx('bc1q-mix-11','EXCH-NEO-5521',12.8,d0+datetime.timedelta(hours=9))
addtx('bc1q-p-020','EXCH-ALP-0042',5.9,d0+datetime.timedelta(hours=12))
addtx('bc1q-p-011','bc1q-p-012',0.39,d0+datetime.timedelta(hours=7))
for _ in range(900):
    a,b=R.sample(pers+mix[:2]+[e[0] for e in exch[1:]],2)
    addtx(a,b,R.uniform(0.01,3),D(2027,3,1)+datetime.timedelta(minutes=R.randint(0,60*24*70)))
tx.sort(key=lambda r:r[4])
for i,r in enumerate(tx): r[0]=i+1
ins('tx_crypto',tx)

# ---------- BRIGADE : pièces, journal, consultants ----------
P=[]; pid=1
DESCS=['Empreinte de chaussure pointure 45','Journal de connexion 203.0.113.66','Fadettes Ferrand','Relevé CH-9131','Badge cloné B-0019','Disque dur Marchetti','Photo caméra Esplanade',
       'Facture Kartograf SARL','Capture réseau MAINT-07','Clé USB trouvée au dépôt','Contrat Ouali Conseil','Bordereau conteneur MSCU-449120','Témoignage dépôt de maintenance','Relevé NeoCoin']
for i,dsc in enumerate(DESCS):
    P.append([i+1,'Minuit' if i<7 else 'Éclipse',dsc,ts(D(2026,11,14)+datetime.timedelta(days=i*2)) if i<7 else ['2027-05-12 14:05:00','2027-05-12 19:12:00','2027-05-12 19:20:00','2027-05-12 20:02:00','2027-05-12 14:31:00','2027-05-12 19:41:00','2027-05-12 19:35:00'][i-7]])
deleted_ids=[8,9,10,13]
ins('pieces',[p for p in P if p[0] not in deleted_ids])
J=[]; jid=1
for _ in range(160):
    lg=R.choice(['i.varga','n.kessler','agent.roux','agent.diallo','y.haddad'])
    act=R.choices(['SELECT','INSERT','UPDATE','DELETE'],[70,15,12,3])[0]
    tid=R.randint(1,14); old=None
    if act=='DELETE': act='SELECT'
    J.append([0,lg,act,'pieces',tid,old,ts(D(2027,5,1)+datetime.timedelta(minutes=R.randint(0,60*24*20)))])
for pidd,t in zip(deleted_ids,['2027-05-12 21:52:09','2027-05-12 21:52:40','2027-05-12 21:53:02','2027-05-12 21:54:18']):
    p=next(x for x in P if x[0]==pidd)
    J.append([0,'consultant.fo','DELETE','pieces',pidd,json.dumps({'affaire':p[1],'description':p[2],'ajoutee_le':p[3]},ensure_ascii=False),t])
J.append([0,'agent.roux','DELETE','pieces',99,json.dumps({'affaire':'Test','description':'Doublon de test','ajoutee_le':'2027-05-02 10:00:00'},ensure_ascii=False),'2027-05-02 10:05:00'])
J.sort(key=lambda r:r[6])
for i,r in enumerate(J): r[0]=i+1
ins('journal_brigade',J)
ins('consultants',[('consultant.fo','Farid Ouali','512000999','Audit sécurité de la base de la brigade'),('consultant.ab','Anne Berthier','512000555','Formation SQL'),
                   ('ext.kartograf','Inconnu (compte prestataire)','512000111','Maintenance TransSeine'),('consultant.jl','Jules Lambert','512001000','Archivage')])
ins('compteurs_alertes',[('Grande Arche',3),('Puteaux-Tram',1)])

# ---------- TÉMOIGNAGES BRUTS ----------
TB=[]; tid=1
base=[('Martine Dubois','06 12 34 56 78'),('Ahmed Kaci','0698765432'),('Julie Perrin','07 11 22 33 44'),('Gérard Lemaire','0655443322'),('Sofia Rossi','06 01 02 03 04'),('Tom Nguyen','0788990011')]
variants=lambda n: [n, n.upper(), '  '+n, n.lower(), n+' ']
for n,tel in base:
    for v in R.sample(variants(n),R.randint(1,3)):
        tels=[tel, tel.replace(' ',''), tel]
        veh=R.choice(['EF-310-OU','ef310ou','EF 310 OU',' ef-310-ou','EF-310-OU','AB-123-CD','ab 123 cd',None])
        TB.append([tid,ts(D(2027,5,12,R.randint(7,20),R.randint(0,59))),v,R.choice(tels),R.choice(["Une Tesla grise garée devant le dépôt de maintenance à 5h40.","J'ai vu un homme en costume avec un ordinateur portable entrer au dépôt.","Il y avait une voiture électrique grise, très silencieuse.","Un utilitaire blanc est passé plusieurs fois.","Un homme élégant aux tempes grises parlait au téléphone."]),veh]); tid+=1
for _ in range(14):
    n=R.choice(['Paul Martin','Inès Roux','Hugo Bernard','Léa Petit','Nadia Benali'])
    TB.append([tid,ts(D(2027,5,12,R.randint(7,20),R.randint(0,59))),n,'06'+''.join(str(R.randint(0,9)) for _ in range(8)),"Rien vu de particulier, beaucoup de monde sur le quai.",R.choice([None,'','KL-552-PM','kl552pm'])]); tid+=1
TB.sort(key=lambda r:r[1])
for i,r in enumerate(TB): r[0]=i+1
ins('temoignages_bruts',TB)
ins('cartes_grises',[('EF-310-OU','Tesla','Grise','Kartograf SARL'),('AB-123-CD','Renault','Blanche','Seine Logistique'),('GH-713-KZ','Audi','Noire','Karine Lefort'),('KL-552-PM','Peugeot','Bleue','Provence Import')])
sys.stdout.write("\n".join(out)+"\n")
