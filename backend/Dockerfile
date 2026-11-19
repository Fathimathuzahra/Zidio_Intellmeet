FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]
