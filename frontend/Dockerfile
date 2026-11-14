FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Значения по умолчанию совпадают с fallback'ами в src/config.js.
ARG VITE_API_URL=/api
ARG VITE_STORAGE_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STORAGE_URL=$VITE_STORAGE_URL

RUN npm run build


FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]