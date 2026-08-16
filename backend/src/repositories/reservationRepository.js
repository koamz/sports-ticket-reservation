import pool from '../config/db.js';

export class ReservationRepository {
  static async createReservation(userId, ticketId, expiresAt) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ۱. بررسی ظرفیت و موجود بودن بلیط برای جلوگیری از تعارض همزمانی
      const checkTicket = `
        SELECT price, remaining_capacity, status 
        FROM tickets 
        WHERE id = $1 FOR UPDATE
      `;
      const ticketRes = await client.query(checkTicket, [ticketId]);
      const ticket = ticketRes.rows[0];

      if (!ticket || ticket.status === 'sold_out' || ticket.remaining_capacity <= 0) {
        throw new Error('This ticket seat has already been reserved or purchased by another user.');
      }

      // ۲. بررسی رزروهای قبلی روی این صندلی
      const checkExisting = `
        SELECT id, status, expires_at FROM reservations 
        WHERE ticket_id = $1 FOR UPDATE
      `;
      const existingRes = await client.query(checkExisting, [ticketId]);
      const existing = existingRes.rows[0];

      if (existing) {
        // اگر صندلی پرداخت شده باشد یا رزرو معلق آن هنوز منقضی نشده باشد، اجازه رزرو مجدد داده نمی‌شود
        if (existing.status === 'paid' || (existing.status === 'pending' && new Date(existing.expires_at) > new Date())) {
          throw new Error('This ticket seat has already been reserved or purchased by another user.');
        }
        // اگر رزرو قبلی لغو شده یا منقضی شده باشد، رکورد قدیمی پاک می‌شود تا صندلی آزاد شده و قید یکتا نشکند
        await client.query(`DELETE FROM reservations WHERE id = $1`, [existing.id]);
      }

      // ۳. ثبت اطلاعات در جدول رزروها
      const insertRes = `
        INSERT INTO reservations (user_id, ticket_id, status, expires_at)
        VALUES ($1, $2, 'pending', $3)
        RETURNING id, user_id, ticket_id, status, reserved_at, expires_at
      `;
      const resVal = await client.query(insertRes, [userId, ticketId, expiresAt]);

      await client.query('COMMIT');
      return resVal.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code === '23505') {
        throw new Error('This ticket seat has already been reserved or purchased by another user.');
      }
      throw e;
    } finally {
      client.release();
    }
  }

  static async payReservation(userId, reservationId, method) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // واکشی رزرو فعال
      const resQuery = `SELECT * FROM reservations WHERE id = $1 AND user_id = $2 AND status = 'pending' FOR UPDATE`;
      const resRows = await client.query(resQuery, [reservationId, userId]);
      const reservation = resRows.rows[0];

      if (!reservation) throw new Error('Active reservation not found or expired.');

      // واکشی مشخصات بلیط
      const ticketQuery = `SELECT price, remaining_capacity FROM tickets WHERE id = $1 FOR UPDATE`;
      const ticketRows = await client.query(ticketQuery, [reservation.ticket_id]);
      const ticket = ticketRows.rows[0];

      // آپدیت ظرفیت بلیط در سطح دیتابیس (DML)
      const newRemaining = ticket.remaining_capacity - 1;
      const tStatus = newRemaining === 0 ? 'sold_out' : 'available';
      await client.query(`UPDATE tickets SET remaining_capacity = $1, status = $2 WHERE id = $3`, [newRemaining, tStatus, reservation.ticket_id]);

      // ثبت نهایی وضعیت رزرو به پرداخت شده
      await client.query(`UPDATE reservations SET status = 'paid' WHERE id = $1`, [reservationId]);

      // ثبت سند مالی پرداخت
      const paymentQuery = `
        INSERT INTO payments (user_id, reservation_id, amount, method, status)
        VALUES ($1, $2, $3, $4, 'success')
        RETURNING id, amount, method, paid_at
      `;
      const payRes = await client.query(paymentQuery, [userId, reservationId, ticket.price, method]);

      await client.query('COMMIT');
      return { payment: payRes.rows[0], ticket_id: reservation.ticket_id };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async findReservationForCancel(userId, reservationId) {
    const query = `
      SELECT r.id AS reservation_id, r.status AS reservation_status, t.id AS ticket_id, t.price, m.match_time
      FROM reservations r
      JOIN tickets t ON r.ticket_id = t.id
      JOIN matches m ON t.match_id = m.id
      WHERE r.id = $1 AND r.user_id = $2
    `;
    const { rows } = await pool.query(query, [reservationId, userId]);
    return rows[0];
  }

  static async processCancelAndRefund(userId, reservationId, ticketId, refundAmount) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // لغو رزرو
      await client.query(`UPDATE reservations SET status = 'cancelled' WHERE id = $1`, [reservationId]);
      
      // بازگرداندن ظرفیت بلیط
      await client.query(`UPDATE tickets SET remaining_capacity = remaining_capacity + 1, status = 'available' WHERE id = $1`, [ticketId]);

      // (در صورت لزوم افزایش کیف پول فیلد اختیاری کاربر در اینجا اعمال می‌شود)

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async getBookings(userId) {
    const query = `
      SELECT r.id AS reservation_id, r.status AS reservation_status, r.reserved_at,
             t.id AS ticket_id, t.price, m.match_time, s.name_fa AS sport_name,
             h.name_fa AS home_team, a.name_fa AS away_team
      FROM reservations r
      JOIN tickets t ON r.ticket_id = t.id
      JOIN matches m ON t.match_id = m.id
      JOIN sports s ON m.sport_id = s.id
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      WHERE r.user_id = $1
      ORDER BY r.reserved_at DESC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  static async adminGetReservations() {
    const query = `
      SELECT r.id AS reservation_id, r.status AS reservation_status, r.reserved_at,
             u.first_name, u.last_name, u.email, t.id AS ticket_id, t.price
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN tickets t ON r.ticket_id = t.id
      ORDER BY r.reserved_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  static async adminUpdateReservationStatus(reservationId, status, adminId) {
    const query = `
      UPDATE reservations
      SET status = $1, cancelled_by = CASE WHEN $1 = 'cancelled' THEN $2 ELSE cancelled_by END
      WHERE id = $3
      RETURNING id, status
    `;
    const { rows } = await pool.query(query, [status, adminId, reservationId]);
    return rows[0];
  }

  static async expirePendingReservations() {
    const query = `
      UPDATE reservations
      SET status = 'expired'
      WHERE status = 'pending' AND expires_at < NOW()
      RETURNING id
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}