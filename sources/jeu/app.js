/* Opération Minuit : moteur du jeu */
(function(){
'use strict';
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MID = id => 'm-' + id.replace('.', '-');
MISSIONS.forEach((m,i) => m._o = i);
MISSIONS.sort((a,b) => a.ch - b.ch || (a.tail?1:0) - (b.tail?1:0) || a._o - b._o);
CHAPTERS.sort((a,b) => a.id - b.id);
const byId = {}; MISSIONS.forEach((m,i) => { m.idx = i; byId[m.id] = m; m.xp = m.xp || 100; m.check = m.check || {}; m.nh = m.nh || 0; });
const MAIN = MISSIONS.filter(m => !m.side), SIDES = MISSIONS.filter(m => m.side);
const HD = () => { if (!S.hard) return S.done; S.hardDone = S.hardDone || {}; return S.hardDone[S.hard] = S.hardDone[S.hard] || {}; };
const nDone = () => MAIN.filter(m => HD()[m.id]).length;
const HARD = { moteurs: [], names: {} };
const hardName = () => HARD.names[S.hard] || S.hard;
const chapById = {}; CHAPTERS.forEach(c => { chapById[c.id] = c; c.missions = MAIN.filter(m => m.ch === c.id); c.sides = SIDES.filter(m => m.ch === c.id); });
const RANKS = [[0,'Stagiaire'],[600,'Enquêteur'],[1800,'Inspecteur'],[3500,'Inspecteur principal'],[5500,'Commissaire'],[8000,'Commissaire divisionnaire'],[11000,'Profiler Data'],[14500,'Chasseur d\'IA'],[19000,'Architecte des données'],[23500,'Chasseur de menaces'],[28500,'Maître du labyrinthe'],[34000,'Légende de la Brigade']];
const IMG = window.IMAGES || {};

/* ---------- état ---------- */
const KEY = 'operation-minuit-v1';
let S = { done:{}, hints:{}, drafts:{}, quiz:{}, unlockAll:false, name:'', bossStart:{} };
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch(e) {}
S.bossStart = S.bossStart || {};
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {} renderTop(); }
function xpTotal(){ let x = 0; for (const k in S.done) x += S.done[k].xp || 0; for (const k in S.quiz) x += S.quiz[k].xp || 0; return x; }
function hardXp(){ let x = 0; const d = HD(); for (const k in d) x += d[k].xp || 0; return x; }
function rankOf(x){ let r = RANKS[0]; for (const k of RANKS) if (x >= k[0]) r = k; return r; }
function nextRank(x){ return RANKS.find(k => k[0] > x); }
function chapDone(c){ return c.missions.every(m => HD()[m.id]); }
const SEASON_NAMES = ['', 'Minuit', 'Éclipse', 'Synapse', 'Hydre', 'Minotaure'];
const SEASON_SUBS = ['', 'Le braquage d\'Hélios · les bases du SQL', 'Le ransomware TransSeine · SQL avancé', 'L\'IA empoisonnée · SQL pour la data et l\'IA', 'La cyberattaque de la ville · SQL pour le SOC', 'Les quatre affaires se rejoignent · le niveau expert'];
function seasonDone(sn){ return MAIN.filter(m => (chapById[m.ch].season || 1) === sn).every(m => HD()[m.id]); }
function seasonUnlocked(sn){ if (sn > 5) return false; if (S.unlockAll || sn === 1) return true; for (let k = 1; k < sn; k++) if (!seasonDone(k)) return false; return true; }
function chapUnlocked(c){ if (S.unlockAll || c.id === 1) return true; return chapDone(chapById[c.id-1]); }
function sideOpen(m){ return m.side !== 'cachee' || chapDone(chapById[m.ch]); }
function sideCard(c){
  if (!c.sides || !c.sides.length) return '';
  return `<div class="panel sidecard"><h3>QUÊTES DE L'ÉPISODE</h3>${c.sides.map(m => {
    const d = HD()[m.id], open = sideOpen(m), lab = m.side === 'cachee' ? 'Quête cachée' : 'Quête annexe';
    if (!open) return `<div class="sideq locked"><span class="stag hid">?</span><div><b>${lab} : ???</b><div class="small muted">Résous toutes les missions de l'épisode pour la révéler.</div></div><span class="sxp">+${m.xp} XP</span></div>`;
    return `<a class="sideq ${d?'ok':''}" href="#${MID(m.id)}"><span class="stag ${m.side === 'cachee' ? 'hid' : ''}">${m.side === 'cachee' ? 'S' : 'A'}</span><div><b>${lab} : ${esc(m.title)}</b>${m.teaser && m.side === 'cachee' ? `<div class="small">${m.teaser}</div>` : ''}</div><span class="sxp">${d ? 'RÉSOLUE' : '+' + m.xp + ' XP'}</span></a>`;
  }).join('')}</div>`;
}

/* ---------- SQL ---------- */
let SQL, PRISTINE, sandboxDb;
function addFns(d){
  const rx = {};
  d.create_function('regexp', (p, v) => { if (p == null || v == null) return null; try { const r = rx[p] || (rx[p] = new RegExp(p)); return r.test(String(v)) ? 1 : 0; } catch (e) { return 0; } });
  d.create_function('ln', x => (x == null || x <= 0) ? null : Math.log(x));
  d.create_function('sqrt', x => x == null ? null : x < 0 ? (x > -1e-6 ? 0 : null) : Math.sqrt(x));
  return d;
}
function fresh(){ const d = addFns(new SQL.Database(PRISTINE)); d.exec('PRAGMA foreign_keys = ON;'); return d; }
function run(db, sql){
  const t0 = performance.now();
  try { const res = db.exec(sql); return { res, ms: performance.now()-t0, changes: db.getRowsModified() }; }
  catch(e){ return { error: e.message, ms: performance.now()-t0 }; }
}
function frenchError(msg){
  let m;
  if ((m = msg.match(/no such column: (.+)/))) return `La colonne <code>${esc(m[1])}</code> n'existe pas. Vérifie l'orthographe dans le schéma, ou le préfixe de table (alias).`;
  if ((m = msg.match(/no such table: (.+)/))) return `La table <code>${esc(m[1])}</code> n'existe pas. Ouvre le schéma pour voir les tables disponibles.`;
  if ((m = msg.match(/near "(.+?)": syntax error/))) return `Erreur de syntaxe près de <code>${esc(m[1])}</code>. Vérifie les virgules, les apostrophes et l'ordre des clauses (SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY).`;
  if (/incomplete input/.test(msg)) return `La requête est incomplète : une parenthèse ou une apostrophe n'est pas fermée ?`;
  if ((m = msg.match(/ambiguous column name: (.+)/))) return `La colonne <code>${esc(m[1])}</code> existe dans plusieurs tables de la jointure : préfixe-la avec l'alias (ex : <code>s.${esc(m[1])}</code>).`;
  if (/misuse of aggregate/.test(msg)) return `Agrégat mal placé : un COUNT, SUM, AVG... ne peut pas aller dans WHERE. Utilise HAVING ou une sous-requête.`;
  if (/UNIQUE constraint failed/.test(msg)) return `Contrainte UNIQUE ou clé primaire violée : cette valeur existe déjà. (${esc(msg)})`;
  if (/NOT NULL constraint failed/.test(msg)) return `Contrainte NOT NULL violée : une colonne obligatoire est vide. (${esc(msg)})`;
  if (/CHECK constraint failed/.test(msg)) return `Contrainte CHECK violée : la valeur ne respecte pas la règle de la table. (${esc(msg)})`;
  if (/FOREIGN KEY constraint failed/.test(msg)) return `Contrainte de clé étrangère : cette opération casserait un lien entre deux tables (la ligne référencée n'existe pas, ou elle est encore utilisée par une autre table).`;
  if (/SELECTs to the left and right of (UNION|INTERSECT|EXCEPT)/.test(msg)) return `Les deux SELECT de l'opération ensembliste n'ont pas le même nombre de colonnes.`;
  if (/cannot start a transaction within a transaction/.test(msg)) return `Une transaction est déjà ouverte.`;
  if (/already exists/.test(msg)) return `Cet objet existe déjà. (${esc(msg)})`;
  return esc(msg);
}

/* ---------- comparaison ---------- */
function canon(v){
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'number') return String(Math.round(v*10000)/10000);
  if (v instanceof Uint8Array) return '[blob]';
  const s = String(v);
  if (/^-?\d+(\.\d+)?$/.test(s) && s.length < 16) return String(Math.round(Number(s)*10000)/10000);
  return s;
}
function lastSet(res){ if (!res || !res.length) return null; return res[res.length-1]; }
function compareSets(exp, got, opt){
  opt = opt || {};
  if (!got) return { ok:false, msg: opt.emptyIsSelect ? "Ta requête s'exécute mais ne renvoie <b>aucune ligne</b>. Vérifie tes valeurs : les textes sont sensibles à la casse (<code>'H'</code> n'est pas <code>'h'</code>) et s'écrivent exactement comme dans la table." : "Ta requête ne renvoie aucun résultat. Termine par un <code>SELECT</code> qui affiche ce qui est demandé." };
  const E = exp.values.map(r => r.map(canon)), G = got.values.map(r => r.map(canon));
  const k = exp.columns.length, m = got.columns.length;
  if (opt.strictCols && m !== k) return { ok:false, msg:`Il faut exactement <b>${k}</b> colonne${k>1?'s':''} (${exp.columns.map(c=>'<code>'+esc(c)+'</code>').join(', ')}). Ta requête en renvoie ${m}.` };
  if (m < k) return { ok:false, msg:`Il manque des colonnes : la réponse en attend ${k} (${exp.columns.map(c=>'<code>'+esc(c)+'</code>').join(', ')}), ta requête en renvoie ${m}.` };
  if (G.length !== E.length) return { ok:false, msg:`Ta requête renvoie <b>${G.length}</b> ligne${G.length>1?'s':''}, la réponse attendue en contient <b>${E.length}</b>. Revois tes conditions.` , near:true};
  const colSig = (rows, j) => rows.map(r => r[j]).sort().join('\u0001');
  const used = new Set(), map = [];
  for (let i=0;i<k;i++){
    const sig = colSig(E, i); let found = -1;
    // préférence : même nom de colonne
    for (let j=0;j<m;j++) if (!used.has(j) && got.columns[j].toLowerCase() === exp.columns[i].toLowerCase() && colSig(G,j) === sig) { found = j; break; }
    if (found < 0) for (let j=0;j<m;j++) if (!used.has(j) && colSig(G,j) === sig) { found = j; break; }
    if (found < 0) {
      const r2 = rows => rows.map(r => r.map(v => /^-?\d+(\.\d+)?$/.test(v) ? String(Math.round(Number(v)*100)/100) : v));
      const E2 = r2(E), G2 = r2(G);
      for (let j=0;j<m;j++) if (!used.has(j) && colSig(G2,j) === colSig(E2,i) && colSig(G,j) !== sig) return { ok:false, msg:`Presque ! Ta colonne <code>${esc(got.columns[j])}</code> a les bonnes valeurs, mais pas le bon arrondi. Pense à <code>ROUND(..., n)</code> comme demandé.` };
      return { ok:false, msg:`Le bon nombre de lignes, mais aucune de tes colonnes ne correspond à <code>${esc(exp.columns[i])}</code> attendue. Vérifie le calcul, le filtre ou la colonne choisie.` };
    }
    used.add(found); map.push(found);
  }
  if (opt.colNames) for (let i=0;i<k;i++) if (got.columns[map[i]].toLowerCase() !== exp.columns[i].toLowerCase()) return { ok:false, msg:`Les valeurs sont bonnes. Renomme la colonne <code>${esc(got.columns[map[i]])}</code> en <code>${esc(exp.columns[i])}</code> avec <code>AS</code>.` };
  const P = G.map(r => map.map(j => r[j]));
  const key = r => r.join('\u0001');
  const a = E.map(key).sort(), b = P.map(key).sort();
  for (let i=0;i<a.length;i++) if (a[i] !== b[i]) return { ok:false, msg:"Le bon nombre de lignes et de colonnes, mais certaines lignes ne correspondent pas. Les valeurs sont presque bonnes : vérifie chaque condition." };
  if (opt.ordered){
    const ks = opt.orderKeys || exp.columns.map((_,i)=>i);
    for (let i=0;i<E.length;i++) if (ks.map(c=>E[i][c]).join('\u0001') !== ks.map(c=>P[i][c]).join('\u0001')) return { ok:false, msg:"Les bonnes lignes, mais <b>pas dans le bon ordre</b>. Vérifie ton ORDER BY (ASC, DESC, critères secondaires)." };
  }
  return { ok:true };
}
/* La correction se fait sur le serveur : le navigateur n'a ni les solutions ni les résultats attendus.
   Ici, on exécute seulement la requête en local pour afficher le résultat tout de suite. */
