# ============================================================
# Dockerfile - portfolio-service (Node.js / Express)
# ============================================================
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
# Actualizado: Forzar instalacion limpia
RUN npm install --omit=dev

COPY src ./src

USER node
ENV NODE_ENV=production
EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4001/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
