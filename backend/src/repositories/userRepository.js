import pool from '../config/db.js';

export class UserRepository {
  static async findByContact(contact) {
    const query = `
      SELECT u.*, r.name AS role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1 OR u.phone = $1
    `;
    const { rows } = await pool.query(query, [contact]);
    return rows[0];
  }

  static async findById(id) {
    // اصلاح فیلد چندزبانه نام شهر به صورت name_fa برای نمایش در داشبورد کاربری فرانت‌اند فارسی
    const query = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status, u.created_at, r.name AS role_name, c.name_fa AS city_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE u.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async create({ roleId, cityId, firstName, lastName, email, phone, passwordHash }) {
    const query = `
      INSERT INTO users (role_id, city_id, first_name, last_name, email, phone, password_hash, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING id, first_name, last_name, email, phone, status
    `;
    const values = [roleId, cityId, firstName, lastName, email, phone, passwordHash];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async updateProfile(id, { firstName, lastName, phone, cityId }) {
    const query = `
      UPDATE users
      SET first_name = $1, last_name = $2, phone = $3, city_id = $4
      WHERE id = $5
      RETURNING id, first_name, last_name, email, phone
    `;
    const { rows } = await pool.query(query, [firstName, lastName, phone, cityId, id]);
    return rows[0];
  }

  static async getCitiesAndVenues() {
    // همگام‌سازی فیلدهای فارسی شهر، نام ورزشگاه و آدرس ورزشگاه برای نمایش بی نقص در فرانت چندزبانه
    const query = `
      SELECT c.id AS city_id, c.name_fa AS city_name, 
             v.id AS venue_id, v.name_fa AS venue_name, v.address_fa AS address, v.capacity
      FROM cities c
      LEFT JOIN venues v ON c.id = v.city_id
      ORDER BY c.name_fa, v.name_fa
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}