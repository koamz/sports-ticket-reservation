import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.js';
import { UserRepository } from '../repositories/userRepository.js';

const JWT_SECRET =
  process.env.JWT_SECRET || 'super_secret_key_for_jwt_tokens';

export class UserService {

  static async requestOTP(contact) {

    if (!contact || typeof contact !== 'string' || !contact.trim()) {
      throw new Error('Contact (email or phone) is required.');
    }

    contact = contact.trim();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Phone validation
    // اجازه می‌دهیم شماره با + و حداقل چند رقم باشد.
    const phoneRegex = /^\+?[0-9]{10,15}$/;

    const isValidEmail = emailRegex.test(contact);
    const isValidPhone = phoneRegex.test(contact);

    if (!isValidEmail && !isValidPhone) {
      throw new Error('Invalid email or phone format.');
    }


    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await redisClient.setEx(
      `otp:${contact}`,
      300,
      otp
    );

    console.log(
      `[OTP DISPATCH] SMS/Email sent to ${contact} with code: ${otp}`
    );

    return {
      message: 'OTP sent successfully.'
    };
  }

  static async verifyOTPAndLogin(contact, otpCode) {
    if (!contact || typeof contact !== 'string' || !contact.trim()) {
      throw new Error('Contact (email or phone) is required.');
    }

    if (
      otpCode === undefined ||
      otpCode === null ||
      String(otpCode).trim() === ''
    ) {
      throw new Error('OTP code is required.');
    }

    contact = contact.trim();
    otpCode = String(otpCode).trim();

    const cachedOtp = await redisClient.get(
      `otp:${contact}`
    );

    if (!cachedOtp || cachedOtp !== otpCode) {
      throw new Error('Invalid or expired OTP.');
    }

    // OTP can only be used once.
    await redisClient.del(`otp:${contact}`);

    const user = await UserRepository.findByContact(contact);

    if (!user) {
      return {
        signup_required: true,
        contact
      };
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role_name
      },
      JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );

    return {
      token,
      user
    };
  }

  static async signup({
    roleId,
    cityId,
    firstName,
    lastName,
    email,
    phone,
    password
  }) {

    if (!firstName || !firstName.trim()) {
      throw new Error('First name is required.');
    }

    if (!lastName || !lastName.trim()) {
      throw new Error('Last name is required.');
    }

    if (!email || !email.trim()) {
      throw new Error('Email is required.');
    }

    if (!phone || !phone.trim()) {
      throw new Error('Phone is required.');
    }

    if (
      password === undefined ||
      password === null ||
      typeof password !== 'string'
    ) {
      throw new Error('Password is required.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // انتساب خودکار نقش تماشاگر (roleId = 1) و شهر پیش‌فرض در صورت عدم ارسال
    const finalRoleId = roleId || 1;
    const finalCityId = cityId || 1;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      roleId: finalRoleId,
      cityId: finalCityId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      passwordHash
    });

    const fullUser = await UserRepository.findById(user.id);
    
    const token = jwt.sign(
      {
        id: fullUser.id,
        email: fullUser.email,
        role: fullUser.role_name
      },
      JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );

    return {
      token,
      user: fullUser
    };
  }

  static async getProfile(userId) {
    const cacheKey = `user:profile:${userId}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('Profile loaded from Redis Cache.');
      return JSON.parse(cachedData);
    }

    const user = await UserRepository.findById(userId);
    if (user) {
      await redisClient.setEx(
        cacheKey,
        3600,
        JSON.stringify(user)
      );
    }
    return user;
  }

  static async updateProfile(userId, data) {
    const user = await UserRepository.updateProfile(
      userId,
      data
    );
    await redisClient.del(
      `user:profile:${userId}`
    );

    return user;
  }

  static async getCitiesAndVenues() {
    const cacheKey = 'common:cities_venues';
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const data =
      await UserRepository.getCitiesAndVenues();
    await redisClient.setEx(
      cacheKey,
      86400,
      JSON.stringify(data)
    );

    return data;
  }
}