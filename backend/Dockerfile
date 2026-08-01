# مرحله اول: بیلد و نصب وابستگی‌ها
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci
COPY . .

# مرحله دوم: اجرای سرور فوق سبک پروداکشن
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "src/server.js"]