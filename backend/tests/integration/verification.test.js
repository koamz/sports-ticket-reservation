import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/db.js';
import redisClient from '../../src/config/redis.js';
import esClient from '../../src/config/elasticsearch.js';
import jwt from 'jsonwebtoken';
import { ElasticsearchService } from '../../src/services/elasticsearchService.js';

describe('Rigorous Sports Ticketing Integration & Bug Verification Suite', () => {
  
  beforeAll(async () => {
    // ۱. حذف صریح ایندکس تستی قدیمی برای پیاده‌سازی مپینگ جدید چندزبانه بدون تداخل داده‌های قدیمی
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

  const generateToken = (id, email, role) => {
    return jwt.sign({ id, email, role }, 'super_secret_key_for_jwt_tokens', { expiresIn: '1h' });
  };

  describe('1. Authentication & OTP State Verification', () => {
    
    test('1. Should reject OTP request with empty body', async () => {
      const res = await request(app)
        .post('/api/auth/otp/request')
        .send({})
        .expect(400);
      expect(res.body).toHaveProperty('error', 'Contact (email or phone) is required.');
    });

    test('2. Should reject OTP request with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/otp/request')
        .send({ contact: 'invalid-email-format' })
        .expect(400);
    });

    test('3. Should generate and store OTP in Redis with 5-minute TTL on valid contact', async () => {
      await request(app)
        .post('/api/auth/otp/request')
        .send({ contact: 'ali@gmail.com' })
        .expect(200);

      const otp = await redisClient.get('otp:ali@gmail.com');
      expect(otp).toBeDefined();
      expect(otp.length).toBe(6);

      const ttl = await redisClient.ttl('otp:ali@gmail.com');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(300);
    });

    test('4. Should fail verification if OTP code is incorrect', async () => {
      await request(app)
        .post('/api/auth/otp/verify')
        .send({ contact: 'ali@gmail.com', code: '999999' })
        .expect(400);
    });

    test('5. Should verify OTP, delete code from Redis, and return JWT token', async () => {
      const otp = await redisClient.get('otp:ali@gmail.com');
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ contact: 'ali@gmail.com', code: otp })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      const deletedOtp = await redisClient.get('otp:ali@gmail.com');
      expect(deletedOtp).toBeNull();
    });

    test('6. Should block profile access with malformed JWT token', async () => {
      await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid_token_value')
        .expect(403);
    });
  });

  describe('2. Multilingual Search & Autocomplete Verification', () => {
    
    test('7. Should search successfully using English keyword (e.g. Perspolis)', async () => {
      const res = await request(app)
        .get('/api/tickets/search?homeTeam=Perspolis')
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].home_team_en).toBe('Perspolis');
    });

    test('8. Should search successfully using Persian keyword (e.g. پرسپولیس)', async () => {
      const res = await request(app)
        .get(`/api/tickets/search?homeTeam=${encodeURIComponent('پرسپولیس')}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].home_team_fa).toBe('پرسپولیس');
    });

    test('9. Should filter results by Persian sport name "فوتبال"', async () => {
      const res = await request(app)
        .get(`/api/tickets/search?sport=${encodeURIComponent('فوتبال')}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].sport_name_fa).toBe('فوتبال');
    });

    test('10. Should return autocomplete suggestions for partial Persian typing (e.g. پر)', async () => {
      const res = await request(app)
        .get(`/api/tickets/autocomplete?q=${encodeURIComponent('پر')}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('11. Should return empty array for autocomplete if query is less than 2 chars', async () => {
      const res = await request(app)
        .get(`/api/tickets/autocomplete?q=${encodeURIComponent('پ')}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('3. Strict Reservations & Unique Database Constraints', () => {
    
    test('12. Should reject reserving a non-existent ticket ID with 400', async () => {
      const token = generateToken(1, 'ali@gmail.com', 'visitor');
      await request(app)
        .post('/api/reservations/reserve')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticketId: 99999 })
        .expect(400);
    });

    test('13. Should prevent double-booking: reserving an already reserved/paid ticket seat must return 400', async () => {
      const token = generateToken(1, 'ali@gmail.com', 'visitor');
      const res = await request(app)
        .post('/api/reservations/reserve')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticketId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('This ticket seat has already been reserved or purchased');
    });

    test('14. Should prevent paying for a non-existent reservation ID', async () => {
      const token = generateToken(1, 'ali@gmail.com', 'visitor');
      await request(app)
        .post('/api/reservations/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({ reservationId: 99999 })
        .expect(400);
    });

    test('15. Should block payment if reservation is already confirmed/paid', async () => {
      const token = generateToken(1, 'ali@gmail.com', 'visitor');
      await request(app)
        .post('/api/reservations/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({ reservationId: 1 })
        .expect(400);
    });

    test('16. Should reject invalid registration if first name is blank', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          roleId: 1,
          cityId: 1,
          firstName: ' ',
          lastName: 'Rezaei',
          email: 'test_empty@gmail.com',
          phone: '+989129999988',
          password: 'password123'
        })
        .expect(400);
    });
  });

  describe('4. Ticket Cancellation, Penalties & Report Issues', () => {

    test('17. Should return 404 for checking cancellation penalty on non-existent booking', async () => {
      const token = generateToken(1, 'ali@gmail.com', 'visitor');
      await request(app)
        .get('/api/reservations/99999/penalty')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    test('18. Should block ticket cancellation without a valid session token', async () => {
      await request(app)
        .post('/api/reservations/cancel')
        .send({ reservationId: 1 })
        .expect(401);
    });

    test('19. Should block standard visitor users from accessing admin reservation controls', async () => {
      const token = generateToken(1, 'ali@gmail.com', 'visitor');
      await request(app)
        .get('/api/admin/reservations')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    test('20. Should successfully submit report for a valid reservation', async () => {
      const token = generateToken(1, 'ali@gmail.com', 'visitor');
      await request(app)
        .post('/api/reports/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          reservationId: 1,
          category: 'Payment Issue',
          subject: 'Double Charge',
          description: 'I was charged twice.'
        })
        .expect(201);
    });
  });
});