import random, datetime, sys
R = random.Random(1313)
out = []
def q(v):
    if v is None: return 'NULL'
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"
def ins(t, rows):
    for r in rows:
        out.append(f"INSERT INTO {t} VALUES ({', '.join(q(x) for x in r)});")

PH = ["Lucas","Hugo","Louis","Nathan","Gabriel","Arthur","Jules","Adam","Raphaël","Léo","Thomas","Maxime","Antoine","Julien","Nicolas","Alexandre","Romain","Kevin","Mehdi","Karim","Yanis","Samir","Bruno","Patrick","Didier","Pascal","Thierry","Olivier","Franck","Laurent","Sébastien","Cédric","Fabrice","Rachid","Omar","Stéphane","Benoît","Gilles","Hervé","Igor","Milan","Enzo","Noah","Tom","Paul","Victor","Simon","Bastien","Yves","Marcel"]
PF = ["Emma","Jade","Louise","Alice","Chloé","Lina","Léa","Manon","Inès","Sarah","Camille","Julie","Laura","Marie","Sophie","Nathalie","Isabelle","Sandrine","Céline","Aurélie","Karine","Nadia","Yasmine","Fatima","Amel","Claire","Pauline","Elodie","Anaïs","Mélanie","Audrey","Valérie","Sylvie","Agnès","Hélène","Margot","Zoé","Lou","Romane","Clara","Océane","Léna","Eva","Rose","Anna","Nina","Maëlle","Salomé","Justine","Lucie"]
NOMS = ["Martin","Bernard","Dubois","Thomas","Robert","Richard","Petit","Durand","Leroy","Moreau","Simon","Laurent","Lefebvre","Michel","Garcia","David","Bertrand","Roux","Vincent","Fournier","Morel","Girard","André","Mercier","Dupont","Lambert","Bonnet","François","Martinez","Legrand","Garnier","Faure","Rousseau","Blanc","Guerin","Muller","Henry","Roussel","Nicolas","Perrin","Morin","Mathieu","Clément","Gauthier","Dumont","Lopez","Fontaine","Chevalier","Robin","Masson","Sanchez","Gerard","Nguyen","Boyer","Denis","Lemaire","Duval","Joly","Gautier","Roger","Roche","Roy","Noel","Meyer","Lucas","Meunier","Jean","Perez","Marchand","Dufour","Blanchard","Marie","Barbier","Brun","Dumas","Brunet","Schmitt","Leroux","Colin","Fernandez","Pierre","Renard","Arnaud","Rolland","Caron","Aubert","Giraud","Leclerc","Vidal","Bourgeois","Renaud","Lemoine","Picard","Gaillard","Philippe","Leclercq","Lacroix","Fabre","Dupuis","Olivier","Rodriguez","Da Silva","Hubert","Louis","Charles","Guillot","Rivière","Le Gall","Guillaume","Adam","Rey","Moulin","Gonzalez","Berger","Lecomte","Menard","Fleury","Deschamps","Carpentier","Julien","Benard","Paris","Maillard","Marchal","Aubry","Vasseur","Le Roux","Renault","Jacquet","Collet","Prevost","Poirier","Charpentier","Royer","Huet","Baron","Dupuy","Pons","Paul","Laine","Carre","Breton","Remy","Schneider","Perrot","Guyot","Barre","Marty","Cousin","Haddad","Benali","Kaci","Diallo","Traoré","Bensaïd"]
VILLES = ["Puteaux","Courbevoie","Nanterre","Paris","Neuilly-sur-Seine","Levallois-Perret","Saint-Denis","Boulogne-Billancourt","Lille","Marseille"]
VW = [8,8,10,25,4,6,7,6,4,4]

# ---------------- SUSPECTS ----------------
THIEF1 = 217; THIEF2 = 388; BRAIN = 131
def is_t1_like(s):
    return s['sexe']=='H' and s['cicatrices']=='Oui' and s['cheveux'] in ('Noirs','Bruns') and s['pointure']>=44 and 50<=s['age']<=59 and s['lunettes']=='Oui'
def is_t2_like(s):
    return s['sexe']=='F' and s['taille']=='Grande' and s['cheveux'] in ('Roux','Blonds') and s['tatouages']=='Oui' and s['telephone'] is None and s['nom'].startswith('Le')
used_phones=set()
def phone():
    while True:
        p = "06" + "".join(str(R.randint(0,9)) for _ in range(8))
        if p not in used_phones: used_phones.add(p); return p
