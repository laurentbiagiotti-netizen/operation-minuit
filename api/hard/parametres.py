"""Configuration des moteurs du mode difficile (surchargée par variables d'environnement)."""
import os
E = os.environ.get
ENGINES = {
    'pg': dict(host=E('PG_HOST', '127.0.0.1'), port=int(E('PG_PORT', '5432')), admin_user=E('PG_ADMIN', 'postgres'),
               admin_password=E('PG_ADMIN_PASSWORD', 'rootpw'), reader_password=E('READER_PASSWORD', 'lecteur_pw_2026'),
               worker_password=E('WORKER_PASSWORD', 'Ouvrier_pw_2026x'), workers=int(E('WORKERS', '3'))),
    'maria': dict(host=E('MARIA_HOST', '127.0.0.1'), port=int(E('MARIA_PORT', '3306')), admin_user='root',
                  admin_password=E('MARIA_ROOT_PASSWORD', 'rootpw'), reader_password=E('READER_PASSWORD', 'lecteur_pw_2026'),
                  worker_password=E('WORKER_PASSWORD', 'Ouvrier_pw_2026x'), workers=int(E('WORKERS', '3')), readers=int(E('MARIA_READERS', '16'))),
    'oracle': dict(host=E('ORA_HOST', '127.0.0.1'), port=int(E('ORA_PORT', '1521')), service=E('ORA_SERVICE', 'FREEPDB1'),
                   admin_user='system', admin_password=E('ORA_PASSWORD', 'rootpw'), reader_password=E('READER_PASSWORD', 'lecteur_pw_2026'),
                   worker_password=E('WORKER_PASSWORD', 'Ouvrier_pw_2026x'), workers=int(E('ORA_WORKERS', E('WORKERS', '3')))),
    'mssql': dict(host=E('MSSQL_HOST', '127.0.0.1'), port=int(E('MSSQL_PORT', '1433')), admin_user='sa',
                  admin_password=E('MSSQL_SA_PASSWORD', 'Root_pw_2026!'), reader_password=E('MSSQL_READER_PASSWORD', 'Lecteur_pw_2026!'),
                  worker_password=E('MSSQL_WORKER_PASSWORD', 'Ouvrier_pw_2026!'), workers=int(E('WORKERS', '3')),
                  backup=E('MSSQL_BACKUP', '/var/opt/mssql/data/minuit.bak'), data_dir=E('MSSQL_DATA_DIR', '/var/opt/mssql/data')),
}
