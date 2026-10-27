FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npm run migrate:up && npm run seed && npm start"]
