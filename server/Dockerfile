# ---- Stage 1: Build ----
FROM node:24 AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY Dockerfile ./

# Install application dependencies, including devDependencies needed for the build
RUN npm ci

# Copy the rest of your source code
COPY ./src ./src

# After building, remove the devDependencies
RUN npm run build
RUN npm prune --production

# ---- Stage 2: Production ----
FROM node:24-alpine AS production
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

COPY package.json .

EXPOSE 3000

CMD [ "node", "dist/server.js" ]