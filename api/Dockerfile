FROM python:3.12-slim
COPY wheels/ /tmp/wheels/
RUN (pip install --no-cache-dir --no-index --find-links /tmp/wheels "psycopg[binary]" pymysql oracledb python-tds \
     || pip install --no-cache-dir "psycopg[binary]" pymysql oracledb python-tds) \
 && rm -rf /tmp/wheels && useradd -u 10001 -m minuit && mkdir -p /data && chown minuit /data
COPY server.py normal.py /app/
COPY hard/ /app/hard/
RUN chmod -R a+rX /app
USER minuit
ENV PYTHONUNBUFFERED=1 DB_PATH=/data/classement.db API_PORT=8000 HARD_DIR=/app/hard MINUIT_SQL_DIR=/app/hard/data
VOLUME ["/data"]
CMD ["python", "/app/server.py"]
