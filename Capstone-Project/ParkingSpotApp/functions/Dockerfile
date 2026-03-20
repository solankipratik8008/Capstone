FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY . .
ENV PORT=8080
CMD ["node", "server.js"]
