// Exporte, pour chaque mission, le résultat attendu calculé sur SQLite (référence du jeu)
// node export_expected.js > expected.json
global.window = globalThis; window.__NO_BOOT = true;
const fs = require('fs'), B = require('path').join(__dirname, '..', 'jeu') + '/';
const initSqlJs = require(B + 'node_modules/sql.js/dist/sql-wasm.js');
eval(['missions1.js','missions2.js','story.js','missions_boss.js','missions3.js','story2.js','missions4.js','story3.js','missions6.js','story5.js','missions5.js','story4.js','sides1.js','sides2.js','sides3.js','sides4.js'].map(f=>fs.readFileSync(B+f,'utf8')).join('\n'));
eval(fs.readFileSync(B+'app_before_serveur.js','utf8'));  // garde la correction locale d'origine pour calculer les résultats attendus
(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database(); ['schema','data','data2','data3','data4','data5'].forEach(f => db.exec(fs.readFileSync(B+f+'.sql','utf8')));
  const M = window.__MINUIT; M.init(SQL, db.export());
  const out = {};
  for (const m of window.__MINUIT.MISSIONS) {
    const c = m.check || {};
    const kind = c.mode === 'dml' ? 'dml' : c.mode === 'plan' ? 'plan' : 'select';
    const e = { id: m.id, ch: m.ch, title: m.title, side: m.side || null, boss: !!m.boss, xp: m.xp || 100, kind,
      opts: { strictCols: !!c.strictCols, colNames: !!c.colNames, ordered: !!c.ordered, orderKeys: c.orderKeys || null },
      require: (m.require || []).map(r => ({ re: r.re, msg: r.msg })), task: m.task, sqlite: { solution: m.solution, setup: m.setup || null, verify: c.verify || null, contains: c.contains || null } };
    if (kind === 'select') { const ref = M.reference(m); e.expected = ref.set ? { columns: ref.set.columns, values: ref.set.values } : null; }
    if (kind === 'dml') { const ref = M.reference(m); e.sqlite_verify = (ref.verify || []).map(v => ({ columns: v.columns, values: v.values })); }
    out[m.id] = e;
  }
  process.stdout.write(JSON.stringify(out));
})();
