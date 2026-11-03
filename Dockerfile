FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5113 \
    SHIFTLY_DATA_FILE=/app/data/shiftly.json
COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY views ./views
COPY public ./public
EXPOSE 5113
# Fresh demo data (dated around today) every time the container starts.
CMD ["sh", "-c", "node dist/seed.js && exec node dist/main.js"]
