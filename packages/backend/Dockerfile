FROM node:20-alpine
WORKDIR /app

# 👇 Copy root configs FIRST
COPY package.json yarn.lock tsconfig.base.json ./
COPY packages ./packages

# Install deps
RUN yarn install --frozen-lockfile

# Build shared + backend
RUN yarn workspace @money-mapper/shared build
RUN yarn workspace @money-mapper/backend build

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "packages/backend/dist/server.js"]
