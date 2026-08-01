import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// ۱. تعریف اندپوینت بک‌اند
app.use('/api', apiRouter);

// ۲. سرو کردن فایل‌های فرانت‌اند وب‌سایت به صورت کلاینت ایستا (Static Assets)
// این کار اجازه می‌دهد کلاینت با رفتن به آدرس سرور اصلی لود شود
app.use(express.static(path.join(__dirname, '../../frontend')));

export default app;