FROM mcr.microsoft.com/playwright:v1.64.1-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=8000
ENV DATA_DIR=/tmp/accessaudit-data

EXPOSE 8000

CMD ["npm", "start"]