function localRun(m, sql){
  const db = fresh();
  if (m.setup) run(db, m.setup);
  const r = run(db, sql); db.close(); return r;
}
function normAnswer(s){ return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim(); }
/* Messages du serveur : on ne garde que le texte et quelques balises de mise en forme. */
function safeMsg(html){
  const t = document.createElement('template'); t.innerHTML = String(html || '');
  const keep = { B:'b', CODE:'code', I:'i', BR:'br', STRONG:'b', EM:'i' };
  const walk = n => Array.from(n.childNodes).map(x => {
    if (x.nodeType === 3) return esc(x.textContent);
    if (x.nodeType !== 1) return '';
    const tag = keep[x.tagName];
    if (!tag) return walk(x);
    return tag === 'br' ? '<br>' : `<${tag}>${walk(x)}</${tag}>`;
  }).join('');
  return walk(t.content);
}
/* ---------- coloration ---------- */
const KW = 'SELECT FROM WHERE AND OR NOT IN IS NULL AS ON JOIN LEFT RIGHT INNER OUTER FULL CROSS NATURAL USING GROUP BY ORDER HAVING LIMIT OFFSET DISTINCT ALL UNION INTERSECT EXCEPT WITH RECURSIVE CASE WHEN THEN ELSE END INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE VIEW INDEX DROP ALTER ADD COLUMN RENAME TO PRIMARY KEY FOREIGN REFERENCES UNIQUE CHECK DEFAULT BEGIN COMMIT ROLLBACK TRANSACTION LIKE BETWEEN EXISTS ASC DESC OVER PARTITION ROWS PRECEDING FOLLOWING CURRENT ROW EXPLAIN QUERY PLAN PRAGMA INTEGER TEXT REAL CAST IF CONSTRAINT CASCADE'.split(' ');
const FN = 'COUNT SUM AVG MIN MAX ROUND UPPER LOWER LENGTH SUBSTR REPLACE TRIM COALESCE IFNULL NULLIF ABS strftime julianday date datetime ROW_NUMBER RANK DENSE_RANK LAG LEAD NTILE FIRST_VALUE LAST_VALUE group_concat instr printf'.split(' ').map(s=>s.toUpperCase());
function highlight(src){
  let out = '', i = 0;
  const re = /(--[^\n]*)|('(?:[^']|'')*'?)|("(?:[^"])*"?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([\s\S])/g;
  let mm;
  while ((mm = re.exec(src))){
    if (mm[1]) out += `<span class="t-com">${esc(mm[1])}</span>`;
    else if (mm[2]) out += `<span class="t-str">${esc(mm[2])}</span>`;
    else if (mm[3]) out += `<span class="t-id">${esc(mm[3])}</span>`;
    else if (mm[4]) out += `<span class="t-num">${esc(mm[4])}</span>`;
    else if (mm[5]) { const u = mm[5].toUpperCase(); out += KW.includes(u) ? `<span class="t-kw">${esc(mm[5])}</span>` : FN.includes(u) ? `<span class="t-fn">${esc(mm[5])}</span>` : esc(mm[5]); }
    else out += esc(mm[6]);
  }
  return out + '\n';
}
function makeEditor(host, initial, onRun, onChange){
  host.innerHTML = `<div class="editor"><pre class="hl" aria-hidden="true"></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Éditeur SQL" placeholder="Écris ta requête SQL ici..."></textarea></div>`;
  const ta = $('textarea', host), hl = $('pre', host);
  const sync = () => { hl.innerHTML = highlight(ta.value); hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; };
  ta.value = initial || ''; sync();
  ta.addEventListener('input', () => { sync(); onChange && onChange(ta.value); });
  ta.addEventListener('scroll', sync);
  ta.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter'){ e.preventDefault(); onRun(); }
    else if (e.key === 'Tab'){ e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); sync(); onChange && onChange(ta.value); }
  });
  return { el: ta, get value(){ return ta.value; }, set value(v){ ta.value = v; sync(); onChange && onChange(v); },
    insert(t){ const s = ta.selectionStart; ta.setRangeText(t, s, ta.selectionEnd, 'end'); ta.focus(); sync(); onChange && onChange(ta.value); }, focus(){ ta.focus(); } };
}
let activeEditor = null;

