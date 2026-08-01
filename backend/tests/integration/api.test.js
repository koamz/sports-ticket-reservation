import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/db.js';
import redisClient from '../../src/config/redis.js';
import esClient from '../../src/config/elasticsearch.js';
import { ElasticsearchService } from '../../src/services/elasticsearchService.js';

describe('Integration Tests - Endpoints & Security Validation', () => {
  
  beforeAll(async () => {
    // حذف صریح ایندکس تستی قدیمی برای پیاده‌سازی مپینگ جدید چندزبانه بدون تداخل داده‌های قدیمی
    await esClient.indices.delete({ index: ElasticsearchService.INDEX_NAME }, { ignore: [404] });
    await ElasticsearchService.initIndex();
    await ElasticsearchService.syncAllTickets();
    // اجبار به رفرش شدن ایندکس الاستیک‌سرچ برای در دسترس قرار گرفتن فوری داکیومنت‌ها در تست‌ها
    await esClient.indices.refresh({ index: ElasticsearchService.INDEX_NAME });
  });

  afterAll(async () => {
    // Tests are run in band, so we keep connections open for other test suites.
    // Jest uses --forceExit in package.json to exit gracefully and clear open handles.
  });

  describe('GET /api/common/cities-venues', () => {
    test('10. Should return 200 OK and valid JSON array', async () => {
      const response = await request(app)
        .get('/api/common/cities-venues')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/tickets/search', () => {
    test('11. Should return 200 OK and search available tickets', async () => {
      const response = await request(app)
        .get('/api/tickets/search?sport=Football')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/tickets/:id', () => {
    test('12. Should return 404 for non-existent ticket details', async () => {
      const response = await request(app)
        .get('/api/tickets/999999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Ticket not found.');
    });
  });

  describe('GET /api/tickets/autocomplete', () => {
    test('13. Should return empty array if query parameter q is missing', async () => {
      const response = await request(app)
        .get('/api/tickets/autocomplete')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    test('14. Should return 200 OK and valid array with suggestions when q is provided', async () => {
      const response = await request(app)
        .get('/api/tickets/autocomplete?q=Pers')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/auth/otp/request', () => {
    test('15. Should reject request if contact phone/email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/otp/request')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Contact (email or phone) is required.');
    });

    test('16. Should success and trigger OTP dispatch with valid email', async () => {
      const response = await request(app)
        .post('/api/auth/otp/request')
        .send({ contact: 'ali@gmail.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'OTP sent successfully.');
    });
  });

  describe('POST /api/auth/otp/verify', () => {
    test('17. Should reject verification with missing parameters', async () => {
      await request(app)
        .post('/api/auth/otp/verify')
        .send({ contact: 'ali@gmail.com' })
        .expect(400);
    });

    test('18. Should fail verification with incorrect OTP code', async () => {
      const response = await request(app)
        .post('/api/auth/otp/verify')
        .send({ contact: 'ali@gmail.com', code: '000000' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid or expired OTP.');
    });
  });

  describe('POST /api/auth/signup', () => {
    test('19. Should fail user creation if password is too short', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          roleId: 1,
          cityId: 1,
          firstName: 'Ali',
          lastName: 'Rezaei',
          email: 'test_short@gmail.com',
          phone: '+989129999900',
          password: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Password must be at least 6 characters.');
    });
  });

  describe('JWT Security Shield Tests', () => {
    test('20. Should block GET /api/user/profile without JWT token', async () => {
      await request(app).get('/api/user/profile').expect(401);
    });

    test('21. Should block PUT /api/user/profile without JWT token', async () => {
      await request(app).put('/api/user/profile').expect(401);
    });

    test('22. Should block POST /api/reservations/reserve without JWT token', async () => {
      await request(app).post('/api/reservations/reserve').expect(401);
    });

    test('23. Should block POST /api/reservations/pay without JWT token', async () => {
      await request(app).post('/api/reservations/pay').expect(401);
    });

    test('24. Should block POST /api/reports/submit without JWT token', async () => {
      await request(app).post('/api/reports/submit').expect(401);
    });
  });
});