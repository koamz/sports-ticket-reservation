import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.js';
import { UserRepository } from '../repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_jwt_tokens';

export class UserService {
  static async requestOTP(contact) {
    // تولید کد تصادفی ۶ رقمی
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // ذخیره در Redis با TTL پنج دقیقه برای احراز هویت موقت
    await redisClient.setEx(`otp:${contact}`, 300, otp);
    
    // شبیه‌سازی ارسال پیامک / ایمیل (در محیط پروداکشن به پنل متصل می‌شود)
    console.log(`[OTP DISPATCH] SMS/Email sent to ${contact} with code: ${otp}`);
    return { message: 'OTP sent successfully.' };
  }

  static async verifyOTPAndLogin(contact, otpCode) {
    const cachedOtp = await redisClient.get(`otp:${contact}`);
    if (!cachedOtp || cachedOtp !== otpCode) {
      throw new Error('Invalid or expired OTP.');
    }

    // پس از تایید موفق، OTP از روی حافظه موقت پاک می‌شود
    await redisClient.del(`otp:${contact}`);

    const user = await UserRepository.findByContact(contact);
    if (!user) {
      return { signup_required: true, contact };
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role_name }, JWT_SECRET, { expiresIn: '24h' });
    return { token, user };
  }

  static async signup({ roleId, cityId, firstName, lastName, email, phone, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserRepository.create({ roleId, cityId, firstName, lastName, email, phone, passwordHash });
    
    // پس از ثبت‌نام، دریافت نام نقش کاربر برای توکن
    const fullUser = await UserRepository.findById(user.id);
    const token = jwt.sign({ id: fullUser.id, email: fullUser.email, role: fullUser.role_name }, JWT_SECRET, { expiresIn: '24h' });
    
    return { token, user: fullUser };
  }

  static async getProfile(userId) {
    const cacheKey = `user:profile:${userId}`;
    
    // بررسی وجود در کش Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('Profile loaded from Redis Cache.');
      return JSON.parse(cachedData);
    }

    // در غیر این صورت واکشی از دیتابیس دیسک و ذخیره در کش
    const user = await UserRepository.findById(userId);
    if (user) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(user)); // TTL: 1 hour
    }
    return user;
  }

  static async updateProfile(userId, data) {
    const user = await UserRepository.updateProfile(userId, data);
    
    // ابطال کش (Cache Invalidation) به محض آپدیت اطلاعات برای تضمین همگام بودن داده‌ها
    await redisClient.del(`user:profile:${userId}`);
    return user;
  }

  static async getCitiesAndVenues() {
    const cacheKey = 'common:cities_venues';
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const data = await UserRepository.getCitiesAndVenues();
    await redisClient.setEx(cacheKey, 86400, JSON.stringify(data)); // TTL: 24 hours
    return data;
  }
}