def mk(i):
    sexe = R.choice(['H','H','F'])
    s = dict(id=i, prenom=R.choice(PH if sexe=='H' else PF), nom=R.choice(NOMS), sexe=sexe,
             age=R.randint(18,82), taille=R.choice(['Petite','Moyenne','Moyenne','Grande']),
             cheveux=R.choices(['Noirs','Bruns','Blonds','Roux','Gris','Chauve',None],[30,30,15,5,10,6,4])[0],
             yeux=R.choice(['Marron','Marron','Bleus','Verts','Noirs']),
             barbe=('Non' if sexe=='F' else R.choice(['Oui','Non'])),
             tatouages=R.choice(['Oui','Non']), lunettes=R.choice(['Oui','Non','Non']),
             cicatrices=R.choice(['Oui','Non','Non']),
             pointure=(R.randint(39,47) if sexe=='H' else R.randint(35,42)),
             ville=R.choices(VILLES,VW)[0], telephone=(None if R.random()<0.12 else phone()))
    if s['email' if False else 'id']: pass
    return s
suspects=[]
for i in range(1,501):
    while True:
        s=mk(i)
        if not is_t1_like(s) and not is_t2_like(s): break
    suspects.append(s)
def setS(i, **kw): suspects[i-1].update(kw)
setS(THIEF1, prenom='Marc', nom='Vasseur', sexe='H', age=54, taille='Grande', cheveux='Bruns', yeux='Verts', barbe='Oui', tatouages='Non', lunettes='Oui', cicatrices='Oui', pointure=45, ville='Courbevoie', telephone='0611223344')
setS(THIEF2, prenom='Karine', nom='Lefort', sexe='F', age=37, taille='Grande', cheveux='Roux', yeux='Bleus', barbe='Non', tatouages='Oui', lunettes='Non', cicatrices='Non', pointure=40, ville='Nanterre', telephone=None)
setS(BRAIN, prenom='Solène', nom='Marchetti', sexe='F', age=46, taille='Moyenne', cheveux='Noirs', yeux='Marron', barbe='Non', tatouages='Non', lunettes='Oui', cicatrices='Non', pointure=38, ville='Neuilly-sur-Seine', telephone='0699887766')
used_phones.update(['0611223344','0699887766'])
assert sum(is_t1_like(s) for s in suspects)==1 and sum(is_t2_like(s) for s in suspects)==1
cols=['id','prenom','nom','sexe','age','taille','cheveux','yeux','barbe','tatouages','lunettes','cicatrices','pointure','ville','telephone']
ins('suspects',[[s[c] for c in cols] for s in suspects])

# ---------------- GANGS ----------------
gangs=[(1,'Les Corbeaux','Courbevoie',None,2009),(2,'Le Cercle','Neuilly-sur-Seine',BRAIN,2015),(3,'Les Highlanders','Saint-Denis',None,2003),
       (4,'La Meute','Lille',None,2012),(5,'Les Calanques','Marseille',None,1998),(6,'Nuit Blanche','Paris',None,2018),(7,'Les Fantômes','Nanterre',None,2021),(8,'Code Zéro','Paris',None,2023)]
pool=[s['id'] for s in suspects if s['id'] not in (THIEF1,THIEF2,BRAIN)]
R.shuffle(pool)
membres=[]; k=0
roles=['Membre','Membre','Membre','Guetteur','Chauffeur','Recruteur']
chefs={}
for g in gangs:
    n=R.randint(12,22)
    mem=pool[k:k+n]; k+=n
    if g[3] is None: chefs[g[0]]=mem[0]
    for j,m in enumerate(mem):
        role='Chef' if (j==0 and g[3] is None) else R.choice(roles)
        d=datetime.date(max(g[4],2000),1,1)+datetime.timedelta(days=R.randint(0,max(1,(datetime.date(2026,6,1)-datetime.date(max(g[4],2000),1,1)).days)))
        membres.append((m,g[0],role,d.isoformat()))
membres += [(BRAIN,2,'Chef','2015-03-02'),(THIEF1,1,'Lieutenant','2011-09-14'),(THIEF1,2,'Membre','2025-02-01'),(THIEF2,2,'Chauffeur','2025-04-19')]
# some double memberships
for m in R.sample(pool[:k],12):
    g=R.randint(1,8)
    if not any(x[0]==m and x[1]==g for x in membres): membres.append((m,g,'Membre','2024-0%d-1%d'%(R.randint(1,9),R.randint(0,9))))
