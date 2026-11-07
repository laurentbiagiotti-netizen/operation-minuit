const { chromium } = require('playwright');
(async () => {
  const U='http://127.0.0.1:8766/index.html';
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1280,height:850} });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(U); await p.waitForSelector('#loading', {state:'detached', timeout:60000});
  await p.evaluate(() => { const s = { done:{}, hints:{}, drafts:{}, quiz:{}, unlockAll:false, name:'Yanis Belkacem', classe:'M1 DATA IA', bossStart:{} }; localStorage.setItem('operation-minuit-v1', JSON.stringify(s)); });
  await p.goto('about:blank'); await p.goto(U+'#chap-1'); await p.waitForSelector('#gate',{timeout:10000});
  await p.fill('#gPrenom','Yanis'); await p.fill('#gNom','Belkacem'); await p.click('#gGo'); await p.waitForTimeout(1200);
  await p.goto(U+'#chap-1'); await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('.sidecard').scrollIntoView());
  await p.screenshot({path:'/tmp/s1.png'});
  // jouer la quête annexe 1.A avec sa solution
  await p.goto(U+'#m-1-A'); await p.waitForTimeout(1000);
  const sol = await p.evaluate(() => window.__MINUIT.byId['1.A'].solution);
  await p.fill('#ed textarea', sol); await p.click('#runBtn'); await p.waitForTimeout(1200);
  console.log('verdict', await p.textContent('#verdict'));
  await p.screenshot({path:'/tmp/s2.png'});
  // cachée verrouillée
  await p.goto(U+'#m-1-S'); await p.waitForTimeout(800); console.log('locked redirect', await p.evaluate(() => location.hash));
  // finir le chapitre 1
  for (const id of await p.evaluate(() => window.__MINUIT.MISSIONS.filter(m=>m.ch===1 && !m.side).map(m=>m.id))) {
    await p.goto(U+'#m-'+id.replace('.','-')); await p.waitForTimeout(500);
    const s = await p.evaluate(i => window.__MINUIT.byId[i].solution, id);
    await p.fill('#ed textarea', s); await p.click('#runBtn'); await p.waitForTimeout(700);
  }
  await p.waitForTimeout(1500);
  await p.goto(U+'#scene-1'); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('.sidecard').scrollIntoView());
  await p.screenshot({path:'/tmp/s3.png'});
  await p.goto(U+'#m-1-S'); await p.waitForTimeout(1000); console.log('hidden open', await p.evaluate(() => location.hash));
  await p.goto(U+'#classement'); await p.waitForTimeout(2000); await p.screenshot({path:'/tmp/s4.png'});
  console.log('errors', errs); await b.close();
})();