/* ---------- rendu résultats ---------- */
function renderResult(host, r, opts){
  opts = opts || {};
  if (!r){ host.innerHTML = ''; return; }
  if (r.error){ host.innerHTML = `<div class="err"><b>Erreur SQL.</b> ${frenchError(r.error)}<div class="raw">${esc(r.error)}</div></div>`; return; }
  const sets = opts.all ? r.res : (r.res.length ? [r.res[r.res.length-1]] : []);
  if (!sets.length){ host.innerHTML = `<div class="okmsg">Instruction exécutée en ${r.ms.toFixed(1)} ms. ${r.changes ? r.changes + ' ligne(s) modifiée(s).' : 'Aucun résultat à afficher.'}</div>`; return; }
  host.innerHTML = sets.map(s => {
    const rows = s.values.slice(0, 300);
    return `<div class="rmeta">${s.values.length} ligne${s.values.length>1?'s':''} · ${s.columns.length} colonne${s.columns.length>1?'s':''} · ${r.ms.toFixed(1)} ms${s.values.length>300?' · 300 premières lignes affichées':''}</div>
    <div class="tablewrap"><table class="res"><thead><tr>${s.columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row=>`<tr>${row.map(v=> v===null ? '<td class="null">NULL</td>' : `<td${typeof v==='number'?' class="n"':''}>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }).join('');
}

const main = () => $('#main');
/* ---------- barre du haut ---------- */
async function setHard(id){
  if (id && !(S.ident && S.ident.mode === 'google')){ toast('Le mode difficile est réservé aux comptes Cybersup connectés avec Google.'); showGate(); return; }
  S.hard = id || ''; save();
  if (S.hard && S.ident && NET.api){
    try { const d = await api('/hard/progres', { uid:S.ident.uid, secret:S.ident.secret, moteur:S.hard }); const h = HD();
      for (const k in d.missions) { const v = d.missions[k]; if (v.xp !== null && v.xp !== undefined) h[k] = { xp: v.xp, at: Date.now() }; }
      save(); } catch(e){}
  }
  toast(S.hard ? 'Mode difficile : ' + hardName() + '. XP doublée !' : 'Retour au mode normal (SQLite).');
  document.body.classList.toggle('hardmode', !!S.hard);
  viewHome();
}
function renderTop(){
  const x = S.hard ? hardXp() : xpTotal(), r = rankOf(x);
  $('#xp').textContent = x; $('#rank').textContent = S.hard ? 'Difficile · ' + hardName() : r[1];
  $('#progress').textContent = `${nDone()}/${MAIN.length}`;
}
const img = k => IMG[k] || '';
const panelImg = (k, cls='') => IMG[k] ? `<img class="pimg ${cls}" src="${IMG[k]}" alt="">` : `<div class="pimg ph ${cls}"></div>`;
function speakerOf(m){
  if (m.who) return m.who;
  const s = m.story;
  if (/Ouali/.test(s)) return 'ouali';
  if (/juge/i.test(s) && !/Varga/.test(s)) return 'juge';
  if (/Varga|commissaire|« Je veux|« Classe|« Ne garde|« Liste|« Ajoute|« Supprime/i.test(s)) return 'varga';
  return 'byte';
}
const SFX_OK = ['BINGO !','BOUM !','EN PLEIN DANS LE MILLE !','YES !','CRAC !','BIEN JOUÉ !'];
const SFX_KO = ['OUPS !','RATÉ !','PAS ENCORE !','HMM...'];
const pick = (a, k) => a[k % a.length];

/* ---------- accueil ---------- */
function viewHome(){
  const firstTodo = MAIN.find(m => !HD()[m.id] && chapUnlocked(chapById[m.ch]));
  const autoSeason = firstTodo ? (chapById[firstTodo.ch].season || 1) : 5;
  let curSeason = S.season && seasonUnlocked(S.season) ? S.season : autoSeason;
  if (!seasonUnlocked(curSeason)) curSeason = 1;
  const started = Object.keys(HD()).length > 0;
  main().innerHTML = `
  <section class="cover panel">
    ${panelImg('cover','coverimg')}
    <div class="cover-txt">
      <div class="cap">Quatre saisons et une grande finale, ${CHAPTERS.length} épisodes, ${MAIN.length} missions dont ${MAIN.filter(m=>m.boss).length} boss, ${SIDES.length} quêtes annexes et cachées</div>
      <h1><span>OPÉRATION</span> MINUIT</h1>
      <div class="bubble big">Un braquage à 480 000 €, un ransomware qui plonge la ville dans le noir, puis une IA qu'on a appris à se tromper. Tu es la nouvelle recrue de la Brigade Data, et ton arme, c'est le SQL !</div>
      <a class="btn go" href="${firstTodo ? (HD()[firstTodo.id] || chapById[firstTodo.ch].missions[0] !== firstTodo ? '#'+MID(firstTodo.id) : '#chap-'+firstTodo.ch) : '#fin'}">${started ? 'Reprendre l\'enquête' : 'Commencer l\'enquête'} ▶</a>
    </div>
  </section>
  <div class="seasonbar" role="tablist" aria-label="Choisir une saison">${[1,2,3,4,5].map(sn => seasonUnlocked(sn)
      ? `<button class="chip sswitch ${sn === curSeason ? 'on' : ''}" data-sn="${sn}" role="tab" aria-selected="${sn === curSeason}">${sn === 5 ? 'Finale' : 'Saison ' + sn}<small>${SEASON_NAMES[sn]}</small>${seasonDone(sn) ? ' ✓' : ''}</button>`
      : `<span class="chip sswitch off" title="Termine la saison précédente pour la débloquer">🔒 ${sn === 5 ? 'Finale' : 'Saison ' + sn}</span>`).join('')}</div>
  ${HARD.moteurs.length ? `<section class="panel hardcard ${S.hard ? 'on' : ''}"><div><b>MODE DIFFICILE</b><div class="small">Les mêmes enquêtes sur un vrai moteur de base de données, avec sa syntaxe. XP doublée et classement à part, réservé aux comptes Cybersup connectés avec Google.${S.ident ? '' : ' Identifie-toi pour y jouer.'}</div></div>
    <div class="row">${[['', 'Normal (SQLite)']].concat(HARD.moteurs.map(x => [x.id, x.nom])).map(([id, nom]) => `<button class="btn small ${(S.hard || '') === id ? 'go' : ''}" data-hard="${id}">${esc(nom)}</button>`).join('')}</div>${S.ident && S.ident.mode === 'google' ? '' : `<p class="small" style="margin-top:10px">🔒 Réservé aux comptes Cybersup : <a href="#" id="hardLogin">connecte-toi avec Google</a> pour y jouer.</p>`}</section>` : ''}
  ${[curSeason].map(sn => `<h2 class="sec season s${sn}">${sn === 5 ? 'GRANDE FINALE' : 'SAISON ' + sn} : OPÉRATION ${SEASON_NAMES[sn].toUpperCase()} <small>${SEASON_SUBS[sn]}</small></h2>
  <div class="episodes">${CHAPTERS.filter(c => (c.season||1) === sn).map(c => {
    const d = c.missions.filter(m => HD()[m.id]).length, un = chapUnlocked(c), full = d === c.missions.length;
    const first = c.missions.find(m => !HD()[m.id]);
    const href = !un ? '#home' : d === 0 ? '#chap-'+c.id : '#'+MID((first || c.missions[0]).id);
    return `<a class="ep panel ${un?'':'locked'} ${full?'full':''}" href="${href}" data-locked="${un?0:1}">
      ${panelImg('ch'+c.id+'_0')}
      <div class="epnum">${c.id}</div>
      ${full ? '<div class="stamp">RÉSOLU</div>' : ''}
      <div class="eptxt">${un ? `<b>${esc(c.title.toUpperCase())}</b><span>${esc(c.subtitle)}</span>` : `<b>ÉPISODE VERROUILLÉ</b><span>Termine l'épisode précédent pour découvrir la suite.</span>`}
      <div class="dots">${c.missions.map(m => `<i class="${HD()[m.id]?'on':''} ${m.boss?'boss':''}"></i>`).join('')}${(c.sides||[]).map(m => `<i class="side ${HD()[m.id]?'on':''}" title="${m.side === 'cachee' ? 'Quête cachée' : 'Quête annexe'}"></i>`).join('')}</div></div>
      ${un ? '' : '<div class="lock">🔒</div>'}
    </a>`; }).join('')}</div>`).join('')}
  ${seasonUnlocked(curSeason + 1) || curSeason === 5 ? '' : `<p class="center muted small">La suite de l'enquête se débloque quand toute la saison est terminée.</p>`}
  <section class="panel classcard">
    <div class="ccimg">${panelImg('varga','tiny')}</div>
    <div class="ccbody"><h3>MA CLASSE</h3>
      <p class="small">Indique ton nom et ta classe pour que ton formateur suive ta progression.</p>
      <div class="ccrow"><input id="myName" placeholder="Prénom Nom" value="${esc(S.name||'')}" ${S.ident && S.ident.mode === 'google' ? 'readonly title="Nom de ton compte Cybersup"' : ''}><input id="myClass" placeholder="Classe (ex. B1 Cyber Puteaux)" value="${esc(S.classe||'')}"></div>
      <div class="ccstatus" id="ccStatus">${cloudStatus()}</div>
      <div class="row"><button class="btn small" id="sendCode">Copier mon code pour le formateur</button></div>
      <div id="codeOut" class="setmsg"></div>
    </div>
  </section>
  <details class="settings"><summary>Réglages et progression</summary>
    <label class="sw"><input type="checkbox" id="unlockAll" ${S.unlockAll?'checked':''}> Mode formateur : tous les épisodes déverrouillés</label>
    <div class="row">
      <button class="btn small" id="exportBtn">Copier mon code de progression</button>
      <button class="btn small" id="importBtn">Importer un code</button>
      <button class="btn small danger" id="resetBtn">Remettre à zéro</button>
    </div>
    <div id="setmsg" class="setmsg"></div>
    <div id="importBox" class="hidden"><textarea id="importTa" placeholder="Colle ici ton code de progression"></textarea><button class="btn small" id="importGo">Importer</button></div>
  </details>`;
  $$('.sswitch[data-sn]').forEach(b => b.addEventListener('click', () => { S.season = +b.dataset.sn; save(); viewHome(); }));
  $$('[data-hard]').forEach(b => b.addEventListener('click', () => setHard(b.dataset.hard)));
  const hl = $('#hardLogin'); if (hl) hl.addEventListener('click', e => { e.preventDefault(); showGate(); });
  $$('.ep[data-locked="1"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast("Termine l'épisode précédent d'abord (ou active le mode formateur dans les réglages)."); }));
  $('#unlockAll').addEventListener('change', e => { S.unlockAll = e.target.checked; save(); viewHome(); });
  let nt;
  const onId = () => { if (!(S.ident && S.ident.mode === 'google')) S.name = $('#myName').value.trim(); S.classe = $('#myClass').value.trim(); save(); clearTimeout(nt); nt = setTimeout(() => { syncCloud(); pushScore(); }, 1200); };
  $('#myName').addEventListener('input', onId); $('#myClass').addEventListener('input', onId);
  $('#sendCode').addEventListener('click', async () => {
    if (!S.name || !S.classe){ toast('Indique d\'abord ton nom et ta classe.'); return; }
    const code = progressCode();
    try { await navigator.clipboard.writeText(code); $('#codeOut').textContent = 'Code copié : colle-le dans le formulaire ou le message que t\'indique ton formateur.'; }
    catch(e){ $('#codeOut').innerHTML = 'Sélectionne le code ci-dessous et copie-le :<textarea readonly>' + code + '</textarea>'; }
  });
  $('#exportBtn').addEventListener('click', async () => {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify({done:S.done, quiz:S.quiz, name:S.name, classe:S.classe}))));
    try { await navigator.clipboard.writeText(code); $('#setmsg').textContent = 'Code copié.'; }
    catch(e){ $('#setmsg').innerHTML = 'Sélectionne le code ci-dessous :<textarea readonly>' + code + '</textarea>'; }
  });
  $('#importBtn').addEventListener('click', () => $('#importBox').classList.toggle('hidden'));
  $('#importGo').addEventListener('click', () => {
    try { const o = JSON.parse(decodeURIComponent(escape(atob($('#importTa').value.trim())))); if (o.v === 2) throw 0; S.done = o.done || {}; S.quiz = o.quiz || {}; S.name = o.name || S.name; S.classe = o.classe || S.classe; save(); viewHome(); toast('Progression importée.'); }
    catch(e){ $('#setmsg').textContent = 'Code invalide.'; }
  });
  let armed = false;
  $('#resetBtn').addEventListener('click', e => {
    if (!armed){ armed = true; e.target.textContent = 'Clique encore pour confirmer'; setTimeout(()=>{ armed=false; e.target.textContent='Remettre à zéro'; }, 4000); return; }
    S = { done:{}, hints:{}, drafts:{}, quiz:{}, unlockAll:false, name:S.name, classe:S.classe, ident:S.ident, bossStart:{} }; save(); viewHome(); toast('Progression remise à zéro.');
  });
}

/* ---------- couverture de chapitre ---------- */
function viewChapter(c){
  if (!chapUnlocked(c)){ location.hash = '#home'; return; }
  const tmp = document.createElement('div'); tmp.innerHTML = c.intro;
  const paras = $$('p', tmp).map(p => ({ q: p.classList.contains('quote'), h: p.innerHTML }));
  main().innerHTML = `<div class="page">
    <div class="splash panel">${panelImg('ch'+c.id+'_0')}
      <div class="splashtitle"><span>ÉPISODE ${c.id}</span>${esc(c.title.toUpperCase())}</div></div>
    <div class="strip s2">
      ${paras.filter(p=>!p.q).map((p,i) => `<div class="panel cappanel">${i===0 ? panelImg('ch'+c.id+'_1') : panelImg('ch'+c.id+'_2')}<div class="cap">${p.h}</div></div>`).join('')}
      ${paras.filter(p=>p.q).map(p => { const who = /Varga/.test(p.h) ? 'varga2' : 'byte'; return `<div class="panel talk introtalk">${panelImg(who)}<div class="bubble">${p.h.replace(/\s*\((Byte|Inès Varga)\)\s*$/,'')}</div></div>`; }).join('')}
    </div>
    <div class="center"><a class="btn go" href="#${MID(c.missions[0].id)}">C'est parti ▶</a></div>
    <div class="center muted small">Au programme : ${esc(c.subtitle)} · ${c.missions.length} missions · un quiz${c.sides && c.sides.length ? ' · des quêtes annexes et cachées' : ''}</div>
    ${sideCard(c)}
  </div>`;
}

/* ---------- mission ---------- */
function shortLesson(html){
  // première partie de la leçon : 1er paragraphe + 1er bloc de code
  const t = document.createElement('div'); t.innerHTML = html;
  const kids = Array.from(t.children); let out = '', rest = '', seenCode = false, seenP = false;
  for (const k of kids){
    if (!seenCode && (k.tagName === 'P' || k.tagName === 'UL') && !seenP){ out += k.outerHTML; seenP = true; continue; }
    if (!seenCode && k.tagName === 'PRE'){ out += k.outerHTML; seenCode = true; continue; }
    if (!seenCode && k.tagName === 'P'){ out += k.outerHTML; continue; }
    rest += k.outerHTML;
  }
  return { out, rest };
}
function viewMission(m){
  const c = chapById[m.ch];
  if (!chapUnlocked(c)){ location.hash = '#home'; toast('Cet épisode est encore verrouillé.'); return; }
  if (!sideOpen(m)){ location.hash = '#chap-' + c.id; toast('Quête cachée : résous d\'abord toutes les missions de l\'épisode.'); return; }
  const pos = m.side ? 1 : c.missions.indexOf(m), done = HD()[m.id], HK = S.hard ? S.hard + ':' + m.id : m.id, hintsUsed = S.hints[HK] || 0;
  const who = speakerOf(m), L = shortLesson(m.lesson);
  const scene = IMG['m' + m.id.replace('.','_')] ? 'm' + m.id.replace('.','_') : 'ch' + c.id + '_' + (pos === c.missions.length - 1 ? 2 : pos % 2);
  main().innerHTML = `<div class="page">
    <div class="pagehead">
      <a href="#chap-${c.id}" class="ephead">ÉPISODE ${c.id} · ${esc(c.title.toUpperCase())}</a>
      <div class="pages">${c.missions.map((x,i) => `<a href="#${MID(x.id)}" class="${x===m?'cur':''} ${HD()[x.id]?'ok':''}" title="${HD()[x.id] || x === m ? esc(x.title) : 'Mission ' + (i+1) + ' : pas encore résolue'}">${i+1}</a>`).join('')}${(c.sides||[]).filter(sideOpen).map(x => `<a href="#${MID(x.id)}" class="sidepg ${x===m?'cur':''} ${HD()[x.id]?'ok':''}" title="${x.side === 'cachee' ? 'Quête cachée' : 'Quête annexe'} : ${esc(x.title)}">${x.side === 'cachee' ? 'S' : 'A'}</a>`).join('')}</div>
    </div>
    ${m.boss ? `<div class="bossbar panel"><div class="sfx">MISSION BOSS !</div><div class="bossinfo">${S.hard ? `<b>${2*m.xp} XP</b> en mode difficile.` : `<b>${m.xp} XP</b> + 100 XP de bonus si tu réussis avant la fin du chrono.`}</div><div class="chrono" id="chrono">--:--</div></div>` : ''}
    <div class="strip s3">
      <div class="panel scenep">${panelImg(scene)}<div class="cap top">${m.side ? (m.side === 'cachee' ? 'QUÊTE CACHÉE · ' : 'QUÊTE ANNEXE · ') : ''}${esc(m.id)} · ${esc(m.title)}</div></div>
      <div class="panel talk wide">${panelImg(who)}<div class="bubble">${m.story}</div><div class="name">${esc((CAST[who]||{}).nom||'')}</div></div>
    </div>
    <details class="panel lessonbar" id="lessonBox">
      <summary>${panelImg('byte2','tiny')}<b>LE TRUC DE BYTE</b><span>La notion du jour, avec un exemple</span><i class="openlbl">Ouvrir</i></summary>
      <div class="bubble flat">${m.lesson}</div>
    </details>
    <div class="panel play">
      <div class="playhead"><div class="sfx small">À TOI !</div><div class="taskbox">${m.task}</div></div>
      ${S.hard ? `<div class="hardnote" id="hardnote"><b>MODE DIFFICILE · ${esc(hardName())}</b> <span class="small">Écris la requête dans la syntaxe de ${esc(hardName())}. Chargement de la mission...</span></div>` : ''}
      ${m.setup ? `<div class="setup">Déjà préparé pour toi : <code>${esc(m.setup)}</code></div>` : ''}
      <div class="playgrid noschema"><div class="playmain">
      ${m.answer ? `<div class="answerrow"><input id="answer" type="text" placeholder="Nom de famille" autocomplete="off"><button class="btn go" id="runBtn">Valider</button></div>
         <details class="more"><summary>Brouillon SQL (pour vérifier avant de répondre)</summary><div id="ed"></div><div class="row"><button class="btn" id="draftRun">Exécuter</button></div></details>`
      : `<div id="ed"></div>
      <div class="row actions">
        <button class="btn go" id="runBtn">Exécuter ▶</button>
        ${hintsUsed < (S.hard ? 99 : m.nh) ? `<button class="btn" id="hintBtn">Un indice ? <small>(-20 XP)</small></button>` : ''}
        <button class="btn ghost" id="schemaBtn">Les tables</button>
        <button class="btn ghost" id="erdBtn">Le schéma</button>
        <button class="btn ghost" id="solBtn">Solution</button>
        <span class="muted small kbd">Ctrl + Entrée</span>
      </div>`}
      </div></div>
      <div id="hintlist"></div>
      <div id="solbox"></div>
      <div id="verdict"></div>
      <div id="result" class="result"></div>
    </div>
    ${S.hard ? '' : `<details class="oracle"><summary>Et en Oracle ?</summary>${c.oracle}</details>`}
  </div>`;
  const ed = makeEditor($('#ed'), S.drafts[HK] != null ? S.drafts[HK] : '', () => go(), v => { S.drafts[HK] = v; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} });
  activeEditor = ed;
  const lb = $('#lessonBox');
  lb.addEventListener('toggle', () => { $('.openlbl', lb).textContent = lb.open ? 'Fermer' : 'Ouvrir'; });
  let fails = 0;
  if (done) showVerdict(m, {ok:true}, true);
  if (m.boss){
    if (!S.hard && !done && S.ident) api('/normal/boss', { uid:S.ident.uid, secret:S.ident.secret, id:m.id }).then(b => { if (b.debut) { S.bossStart[m.id] = b.debut + (Date.now() - b.maintenant); save(); } }).catch(()=>{});
    else if (!S.bossStart[m.id] && !done){ S.bossStart[m.id] = Date.now(); save(); }
    const tick = () => {
      const el = $('#chrono'); if (!el) return;
      if (HD()[m.id]){ el.textContent = HD()[m.id].bonus ? 'BONUS !' : 'RÉSOLU'; el.classList.add('done'); return; }
      const left = Math.round(m.timer - (Date.now() - S.bossStart[m.id]) / 1000);
      if (left <= 0){ el.textContent = 'TEMPS ÉCOULÉ'; el.classList.add('over'); return; }
      el.textContent = String(Math.floor(left/60)).padStart(2,'0') + ':' + String(left%60).padStart(2,'0');
      el.classList.toggle('hot', left <= 60);
    };
    tick(); window.__tick = setInterval(tick, 1000);
  }
  let hardBusy = false;
  async function hardGo(){
    if (!ed.value.trim()){ toast("Écris d'abord ta requête dans l'ordinateur."); return; }
    if (hardBusy) return; hardBusy = true; $('#runBtn').disabled = true;
    $('#result').innerHTML = `<div class="okmsg">Exécution sur ${esc(hardName())}...</div>`;
    try {
      const d = await api('/hard/run', { uid:S.ident.uid, secret:S.ident.secret, moteur:S.hard, id:m.id, sql:ed.value });
      if (d.error && !d.result) $('#result').innerHTML = `<div class="err"><b>Erreur ${esc(hardName())}.</b><div class="raw">${esc(d.msg || '')}</div></div>`;
      else renderResult($('#result'), { res: d.result ? [d.result] : [], ms: d.ms || 0, changes: d.changes });
      if (d.ok){ solveHard(m, d.xp); showVerdict(m, {ok:true}); }
      else { if (++fails === 2 && !lb.open){ lb.open = true; toast('Byte t\'a ouvert son truc, juste au-dessus.'); } if (!d.error || d.result) showVerdict(m, {ok:false, msg: d.msg}); else $('#verdict').innerHTML = ''; }
    } catch(e){ $('#result').innerHTML = `<div class="err"><b>Serveur indisponible.</b> ${esc(e.message)}</div>`; }
    hardBusy = false; $('#runBtn').disabled = false;
  }
  if (S.hard) api('/hard/mission?moteur=' + encodeURIComponent(S.hard) + '&id=' + encodeURIComponent(m.id)).then(d => {
    const box = $('#hardnote'); if (!box) return;
    if (!d.disponible){ box.innerHTML = `<b>MODE DIFFICILE · ${esc(hardName())}</b> <span class="small">${esc(d.raison || 'Mission indisponible sur ce moteur.')}</span>`; $('#runBtn').disabled = true; return; }
    box.innerHTML = `<b>MODE DIFFICILE · ${esc(hardName())}</b> <span class="small">${d.note ? esc(d.note) : 'Écris la requête dans la syntaxe de ' + esc(hardName()) + '.'}</span>`;
    const hb = $('#hintBtn'); if (hb && (S.hints[HK] || 0) >= d.indices) hb.remove();
    if (S.hints[HK]) api('/hard/hint', { uid:S.ident.uid, secret:S.ident.secret, moteur:S.hard, id:m.id, voir:1 }).then(h => { $('#hintlist').innerHTML = h.indices.slice(0, S.hints[HK]).map(x => `<div class="hint">💡 ${esc(x)}</div>`).join(''); }).catch(()=>{});
  }).catch(e => { const box = $('#hardnote'); if (box) box.innerHTML = '<b>MODE DIFFICILE</b> <span class="small">Serveur indisponible : ' + esc(e.message) + '</span>'; });
  let normalBusy = false;
  async function go(){
    if (S.hard) return hardGo();
    if (m.answer){ renderResult($('#result'), run(sandboxDb, ed.value)); return; }
    if (!ed.value.trim()){ toast("Écris d'abord ta requête dans l'ordinateur."); return; }
    const r = localRun(m, ed.value);
    renderResult($('#result'), r, {all: m.check.mode === 'dml'});
    if (!NET.api || !S.ident){ $('#verdict').innerHTML = `<div class="verdict ko"><div class="sfx ko">HORS LIGNE</div><div class="vbody"><div class="bubble">La correction se fait sur le serveur du jeu. ${NET.api ? 'Identifie-toi pour que ta réponse soit vérifiée.' : 'Ouvre le jeu depuis son adresse en ligne pour que ta réponse soit vérifiée.'}</div></div></div>`; if (NET.api) showGate(); return; }
    if (normalBusy) return; normalBusy = true; $('#runBtn').disabled = true;
    try {
      const d = await api('/normal/run', { uid:S.ident.uid, secret:S.ident.secret, id:m.id, sql:ed.value });
      if (d.ok){ solve(m, d); showVerdict(m, {ok:true}); }
      else {
        if (++fails === 2 && !lb.open){ lb.open = true; toast('Byte t\'a ouvert son truc, juste au-dessus.'); }
        showVerdict(m, d.raw ? {ok:false, error:true, msg: frenchError(d.raw)} : {ok:false, error:d.error, msg: d.msg});
      }
    } catch(e){ $('#verdict').innerHTML = `<div class="verdict ko"><div class="sfx ko">ERREUR !</div><div class="vbody"><div class="bubble">Le serveur de correction ne répond pas : ${esc(e.message)}. Réessaie dans un instant.</div></div></div>`; }
    normalBusy = false; $('#runBtn').disabled = false;
  }
  if (m.answer){
    $('#draftRun').addEventListener('click', go);
    const submit = () => {
      const v = normAnswer($('#answer').value);
      if (m.check.answers.includes(v)){ solve(m); showVerdict(m, {ok:true}); }
      else showVerdict(m, {ok:false, msg: v ? "Ce n'est pas le bon nom. Repense à la cheffe du Cercle..." : "Écris un nom."});
    };
    $('#runBtn').addEventListener('click', submit);
    $('#answer').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  } else {
    $('#runBtn').addEventListener('click', go);
    $('#schemaBtn').addEventListener('click', openSchema);
    if ($('#erdBtn')) $('#erdBtn').addEventListener('click', () => openSchemaModal(c.season || 1));
    try { sessionStorage.setItem('om-last-mission', m.id); } catch(e){}
    const hb = $('#hintBtn');
    if (hb && S.hard) hb.addEventListener('click', async () => {
      try {
        const h = await api('/hard/hint', { uid:S.ident.uid, secret:S.ident.secret, moteur:S.hard, id:m.id });
        S.hints[HK] = h.indices.length; save();
        $('#hintlist').innerHTML = h.indices.map(x => `<div class="hint">💡 ${esc(x)}</div>`).join('');
        if (!h.reste) hb.remove();
      } catch(e){ toast(e.message); }
    });
    else if (hb) hb.addEventListener('click', async () => {
      if (!S.ident){ showGate(); return; }
      try {
        const h = await api('/normal/hint', { uid:S.ident.uid, secret:S.ident.secret, id:m.id });
        S.hints[m.id] = h.indices.length; save();
        $('#hintlist').innerHTML = h.indices.map(x => `<div class="hint">💡 ${esc(x)}</div>`).join('');
        if (!h.reste) hb.remove();
      } catch(e){ toast(e.message); }
    });
    if (!S.hard && S.ident && hintsUsed) api('/normal/hint', { uid:S.ident.uid, secret:S.ident.secret, id:m.id, voir:1 }).then(h => { $('#hintlist').innerHTML = h.indices.map(x => `<div class="hint">💡 ${esc(x)}</div>`).join(''); if (!h.reste && $('#hintBtn')) $('#hintBtn').remove(); }).catch(()=>{});
    let armed = false;
    $('#solBtn').addEventListener('click', async e => {
      if (!HD()[m.id] && !armed){ armed = true; e.target.textContent = 'Sûr ? (0 XP)'; return; }
      if (S.hard){
        try {
          const d = await api('/hard/solution', { uid:S.ident.uid, secret:S.ident.secret, moteur:S.hard, id:m.id });
          $('#solbox').innerHTML = `<div class="solution"><b>Une solution possible en ${esc(hardName())}</b> (d'autres sont acceptées) :<pre class="code">${highlight(d.solution)}</pre><button class="btn small" id="copySol">La mettre dans l'éditeur</button></div>`;
          $('#copySol').addEventListener('click', () => { ed.value = d.solution; ed.focus(); });
        } catch(err){ toast(err.message); }
        return;
      }
      if (!S.ident){ showGate(); return; }
      try {
        const d = await api('/normal/solution', { uid:S.ident.uid, secret:S.ident.secret, id:m.id });
        if (!S.done[m.id]) { S.hints[m.id + ':sol'] = 1; save(); }
        $('#solbox').innerHTML = `<div class="solution"><b>Une solution possible</b> (d'autres sont acceptées) :<pre class="code">${highlight(prettySQL(d.solution))}</pre><button class="btn small" id="copySol">La mettre dans l'éditeur</button></div>`;
        $('#copySol').addEventListener('click', () => { ed.value = prettySQL(d.solution); ed.focus(); });
      } catch(err){ toast(err.message); }
    });
    ed.focus();
  }
}
function sandboxFor(){ return sandboxDb; }
function solveHard(m, xp){
  const d = HD(); if (d[m.id]) return;
  d[m.id] = { xp: xp || 0, at: Date.now() };
  save(); confetti();
}
function solve(m, d){
  if (S.done[m.id] && !S.done[m.id].nv) return;
  const c = chapById[m.ch], wasDone = chapDone(c);
  S.done[m.id] = { xp: d.xp || 0, bonus: d.bonus || 0, hints: d.indices || 0, sol: !!d.solution, at: Date.now() };
  save(); confetti(); syncCloud(); pushScore();
  const hid = (c.sides||[]).find(x => x.side === 'cachee');
  if (!m.side && !wasDone && chapDone(c) && hid) setTimeout(() => toast('Quête cachée révélée : ' + hid.title), 1200);
}
function showVerdict(m, v, already){
  const box = $('#verdict');
  if (v.ok){
    const c = chapById[m.ch], next = m.side ? null : MAIN[MAIN.indexOf(m)+1];
    const last = !m.side && c.missions[c.missions.length-1] === m, d = HD()[m.id] || {xp:0};
    box.innerHTML = `<div class="verdict ok"><div class="sfx">${already ? 'DÉJÀ RÉSOLU !' : pick(SFX_OK, m.idx)}</div>
      <div class="vbody"><b>+${d.xp} XP${d.bonus ? ' (dont +100 de bonus chrono !)' : ''}</b>${d.nv && !S.hard ? '<div class="small">Résolue avant la correction par le serveur : relance ta requête pour qu\'elle compte dans le classement.</div>' : ''}${m.success ? `<div class="bubble">${m.success}</div>` : ''}
      <div class="row">${m.side ? `<a class="btn go" href="#chap-${c.id}">Retour à l'épisode ▶</a>` : last ? `<a class="btn go" href="#scene-${c.id}">La suite de l'histoire ▶</a>` : next ? `<a class="btn go" href="#${MID(next.id)}">Page suivante ▶</a>` : ''}
      ${m.id === '41.10' ? `<a class="btn go" href="#fin">Ton certificat ▶</a>` : ''}</div></div></div>`;
    box.scrollIntoView({behavior:'smooth', block:'nearest'});
  } else {
    box.innerHTML = `<div class="verdict ko"><div class="sfx ko">${v.error ? 'ERREUR !' : pick(SFX_KO, (m.idx + Date.now()) % 4)}</div><div class="vbody"><div class="bubble">${safeMsg(v.msg)}</div></div></div>`;
  }
}
function prettySQL(s){
  return s.replace(/\s+(FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|UNION ALL|UNION|INTERSECT|EXCEPT|LEFT JOIN|JOIN|VALUES|SET)\b/g, '\n$1')
          .replace(/\s+AND\s+/g, '\n  AND ').replace(/;\s*/g, ';\n').trim();
}

/* ---------- scène de fin de chapitre ---------- */
function viewScene(c){
  const lines = (window.SCENES||{})[c.id] || [];
  if (!chapDone(c) && !S.unlockAll){ location.hash = '#home'; return; }
  let n = 0;
  main().innerHTML = `<div class="page">
    <div class="pagehead"><span class="ephead">ÉPISODE ${c.id} · ${esc(c.title.toUpperCase())} · LA SUITE</span></div>
    <div class="comicgrid">${lines.map(([who, txt]) => {
      const p = CAST[who] || {nom:''};
      if (who === 'narr') return `<div class="panel cappanel span2">${panelImg('ch'+c.id+'_'+((n++)%3))}<div class="cap">${esc(txt)}</div></div>`;
      const k = who === 'varga' && /!|Lancez|Faites|Alors/.test(txt) ? 'varga2' : (who === 'ouali' && c.id >= 18 && IMG.ouali2) ? 'ouali2' : who;
      return `<div class="panel talk">${panelImg(k)}<div class="bubble">${esc(txt)}</div><div class="name">${esc(p.nom)}</div></div>`;
    }).join('')}</div>
    <div class="center"><a class="btn go" href="#quiz-${c.id}">Le quiz de l'épisode ▶</a> <a class="btn" href="#board">Tableau d'enquête</a></div>
    ${sideCard(c)}
  </div>`;
  const ps = $$('.comicgrid .panel'); let u = 0;
  ps.forEach((p,i) => { p.style.animationDelay = (i*0.12)+'s'; u += p.classList.contains('span2') ? 2 : 1; });
  const r = u % 3, last = ps[ps.length-1];
  if (r && last && window.innerWidth > 900) last.style.gridColumn = 'span ' + (3 - r + (last.classList.contains('span2') ? 2 : 1));
}

/* ---------- tableau d'enquête ---------- */
function viewBoard(){
  const items = window.BOARD || [];
  const got = items.filter(b => S.done[b.unlock]).length;
  main().innerHTML = `<div class="page"><h2 class="sec">LE TABLEAU D'ENQUÊTE <small>${got}/${items.length}</small></h2>
  <div class="cork">${items.map((b,i) => { const ok = !!S.done[b.unlock]; const m = byId[b.unlock];
    return `<div class="polaroid ${ok?'ok':'lock'}" style="--r:${[-3,2,-1.5,3,-2,1.5,-2.5,2][i%8]}deg">
      ${ok ? (b.img && IMG[b.img] ? `<img src="${IMG[b.img]}" alt="">` : `<div class="pinico">${esc(b.t)}</div>`) : `<div class="pinico">?</div>`}
      <b>${ok ? esc(b.t) : '???'}</b><span>${ok ? esc(b.s) : `<a href="#${MID(b.unlock)}">Mission ${b.unlock}</a>`}</span>
      ${ok ? `<ul>${b.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>` : ''}</div>`; }).join('')}</div>
  <div class="panel tlpanel"><h3>LA NUIT DU 13, MINUTE PAR MINUTE</h3><div class="timeline">${[
    ['22h31','Injections SQL sur le portail web','12.4'],['22h40','Début de la force brute depuis 203.0.113.66','5.5'],['22h51','Ferrand badge à l\'entrée principale','9.1'],
    ['23h18','Connexion réussie avec le compte j.ferrand','5.6'],['23h21','Virement de 480 000 € vers FR76-7001','8.4'],['23h31','Ouverture de la salle des coffres (badge B-0027)','7.3'],
    ['23h33','Ferrand appelle Vasseur','6.8'],['23h40','Badge B-0019 refusé aux coffres','7.3'],['23h52','L\'Audi GH-713-KZ passe sur l\'esplanade','4.4'],
    ['23h58','Fausse plaque XX-000-XX','6.5'],['00h20','Vasseur appelle Marchetti','8.3'],['11h30 (le 14)','455 000 € arrivent sur CH-9131','8.5']
  ].map(([t,e,u]) => `<div class="tl ${S.done[u]?'ok':''}"><b>${t}</b><span>${S.done[u] ? esc(e) : '??? (mission ' + u + ')'}</span></div>`).join('')}</div></div>
  <h2 class="sec">TES BADGES</h2>
  <div class="badges">${badges().map(b => `<div class="badge ${b.got?'got':''}"><div class="bico">${b.ico}</div><b>${esc(b.t)}</b><span>${esc(b.d)}</span></div>`).join('')}</div></div>`;
}
function badges(){
  const ch = id => chapDone(chapById[id]);
  const noHint = id => chapById[id].missions.every(m => S.done[m.id] && !S.done[m.id].hints && !S.done[m.id].sol);
  const perfectQuiz = Object.keys(S.quiz).filter(k => S.quiz[k].score === chapById[k].quiz.length).length;
  return [
    {ico:'1', t:'Premier SELECT', d:'La première mission', got:!!S.done['1.1']},
    {ico:'2', t:'Démasqué', d:'Trouver le braqueur', got:!!S.done['2.6']},
    {ico:'3', t:'Joker', d:'LIKE et NULL maîtrisés', got:ch(3)},
    {ico:'5', t:'Analyste SOC', d:'Repérer la force brute', got:ch(5)},
    {ico:'6', t:'Roi des jointures', d:'Finir l\'épisode 6', got:ch(6)},
    {ico:'8', t:'Récursif', d:'Suivre l\'argent', got:!!S.done['8.4']},
    {ico:'9', t:'Chronologiste', d:'Les fenêtres', got:ch(9)},
    {ico:'11', t:'Architecte', d:'Concevoir des tables', got:ch(11)},
    {ico:'12', t:'Hacker éthique', d:'Comprendre l\'injection', got:ch(12)},
    {ico:'∞', t:'Sans filet', d:'Un épisode sans indice', got:CHAPTERS.some(c => noHint(c.id))},
    {ico:'Q', t:'Sans faute', d:'3 quiz parfaits', got:perfectQuiz >= 3},
    {ico:'★', t:'Affaire Minuit', d:'Saison 1 résolue', got:!!S.done['13.2']},
    {ico:'{ }', t:'Déchiffreur', d:'Le JSON de Solène', got:ch(15)},
    {ico:'≈', t:'Gaps and islands', d:'Le trou du conteneur', got:!!S.done['16.5']},
    {ico:'0', t:'Patient zéro', d:'Trouver la première machine', got:!!S.done['17.3']},
    {ico:'⛓', t:'Traqueur de cryptos', d:'Sortir du mixeur', got:ch(18)},
    {ico:'⚡', t:'Optimiseur', d:'Index couvrant', got:!!S.done['20.4']},
    {ico:'B', t:'Chasseur de boss', d:'10 boss au chrono', got:Object.values(S.done).filter(d=>d.bonus).length >= 10},
    {ico:'★★', t:'Le Cartographe', d:'Saison 2 résolue', got:!!S.done['22.3']}
  ];
}

/* ---------- quiz ---------- */
function viewQuiz(c){
  let i = 0, score = 0; const reps = [];
  const qs = c.quiz;
  function step(){
    if (i >= qs.length){
      const xp = score * 50, prev = S.quiz[c.id];
      if (!prev || prev.score < score) { S.quiz[c.id] = { score, xp }; save(); syncCloud(); pushScore(); }
      if (NET.api && S.ident) api('/normal/quiz', { uid:S.ident.uid, secret:S.ident.secret, ch:c.id, reponses:reps }).then(r => { S.quiz[c.id] = { score:r.meilleur, xp:50*r.meilleur }; save(); renderTop(); }).catch(()=>{});
      const nc = chapById[c.id+1];
      main().innerHTML = `<div class="page"><div class="panel quizp center">${panelImg(score === qs.length ? 'varga2' : 'byte2','mini')}
        <div class="sfx">${score}/${qs.length}</div><p><b>+${xp} XP</b></p>
        <div class="row center">${nc ? `<a class="btn go" href="#chap-${nc.id}">Épisode ${nc.id} : ${esc(nc.title)} ▶</a>` : `<a class="btn go" href="#fin">Ton certificat ▶</a>`}<button class="btn" id="again">Refaire le quiz</button></div></div></div>`;
      $('#again').addEventListener('click', () => viewQuiz(c));
      return;
    }
    const q = qs[i];
    main().innerHTML = `<div class="page"><div class="pagehead"><span class="ephead">QUIZ DE L'ÉPISODE ${c.id} · QUESTION ${i+1}/${qs.length}</span></div>
      <div class="panel quizp"><div class="lessonhead">${panelImg('varga','mini')}<div class="bubble flat"><b>${q.q}</b></div></div>
      <div class="opts">${q.o.map((o,j)=>`<button class="opt" data-j="${j}"><i>${'ABCD'[j]}</i>${o}</button>`).join('')}</div><div id="qfb"></div></div></div>`;
    $$('.opt').forEach(b => b.addEventListener('click', () => {
      const j = +b.dataset.j; reps[i] = j; $$('.opt').forEach(x => x.disabled = true);
      $$('.opt')[q.a].classList.add('right'); if (j !== q.a) b.classList.add('wrong'); else score++;
      $('#qfb').innerHTML = `<div class="verdict ${j===q.a?'ok':'ko'}"><div class="sfx ${j===q.a?'':'ko'}">${j===q.a?'EXACT !':'RATÉ !'}</div><div class="vbody"><div class="bubble">${q.e}</div><div class="row"><button class="btn go" id="nextQ">${i+1<qs.length?'Question suivante ▶':'Mon score ▶'}</button></div></div></div>`;
      $('#nextQ').addEventListener('click', () => { i++; step(); });
    }));
  }
  step();
}

/* ---------- bac à sable ---------- */
function viewSandbox(){
  main().innerHTML = `<div class="page"><div class="panel play">
    <div class="playhead"><div class="sfx small">LIBRE !</div><div class="taskbox"><b>Le bac à sable.</b> Toute la base de l'enquête, en accès libre. Tes modifications restent jusqu'à la réinitialisation.</div></div>
    <div class="examples">${[
      ['Les tables', "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;"],
      ['Colonnes de suspects', "SELECT * FROM pragma_table_info('suspects');"],
      ['Plan d\'exécution', "EXPLAIN QUERY PLAN\nSELECT * FROM delits WHERE suspect_id = 217;"],
      ['Top villes', "SELECT ville, COUNT(*) AS nb\nFROM suspects\nGROUP BY ville\nORDER BY nb DESC;"],
      ['Membres des gangs', "SELECT g.nom, group_concat(s.nom, ', ') AS membres\nFROM gangs g\nJOIN membres m ON m.gang_id = g.id\nJOIN suspects s ON s.id = m.suspect_id\nGROUP BY g.id;"]
    ].map(([t,q])=>`<button class="chip" data-q="${esc(q)}">${esc(t)}</button>`).join('')}</div>
    <div id="ed"></div>
    <div class="row actions"><button class="btn go" id="runBtn">Exécuter ▶</button><button class="btn ghost" id="schemaBtn">Les tables</button><button class="btn ghost" id="resetDb">Réinitialiser la base</button></div>
    <div id="result" class="result"></div></div></div>`;
  const ed = makeEditor($('#ed'), S.drafts.sandbox || "SELECT *\nFROM suspects\nLIMIT 20;", go, v => { S.drafts.sandbox = v; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} });
  activeEditor = ed;
  async function go(){
    if (!S.hard) return renderResult($('#result'), run(sandboxDb, ed.value), {all:true});
    $('#result').innerHTML = `<div class="okmsg">Exécution sur ${esc(hardName())} (lecture seule)...</div>`;
    try { const d = await api('/hard/sandbox', { uid:S.ident.uid, secret:S.ident.secret, moteur:S.hard, sql:ed.value });
      if (!d.ok) $('#result').innerHTML = `<div class="err"><b>Erreur ${esc(hardName())}.</b><div class="raw">${esc(d.msg || '')}</div></div>`;
      else renderResult($('#result'), { res: d.result ? [d.result] : [], ms: 0 }, {all:true});
    } catch(e){ $('#result').innerHTML = `<div class="err">${esc(e.message)}</div>`; }
  }
  $('#runBtn').addEventListener('click', go);
  $('#schemaBtn').addEventListener('click', openSchema);
  $('#resetDb').addEventListener('click', () => { sandboxDb.close(); sandboxDb = fresh(); toast('Base réinitialisée.'); });
  $$('.chip').forEach(b => b.addEventListener('click', () => { ed.value = b.dataset.q; go(); }));
  ed.focus();
}

/* ---------- schéma ---------- */
const DESC = {
  suspects:'Les 500 individus fichés', gangs:'Les gangs et leur chef', membres:'Qui est dans quel gang', delits:'Les casiers judiciaires',
  vehicules:'Les voitures et leurs propriétaires', cameras:'Les caméras qui lisent les plaques', employes:'Le personnel de la banque Hélios', agences:'Les agences Hélios',
  acces_badges:'Les passages de badge', connexions:'Les connexions au système informatique', appels:'Les appels téléphoniques', comptes:'Les comptes bancaires', virements:'Les virements', utilisateurs_portail:'Les comptes du site web',
  incidents:'Saison 2 : incidents du réseau TransSeine', saisies:'Saison 2 : le disque dur de Marchetti (JSON)', mouvements_port:'Saison 2 : scans des conteneurs au port', conteneurs:'Saison 2 : conteneurs et importateurs', societes:'Saison 2 : sociétés', participations:'Saison 2 : qui possède quoi', trafic:'Saison 2 : journal réseau TransSeine', sessions_postes:'Saison 2 : qui est connecté où', wallets:'Saison 2 : portefeuilles crypto', tx_crypto:'Saison 2 : transactions crypto', pieces:'Saison 2 : pièces à conviction', journal_brigade:'Saison 2 : journal d\'audit de la brigade', consultants:'Saison 2 : consultants extérieurs', compteurs_alertes:'Saison 2 : alertes par station', temoignages_bruts:'Saison 2 : témoignages saisis à la main', cartes_grises:'Saison 2 : cartes grises'
};
function openSchema(){
  const db = sandboxDb;
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")[0].values.map(r=>r[0]);
  const order = Object.keys(DESC).filter(t => tables.includes(t)).concat(tables.filter(t => !DESC[t]));
  const html = order.map(t => {
    const cols = db.exec(`SELECT name, type, pk FROM pragma_table_info('${t}')`)[0].values;
    const fks = (db.exec(`SELECT "from", "table", "to" FROM pragma_foreign_key_list('${t}')`)[0] || {values:[]}).values;
    const n = db.exec(`SELECT COUNT(*) FROM "${t}"`)[0].values[0][0];
    return `<div class="tbl"><div class="tname" data-ins="${t}">${t}<span>${n} lignes</span></div><div class="tdesc">${esc(DESC[t]||'Table créée par toi')}</div>
      ${cols.map(c => { const fk = fks.find(f => f[0] === c[0]); return `<div class="col" data-ins="${c[0]}"><span class="cn">${c[2]?'<i class="pk">clé</i>':''}${fk?'<i class="fk">lien</i>':''}${esc(c[0])}</span><span class="ct">${fk?`→ ${esc(fk[1])}`:''}</span></div>`; }).join('')}</div>`;
  }).join('');
  $('#drawerBody').innerHTML = `<p class="small">Clique sur un nom pour l'écrire dans l'éditeur. <i class="pk">clé</i> identifiant unique, <i class="fk">lien</i> renvoie vers une autre table.</p><div class="tables">${html}</div>`;
  $$('#drawerBody [data-ins]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); if (activeEditor) activeEditor.insert(el.dataset.ins); }));
  $('#drawer').classList.add('open');
}


/* ---------- schémas (ERD) ---------- */
const LOGICAL = [
 ['cameras','immatriculation','vehicules','immatriculation'],['appels','appelant','suspects','telephone'],['appels','appele','employes','telephone'],
 ['connexions','login','employes','login'],['trafic','poste','sessions_postes','poste'],['tx_crypto','de','wallets','adresse'],['tx_crypto','vers','wallets','adresse'],
 ['conteneurs','importateur_siren','societes','siren'],['mouvements_port','conteneur','conteneurs','code'],['journal_brigade','login','consultants','login'],
 ['journal_brigade','ligne_id','pieces','id'],['consultants','societe_siren','societes','siren'],['participations','detenteur','societes','siren'],
 ['cartes_grises','immatriculation','temoignages_bruts','plaque'],['incidents','station','compteurs_alertes','station'],
 ['dataset_vigie','annote_par','annotateurs','id'],['annotateurs','compte_paiement','paiements_annotation','compte_paiement'],['paiements_annotation','payeur_siren','societes','siren'],
 ['chatbot_sessions','appareil','appareils','appareil'],['appareils','proprietaire_login','employes_neurocite','login'],['echantillons_tts','depose_par','employes_neurocite','login'],
 ['appels_vocaux','locuteur_declare','voix_ref','locuteur'],['scans_gpu','serveur','inventaire_gpu','serveur'],['patrouilles','quartier','dataset_vigie','quartier'],
 ['releves_electriques','sous_station','sous_stations','nom'],['sous_stations','station','antennes','station'],['bornages','antenne','antennes','antenne'],['bornages','numero','abonnes','numero'],['communications','appelant','abonnes','numero'],['sous_stations','payeur_siren','societes','siren'],['troncons','vers','sous_stations','station'],
 ['auth_logs','login','comptes_ad','login'],['postes','utilisateur','comptes_ad','login'],['auth_logs','source_ip','postes','ip'],['process_logs','host','postes','hostname'],['proxy_logs','host','postes','hostname'],['proxy_logs','domaine','domaines_connus','domaine'],['dns_logs','host','postes','hostname'],['clics','login','comptes_ad','login'],['commandes_ot','source_ip','postes','ip'],['deplacements','login','comptes_ad','login'],['lignes_internet','ip','proxy_logs','ip_dest'],['lignes_internet','abonne_siren','societes','siren'],['commandes_ot','site','capteurs','site']
];
const LAYOUT = {
  1:{gangs:[1,1],membres:[1,2],delits:[1,3],suspects:[2,1,3],vehicules:[3,1],comptes:[3,2],appels:[3,3],connexions:[3,4],cameras:[4,1],virements:[4,2],employes:[4,3,2],utilisateurs_portail:[5,1],agences:[5,3],acces_badges:[5,4]},
  2:{mouvements_port:[1,1],conteneurs:[2,1],societes:[3,1],participations:[4,1],saisies:[5,1],pieces:[1,2],journal_brigade:[2,2],consultants:[3,2],incidents:[4,2],compteurs_alertes:[5,2],trafic:[1,3],sessions_postes:[2,3],tx_crypto:[3,3],wallets:[4,3],temoignages_bruts:[1,4],cartes_grises:[2,4]},
  3:{predictions_vigie:[1,1],dataset_vigie:[2,1,2],annotations:[3,1],annotateurs:[4,1],paiements_annotation:[5,1],patrouilles:[1,2],voix_ref:[3,2],appels_vocaux:[4,2],echantillons_tts:[5,2],chatbot_logs:[1,3],chatbot_sessions:[2,3],documents_rag:[3,3],appareils:[4,3],employes_neurocite:[5,3],acces_datacenter:[1,4],inventaire_gpu:[2,4],scans_gpu:[3,4]},
  4:{comptes_ad:[1,1],postes:[2,1],auth_logs:[1,2,2],deplacements:[2,2],mail_logs:[3,1],clics:[3,2],process_logs:[4,1,2],proxy_logs:[5,1],domaines_connus:[5,2],dns_logs:[3,3],capteurs:[4,3],commandes_ot:[5,3],lignes_internet:[2,4]},
  5:{carnet_delorme:[1,1],minotaure_checkpoints:[1,2],releves_electriques:[2,1],sous_stations:[2,2],troncons:[3,1],antennes:[3,2],bornages:[4,1],abonnes:[4,2],communications:[5,1],file_minotaure:[5,2]}
};
const S3T = ['dataset_vigie','predictions_vigie','annotateurs','annotations','paiements_annotation','voix_ref','appels_vocaux','echantillons_tts','chatbot_sessions','chatbot_logs','documents_rag','appareils','employes_neurocite','patrouilles','acces_datacenter','inventaire_gpu','scans_gpu'];
const S4T = ['comptes_ad','postes','auth_logs','deplacements','mail_logs','clics','process_logs','proxy_logs','domaines_connus','dns_logs','capteurs','commandes_ot','lignes_internet'];
const S5T = ['carnet_delorme','releves_electriques','sous_stations','minotaure_checkpoints','troncons','antennes','bornages','abonnes','communications','file_minotaure'];
const S1T = ['suspects','delits','membres','gangs','vehicules','cameras','employes','agences','acces_badges','connexions','appels','comptes','virements','utilisateurs_portail'];
const S2T = ['incidents','compteurs_alertes','saisies','mouvements_port','conteneurs','societes','participations','trafic','sessions_postes','wallets','tx_crypto','pieces','journal_brigade','consultants','temoignages_bruts','cartes_grises'];
let _tables = null;
function allTables(){ if (!_tables) _tables = new Set(sandboxDb.exec("SELECT name FROM sqlite_master WHERE type='table'")[0].values.map(r=>r[0])); return _tables; }
function tablesFor(m){
  const known = allTables();
  return (m.tbl || []).filter(t => known.has(t)).slice(0, 5);
}
function linksAmong(tables){
  const out = [];
  for (const t of tables){
    const fk = (sandboxDb.exec(`SELECT "from","table","to" FROM pragma_foreign_key_list('${t}')`)[0] || {values:[]}).values;
    for (const [f, tt, to] of fk) if (tables.includes(tt)) out.push({a:t, ac:f, b:tt, bc:to || 'id', fk:true});
  }
  for (const [a, ac, b, bc] of LOGICAL) if (tables.includes(a) && tables.includes(b) && !out.some(l => l.a===a && l.ac===ac && l.b===b)) out.push({a, ac, b, bc, fk:false});
  return out;
}
function drawErd(host, tables, opt){
  opt = opt || {};
  const links = linksAmong(tables);
  const linkCols = new Set(links.flatMap(l => [l.a+'.'+l.ac, l.b+'.'+l.bc]));
  const lay = opt.layout && window.innerWidth > 900 ? opt.layout : null;
  host.innerHTML = `<div class="erd ${opt.mini?'mini':''} ${lay?'laid':''}"><svg class="erdsvg"></svg>${tables.map(t => {
    const cols = sandboxDb.exec(`SELECT name, pk FROM pragma_table_info('${t}')`)[0].values;
    const n = sandboxDb.exec(`SELECT COUNT(*) FROM "${t}"`)[0].values[0][0];
    const pos = lay && lay[t] ? ` style="grid-column:${lay[t][0]};grid-row:${lay[t][1]}${lay[t][2] ? ' / span ' + lay[t][2] : ''}"` : '';
    return `<div class="ebox" data-t="${t}"${pos}><div class="ehead" data-ins="${t}">${t}<span>${n}</span></div>${cols.map(([c, pk]) =>
      `<div class="ecol ${linkCols.has(t+'.'+c)?'lk':''}" data-t="${t}" data-c="${c}" data-ins="${c}">${pk?'<i class="pk">clé</i>':''}${esc(c)}</div>`).join('')}</div>`; }).join('')}</div>
    ${links.length ? `<div class="elegend"><span><i class="l1"></i> clé étrangère</span><span><i class="l2"></i> lien logique (même valeur)</span></div>` : ''}`;
  $$('[data-ins]', host).forEach(el => el.addEventListener('click', e => { e.stopPropagation(); if (activeEditor && document.body.contains(activeEditor.el || document.body)) activeEditor.insert(el.dataset.ins); }));
  const paint = () => {
    const erd = $('.erd', host), svg = $('svg', erd); if (!erd) return;
    const R = erd.getBoundingClientRect(); svg.setAttribute('width', R.width); svg.setAttribute('height', R.height);
    let html = '';
    links.forEach((l, i) => {
      const ea = $(`.ecol[data-t="${l.a}"][data-c="${l.ac}"]`, erd), eb = $(`.ecol[data-t="${l.b}"][data-c="${l.bc}"]`, erd);
      if (!ea || !eb) return;
      const a = ea.getBoundingClientRect(), b = eb.getBoundingClientRect();
      const ay = a.top + a.height/2 - R.top, by = b.top + b.height/2 - R.top;
      let ax, bx, c1, c2;
      if (Math.abs(a.left - b.left) < 20){ ax = a.right - R.left; bx = b.right - R.left; const k = 26 + (i%3)*10; c1 = ax + k; c2 = bx + k; }
      else if (a.left < b.left){ ax = a.right - R.left; bx = b.left - R.left; c1 = ax + 40; c2 = bx - 40; }
      else { ax = a.left - R.left; bx = b.right - R.left; c1 = ax - 40; c2 = bx + 40; }
      html += `<path d="M${ax},${ay} C${c1},${ay} ${c2},${by} ${bx},${by}" class="${l.fk?'fk':'lg'}"/><circle cx="${ax}" cy="${ay}" r="3.5"/><circle cx="${bx}" cy="${by}" r="3.5"/>`;
    });
    svg.innerHTML = html;
  };
  requestAnimationFrame(() => requestAnimationFrame(paint));
  clearTimeout(host._rt); window.addEventListener('resize', () => { clearTimeout(host._rt); host._rt = setTimeout(paint, 120); });
  $$('img').forEach(im => im.complete || im.addEventListener('load', paint, {once:true}));
}
const SCHEMA_TABS = [[1,'Saison 1 : Minuit'],[2,'Saison 2 : Éclipse'],[3,'Saison 3 : Synapse'],[4,'Saison 4 : Hydre'],[5,'Finale : Minotaure']];
function schemaWidget(host, sn0){
  const known = allTables();
  const extra = [...known].filter(t => !S1T.includes(t) && !S2T.includes(t) && !S3T.includes(t) && !S4T.includes(t) && !S5T.includes(t));
  const tabs = SCHEMA_TABS.filter(([sn]) => seasonUnlocked(sn));
  if (!tabs.some(([sn]) => sn === sn0)) sn0 = tabs[tabs.length - 1][0];
  host.innerHTML = `<div class="tabs">${tabs.map(([sn, l]) => `<button class="chip" data-s="${sn}">${l}</button>`).join('')}${extra.length ? '<button class="chip" data-s="6">Tes tables</button>' : ''}</div><div class="panel erdpanel"></div>`;
  const erd = host.querySelector('.erdpanel');
  const show = sn => { host.querySelectorAll('.tabs .chip').forEach(b => b.classList.toggle('on', b.dataset.s == sn)); drawErd(erd, (sn == 1 ? S1T : sn == 2 ? S2T : sn == 3 ? S3T : sn == 4 ? S4T : sn == 5 ? S5T : extra).filter(t => known.has(t)), {layout: LAYOUT[sn]}); };
  host.querySelectorAll('.tabs .chip').forEach(b => b.addEventListener('click', () => show(b.dataset.s)));
  show(sn0);
}
function openSchemaModal(sn0){
  let ov = $('#schemaModal');
  if (!ov){ ov = document.createElement('div'); ov.id = 'schemaModal'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="smbox panel" role="dialog" aria-modal="true" aria-label="Schéma de la base"><div class="smhead"><h2>LE SCHÉMA DE LA BASE</h2><button class="btn small" id="smClose">Fermer et revenir à la mission ✕</button></div><p class="small">Traits pleins : clés étrangères. Pointillés : liens logiques (colonnes qu'on peut joindre). Clique sur un nom pour l'écrire dans ton éditeur.</p><div id="smBody"></div></div>`;
  ov.classList.add('open'); document.body.classList.add('noscroll');
  const close = () => { ov.classList.remove('open'); document.body.classList.remove('noscroll'); };
  $('#smClose').addEventListener('click', close);
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  schemaWidget($('#smBody'), sn0);
}
function viewSchema(){
  let back = '';
  try { const lm = sessionStorage.getItem('om-last-mission'); if (lm && byId[lm]) back = `<a class="btn small" href="#${MID(lm)}">← Revenir à la mission ${esc(lm)}</a>`; } catch(e){}
  main().innerHTML = `<div class="page"><div class="pagehead"><h2 class="sec">LE SCHÉMA DE LA BASE</h2>${back}</div>
    <p>Chaque boîte est une table, chaque ligne une colonne. Les traits pleins sont des <b>clés étrangères</b> déclarées, les pointillés des <b>liens logiques</b> (deux colonnes qui contiennent la même valeur et qu'on peut joindre). Clique sur un nom pour l'insérer dans l'éditeur du bac à sable.</p>
    <div id="fullErd"></div></div>`;
  let sn0 = 1; try { const lm = sessionStorage.getItem('om-last-mission'); if (lm && byId[lm]) sn0 = chapById[byId[lm].ch].season || 1; } catch(e){}
  schemaWidget($('#fullErd'), sn0);
}

/* ---------- mémo ---------- */
function viewMemo(){
  main().innerHTML = `<div class="page"><h2 class="sec">LE CARNET DE BYTE</h2><p>L'essentiel du SQL sur une page. Clique sur un bloc pour l'essayer dans le bac à sable.</p><div class="memogrid">${MEMO.map(([t,code,note])=>`<div class="panel mcard"><h3>${esc(t)}</h3><pre class="code" data-q="${esc(code)}">${highlight(code)}</pre>${note?`<p class="small">${note}</p>`:''}</div>`).join('')}</div>
  <div class="panel mcard"><h3>DANS QUEL ORDRE SQL LIT TA REQUÊTE</h3><ol class="order"><li>FROM et JOIN</li><li>WHERE</li><li>GROUP BY</li><li>HAVING</li><li>SELECT (et les fenêtres OVER)</li><li>DISTINCT</li><li>ORDER BY</li><li>LIMIT</li></ol></div></div>`;
  $$('.memogrid pre[data-q]').forEach(p => p.addEventListener('click', () => { S.drafts.sandbox = p.dataset.q; save(); location.hash = '#sandbox'; }));
}
const MEMO = [
  ['Lire', "SELECT DISTINCT ville, sexe\nFROM suspects\nORDER BY ville ASC, sexe DESC\nLIMIT 10;"],
  ['Filtrer', "SELECT * FROM suspects\nWHERE age BETWEEN 30 AND 40\n  AND cheveux IN ('Roux', 'Blonds')\n  AND (nom LIKE 'Le%' OR nom LIKE '_a%')\n  AND telephone IS NOT NULL;", 'AND passe avant OR : mets des parenthèses.'],
  ['Fonctions', "SELECT UPPER(nom), LENGTH(nom), SUBSTR(nom, 1, 3),\n  COALESCE(telephone, 'inconnu'),\n  ROUND(prejudice, 2),\n  strftime('%Y', date_faits),\n  CASE WHEN age < 25 THEN 'Jeune' ELSE 'Adulte' END\nFROM suspects JOIN delits ON delits.suspect_id = suspects.id;"],
  ['Compter, grouper', "SELECT type, COUNT(*) AS nb, ROUND(AVG(prejudice), 2) AS moy\nFROM delits\nGROUP BY type\nHAVING COUNT(*) > 5\nORDER BY nb DESC;", 'WHERE filtre les lignes, HAVING filtre les groupes.'],
  ['Joindre', "SELECT s.nom, d.type\nFROM suspects s\nJOIN delits d ON d.suspect_id = s.id;"],
  ['Ceux qui n\'ont rien', "SELECT s.nom\nFROM suspects s\nLEFT JOIN delits d ON d.suspect_id = s.id\nWHERE d.id IS NULL;"],
  ['Sous-requêtes', "SELECT nom FROM suspects s\nWHERE age > (SELECT AVG(age) FROM suspects)\n  AND NOT EXISTS (SELECT 1 FROM vehicules v WHERE v.suspect_id = s.id);"],
  ['Ensembles', "SELECT suspect_id FROM membres WHERE gang_id = 1\nUNION\nSELECT suspect_id FROM membres WHERE gang_id = 2;", 'Aussi : UNION ALL, INTERSECT, EXCEPT.'],
  ['CTE récursive', "WITH RECURSIVE n(i) AS (\n  SELECT 1\n  UNION ALL\n  SELECT i + 1 FROM n WHERE i < 10\n)\nSELECT i FROM n;"],
  ['Fenêtres', "SELECT nom, ville, age,\n  RANK() OVER (PARTITION BY ville ORDER BY age DESC) AS rang,\n  LAG(age) OVER (ORDER BY age) AS precedent\nFROM suspects;"],
  ['Texte', "SELECT expediteur,\n  substr(expediteur, instr(expediteur, '@') + 1) AS domaine,\n  REPLACE(expediteur, '-', '') AS sans_tirets\nFROM mail_logs\nLIMIT 5;", 'Aussi : LOWER, rtrim, length, REGEXP, CAST(unhex(x) AS TEXT).'],
  ['Assembler', "SELECT ville, group_concat(nom, ', ' ORDER BY nom) AS noms\nFROM suspects\nGROUP BY ville;", 'Le ORDER BY se met à l\'intérieur des parenthèses.'],
  ['JSON', "SELECT j.key, j.value\nFROM voix_ref r, json_each(r.vecteur) j\nWHERE r.locuteur = 'Inès Varga';", 'Et json_extract(col, \'$.cle\') pour une seule valeur.'],
  ['Statistiques', "SELECT AVG(age) AS moyenne,\n  sqrt(AVG(age * age) - AVG(age) * AVG(age)) AS ecart_type\nFROM suspects;", 'Score z : (x - moyenne) / écart-type.'],
  ['Îlots', "WITH h AS (SELECT id, id - ROW_NUMBER() OVER (ORDER BY id) AS grp\n  FROM suspects WHERE age > 40)\nSELECT MIN(id), MAX(id), COUNT(*) FROM h GROUP BY grp;", 'Valeur moins ROW_NUMBER : constante dans un bloc continu.'],
  ['Modifier', "INSERT INTO gangs (id, nom) VALUES (9, 'Les Ombres');\nUPDATE gangs SET territoire = 'Lyon' WHERE id = 9;\nDELETE FROM gangs WHERE id = 9;", 'Teste toujours ton WHERE avec un SELECT avant.'],
  ['Automatiser', "CREATE INDEX idx_nom ON suspects(nom);\nCREATE TABLE gangs_log (id INTEGER, nom TEXT);\nCREATE TRIGGER trg AFTER INSERT ON gangs\nBEGIN\n  INSERT INTO gangs_log VALUES (NEW.id, NEW.nom);\nEND;", 'EXPLAIN QUERY PLAN montre si l\'index sert.'],
  ['Créer', "CREATE TABLE t (\n  id INTEGER PRIMARY KEY,\n  nom TEXT NOT NULL UNIQUE,\n  age INTEGER CHECK (age >= 0),\n  suspect_id INTEGER REFERENCES suspects(id)\n);"]
];

/* ---------- fin ---------- */
function viewEnd(){
  const all = nDone() === MAIN.length, x = xpTotal();
  main().innerHTML = `<div class="page"><div class="cert panel">
    ${panelImg('ch41_2','certimg')}
    <img class="certlogo" src="${LOGO}" alt="Cybersup">
    <div class="sfx">${all ? 'LÉGENDE DE LA BRIGADE !' : 'ENQUÊTE EN COURS'}</div>
    <p>La Brigade Data certifie que</p>
    <input id="certName" class="certname" placeholder="Ton prénom et ton nom" value="${esc(S.name||'')}">
    <p>${all ? 'a résolu les quatre saisons et la grande finale : « Minuit », « Éclipse », « Synapse », « Hydre » et « Minotaure »' : `a résolu ${nDone()} missions sur ${MAIN.length}`}, au rang de <b>${rankOf(x)[1]}</b>, avec <b>${x} XP</b>.</p>
    <p class="small">${new Date().toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</p>
    <p class="sig">Cybersup, l'école qui protège votre avenir</p></div></div>`;
  $('#certName').addEventListener('input', e => { S.name = e.target.value; save(); });
}



/* ---------- identité et classement ---------- */
const NET = { api:null, gid:'', domain:'votre-domaine.fr', rang:null };
async function initNet(){
  if (!/^https?:$/.test(location.protocol)) return;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3500);
    const r = await fetch('/api/config', { cache:'no-store', signal: ctl.signal }); clearTimeout(t);
    if (!r.ok) return; const c = await r.json(); if (!c || !c.classement) return;
    NET.api = '/api'; NET.gid = c.google_client_id || ''; NET.domain = c.domaine || NET.domain;
    try { const h = await (await fetch('/api/hard/config', { cache:'no-store' })).json(); HARD.moteurs = h.moteurs || []; HARD.moteurs.forEach(x => HARD.names[x.id] = x.nom); } catch(e){}
  } catch(e){}
  if (S.hard && (!HARD.names[S.hard] || !(S.ident && S.ident.mode === 'google'))){ S.hard = ''; save(); document.body.classList.remove('hardmode'); }
  document.body.classList.toggle('hardmode', !!S.hard);
}
async function api(path, body){
  const r = await fetch(NET.api + path, body ? { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) } : { cache:'no-store' });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.erreur || 'Le serveur ne répond pas.');
  return d;
}
function needGate(){ if (location.hash === '#prof') return false; return !S.name || (NET.api && !S.ident); }
function setIdent(d, classe){
  S.ident = { uid:d.uid, secret:d.secret, mode:d.mode, email:d.email || '' };
  S.name = (d.prenom + ' ' + d.nom).trim(); if (classe) S.classe = classe;
  save(); closeGate(); pushScore(true); syncNormal(); toast('Bienvenue dans la Brigade Data, ' + d.prenom + ' !');
  if (location.hash === '' || location.hash === '#home') viewHome();
}
function closeGate(){ const g = $('#gate'); if (g) g.remove(); document.body.classList.remove('noscroll'); }
function showGate(){
  if ($('#gate')) return;
  const parts = (S.name || '').split(' ');
  const g = document.createElement('div'); g.id = 'gate'; g.className = 'gate';
  g.innerHTML = `<div class="gatebox" role="dialog" aria-modal="true" aria-labelledby="gateT">
    <h2 id="gateT">AVANT DE COMMENCER</h2>
    <p>La commissaire Varga doit savoir qui rejoint la Brigade Data. ${NET.api ? 'Ton score apparaîtra dans le <b>classement</b>.' : ''}</p>
    <input id="gClasse" placeholder="Ta classe (ex. M1 DATA IA)" value="${esc(S.classe || '')}" autocomplete="off">
    ${NET.api && NET.gid ? `<div class="or">Avec ton compte Cybersup</div><div id="gBtn" style="display:flex;justify-content:center;min-height:44px"></div><div class="or">ou</div>` : ''}
    <input id="gPrenom" placeholder="Prénom" value="${esc(parts[0] || '')}" autocomplete="given-name">
    <input id="gNom" placeholder="Nom" value="${esc(parts.slice(1).join(' '))}" autocomplete="family-name">
    <div class="gerr" id="gErr"></div>
    <div class="row" style="justify-content:flex-end;margin-top:8px">${S.ident ? '<button class="btn" id="gClose">Annuler</button>' : ''}<button class="btn go" id="gGo">Entrer dans la Brigade ▶</button></div>
    <p class="small muted" style="margin-top:12px">${NET.api ? 'Seuls ton prénom, l\'initiale de ton nom, ta classe et ton score sont visibles dans le classement.' : 'Ton nom sert à ton certificat et au code de progression pour ton formateur.'}</p>
  </div>`;
  document.body.appendChild(g); document.body.classList.add('noscroll');
  const err = m => { $('#gErr').textContent = m || ''; };
  if ($('#gClose')) $('#gClose').addEventListener('click', closeGate);
  $('#gGo').addEventListener('click', async () => {
    const p = $('#gPrenom').value.trim(), n = $('#gNom').value.trim(), cl = $('#gClasse').value.trim();
    if (p.length < 2 || n.length < 2) return err('Indique ton prénom et ton nom.');
    if (!NET.api){ S.name = p + ' ' + n; S.classe = cl; save(); closeGate(); viewHome(); return; }
    $('#gGo').disabled = true; err('');
    try { setIdent(await api('/inscription', { prenom:p, nom:n, classe:cl }), cl); }
    catch(e){ err(e.message); $('#gGo').disabled = false; }
  });
  [$('#gPrenom'), $('#gNom')].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') $('#gGo').click(); }));
  if (NET.api && NET.gid) loadGoogle(() => {
    google.accounts.id.initialize({ client_id: NET.gid, hd: NET.domain, ux_mode:'popup', callback: async resp => {
      err(''); try { const cl = $('#gClasse').value.trim(); setIdent(await api('/inscription', { credential: resp.credential, classe: cl }), cl); } catch(e){ err(e.message); }
    }});
    google.accounts.id.renderButton($('#gBtn'), { theme:'outline', size:'large', text:'signin_with', shape:'pill', locale:'fr' });
  });
}
function loadGoogle(cb){
  if (window.google && google.accounts && google.accounts.id) return cb();
  const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
  sc.onload = cb; sc.onerror = () => { const b = $('#gBtn'); if (b) b.innerHTML = '<span class="small muted">Connexion Google indisponible : utilise ton prénom et ton nom.</span>'; };
  document.head.appendChild(sc);
}
let scoreT = null;
/* Progression du mode normal : c'est le serveur qui fait foi (et elle suit l'élève d'un appareil à l'autre). */
let syncingNormal = false;
async function syncNormal(){
  if (!NET.api || !S.ident || syncingNormal) return;
  syncingNormal = true;
  try {
    const A = { uid:S.ident.uid, secret:S.ident.secret };
    let p = await api('/normal/progres', A);
    const okSrv = id => p.missions[id] && p.missions[id].xp !== null && p.missions[id].xp !== undefined;
    if (!S.rattrape){
      const items = Object.keys(S.done).filter(id => byId[id] && !okSrv(id) && S.drafts[id]).slice(0, 400)
        .map(id => ({ id, sql:S.drafts[id], indices:S.done[id].hints || 0, solution:S.done[id].sol ? 1 : 0 }));
      if (items.length){ try { p = await api('/normal/rattrapage', Object.assign({ items }, A)); if (p.valides) toast(p.valides + ' mission(s) déjà résolue(s) validée(s) par le serveur.'); } catch(e){} }
      S.rattrape = 1;
    }
    for (const id in p.missions){
      const v = p.missions[id]; if (!byId[id]) continue;
      if (v.indices) S.hints[id] = Math.max(S.hints[id] || 0, v.indices);
      if (v.solution) S.hints[id + ':sol'] = 1;
      if (okSrv(id)) S.done[id] = { xp:v.xp, bonus:v.bonus || 0, hints:v.indices || 0, sol:!!v.solution, at:(S.done[id] && S.done[id].at) || Date.now() };
    }
    for (const id in S.done) if (!okSrv(id)) S.done[id] = Object.assign({}, S.done[id], { xp:0, bonus:0, nv:1 });
    for (const ch in S.quiz) if (p.quiz[ch] === undefined) S.quiz[ch] = Object.assign({}, S.quiz[ch], { xp:0 });
    for (const ch in p.quiz) S.quiz[ch] = { score:p.quiz[ch], xp:50 * p.quiz[ch] };
    save(); renderTop();
  } catch(e){}
  syncingNormal = false;
}
function pushScore(now){
  if (!NET.api || !S.ident) return;
  clearTimeout(scoreT);
  scoreT = setTimeout(async () => {
    const o = summary();
    try { const d = await api('/score', { uid:S.ident.uid, secret:S.ident.secret, xp:o.xp, missions:o.missions, quetes:o.quetes, boss:o.boss, classe:S.classe || '', nom_complet:S.name || '' }); NET.rang = d.rang; renderTop(); }
    catch(e){ if (/inconnu/.test(e.message)){ S.ident = null; save(); showGate(); } }
  }, now ? 50 : 1500);
}
async function sha12(t){ try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join('').slice(0,12); } catch(e){ return ''; } }
async function viewClassement(filtre, mode, moteur){
  mode = mode || (S.hard ? 'difficile' : 'normal'); moteur = moteur === undefined ? '' : moteur;
  if (!NET.api){
    main().innerHTML = `<div class="page"><h2>CLASSEMENT</h2><div class="panel" style="padding:18px;background:#fff">Le classement est disponible sur la version en ligne du jeu, <b>sql.votre-domaine.fr</b>.</div></div>`; return;
  }
  const cl = filtre === undefined ? (S.classe || '') : filtre;
  main().innerHTML = `<div class="page"><h2>CLASSEMENT</h2><p class="muted">Chargement...</p></div>`;
  const qs = [cl ? 'classe=' + encodeURIComponent(cl) : '', mode === 'difficile' ? 'mode=difficile' : '', moteur ? 'moteur=' + moteur : ''].filter(Boolean).join('&');
  let d; try { d = await api('/classement' + (qs ? '?' + qs : '')); } catch(e){ main().innerHTML = `<div class="page"><h2>CLASSEMENT</h2><p>${esc(e.message)}</p></div>`; return; }
  const me = S.ident ? await sha12(S.ident.uid) : '';
  const tabs = [['', 'Toutes les classes']].concat(d.classes.map(c => [c, c]));
  main().innerHTML = `<div class="page">
    <h2>CLASSEMENT</h2>
    ${HARD.moteurs.length ? `<div class="lbtabs"><button class="btn small ${mode === 'normal' ? 'go' : ''}" data-mode="normal">Mode normal</button><button class="btn small ${mode === 'difficile' ? 'go' : ''}" data-mode="difficile">Mode difficile</button>
      ${mode === 'difficile' ? [['', 'Tous les moteurs']].concat(HARD.moteurs.map(x => [x.id, x.nom])).map(([v, l]) => `<button class="chip ${v === moteur ? 'on' : ''}" data-mot="${v}">${esc(l)}</button>`).join('') : ''}</div>` : ''}
    <p class="muted">${d.total} enquêteurs classés. ${mode === 'difficile' ? 'XP du mode difficile, validée par le serveur sur le vrai moteur (doublée). Seuls les comptes Cybersup connectés avec Google y figurent.' + (S.ident && S.ident.mode !== 'google' ? ' <b>Connecte-toi avec ton compte Cybersup pour y apparaître.</b>' : '') : 'Le score, c\'est ton XP validée par le serveur : missions, quêtes annexes et cachées, boss au chrono et quiz.'}</p>
    <div class="lbtabs">${tabs.map(([v, l]) => `<button class="btn small ${v === cl ? 'go' : ''}" data-cl="${esc(v)}">${esc(l)}</button>`).join('')}</div>
    <div class="panel" style="overflow-x:auto"><table class="lb"><thead><tr><th class="n">#</th><th>Enquêteur</th><th>Classe</th><th class="n">XP</th><th class="n">Missions</th>${mode === 'difficile' ? '<th>Moteurs</th>' : '<th class="n">Quêtes</th><th class="n">Boss</th>'}</tr></thead>
    <tbody>${d.joueurs.length ? d.joueurs.map(r => `<tr class="${r.uid_hash === me ? 'me' : ''}"><td class="n">${r.rang <= 3 ? ['🥇','🥈','🥉'][r.rang-1] : r.rang}</td><td>${esc(r.joueur)}${r.google ? ' <span class="small muted">✔</span>' : ''}</td><td>${esc(r.classe)}</td><td class="n"><b>${r.xp}</b></td><td class="n">${r.missions}</td>${mode === 'difficile' ? `<td>${esc((r.moteurs || []).join(', '))}</td>` : `<td class="n">${r.quetes}</td><td class="n">${r.boss}</td>`}</tr>`).join('') : '<tr><td colspan="7">Personne encore dans ce classement : à toi de jouer !</td></tr>'}</tbody></table></div>
    <p class="small muted">✔ : connecté avec un compte Cybersup. L'XP est calculée par le serveur, à partir des missions et des quiz qu'il a corrigés.</p>
  </div>`;
  $$('.lbtabs [data-cl]').forEach(b => b.addEventListener('click', () => viewClassement(b.dataset.cl, mode, moteur)));
  $$('.lbtabs [data-mode]').forEach(b => b.addEventListener('click', () => viewClassement(cl, b.dataset.mode, '')));
  $$('.lbtabs [data-mot]').forEach(b => b.addEventListener('click', () => viewClassement(cl, mode, b.dataset.mot)));
}

/* ---------- suivi de classe ---------- */
const CLOUD = { db:null, user:null, id:null, admin:false, state:'local', unsub:null, rows:[] };
function cloudStatus(){
  if (CLOUD.state === 'ok') return '<span class="dot ok"></span> Synchronisé automatiquement avec l\'espace formateur.';
  if (CLOUD.state === 'denied') return '<span class="dot"></span> Synchronisation automatique impossible avec ton compte : envoie ton code au formateur.';
  if (CLOUD.state === 'wait') return '<span class="dot"></span> Connexion au suivi de classe...';
  return '<span class="dot"></span> Pas de synchronisation automatique ici : envoie ton code au formateur quand il te le demande.';
}
function summary(){
  const ids = Object.keys(S.done);
  return { v:2, nom:S.name||'', classe:S.classe||'', missions:ids.filter(i => byId[i] && !byId[i].side).length, quetes:ids.filter(i => byId[i] && byId[i].side).length, xp:xpTotal(), boss:ids.filter(i => byId[i] && byId[i].boss).length,
    bonus:Object.values(S.done).filter(d => d.bonus).length, done:ids, quiz:Object.fromEntries(Object.entries(S.quiz).map(([k,q]) => [k, q.score])),
    hints:Object.values(S.done).reduce((a,d) => a + (d.hints||0), 0), solutions:Object.values(S.done).filter(d => d.sol).length,
    maj:new Date().toISOString() };
}
function hashStr(str){ let h = 2166136261; for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function progressCode(){ const o = summary(); const body = JSON.stringify(o); return 'MINUIT-' + btoa(unescape(encodeURIComponent(body))) + '-' + hashStr('brigade:' + body); }
function parseCode(code){
  code = code.trim(); const m = code.match(/^MINUIT-([A-Za-z0-9+/=]+)-([a-z0-9]+)$/); if (!m) return null;
  try { const body = decodeURIComponent(escape(atob(m[1]))); const o = JSON.parse(body); o._ok = hashStr('brigade:' + body) === m[2]; return o; } catch(e){ return null; }
}
async function initCloud(){
  if (!window.claude || !window.claude.use) return;
  CLOUD.state = 'wait'; const st = $('#ccStatus'); if (st) st.innerHTML = cloudStatus();
  try {
    const [db, u] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    CLOUD.db = db; CLOUD.user = u;
    if (!db || !u){ CLOUD.state = 'local'; }
    else {
      CLOUD.id = await u.id();
      CLOUD.admin = !!(await Promise.resolve(u.canEdit && u.canEdit()));
      CLOUD.state = CLOUD.id ? 'ok' : 'local';
      if (CLOUD.state === 'ok') await syncCloud();
    }
  } catch(e){ CLOUD.state = 'local'; }
  const s2 = $('#ccStatus'); if (s2) s2.innerHTML = cloudStatus();
  if (location.hash === '#prof') viewProf();
}
let syncing = false, syncAgain = false;
async function syncCloud(){
  if (!CLOUD.db || !CLOUD.id || CLOUD.state !== 'ok' || !S.name) return;
  if (syncing){ syncAgain = true; return; }
  syncing = true;
  try { await CLOUD.db.doc('progres/' + CLOUD.id).set(summary()); }
  catch(e){ if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) { CLOUD.state = 'denied'; const st = $('#ccStatus'); if (st) st.innerHTML = cloudStatus(); } }
  syncing = false;
  if (syncAgain){ syncAgain = false; syncCloud(); }
}
const PROF_KEY = 'operation-minuit-prof';
function profLocal(){ try { return JSON.parse(localStorage.getItem(PROF_KEY)) || []; } catch(e){ return []; } }
function profSave(rows){ try { localStorage.setItem(PROF_KEY, JSON.stringify(rows)); } catch(e){} }
function viewProf(){
  const pasted = profLocal();
  main().innerHTML = `<div class="page"><h2 class="sec">ESPACE FORMATEUR</h2>
    <div class="panel profintro">
      <p><b>Deux façons de récupérer la progression des étudiants :</b></p>
      <ol><li><b>Automatique</b> : les étudiants membres de ton organisation claude.ai, à qui tu as partagé la page avec au moins le rôle Contributeur, sont synchronisés en direct. ${CLOUD.state === 'ok' ? (CLOUD.admin ? '<span class="dot ok"></span> Actif pour ton compte.' : '<span class="dot"></span> Ton compte ne peut pas lire les progressions (il faut être propriétaire ou éditeur de la page).') : '<span class="dot"></span> Indisponible dans cette vue.'}</li>
      <li><b>Par code</b> : chaque étudiant clique sur « Copier mon code pour le formateur » (accueil, encadré Ma classe) et te l'envoie. Colle tous les codes ci-dessous, un par ligne ou en vrac. Ils restent enregistrés dans ton navigateur.</li></ol>
      <textarea id="codesIn" placeholder="MINUIT-..."></textarea>
      <div class="row"><button class="btn go" id="addCodes">Ajouter les codes</button><button class="btn" id="csvBtn">Copier le tableau (CSV)</button><button class="btn ghost danger" id="clearCodes">Vider les codes collés</button><span id="profMsg" class="small"></span></div>
    </div>
    <div class="row profbar"><label>Classe <select id="fClass"><option value="">Toutes</option></select></label><span id="profCount" class="small"></span></div>
    <div id="profStats" class="profstats"></div>
    <div class="tablewrap"><table class="res proft"><thead><tr>
      <th data-k="nom">Étudiant</th><th data-k="classe">Classe</th><th data-k="missions">Missions</th><th data-k="xp">XP</th><th data-k="s1">Saison 1</th><th data-k="s2">Saison 2</th><th data-k="s3">Saison 3</th><th data-k="s4">Saison 4</th><th data-k="boss">Boss</th><th data-k="quiz">Quiz</th><th data-k="aide">Aides</th><th data-k="ep">Épisode en cours</th><th data-k="maj">Dernière activité</th><th>Source</th></tr></thead><tbody id="profBody"></tbody></table></div>
    <h3 class="sec">OÙ LA CLASSE BLOQUE</h3><div id="heat" class="heat"></div></div>`;
  let sortK = 'nom', sortDir = 1;
  const sids = n => MAIN.filter(m => (chapById[m.ch].season || 1) === n).map(m => m.id), s1ids = sids(1), s2ids = sids(2), s3ids = sids(3), s4ids = sids(4);
  const enrich = r => {
    const d = new Set(r.done || []);
    const cur = CHAPTERS.find(c => c.missions.some(m => !d.has(m.id)));
    const qs = Object.values(r.quiz || {}); const qmax = Object.keys(r.quiz || {}).reduce((a,k) => a + ((chapById[k]||{}).quiz||[]).length, 0);
    return Object.assign({}, r, { s1: Math.round(100*s1ids.filter(i => d.has(i)).length/s1ids.length), s2: Math.round(100*s2ids.filter(i => d.has(i)).length/s2ids.length), s3: Math.round(100*s3ids.filter(i => d.has(i)).length/s3ids.length), s4: Math.round(100*s4ids.filter(i => d.has(i)).length/s4ids.length),
      quiz: qmax ? Math.round(100*qs.reduce((a,b)=>a+b,0)/qmax) : null, aide:(r.hints||0) + 3*(r.solutions||0), ep: cur ? cur.id : 99, epTxt: cur ? cur.code + ' ' + cur.title : 'Terminé', dset:d });
  };
  const allRows = () => {
    const map = {};
    const put = (r, src) => { const k = (r.nom||'').toLowerCase().trim() + '|' + (r.classe||'').toLowerCase().trim(); if (!map[k] || (r.maj||'') > (map[k].maj||'')) map[k] = Object.assign({}, r, {src}); };
    pasted.forEach(r => put(r, r._ok === false ? 'code (modifié ?)' : 'code'));
    CLOUD.rows.forEach(r => put(r, 'auto'));
    return Object.values(map).map(enrich);
  };
  const render = () => {
    const rows = allRows(); const f = $('#fClass').value;
    const classes = [...new Set(rows.map(r => r.classe).filter(Boolean))].sort();
    $('#fClass').innerHTML = '<option value="">Toutes</option>' + classes.map(c => `<option ${c===f?'selected':''}>${esc(c)}</option>`).join('');
    const vis = rows.filter(r => !f || r.classe === f).sort((a,b) => { const x = a[sortK], y = b[sortK]; return (x > y ? 1 : x < y ? -1 : 0) * sortDir; });
    $('#profCount').textContent = vis.length + ' étudiant' + (vis.length > 1 ? 's' : '');
    const avg = k => vis.length ? Math.round(vis.reduce((a,r) => a + (r[k]||0), 0) / vis.length) : 0;
    $('#profStats').innerHTML = vis.length ? `<div class="stat"><b>${avg('missions')}</b><span>missions en moyenne</span></div><div class="stat"><b>${avg('s1')} %</b><span>de la Saison 1</span></div><div class="stat"><b>${avg('s2')} %</b><span>de la Saison 2</span></div><div class="stat"><b>${avg('s3')} %</b><span>de la Saison 3</span></div><div class="stat"><b>${avg('s4')} %</b><span>de la Saison 4</span></div><div class="stat"><b>${vis.filter(r => r.maj && Date.now() - new Date(r.maj) > 7*864e5).length}</b><span>inactifs depuis 7 jours</span></div>` : '';
    $('#profBody').innerHTML = vis.length ? vis.map(r => `<tr><td>${esc(r.nom||'?')}</td><td>${esc(r.classe||'')}</td><td class="n">${r.missions}/${MAIN.length}</td><td class="n">${r.xp}</td>
      <td><div class="mbar"><i style="width:${r.s1}%"></i></div>${r.s1} %</td><td><div class="mbar"><i style="width:${r.s2}%"></i></div>${r.s2} %</td><td><div class="mbar"><i style="width:${r.s3}%"></i></div>${r.s3} %</td><td><div class="mbar"><i style="width:${r.s4}%"></i></div>${r.s4} %</td><td class="n">${r.boss}</td>
      <td class="n">${r.quiz == null ? '' : r.quiz + ' %'}</td><td class="n">${r.aide}</td><td>${esc(r.epTxt)}</td><td>${r.maj ? new Date(r.maj).toLocaleString('fr-FR', {dateStyle:'short', timeStyle:'short'}) : ''}</td><td class="small">${esc(r.src)}</td></tr>`).join('')
      : `<tr><td colspan="12">Aucun étudiant pour l'instant. Colle des codes ci-dessus, ou attends que les étudiants synchronisés se connectent.</td></tr>`;
    $('#heat').innerHTML = vis.length ? CHAPTERS.map(c => { const n = vis.filter(r => r.ep === c.id).length; const done = vis.filter(r => c.missions.every(m => r.dset.has(m.id))).length;
      return `<div class="hcell" title="${esc(c.title)}"><b>${c.id}</b><i style="height:${Math.round(100*n/vis.length)}%"></i><span>${n} en cours<br>${done} fini${done>1?'s':''}</span></div>`; }).join('') : '';
  };
  $('#fClass').addEventListener('change', render);
  $$('.proft th[data-k]').forEach(th => th.addEventListener('click', () => { const k = th.dataset.k; sortDir = sortK === k ? -sortDir : (k === 'nom' || k === 'classe' ? 1 : -1); sortK = k; render(); }));
  $('#addCodes').addEventListener('click', () => {
    const found = ($('#codesIn').value.match(/MINUIT-[A-Za-z0-9+/=]+-[a-z0-9]+/g) || []).map(parseCode).filter(Boolean);
    const cur = profLocal(); found.forEach(o => cur.push(o)); profSave(cur); pasted.length = 0; cur.forEach(o => pasted.push(o));
    $('#profMsg').textContent = found.length + ' code(s) ajouté(s)' + (found.some(o => !o._ok) ? ', dont certains semblent modifiés à la main' : '') + '.';
    $('#codesIn').value = ''; render();
  });
  let armed = false;
  $('#clearCodes').addEventListener('click', e => { if (!armed){ armed = true; e.target.textContent = 'Confirmer'; return; } profSave([]); pasted.length = 0; render(); e.target.textContent = 'Vider les codes collés'; armed = false; });
  $('#csvBtn').addEventListener('click', async () => {
    const rows = allRows().filter(r => !$('#fClass').value || r.classe === $('#fClass').value);
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const csv = ['Nom;Classe;Missions;XP;Saison 1 %;Saison 2 %;Saison 3 %;Saison 4 %;Boss;Quiz %;Aides;Episode en cours;Derniere activite'].concat(rows.map(r => [r.nom, r.classe, r.missions, r.xp, r.s1, r.s2, r.s3, r.s4, r.boss, r.quiz, r.aide, r.epTxt, r.maj].map(q).join(';'))).join('\n');
    try { await navigator.clipboard.writeText(csv); $('#profMsg').textContent = 'Tableau copié : colle-le dans Excel ou Google Sheets.'; } catch(e){ $('#profMsg').textContent = 'Copie refusée par le navigateur.'; }
  });
  render();
  if (CLOUD.db && CLOUD.admin && !CLOUD.unsub){
    CLOUD.unsub = CLOUD.db.collection('progres').onSnapshot(snap => { CLOUD.rows = snap.docs.map(d => d.data()).filter(Boolean); if (location.hash === '#prof') render(); }, () => {});
  } else if (CLOUD.rows.length) render();
}

/* ---------- utilitaires ---------- */
function toast(t){ const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(()=>el.classList.remove('show'), 2600); }
function confetti(){
  const c = document.createElement('div'); c.className = 'confetti';
  for (let i=0;i<40;i++){ const s = document.createElement('i'); s.style.left = Math.random()*100+'%'; s.style.animationDelay = (Math.random()*0.4)+'s'; s.style.background = ['#FD7119','#FFA364','#0A1047','#303880'][i%4]; c.appendChild(s); }
  document.body.appendChild(c); setTimeout(()=>c.remove(), 2200);
}
function route(){
  const h = location.hash.slice(1) || 'home';
  $('#drawer').classList.remove('open');
  $$('.topnav a').forEach(a => a.classList.toggle('cur', a.getAttribute('href') === '#'+h));
  window.scrollTo(0,0);
  if (window.__tick){ clearInterval(window.__tick); window.__tick = null; }
  if (h.startsWith('m-')){ const id = h.slice(2).replace('-', '.'); if (byId[id]) return viewMission(byId[id]); }
  if (h.startsWith('chap-')){ const c = chapById[+h.slice(5)]; if (c) return viewChapter(c); }
  if (h.startsWith('quiz-')){ const c = chapById[+h.slice(5)]; if (c) return viewQuiz(c); }
  if (h.startsWith('scene-')){ const c = chapById[+h.slice(6)]; if (c) return viewScene(c); }
  if (h === 'board') return viewBoard();
  if (h === 'prof') return viewProf();
  if (h === 'classement') return viewClassement();
  if (h === 'schema') return viewSchema();
  if (h === 'sandbox') return viewSandbox();
  if (h === 'memo') return viewMemo();
  if (h === 'fin') return viewEnd();
  viewHome();
}

/* ---------- démarrage ---------- */
async function boot(){
  const bin = Uint8Array.from(atob(WASM_B64), c => c.charCodeAt(0));
  SQL = await initSqlJs({ wasmBinary: bin });
  const db = new SQL.Database(); db.exec('BEGIN'); (Array.isArray(DB_SQL) ? DB_SQL : [DB_SQL]).forEach(x => db.exec(x)); db.exec('COMMIT');
  PRISTINE = db.export(); db.close();
  sandboxDb = fresh();
  $('#loading').remove();
  $('#drawerClose').addEventListener('click', () => $('#drawer').classList.remove('open'));

  document.addEventListener('keydown', e => { if (e.key === 'Escape'){ $('#drawer').classList.remove('open'); const sm = $('#schemaModal'); if (sm){ sm.classList.remove('open'); document.body.classList.remove('noscroll'); } } });
  window.addEventListener('hashchange', route);
  renderTop(); route();
  initCloud();
  await initNet();
  if (needGate()) showGate(); else { pushScore(true); syncNormal(); }
  renderTop(); if (HARD.moteurs.length && (location.hash === '' || location.hash === '#home')) viewHome();
  window.addEventListener('hashchange', () => { if (needGate()) showGate(); });
}
window.__MINUIT = { localRun, safeMsg, byId, MISSIONS, compareSets, MEMO, addFns, init: (lib, bytes) => { SQL = lib; PRISTINE = bytes; } };
if (!window.__NO_BOOT) boot().catch(e => { $('#loading').innerHTML = 'Erreur de chargement du moteur SQL : ' + esc(e.message); });
})();
