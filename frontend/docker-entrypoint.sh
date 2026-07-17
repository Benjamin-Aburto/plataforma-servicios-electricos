#!/bin/sh
# Este script se coloca en /docker-entrypoint.d/, carpeta que la imagen
# oficial de nginx ejecuta automáticamente (vía run-parts) ANTES de
# arrancar nginx. No recibe argumentos y no debe hacer "exec" de nada.
set -e

# Genera /usr/share/nginx/html/env-config.js en cada arranque del contenedor,
# inyectando las URLs de los microservicios (CONTACT_API_URL, PORTFOLIO_API_URL).
# Así la MISMA imagen sirve para distintos entornos sin necesidad de reconstruirla.
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  CONTACT_API_URL: "${CONTACT_API_URL:-http://localhost:4000/api}",
  PORTFOLIO_API_URL: "${PORTFOLIO_API_URL:-http://localhost:4001/api}"
};
EOF

echo "✅ env-config.js generado con CONTACT_API_URL=${CONTACT_API_URL:-http://localhost:4000/api} y PORTFOLIO_API_URL=${PORTFOLIO_API_URL:-http://localhost:4001/api}"