gangs=[(g[0],g[1],g[2],g[3] if g[3] else chefs[g[0]],g[4]) for g in gangs]
ins('gangs',gangs); ins('membres',membres)

# ---------------- DELITS ----------------
TYPES=[('Vol',2500),('Cambriolage',12000),('Vol de voiture',18000),('Escroquerie',35000),('Fraude informatique',60000),('Recel',8000),('Braquage',90000),('Trouble à l\'ordre public',300),('Vandalisme',1500),('Usurpation d\'identité',9000),('Phishing',22000)]
PRISONS=['Fleury-Mérogis','La Santé','Fresnes','Nanterre','Les Baumettes','Loos-lès-Lille']
delits=[]; did=1
def add_delit(sid, typ=None, year=None):
    global did
    t,base = R.choice(TYPES) if typ is None else next(x for x in TYPES if x[0]==typ)
    y = year or R.randint(2005,2026)
    d=datetime.date(y,1,1)+datetime.timedelta(days=R.randint(0,330 if y==2026 else 364))
    debut=d+datetime.timedelta(days=R.randint(20,200))
    fin=debut+datetime.timedelta(days=R.randint(30,1500))
    pr = round(base*R.uniform(0.2,2.5),2) if R.random()>0.05 else None
    comp=R.choice(['Bon','Bon','Mauvais'])
    delits.append([did,sid,t,d.isoformat(),R.choices(VILLES,VW)[0],R.choice(PRISONS),comp,debut.isoformat(),fin.isoformat(),pr]); did+=1
recid=R.sample([s['id'] for s in suspects if s['id'] not in (THIEF1,THIEF2,BRAIN)],330)
for sid in recid:
    for _ in range(R.choices([1,2,3,4,5,7],[40,25,15,10,7,3])[0]): add_delit(sid)
for y,t in [(2006,'Vol'),(2009,'Cambriolage'),(2012,'Braquage'),(2014,'Recel'),(2018,'Braquage'),(2022,'Cambriolage')]: add_delit(THIEF1,t,y)
for y,t in [(2016,'Vol de voiture'),(2019,'Vol de voiture'),(2023,'Escroquerie')]: add_delit(THIEF2,t,y)
R.shuffle(delits)
ins('delits',delits)
assert max(sum(1 for d in delits if d[1]==s) for s in recid) <= 7

# ---------------- VEHICULES / CAMERAS ----------------
def plate():
    L='ABCDEFGHJKLMNPRSTVWXYZ'
    return f"{R.choice(L)}{R.choice(L)}-{R.randint(100,999)}-{R.choice(L)}{R.choice(L)}"
MARQUES=['Renault','Peugeot','Citroën','Volkswagen','Toyota','BMW','Audi','Dacia','Tesla','Fiat']
COUL=['Noire','Blanche','Grise','Bleue','Rouge','Verte']
veh=[]; plates=set()
for s in suspects:
    for _ in range(R.choices([0,1,2],[25,65,10])[0]):
        p=plate()
        while p in plates: p=plate()
        plates.add(p); veh.append((p,s['id'],R.choice(MARQUES),R.choice(COUL),R.randint(2005,2026)))
veh=[v for v in veh if v[1]!=THIEF2]
veh.append(('GH-713-KZ',THIEF2,'Audi','Noire',2022)); veh.append(('FB-221-TR',THIEF1,'Peugeot','Grise',2017))
ins('vehicules',veh)
LIEUX=['Esplanade La Défense','Pont de Neuilly','Porte Maillot','Rond-point de la Boule','A14 Péage','Quai de Dion-Bouton']
cams=[]; cid=1
allp=[v[0] for v in veh]
for _ in range(1400):
    day=datetime.datetime(2026,11,1)+datetime.timedelta(minutes=R.randint(0,60*24*20))
    cams.append([cid,R.choice(LIEUX),day.strftime('%Y-%m-%d %H:%M:%S'),R.choice(allp) if R.random()>0.15 else plate()]); cid+=1
# night of the heist: 2026-11-13 23:00 -> 2026-11-14 00:30 at Esplanade: a handful of cars
for t,p in [('2026-11-13 23:04:12',R.choice(allp)),('2026-11-13 23:17:40',R.choice(allp)),('2026-11-13 23:52:09','GH-713-KZ'),('2026-11-14 00:11:31',R.choice(allp)),('2026-11-13 23:58:55','XX-000-XX'),('2026-11-14 00:05:02','GH-713-KZ')]:
    cams.append([cid,'Esplanade La Défense',t,p]); cid+=1
