FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY patches/ ./patches/

RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/index.js"]
