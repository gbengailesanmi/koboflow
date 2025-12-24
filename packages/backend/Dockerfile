FROM node:20-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM base AS build
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3001
CMD ["node", "dist/index.js"]
