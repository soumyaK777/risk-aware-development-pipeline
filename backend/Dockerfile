
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --legacy-peer-deps \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY backend/ ./backend/

EXPOSE 5000

CMD ["node", "backend/server.cjs"]
