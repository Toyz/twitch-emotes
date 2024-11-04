FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS install
WORKDIR /temp/dev
COPY package.json bun.lockb ./
RUN bun install --production --frozen-lockfile

FROM base AS release
COPY --from=install /temp/dev/node_modules ./node_modules
COPY ./src ./
COPY ./public ./public
COPY ./views ./views

EXPOSE 8080
CMD ["bun", "run", "server.ts"]