cams.append([cid,'Pont de Neuilly','2026-11-14 00:14:47','GH-713-KZ']); cid+=1
cams.append([cid,'A14 Péage','2026-11-14 00:31:20','GH-713-KZ']); cid+=1
# remove random hits on esplanade in the window for GH plate other than planted
cams.sort(key=lambda r:r[2])
for i,c in enumerate(cams): c[0]=i+1
ins('cameras',cams)

# ---------------- AGENCES / EMPLOYES ----------------
agences=[(1,'Hélios La Défense','Puteaux'),(2,'Hélios Opéra','Paris'),(3,'Hélios Neuilly','Neuilly-sur-Seine'),(4,'Hélios Lille Centre','Lille'),(5,'Hélios Vieux-Port','Marseille'),(6,'Siège Hélios','Paris')]
POSTES=['Conseiller','Conseiller','Guichetier','Analyste risques','Technicien sécurité','Chargé de clientèle','Responsable agence','Directeur régional','Administrateur SI','Comptable']
emp=[]
# eid, prenom, nom, poste, agence_id, manager_id, salaire, embauche, badge, telephone, login
emp.append([1,'Arnaud','Delacroix','Président',6,None,14800,'2004-01-05','B-0001',phone(),'a.delacroix'])
emp.append([2,'Martine','Hollier','Directrice des opérations',6,1,9900,'2008-03-17','B-0002',phone(),'m.hollier'])
emp.append([3,'Farid','Ouali','Directeur SI',6,1,9600,'2011-06-01','B-0003',phone(),'f.ouali'])
eid=4
for a in agences[:5]:
    emp.append([eid,R.choice(PH+PF),R.choice(NOMS),'Responsable agence',a[0],2,R.randint(5200,6800),f"{R.randint(2005,2018)}-0{R.randint(1,9)}-1{R.randint(0,9)}",f"B-{eid:04d}",phone(),None]); eid+=1
mgr_of_agence={a[0]:4+i for i,a in enumerate(agences[:5])}
FERRAND=27
while eid<=64:
    a=R.randint(1,5)
    p=R.choice(POSTES[:6]+['Administrateur SI','Comptable'])
    m = 3 if p=='Administrateur SI' else mgr_of_agence[a]
    emp.append([eid,R.choice(PH+PF),R.choice(NOMS),p,a if p!='Administrateur SI' else 6,m,R.randint(2100,4800),f"{R.randint(2008,2026)}-{R.randint(1,12):02d}-{R.randint(10,28)}",f"B-{eid:04d}",phone(),None]); eid+=1
e=emp[FERRAND-1]; e[1:9]=['Julien','Ferrand','Technicien sécurité',1,4,2650,'2023-02-13','B-0027']; e[9]='0645454545'
# team leads under agence managers for hierarchy depth
emp[30-1][3]='Chef d\'équipe'; emp[30-1][4]=1; emp[30-1][5]=4
for x in emp:
    if x[4]==1 and x[0] not in (4,30) and x[3] not in ('Responsable agence',): x[5]=30
emp[FERRAND-1][5]=30
seen=set()
for x in emp:
    if x[10] is None:
        base=(x[1][0]+'.'+x[2]).lower().replace(' ','').replace('é','e').replace('è','e').replace('ë','e').replace('ï','i').replace('ç','c').replace('î','i').replace('ô','o')
        b2=base; n=2
        while b2 in seen: b2=base+str(n); n+=1
        x[10]=b2
    seen.add(x[10])
logins=[x[10] for x in emp]
assert len(set(logins))==len(logins), 'dup logins'
ins('employes',emp)
ins('agences',[(a[0],a[1],a[2],mgr_of_agence.get(a[0],1)) for a in agences])

# ---------------- ACCES BADGES ----------------
PORTES=['Entrée principale','Salle des coffres','Salle serveurs','Parking','Bureau direction']
badges=[]; bid=1
for _ in range(900):
    x=R.choice(emp)
    day=datetime.datetime(2026,11,2)+datetime.timedelta(days=R.randint(0,15),hours=R.randint(7,19),minutes=R.randint(0,59),seconds=R.randint(0,59))
    porte=R.choices(PORTES,[50,6,8,30,6])[0]
    res='OK' if R.random()>0.06 else 'REFUSE'
    badges.append([0,x[8],x[0],x[4] if x[4]!=6 else 1,porte,day.strftime('%Y-%m-%d %H:%M:%S'),res])
