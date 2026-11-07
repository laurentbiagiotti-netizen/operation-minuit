FROM nginxinc/nginx-unprivileged:1.27-alpine

LABEL org.opencontainers.image.title="Opération Minuit" \
      org.opencontainers.image.description="Serious game SQL de Cybersup (site statique)" \
      org.opencontainers.image.vendor="Cybersup"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/

USER root
RUN chmod 644 /etc/nginx/conf.d/default.conf && chown -R nginx:nginx /usr/share/nginx/html && find /usr/share/nginx/html -type d -exec chmod 755 {} + \
 && find /usr/share/nginx/html -type f -exec chmod 644 {} +
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
