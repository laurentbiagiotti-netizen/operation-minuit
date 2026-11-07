// Sépare le contenu des missions en deux :
// - /home/claude/hard/normal.json : ce que seul le serveur connaît (solutions, indices, chrono, réponses du quiz)
// - /home/claude/build/missions_public.js : ce que le navigateur reçoit (sans solutions ni indices)
// node export_normal.js
const fs = require('fs'), vm = require('vm'), B = '/home/claude/build/';
const FILES = ['missions1.js','missions2.js','story.js','missions_boss.js','missions3.js','story2.js','missions4.js','story3.js','missions6.js','story5.js','missions5.js','story4.js','sides1.js','sides2.js','sides3.js','sides4.js'];
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(FILES.map(f => fs.readFileSync(B + f, 'utf8')).join('\n'), ctx);
const MISSIONS = vm.runInContext('MISSIONS', ctx), CHAPTERS = vm.runInContext('CHAPTERS', ctx);
const CAST = vm.runInContext('CAST', ctx), SCENES = vm.runInContext('SCENES', ctx), BOARD = vm.runInContext('BOARD', ctx);

const srv = { missions: {}, quiz: {}, chapitres: {} };
const pub = [];
for (const m of MISSIONS) {
  const c = m.check || {};
  srv.missions[m.id] = { ch: m.ch, xp: m.xp || 100, boss: !!m.boss, timer: m.timer || null, side: m.side || null,
    hints: m.hints || [], solution: m.solution || '' };
  const txt = (m.setup || '') + ' ' + (m.solution || '') + ' ' + (c.verify ? c.verify.join(' ') : '');
  const tables = [], re = /\b(?:FROM|JOIN|INTO|UPDATE|TABLE|ON|pragma_\w+\(')\s*'?([a-z_]+)/gi; let r;
  while ((r = re.exec(txt))) { const t = r[1].toLowerCase(); if (!tables.includes(t)) tables.push(t); }
  const ddl = [...txt.matchAll(/CREATE\s+TABLE\s+(\w+)/gi)].map(x => x[1].toLowerCase());
  const p = Object.assign({}, m);
  delete p.solution; delete p.hints;
  p.check = Object.assign({}, c); delete p.check.verify; delete p.check.answers;
  p.nh = (m.hints || []).length; p.tbl = tables; p.ddl = ddl;
  pub.push(p);
}
for (const c of CHAPTERS) {
  if (c.quiz) srv.quiz[c.id] = c.quiz.map(q => q.a);
  srv.chapitres[c.id] = MISSIONS.filter(m => m.ch === c.id && !m.side).map(m => m.id);
}
fs.writeFileSync('/home/claude/hard/normal.json', JSON.stringify(srv));
const J = o => JSON.stringify(o).replace(/<\//g, '<\\/');
fs.writeFileSync(B + 'missions_public.js',
  '// Généré par export_normal.js : missions sans solutions ni indices (ils restent sur le serveur)\n' +
  'window.CHAPTERS = ' + J(CHAPTERS) + ';\nwindow.MISSIONS = ' + J(pub) + ';\nwindow.CAST = ' + J(CAST) +
  ';\nwindow.SCENES = ' + J(SCENES) + ';\nwindow.BOARD = ' + J(BOARD) + ';\n');
// contrôle : rien de perdu à la sérialisation (pas de fonctions dans les données)
const lost = [CAST, SCENES, BOARD, CHAPTERS].some(o => JSON.stringify(o) === undefined);
console.log('missions', pub.length, 'quiz', Object.keys(srv.quiz).length, 'perte', lost,
  'solutions dans le public :', /SELECT \* FROM suspects;/.test(fs.readFileSync(B + 'missions_public.js', 'utf8')));