night=[('B-0027',27,1,'Parking','2026-11-13 22:48:10','OK'),('B-0027',27,1,'Entrée principale','2026-11-13 22:51:37','OK'),
       ('B-0027',27,1,'Salle serveurs','2026-11-13 23:09:02','OK'),('B-0027',27,1,'Salle des coffres','2026-11-13 23:31:44','OK'),
       ('B-0027',27,1,'Entrée principale','2026-11-13 23:58:20','OK'),('B-0027',27,1,'Parking','2026-11-14 00:02:51','OK'),
       ('B-0012',12,1,'Entrée principale','2026-11-13 22:05:12','OK'),('B-0012',12,1,'Parking','2026-11-13 22:20:49','OK'),
       ('B-0019',19,1,'Salle des coffres','2026-11-13 23:40:05','REFUSE'),('B-0004',4,1,'Bureau direction','2026-11-13 21:15:30','OK')]
for n in night: badges.append([0,*n[0:2],n[2],*n[3:]])
# make B-0019 owner agency 1 for consistency
badges.sort(key=lambda r:r[5])
for i,b in enumerate(badges): b[0]=i+1
ins('acces_badges',badges)

# ---------------- CONNEXIONS ----------------
con=[]
PAYS=['FR','FR','FR','FR','FR','BE','ES','DE']
ips={x[10]:f"10.{R.randint(1,9)}.{R.randint(0,255)}.{R.randint(1,254)}" for x in emp}
for _ in range(2600):
    x=R.choice(emp)
    t=datetime.datetime(2026,11,1)+datetime.timedelta(minutes=R.randint(0,60*24*16))
    ok = 1 if R.random()>0.07 else 0
    con.append([0,x[10],ips[x[10]] if R.random()>0.1 else f"192.168.{R.randint(0,5)}.{R.randint(1,254)}",t.strftime('%Y-%m-%d %H:%M:%S'),ok,'FR' if R.choice(PAYS) else 'FR'])
# noisy but legit-ish external scanners
for ip,n,p in [('198.51.100.23',9,'US'),('198.51.100.88',14,'BR'),('192.0.2.140',6,'CN')]:
    for _ in range(n):
        t=datetime.datetime(2026,11,R.randint(3,12),R.randint(0,23),R.randint(0,59),R.randint(0,59))
        con.append([0,R.choice(logins),ip,t.strftime('%Y-%m-%d %H:%M:%S'),0,p])
t=datetime.datetime(2026,11,13,22,40,0)
for i in range(240):
    t+=datetime.timedelta(seconds=R.randint(3,8))
    con.append([0,R.choice(logins+['admin','root','test','helios']),'203.0.113.66',t.strftime('%Y-%m-%d %H:%M:%S'),0,'NL'])
for tt,lg in [('2026-11-13 22:31:02',"admin' --"),('2026-11-13 22:31:40',"' OR '1'='1' --"),('2026-11-13 22:33:15',"x' UNION SELECT login, hash_mdp FROM utilisateurs_portail --"),('2026-11-13 22:34:51',"admin'/*")]:
    con.append([0,lg,'203.0.113.66',tt,0,'NL'])
con.append([0,'j.ferrand','203.0.113.66','2026-11-13 23:18:42',1,'NL'])
con.append([0,'j.ferrand','203.0.113.66','2026-11-13 23:44:03',1,'NL'])
con.sort(key=lambda r:r[3])
for i,c in enumerate(con): c[0]=i+1
ins('connexions',con)

# ---------------- APPELS ----------------
allphones=[s['telephone'] for s in suspects if s['telephone']]+[x[9] for x in emp]
app=[]
for _ in range(1600):
    a,b=R.sample(allphones,2)
    t=datetime.datetime(2026,10,15)+datetime.timedelta(minutes=R.randint(0,60*24*32))
    app.append([0,a,b,t.strftime('%Y-%m-%d %H:%M:%S'),R.randint(5,1800)])
