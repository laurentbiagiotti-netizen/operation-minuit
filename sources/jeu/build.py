import base64, json, os, glob
B=os.path.dirname(os.path.abspath(__file__))
R=os.path.abspath(os.path.join(B, '..', '..'))
t=open(f'{B}/template.html').read()
logo='data:image/svg+xml;base64,'+base64.b64encode(open(f'{B}/logo-blanc.svg','rb').read()).decode()
import shutil
D=f'{B}/dist'; shutil.rmtree(D, ignore_errors=True); os.makedirs(f'{D}/img')
imgs={}
for p in sorted(glob.glob(f'{B}/img2/*.jpg') or glob.glob(f'{R}/site/img/*.jpg')):
    k=os.path.basename(p)[:-4]; shutil.copy(p, f'{D}/img/{k}.jpg'); imgs[k]='img/'+k+'.jpg'
dbsql=[open(f'{B}/{f}.sql').read() for f in ['schema','data','data2','data3','data4','data5']]
import subprocess
subprocess.run(['node', f'{B}/export_normal.js'], check=True)
missions=open(f'{B}/missions_public.js').read()
rep={'__SQLJS__':open(f'{B}/node_modules/sql.js/dist/sql-wasm.js').read(),
     '__WASM__':base64.b64encode(open(f'{B}/node_modules/sql.js/dist/sql-wasm.wasm','rb').read()).decode(),
     '__LOGO__':logo,'__IMAGES__':json.dumps(imgs),'__DBSQL__':json.dumps(dbsql).replace('</','<\\/'),
     '__MISSIONS__':missions,'__APP__':open(f'{B}/app.js').read()}
for k,v in rep.items(): t=t.replace(k, v)
open(f'{D}/index.html','w').write(t)
shutil.rmtree(f'{R}/site', ignore_errors=True); shutil.copytree(D, f'{R}/site')
print('site/ mis à jour, size MB', round(len(t)/1e6,2), 'images', len(imgs))
