-- ۱. لیست بلیط‌های خریداری‌شده توسط کاربر
CREATE OR REPLACE FUNCTION get_user_purchased_tickets(u_contact VARCHAR)
RETURNS TABLE(ticket_id INT, home_team VARCHAR, away_team VARCHAR, price DECIMAL, purchase_time TIMESTAMP) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, h.name_fa, a.name_fa, t.price, r.reserved_at
    FROM users u
    JOIN reservations r ON u.id = r.user_id
    JOIN tickets t ON r.ticket_id = t.id
    JOIN matches m ON t.match_id = m.id
    JOIN teams h ON m.home_team_id = h.id
    JOIN teams a ON m.away_team_id = a.id
    WHERE (u.email = u_contact OR u.phone = u_contact) AND r.status = 'paid'
    ORDER BY r.reserved_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ۲. نام کاربرانی که حداقل یک‌بار رزرو آن‌ها توسط پشتیبان لغو شده
CREATE OR REPLACE FUNCTION get_cancelled_users_by_support(s_contact VARCHAR)
RETURNS TABLE(user_first_name VARCHAR, user_last_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT u_visitor.first_name, u_visitor.last_name
    FROM users u_support
    JOIN reservations r ON u_support.id = r.cancelled_by
    JOIN users u_visitor ON r.user_id = u_visitor.id
    WHERE (u_support.email = s_contact OR u_support.phone = s_contact) AND r.status = 'cancelled';
END;
$$ LANGUAGE plpgsql;

-- ۳. دریافت نام شهر و نمایش بلیط‌های خریداری شده در آن
CREATE OR REPLACE FUNCTION get_tickets_purchased_in_city(c_name VARCHAR)
RETURNS TABLE(ticket_id INT, buyer_name TEXT, match_desc TEXT, venue_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, 
           (u.first_name || ' ' || u.last_name)::text, 
           (h.name_fa || ' vs ' || a.name_fa)::text, 
           v.name_fa
    FROM cities c
    JOIN venues v ON c.id = v.city_id
    JOIN matches m ON v.id = m.venue_id
    JOIN teams h ON m.home_team_id = h.id
    JOIN teams a ON m.away_team_id = a.id
    JOIN tickets t ON m.id = t.match_id
    JOIN reservations r ON t.id = r.ticket_id
    JOIN users u ON r.user_id = u.id
    WHERE (c.name_en = c_name OR c.name_fa = c_name) AND r.status = 'paid';
END;
$$ LANGUAGE plpgsql;

-- ۴. موتور جستجوی متنی بلیط‌ها
CREATE OR REPLACE FUNCTION search_tickets(search_term VARCHAR)
RETURNS TABLE(ticket_id INT, visitor_name TEXT, match_title TEXT, venue_name VARCHAR, category_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id,
           (u.first_name || ' ' || u.last_name)::text,
           (h.name_fa || ' - ' || a.name_fa)::text,
           v.name_fa,
           tc.name_fa
    FROM tickets t
    JOIN matches m ON t.match_id = m.id
    JOIN teams h ON m.home_team_id = h.id
    JOIN teams a ON m.away_team_id = a.id
    JOIN venues v ON m.venue_id = v.id
    JOIN ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN reservations r ON t.id = r.ticket_id
    LEFT JOIN users u ON r.user_id = u.id
    WHERE (u.first_name ILIKE '%' || search_term || '%')
       OR (u.last_name ILIKE '%' || search_term || '%')
       OR (h.name_fa ILIKE '%' || search_term || '%')
       OR (a.name_fa ILIKE '%' || search_term || '%')
       OR (v.name_fa ILIKE '%' || search_term || '%')
       OR (tc.name_fa ILIKE '%' || search_term || '%')
       OR (h.name_en ILIKE '%' || search_term || '%')
       OR (a.name_en ILIKE '%' || search_term || '%')
       OR (v.name_en ILIKE '%' || search_term || '%')
       OR (tc.name_en ILIKE '%' || search_term || '%');
END;
$$ LANGUAGE plpgsql;

-- ۵. اطلاعات کاربران همشهری
CREATE OR REPLACE FUNCTION get_fellow_citizens(u_contact VARCHAR)
RETURNS TABLE(first_name VARCHAR, last_name VARCHAR, email VARCHAR, phone VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT o.first_name, o.last_name, o.email, o.phone
    FROM users u
    JOIN users o ON u.city_id = o.city_id
    WHERE (u.email = u_contact OR u.phone = u_contact) AND u.id <> o.id;
END;
$$ LANGUAGE plpgsql;

-- ۶. دریافت تاریخ و نمایش n خریدار برتر از آن تاریخ به بعد
CREATE OR REPLACE FUNCTION get_top_buyers_since(start_date TIMESTAMP, limit_n INT)
RETURNS TABLE(user_id INT, first_name VARCHAR, last_name VARCHAR, total_purchased BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.first_name, u.last_name, COUNT(r.id) AS purchase_count
    FROM users u
    JOIN reservations r ON u.id = r.user_id
    WHERE r.status = 'paid' AND r.reserved_at >= start_date
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY purchase_count DESC
    LIMIT limit_n;
END;
$$ LANGUAGE plpgsql;

-- ۷. صندلی‌های کنسل شده به تفکیک نوع مسابقه
CREATE OR REPLACE FUNCTION get_cancelled_tickets_by_sport(s_type VARCHAR)
RETURNS TABLE(ticket_id INT, match_title TEXT, original_price DECIMAL, match_date TIMESTAMP) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, (h.name_en || ' vs ' || a.name_en)::text, t.price, m.match_time
    FROM tickets t
    JOIN matches m ON t.match_id = m.id
    JOIN sports s ON m.sport_id = s.id
    JOIN teams h ON m.home_team_id = h.id
    JOIN teams a ON m.away_team_id = a.id
    JOIN reservations r ON t.id = r.ticket_id
    WHERE (s.name_en = s_type OR s.name_fa = s_type) AND r.status = 'cancelled'
    ORDER BY m.match_time ASC;
END;
$$ LANGUAGE plpgsql;

-- ۸. دریافت کاربران با بیشترین گزارش روی یک موضوع خاص
CREATE OR REPLACE FUNCTION get_users_with_most_reports_by_subject(rep_subject VARCHAR)
RETURNS TABLE(user_id INT, first_name VARCHAR, last_name VARCHAR, report_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.first_name, u.last_name, COUNT(r.id) AS num_reports
    FROM users u
    JOIN reports r ON u.id = r.user_id
    WHERE r.subject = rep_subject
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY num_reports DESC;
END;
$$ LANGUAGE plpgsql;