PF_,PV,PM='0645454545','0611223344','0699887766'
BURNER='0700000713'
for a,b,t,d in [(PM,PF_,'2026-11-10 19:02:11',412),(PF_,PV,'2026-11-12 21:40:00',95),(PV,BURNER,'2026-11-13 22:30:18',61),(PF_,PV,'2026-11-13 23:33:05',38),
                (PV,PM,'2026-11-14 00:20:44',203),(PF_,PM,'2026-11-14 00:25:10',27),(BURNER,PV,'2026-11-14 00:06:59',44),(PM,'0601020304','2026-11-14 08:00:00',600)]:
    app.append([0,a,b,t,d])
app.sort(key=lambda r:r[3])
for i,a in enumerate(app): a[0]=i+1
ins('appels',app)

# ---------------- COMPTES / VIREMENTS ----------------
comptes=[('HEL-COFFRE-01',None,'Hélios','2004-01-05')]
owners=R.sample([s['id'] for s in suspects],380)
for i,o in enumerate(owners):
    comptes.append((f"FR76-{1000+i:04d}",o,R.choice(['Hélios','Banque Ouest','Crédit Bleu','NéoBanq']),f"{R.randint(2005,2026)}-{R.randint(1,12):02d}-{R.randint(10,28)}"))
# trail accounts
trail=['FR76-7001','LT-4402','MT-0913','CY-2207','CH-9131']
tr_owner={'FR76-7001':None,'LT-4402':None,'MT-0913':None,'CY-2207':None,'CH-9131':None}
for c in trail: comptes.append((c,tr_owner[c],{'FR':'NéoBanq','LT':'Baltic Pay','MT':'Malta Trust','CY':'Kyrenia Bank','CH':'Banque Lémanique'}[c[:2]],'2025-0%d-15'%R.randint(1,9)))
comptes=[c for c in comptes if c[1]!=BRAIN]+[('FR76-0131',BRAIN,'Crédit Bleu','2012-05-02')]
comptes=[c if c[0]!='CH-9131' else (c[0],BRAIN,c[2],c[3]) for c in comptes]
ins('comptes',comptes)
vir=[]; acc=[c[0] for c in comptes if c[0] not in trail and c[0]!='HEL-COFFRE-01']
for _ in range(2200):
    a,b=R.sample(acc,2)
    t=datetime.datetime(2026,9,1)+datetime.timedelta(minutes=R.randint(0,60*24*80))
    vir.append([0,a,b,round(R.uniform(10,4000),2),t.strftime('%Y-%m-%d %H:%M:%S')])
# legit outgoing from coffre
for _ in range(15):
    t=datetime.datetime(2026,11,R.randint(1,12),R.randint(9,17),R.randint(0,59))
    vir.append([0,'HEL-COFFRE-01',R.choice(acc),round(R.uniform(1000,20000),2),t.strftime('%Y-%m-%d %H:%M:%S')])
chain=[('HEL-COFFRE-01','FR76-7001',480000.00,'2026-11-13 23:21:05'),('FR76-7001','LT-4402',475000.00,'2026-11-13 23:36:40'),
       ('LT-4402','MT-0913',470000.00,'2026-11-14 02:10:12'),('MT-0913','CY-2207',462500.00,'2026-11-14 07:45:00'),('CY-2207','CH-9131',455000.00,'2026-11-14 11:30:30'),
       ('FR76-7001',R.choice(acc),4800.00,'2026-11-13 23:40:00'),('LT-4402',R.choice(acc),4950.00,'2026-11-14 02:15:00'),('MT-0913',R.choice(acc),7400.00,'2026-11-14 08:00:00'),
       ('CH-9131','FR76-0131',9900.00,'2026-11-15 10:00:00')]
for c in chain: vir.append([0,*c])
vir.sort(key=lambda r:r[4])
for i,v in enumerate(vir): v[0]=i+1
ins('virements',vir)

# ---------------- PORTAIL (injection) ----------------
portail=[(1,'admin','9f86d081884c7d65','Administrateur'),(2,'j.ferrand','5e884898da280471','Technicien'),(3,'m.hollier','2c26b46b68ffc68f','Direction'),
         (4,'f.ouali','fcde2b2edba56bf4','Administrateur'),(5,'stagiaire','b5bb9d8014a0f9b1','Lecture'),(6,'audit','7c222fb2927d828a','Lecture')]
ins('utilisateurs_portail',portail)
sys.stdout.write("\n".join(out)+"\n")
print(f"-- suspects {len(suspects)} delits {len(delits)} membres {len(membres)} cams {len(cams)} badges {len(badges)} con {len(con)} appels {len(app)} vir {len(vir)} comptes {len(comptes)}", file=sys.stderr)
