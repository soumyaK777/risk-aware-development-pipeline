
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --legacy-peer-deps

COPY backend/ ./backend/

EXPOSE 5000

CMD ["node", "backend/server.cjs"]
