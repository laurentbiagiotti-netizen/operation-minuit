const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{width:1280,height:900} }); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8590/', {timeout:60000}); await p.waitForSelector('#loading', {state:'detached', timeout:60000});
  await p.waitForSelector('#gate'); await p.fill('#gPrenom','Ui'); await p.fill('#gNom','Testeur'); await p.fill('#gClasse','audit'); await p.click('#gGo');
  await p.waitForSelector('#gate', {state:'detached'});
  await p.goto('http://127.0.0.1:8590/#m-1-1'); await p.waitForSelector('#ed textarea');
  await p.fill('#ed textarea', 'SELECT nom FROM suspects;'); await p.click('#runBtn'); await p.waitForSelector('.verdict'); await p.waitForTimeout(500);
  console.log('faux :', (await p.textContent('.verdict')).slice(0,120));
  await p.click('#hintBtn'); await p.waitForSelector('.hint'); console.log('indice :', await p.textContent('#hintlist'));
  await p.fill('#ed textarea', 'SELECT * FROM suspects;'); await p.click('#runBtn'); await p.waitForSelector('.verdict.ok', {timeout:10000});
  console.log('juste :', (await p.textContent('.verdict.ok')).slice(0,60), '| XP haut :', await p.textContent('#xp'));
  await p.screenshot({path:'/tmp/ui1.png'});
  await p.goto('http://127.0.0.1:8590/#m-1-2'); await p.waitForSelector('#ed textarea');
  await p.click('#solBtn'); await p.click('#solBtn'); await p.waitForSelector('.solution'); console.log('solution :', (await p.textContent('.solution pre')).slice(0,40));
  // reprise sur un autre appareil : nouvelle session, même identité
  const st = await p.evaluate(() => localStorage.getItem('operation-minuit-v1'));
  const ident = JSON.parse(st).ident;
  const p2 = await (await b.newContext()).newPage();
  await p2.goto('http://127.0.0.1:8590/'); await p2.waitForSelector('#loading', {state:'detached', timeout:60000});
  await p2.evaluate(i => { localStorage.setItem('operation-minuit-v1', JSON.stringify({done:{}, hints:{}, drafts:{}, quiz:{}, name:'Ui Testeur', ident:i, bossStart:{}})); }, ident);
  await p2.reload(); await p2.waitForSelector('#loading', {state:'detached', timeout:60000}); await p2.waitForTimeout(2500);
  console.log('autre appareil XP :', await p2.textContent('#xp'), JSON.stringify(Object.keys(JSON.parse(await p2.evaluate(() => localStorage.getItem('operation-minuit-v1'))).done)));
  // ancien joueur : progression locale déclarée + brouillons -> rattrapage
  const p3 = await (await b.newContext()).newPage();
  await p3.goto('http://127.0.0.1:8590/'); await p3.waitForSelector('#loading', {state:'detached', timeout:60000});
  const u = await p3.evaluate(async () => (await fetch('/api/inscription', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prenom:'Ancien', nom:'Joueur', classe:'audit'})})).json());
  await p3.evaluate(u => localStorage.setItem('operation-minuit-v1', JSON.stringify({done:{'1.1':{xp:100},'1.2':{xp:100},'1.3':{xp:100}}, hints:{}, drafts:{'1.1':'SELECT * FROM suspects;','1.2':'SELECT 1'}, quiz:{'1':{score:3,xp:150}}, name:'Ancien Joueur', ident:{uid:u.uid, secret:u.secret, mode:'nom'}, bossStart:{}})), u);
  await p3.reload(); await p3.waitForSelector('#loading', {state:'detached', timeout:60000}); await p3.waitForTimeout(3000);
  const s3 = JSON.parse(await p3.evaluate(() => localStorage.getItem('operation-minuit-v1')));
  console.log('ancien joueur XP :', await p3.textContent('#xp'), JSON.stringify(s3.done));
  await p3.goto('http://127.0.0.1:8590/#m-1-2'); await p3.waitForTimeout(1500); console.log('verdict non validé :', (await p3.textContent('#verdict')).slice(0,160));
  await p.goto('http://127.0.0.1:8590/#classement'); await p.waitForTimeout(2000); await p.screenshot({path:'/tmp/ui2.png'});
  // quiz
  await p.goto('http://127.0.0.1:8590/#quiz-1'); for (let i=0;i<3;i++){ await p.waitForSelector('.opt'); await p.click('.opt >> nth=0'); await p.click('#nextQ'); }
  await p.waitForTimeout(1500); console.log('quiz :', await p.textContent('.sfx'), 'XP haut :', await p.textContent('#xp'));
  console.log('erreurs JS :', errs.slice(0,6));
  await b.close();
})();
