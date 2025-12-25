FROM node:20-alpine AS build
WORKDIR /app

COPY package.json yarn.lock tsconfig.base.json ./
COPY packages ./packages

RUN yarn install --frozen-lockfile

RUN yarn workspace @money-mapper/shared build && yarn workspace @money-mapper/backend build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
COPY --from=build /app/packages/backend/package.json ./packages/backend/package.json

EXPOSE 3001
CMD ["node", "packages/backend/dist/server.js"]
