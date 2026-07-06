# syntax=docker/dockerfile:1
# Frontend Rumbo — React + Vite (D-026).
# Targets:
#   dev        → usado por docker-compose de rumbo-devops (vite dev server, hot reload)
#   production → fallback estático con nginx; el deploy principal es Vercel (ver DEPLOY.md en rumbo-devops)

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS deps
# pnpm-workspace.yaml trae allowBuilds (esbuild) — sin él, pnpm 11 aborta el install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

FROM deps AS build
COPY . .
RUN pnpm build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
# SPA fallback: toda ruta que no sea un archivo sirve index.html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location / { try_files $uri /index.html; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
