import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// ۱. جستجوی خودکار و منعطف برای پیدا کردن فایل openapi.yaml
const possiblePaths = [
  path.resolve(__dirname, '../../openapi.yaml'),
  path.resolve(__dirname, '../openapi.yaml'),
  path.resolve(process.cwd(), '../openapi.yaml'),
  path.resolve(process.cwd(), 'openapi.yaml')
];

const swaggerPath = possiblePaths.find(p => fs.existsSync(p));

if (swaggerPath) {
  try {
    const swaggerDocument = YAML.load(swaggerPath);
    // پشتیبانی کامل از روت سواگر با اسلش و بدون اسلش
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log(`[SWAGGER] UI mounted successfully from: ${swaggerPath}`);
  } catch (err) {
    console.error('[SWAGGER ERROR] Failed to parse openapi.yaml:', err.message);
  }
} else {
  console.warn('[SWAGGER WARNING] openapi.yaml was not found in paths:', possiblePaths);
}

// ۲. تعریف مسیرهای وب سرویس
app.use('/api', apiRouter);

// ۳. سرو کردن فایل‌های فرانت‌اند وب‌سایت
app.use(express.static(path.resolve(__dirname, '../../frontend')));

export default app;