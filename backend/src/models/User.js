export class User {
  constructor({ id, role_id, city_id, first_name, last_name, email, phone, status, created_at }) {
    this.id = id;
    this.roleId = role_id;
    this.cityId = city_id;
    this.firstName = first_name;
    this.lastName = last_name;
    this.email = email;
    this.phone = phone;
    this.status = status;
    this.createdAt = created_at;
  }

  // متد اعتبارسنجی داده‌های ورودی قبل از ارسال به دیتابیس
  static validateSignup(data) {
    const errors = [];
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (!data.firstName || data.firstName.trim().length < 2) errors.push('First name is too short.');
    if (!data.lastName || data.lastName.trim().length < 2) errors.push('Last name is too short.');
    if (!data.email || !emailRegex.test(data.email)) errors.push('Invalid email format.');
    if (!data.phone || !phoneRegex.test(data.phone)) errors.push('Invalid phone format.');
    if (!data.password || data.password.length < 6) errors.push('Password must be at least 6 characters.');
    if (!data.roleId) errors.push('Role ID is required.');

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}