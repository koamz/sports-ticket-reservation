import pool from '../config/db.js';

export class TicketRepository {
  static async searchTickets({ sport, homeTeam, awayTeam, city, venue, tier, maxPrice }) {
    // بازگرداندن فیلدهای فارسی فیزیکی دیتابیس همگام با منطق چندزبانه کلاینت
    let query = `
      SELECT t.id AS ticket_id, t.price, t.remaining_capacity, t.status AS ticket_status,
             tc.name_fa AS category_name, s.name_fa AS sport_name,
             m.match_time, h.name_fa AS home_team, a.name_fa AS away_team,
             v.name_fa AS venue_name, c.name_fa AS city_name
      FROM tickets t
      JOIN ticket_categories tc ON t.category_id = tc.id
      JOIN matches m ON t.match_id = m.id
      JOIN sports s ON m.sport_id = s.id
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      JOIN venues v ON m.venue_id = v.id
      JOIN cities c ON v.city_id = c.id
      WHERE t.status = 'available' AND t.remaining_capacity > 0
    `;
    const params = [];
    let counter = 1;

    // پشتیبانی موتور جستجوی فال‌بک SQL از هر دو ساختار فیلتر فارسی و انگلیسی
    if (sport) {
      query += ` AND (s.name_en ILIKE $${counter} OR s.name_fa ILIKE $${counter})`;
      params.push(`%${sport}%`);
      counter++;
    }
    if (homeTeam) {
      query += ` AND (h.name_en ILIKE $${counter} OR h.name_fa ILIKE $${counter})`;
      params.push(`%${homeTeam}%`);
      counter++;
    }
    if (awayTeam) {
      query += ` AND (a.name_en ILIKE $${counter} OR a.name_fa ILIKE $${counter})`;
      params.push(`%${awayTeam}%`);
      counter++;
    }
    if (city) {
      query += ` AND (c.name_en ILIKE $${counter} OR c.name_fa ILIKE $${counter})`;
      params.push(`%${city}%`);
      counter++;
    }
    if (venue) {
      query += ` AND (v.name_en ILIKE $${counter} OR v.name_fa ILIKE $${counter})`;
      params.push(`%${venue}%`);
      counter++;
    }
    if (tier) {
      query += ` AND (tc.name_en ILIKE $${counter} OR tc.name_fa ILIKE $${counter})`;
      params.push(`%${tier}%`);
      counter++;
    }
    if (maxPrice) {
      query += ` AND t.price <= $${counter}`;
      params.push(maxPrice);
      counter++;
    }

    query += ` ORDER BY m.match_time ASC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async findDetailById(ticketId) {
    // اصلاح و همگام‌سازی فیلدهای فارسی مسابقات در کوئری واکشی جزئیات بلیط
    const queryBase = `
      SELECT t.id AS ticket_id, t.price, t.remaining_capacity, t.status AS ticket_status,
             tc.name_fa AS category_name, s.name_fa AS sport_name, m.match_time,
             h.name_fa AS home_team, a.name_fa AS away_team, v.name_fa AS venue_name
      FROM tickets t
      JOIN ticket_categories tc ON t.category_id = tc.id
      JOIN matches m ON t.match_id = m.id
      JOIN sports s ON m.sport_id = s.id
      JOIN teams h ON m.home_team_id = h.id
      JOIN teams a ON m.away_team_id = a.id
      JOIN venues v ON m.venue_id = v.id
      WHERE t.id = $1
    `;
    const { rows } = await pool.query(queryBase, [ticketId]);
    if (rows.length === 0) return null;

    const baseData = rows[0];

    let detailQuery = '';
    // بررسی هوشمند فیلد فارسی یا انگلیسی رشته ورزشی برای واکشی جزئیات کلاس‌بندی
    if (baseData.sport_name === 'Football' || baseData.sport_name === 'فوتبال') {
      detailQuery = `SELECT league_name, stadium_name, section_name, row_number, seat_number, facilities FROM football_details WHERE ticket_id = $1`;
    } else if (baseData.sport_name === 'Volleyball' || baseData.sport_name === 'والیبال') {
      detailQuery = `SELECT league_name, hall_name AS stadium_name, section_number AS section_name, row_number, seat_number, facilities FROM volleyball_details WHERE ticket_id = $1`;
    } else if (baseData.sport_name === 'Basketball' || baseData.sport_name === 'بسکتبال') {
      detailQuery = `SELECT league_name, hall_name AS stadium_name, section_number AS section_name, row_number, seat_number, facilities FROM basketball_details WHERE ticket_id = $1`;
    }

    if (detailQuery) {
      const detailRes = await pool.query(detailQuery, [ticketId]);
      baseData.sport_details = detailRes.rows[0] || null;
    }

    return baseData;
  }
}