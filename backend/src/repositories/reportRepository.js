import pool from '../config/db.js';

export class ReportRepository {
  static async createReport(userId, { reservationId, category, subject, description }) {
    const query = `
      INSERT INTO reports (user_id, reservation_id, category, subject, description, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id, user_id, reservation_id, category, subject, description, status, created_at
    `;
    const values = [userId, reservationId, category, subject, description];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async adminGetReports() {
    const query = `
      SELECT r.*, u.first_name, u.last_name, u.email
      FROM reports r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  static async adminUpdateReportStatus(reportId, status) {
    const query = `
      UPDATE reports
      SET status = $1
      WHERE id = $2
      RETURNING id, status
    `;
    const { rows } = await pool.query(query, [status, reportId]);
    return rows[0];
  }
}