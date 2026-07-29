FROM node:20-alpine AS base

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# ---- development (hot reload) ----
FROM base AS dev
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---- production build ----
FROM base AS build
RUN npm run build

# ---- production server ----
FROM nginx:alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
