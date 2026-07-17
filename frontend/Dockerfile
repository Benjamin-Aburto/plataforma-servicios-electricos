# ============================================================
# Dockerfile - Frontend (multietapa)
#
# Etapa 1 "builder": prepara los archivos estáticos finales.
#   (En este proyecto es HTML/CSS/JS puro, pero se deja la etapa
#   separada a propósito: si mañana el frontend migra a React/Vite,
#   basta con cambiar el comando de build de esta etapa sin tocar
#   la etapa final de Nginx).
#
# Etapa 2 "runtime": imagen final mínima basada en nginx:alpine,
#   que NO contiene Node ni herramientas de build, solo los
#   archivos estáticos ya listos -> imagen más liviana y con
#   menor superficie de ataque.
# ============================================================

# ---------- Etapa 1: builder ----------
FROM node:20-alpine AS builder

WORKDIR /build

# Copiamos el código fuente estático
COPY src ./src

# "Build" del sitio: aquí solo copiamos los archivos a /build/dist,
# pero es el punto donde en un proyecto real correrías
# `npm ci && npm run build` (React, Vite, etc.)
RUN mkdir -p dist && cp -r src/* dist/


# ---------- Etapa 2: runtime ----------
FROM nginx:1.27-alpine AS runtime

# Copiamos solo el resultado del build, no el código fuente ni node_modules
COPY --from=builder /build/dist /usr/share/nginx/html

# Configuración custom de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Script que inyecta variables de entorno en runtime (env-config.js)
COPY docker-entrypoint.sh /docker-entrypoint.d/40-inject-env.sh
RUN chmod +x /docker-entrypoint.d/40-inject-env.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80 > /dev/null || exit 1

# La imagen oficial de nginx ya ejecuta todo lo que hay en
# /docker-entrypoint.d/ antes de arrancar nginx, así que no
# necesitamos sobreescribir el ENTRYPOINT.
CMD ["nginx", "-g", "daemon off;"]
