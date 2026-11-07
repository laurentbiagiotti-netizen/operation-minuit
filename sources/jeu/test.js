global.window = globalThis; window.__NO_BOOT = true;
const fs = require('fs'), B = __dirname + '/';
const initSqlJs = require(B + 'node_modules/sql.js/dist/sql-wasm.js');
eval(['missions1.js','missions2.js','story.js','missions_boss.js','missions3.js','story2.js','missions4.js','story3.js','missions6.js','story5.js','missions5.js','story4.js','sides1.js','sides2.js','sides3.js','sides4.js'].map(f=>fs.readFileSync(B+f,'utf8')).join('\n'));
eval(fs.readFileSync(B+'app.js','utf8'));
(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database(); ['schema','data','data2','data3','data4','data5'].forEach(f => db.exec(fs.readFileSync(B+f+'.sql','utf8')));
  const M = window.__MINUIT; M.init(SQL, db.export());
  let bad = 0;
  for (const m of MISSIONS) {
    if (m.check.mode === 'answer' || m.check.mode === 'plan') { if (m.check.mode === 'plan') { const r = M.evaluate(m, m.solution); console.log(r.verdict.ok ? 'OK  ' : 'FAIL', m.id, 'plan', r.verdict.msg||''); if(!r.verdict.ok) bad++; continue; } console.log('OK  ', m.id, 'answer'); continue; }
    const ref = M.reference(m);
    if (ref.error || (!ref.set && !ref.verify)) { console.log('REFERR', m.id, ref.error); bad++; continue; }
    const info = ref.set ? `${ref.set.values.length} lignes x ${ref.set.columns.length}` : 'dml ' + ref.verify.map(v => v.values.length).join('/');
    if (ref.set && !ref.set.values.length) { console.log('EMPTY', m.id); bad++; }
    const r = M.evaluate(m, m.solution);
    if (!r.verdict.ok) { console.log('FAIL', m.id, r.verdict.msg); bad++; } else console.log('OK  ', m.id, info);
  }
  // variantes : d'autres requêtes justes doivent passer, des fausses échouer
  const V = [
    ['28.4', "WITH c AS (SELECT j.key AS k, AVG(j.value) AS v FROM appels_vocaux x, json_each(x.vecteur) j WHERE x.numero_appelant = '0745998877' GROUP BY j.key), e AS (SELECT t.id, t.fichier, t.depose_par, j.key AS k, j.value AS v FROM echantillons_tts t, json_each(t.vecteur) j) SELECT e.id, e.fichier, e.depose_par, ROUND(SUM(e.v * c.v), 3) AS similarite FROM e JOIN c ON c.k = e.k GROUP BY e.id, e.fichier, e.depose_par ORDER BY SUM(e.v * c.v) DESC LIMIT 5", true],
    ['31.3', "INSERT INTO proces_verbal (affaire, coupable, preuve) SELECT 'Synapse', 'Maxime Delorme', 'x' FROM echantillons_tts LIMIT 1", false],
    ['40.5', "INSERT INTO proces_verbal (affaire, coupable, preuve) SELECT 'Hydre', nom, 'x' FROM societes WHERE siren LIKE '%3000' AND EXISTS (SELECT 1 FROM auth_logs)", false],
    ['22.3', "INSERT INTO proces_verbal SELECT DISTINCT 'Éclipse', 'Farid Ouali', 'x' FROM journal_brigade", false],
    ['13.2', "INSERT INTO proces_verbal SELECT 'Minuit', 'Solène Marchetti', 'x' FROM gangs LIMIT 1", false],
    ['13.2', "INSERT INTO proces_verbal VALUES ('Minuit', 'Solène Marchetti', 'x')", false],
    ['40.5', "INSERT INTO proces_verbal (affaire, coupable, preuve) SELECT 'Hydre', nom, 'x' FROM societes WHERE nom LIKE 'Lab%'", false],
    ['31.3', "INSERT INTO proces_verbal (affaire, coupable, preuve) SELECT 'Synapse', e.nom, 'autre preuve' FROM employes_neurocite e JOIN echantillons_tts t ON t.depose_par = e.login WHERE t.fichier LIKE 'varga_%' LIMIT 1", true],
    ['40.4', "SELECT l.ip, 'x' AS role, s.nom AS abonne, s.creation, l.adresse FROM lignes_internet l JOIN societes s ON s.siren = l.abonne_siren WHERE l.ip IN ('192.0.2.150','192.0.2.66')", false],
    ['39.5', "CREATE TABLE alertes (id INTEGER PRIMARY KEY, horodatage TEXT, host TEXT, cible TEXT); CREATE TRIGGER trg_ioc AFTER INSERT ON proxy_logs WHEN NEW.domaine IN (SELECT valeur FROM ioc WHERE type = 'domaine') BEGIN INSERT INTO alertes (horodatage, host, cible) VALUES (NEW.horodatage, NEW.host, NEW.domaine); END;", false],
    ['36.4', "SELECT host, domaine, ip_dest, 600 AS moyenne_s FROM proxy_logs WHERE domaine = 'cdn-update-check.net' GROUP BY host", true],
    ['34.4', "SELECT horodatage, 0 AS niveau, process AS arbre FROM process_logs WHERE host = 'PC-COMPTA-07' AND horodatage >= '2028-03-06 09:14:40' LIMIT 9", false],
    ['41.10', "SELECT 'Dédale' AS station, 20 AS minutes, '2028-03-21 04:05' AS heure_limite, 'Paul Ricci' AS complice", false],
    ['41.8', "WITH RECURSIVE p(noeud, chemin, total) AS (SELECT 'Préfecture', 'Préfecture', 0 UNION ALL SELECT t.vers, p.chemin || ' > ' || t.vers, p.total + t.minutes FROM p JOIN troncons t ON t.de = p.noeud WHERE instr(p.chemin, t.vers) = 0 AND p.total + t.minutes <= 60 AND p.noeud <> 'Dédale') SELECT chemin, total AS minutes FROM p WHERE noeud = 'Dédale' ORDER BY total LIMIT 1", false],
    ['41.9', "BEGIN; UPDATE file_minotaure SET statut = 'bloque' WHERE montant < 1000; COMMIT;", false],
    ['41.1', "SELECT group_concat(UPPER(substr(texte, ligne, 1)), '') AS message FROM (SELECT * FROM carnet_delorme ORDER BY page, ligne)", true],
    ['31.2', "SELECT 'Maxime Delorme' AS nom", false],
    ['24.3', "SELECT id, creneau, incidents_7j, ROUND((incidents_7j - MIN(incidents_7j) OVER ()) * 1.0 / (MAX(incidents_7j) OVER () - MIN(incidents_7j) OVER ()), 3) AS inc_norm FROM dataset_vigie WHERE quartier = 'La Défense' AND date = '2028-02-01'", false],
    ['26.1', "SELECT SUM(CASE WHEN p.prediction = 1 AND d.label_risque = 1 THEN 1 ELSE 0 END) AS tp, SUM(CASE WHEN p.prediction = 1 AND d.label_risque = 0 THEN 1 ELSE 0 END) AS fp, SUM(CASE WHEN p.prediction = 0 AND d.label_risque = 1 THEN 1 ELSE 0 END) AS fn, SUM(CASE WHEN p.prediction = 0 AND d.label_risque = 0 THEN 1 ELSE 0 END) AS tn FROM predictions_vigie p JOIN dataset_vigie d ON d.id = p.dataset_id WHERE p.modele = 'v1'", false],
    ['23.1', "SELECT label_risque, COUNT(id) AS nb FROM dataset_vigie GROUP BY 1 ORDER BY 1", true],
    ['25.2', "SELECT COUNT(*) AS fuites FROM (SELECT DISTINCT a.quartier, a.date, a.creneau FROM dataset_vigie a JOIN dataset_vigie b ON a.quartier=b.quartier AND a.date=b.date AND a.creneau=b.creneau AND a.split='train' AND b.split='test')", false],
    ['30.1', "SELECT quartier FROM patrouilles WHERE date = '2028-02-29' AND nb_agents = 0", false],
    ['1.2', 'SELECT * FROM suspects', false], ['2.3', "SELECT id, prenom, nom, cheveux FROM suspects WHERE sexe='H' AND cicatrices='Oui' AND cheveux='Noirs' OR cheveux='Bruns'", false],
    ['2.3', "SELECT nom, prenom, id, cheveux FROM suspects WHERE sexe='H' AND cicatrices='Oui' AND cheveux IN ('Noirs','Bruns')", true],
    ['2.1', "SELECT * FROM suspects WHERE sexe = 'H'", false], ['1.6', "SELECT prenom, nom, age FROM suspects ORDER BY age, nom", false],
    ['3.3', "SELECT * FROM suspects WHERE sexe='F' AND taille='Grande' AND cheveux IN ('Roux','Blonds') AND tatouages='Oui' AND nom LIKE 'Le%' AND telephone = NULL", false],
    ['6.2', "SELECT suspect_id, s.prenom, s.nom, COUNT(*) nb FROM delits d JOIN suspects s ON s.id=d.suspect_id GROUP BY suspect_id HAVING nb>=6 ORDER BY nb DESC", true],
    ['10.3', "UPDATE suspects SET telephone='0700000713'", false], ['10.3', "UPDATE suspects SET telephone='0700000713' WHERE nom='Lefort' AND prenom='Karine'", true],
    ['10.7', "BEGIN; UPDATE employes SET salaire = 0; COMMIT;", false],
    ['11.1', "CREATE TABLE preuves (id INTEGER PRIMARY KEY, affaire TEXT NOT NULL, description TEXT NOT NULL, type TEXT, suspect_id INTEGER REFERENCES suspects(id))", false],
    ['13.1', "SELECT prenom, nom FROM suspects WHERE id = 131", false],
    ['4.3', "SELECT type, date_faits, CAST(strftime('%Y', date_faits) AS INTEGER) AS annee, CAST(julianday(fin_peine) - julianday(debut_peine) AS INTEGER) AS jours FROM delits WHERE suspect_id=217 ORDER BY date_faits", true],
    ['7.2', "SELECT s.id, s.prenom, s.nom FROM suspects s JOIN membres m ON m.suspect_id = s.id WHERE m.gang_id IN (SELECT id FROM gangs WHERE nom='Le Cercle')", false]
  ];
  for (const [id, q, exp] of V) { const r = M.evaluate(M.byId[id], q); const ok = r.verdict.ok === exp; if (!ok) bad++; console.log(ok ? 'VAR ok' : 'VAR KO', id, exp, '|', r.verdict.ok ? 'accepté' : r.verdict.msg.replace(/<[^>]+>/g,'')); }
  console.log('PROBLÈMES :', bad, '/ missions', MISSIONS.length);
})();
