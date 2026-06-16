FROM node:20-alpine AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npm run db:generate
RUN npm run build

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000
CMD ["npm", "start"]
