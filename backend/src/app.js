import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// اضافه کردن swagger برای ارتباط راحت تر با frontend
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Swagger UI available at /api-docs');
} catch (error) {
  console.error('Swagger loading error:', error.message);
}

// ۱. تعریف اندپوینت بک‌اند
app.use('/api', apiRouter);

// ۲. سرو کردن فایل‌های فرانت‌اند وب‌سایت به صورت کلاینت ایستا (Static Assets)
app.use(express.static(path.join(__dirname, '../../frontend')));

// اضافه شدن یه مسیر ساده برای تست 
app.get('/', (req, res) => {
  res.send('Sports Ticketing API is running! Visit /api-docs for documentation.');
});

export default app;