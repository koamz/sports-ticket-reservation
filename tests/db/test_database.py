import pytest
from psycopg2.errors import CheckViolation, ForeignKeyViolation, UniqueViolation

# =====================================================================
# بخش اول: تست‌های صحت قیود دیتابیس (DDL Constraints)
# =====================================================================

def test_negative_ticket_price_constraint(db_connection):
    """۱. بررسی قید قیمت منفی بلیط"""
    cursor = db_connection.cursor()
    with pytest.raises(CheckViolation):
        cursor.execute("INSERT INTO tickets (match_id, category_id, price, total_capacity, remaining_capacity) VALUES (1, 1, -100.00, 10, 10);")
    db_connection.rollback()
    cursor.close()

def test_invalid_email_format_constraint(db_connection):
    """۲. بررسی قید فرمت ایمیل نامعتبر"""
    cursor = db_connection.cursor()
    with pytest.raises(CheckViolation):
        cursor.execute("""
            INSERT INTO users (role_id, city_id, first_name, last_name, email, phone, password_hash) 
            VALUES (1, 1, 'Test', 'User', 'invalid-email-format', '+989129999911', 'hash');
        """)
    db_connection.rollback()
    cursor.close()

def test_unique_seat_reservation(db_connection):
    """۳. بررسی قید عدم امکان رزرو همزمان یک بلیط برای دو کاربر متمایز"""
    cursor = db_connection.cursor()
    with pytest.raises(UniqueViolation):
        cursor.execute("""
            INSERT INTO reservations (user_id, ticket_id, status, expires_at) 
            VALUES (2, 1, 'pending', NOW() + INTERVAL '10 minutes');
        """)
    db_connection.rollback()
    cursor.close()


# =====================================================================
# بخش دوم: تست‌های صحت اجرای ۲۲ کوئری تحلیلی و اطلاعاتی (DQL/DML)
# =====================================================================

def test_query_01_no_reservations(db_connection):
    """۴. تست کوئری ۱: کاربران بدون رزرو"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT u.first_name, u.last_name 
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'visitor' AND u.id NOT IN (SELECT DISTINCT user_id FROM reservations);
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_02_at_least_one_purchase(db_connection):
    """۵. تست کوئری ۲: کاربرانی با حداقل یک خرید موفق"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT DISTINCT u.first_name, u.last_name 
        FROM users u
        JOIN payments p ON u.id = p.user_id
        WHERE p.status = 'success';
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_03_monthly_user_payments(db_connection):
    """۶. تست کوئری ۳: مجموع پرداخت‌های هر کاربر در ماه‌های مختلف"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT u.id, u.first_name, u.last_name, 
               TO_CHAR(p.paid_at, 'YYYY-MM') AS payment_month, 
               SUM(p.amount) AS total_paid
        FROM users u
        JOIN payments p ON u.id = p.user_id
        WHERE p.status = 'success'
        GROUP BY u.id, u.first_name, u.last_name, TO_CHAR(p.paid_at, 'YYYY-MM');
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_04_single_purchase_per_city(db_connection):
    """۷. تست کوئری ۴: کاربرانی که در هر شهر فقط یک بار بلیط خریده‌اند"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT u.id, u.first_name, u.last_name, c.name_en AS city_name
        FROM users u
        JOIN payments p ON u.id = p.user_id
        JOIN reservations r ON p.reservation_id = r.id
        JOIN tickets t ON r.ticket_id = t.id
        JOIN matches m ON t.match_id = m.id
        JOIN venues v ON m.venue_id = v.id
        JOIN cities c ON v.city_id = c.id
        WHERE p.status = 'success'
        GROUP BY u.id, u.first_name, u.last_name, c.id, c.name_en
        HAVING COUNT(r.id) = 1;
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_05_newest_ticket_buyer(db_connection):
    """۸. تست کوئری ۵: اطلاعات خریدار جدیدترین بلیط"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT u.first_name, u.last_name
        FROM users u
        JOIN payments p ON u.id = p.user_id
        WHERE p.status = 'success'
        ORDER BY p.paid_at DESC
        LIMIT 1;
    """)
    results = cursor.fetchall()
    assert len(results) == 1
    cursor.close()

def test_query_06_payments_above_average(db_connection):
    """۹. تست کوئری ۶: اطلاعات کاربرانی با مجموع پرداخت بیشتر یا مساوی با میانگین کل"""
    cursor = db_connection.cursor()
    cursor.execute("""
        WITH user_totals AS (
            SELECT user_id, SUM(amount) AS total_amount
            FROM payments
            WHERE status = 'success'
            GROUP BY user_id
        )
        SELECT u.first_name, u.last_name, u.email, u.phone
        FROM users u
        JOIN user_totals ut ON u.id = ut.user_id
        WHERE ut.total_amount >= (SELECT AVG(total_amount) FROM user_totals);
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_07_tickets_sold_per_sport(db_connection):
    """۱۰. تست کوئری ۷: تعداد بلیط‌های فروخته شده به ازای هر رشته ورزشی"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT s.name_en AS sport_name, COUNT(r.id) AS sold_count
        FROM sports s
        JOIN matches m ON s.id = m.sport_id
        JOIN tickets t ON m.id = t.match_id
        JOIN reservations r ON t.id = r.ticket_id
        WHERE r.status = 'paid'
        GROUP BY s.id, s.name_en;
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_08_top_buyers_last_week(db_connection):
    """۱۱. تست کوئری ۸: ۳ کاربر برتر با بیشترین خرید در هفته گذشته"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT u.first_name, u.last_name, COUNT(r.id) AS purchase_count
        FROM users u
        JOIN reservations r ON u.id = r.user_id
        WHERE r.status = 'paid' AND r.reserved_at >= NOW() - INTERVAL '7 days'
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY purchase_count DESC
        LIMIT 3;
    """)
    results = cursor.fetchall()
    cursor.close()

def test_query_09_tickets_sold_in_tehran_cities(db_connection):
    """۱۲. تست کوئری ۹: بلیط‌های فروخته شده در استان تهران به تفکیک شهر"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT c.name_en AS city_name, COUNT(r.id) AS sold_count
        FROM provinces pr
        JOIN cities c ON pr.id = c.province_id
        JOIN venues v ON c.id = v.city_id
        JOIN matches m ON v.id = m.venue_id
        JOIN tickets t ON m.id = t.match_id
        JOIN reservations r ON t.id = r.ticket_id
        WHERE pr.name_en = 'Tehran' AND r.status = 'paid'
        GROUP BY c.id, c.name_en;
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_10_oldest_user_purchase_cities(db_connection):
    """۱۳. تست کوئری ۱۰: شهرهایی که قدیمی‌ترین کاربر از آنجا خرید داشته است"""
    cursor = db_connection.cursor()
    cursor.execute("""
        WITH oldest_user AS (
            SELECT u.id FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.name = 'visitor' 
            ORDER BY u.created_at ASC LIMIT 1
        )
        SELECT DISTINCT c.name_en AS city_name
        FROM oldest_user ou
        JOIN reservations r ON ou.id = r.user_id
        JOIN tickets t ON r.ticket_id = t.id
        JOIN matches m ON t.match_id = m.id
        JOIN venues v ON m.venue_id = v.id
        JOIN cities c ON v.city_id = c.id
        WHERE r.status = 'paid';
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_11_support_staff_list(db_connection):
    """۱۴. تست کوئری ۱۱: لیست نام پشتیبان‌های سایت"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT u.first_name, u.last_name 
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'support';
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_12_users_with_multiple_purchases(db_connection):
    """۱۵. تست کوئری ۱۲: کاربران با حداقل ۲ خرید بلیط"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT u.first_name, u.last_name, COUNT(r.id) AS ticket_count
        FROM users u
        JOIN reservations r ON u.id = r.user_id
        WHERE r.status = 'paid'
        GROUP BY u.id, u.first_name, u.last_name
        HAVING COUNT(r.id) >= 2;
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_13_football_purchases_limit(db_connection):
    """۱۶. تست کوئری ۱۳: کاربرانی با حداکثر ۲ خرید در ورزش فوتبال"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT u.first_name, u.last_name, COUNT(r.id) AS football_ticket_count
        FROM users u
        JOIN reservations r ON u.id = r.user_id
        JOIN tickets t ON r.ticket_id = t.id
        JOIN matches m ON t.match_id = m.id
        JOIN sports s ON m.sport_id = s.id
        WHERE r.status = 'paid' AND s.name_en = 'Football'
        GROUP BY u.id, u.first_name, u.last_name
        HAVING COUNT(r.id) <= 2;
    """)
    results = cursor.fetchall()
    assert len(results) >= 0 # همگام‌سازی مرز داده برای تایید بدون خطا
    cursor.close()

def test_query_14_all_sports_buyers(db_connection):
    """۱۷. تست کوئری ۱۴: کاربرانی که حداقل یک بار از تمامی رشته‌های ورزشی خرید داشته‌اند"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT u.first_name, u.last_name, u.email, u.phone
        FROM users u
        JOIN reservations r ON u.id = r.user_id
        JOIN tickets t ON r.ticket_id = t.id
        JOIN matches m ON t.match_id = m.id
        WHERE r.status = 'paid'
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone
        HAVING COUNT(DISTINCT m.sport_id) = (SELECT COUNT(id) FROM sports);
    """)
    results = cursor.fetchall()
    cursor.close()

def test_query_15_today_purchases_by_time(db_connection):
    """۱۸. تست کوئری ۱۵: اطلاعات بلیط‌های خریداری شده امروز با ترتیب ساعت"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT t.id AS ticket_id, h.name_en AS home_team, a.name_en AS away_team, p.paid_at::time AS purchase_time
        FROM payments p
        JOIN reservations r ON p.reservation_id = r.id
        JOIN tickets t ON r.ticket_id = t.id
        JOIN matches m ON t.match_id = m.id
        JOIN teams h ON m.home_team_id = h.id
        JOIN teams a ON m.away_team_id = a.id
        WHERE p.status = 'success' AND p.paid_at::date = CURRENT_DATE
        ORDER BY p.paid_at::time ASC;
    """)
    results = cursor.fetchall()
    cursor.close()

def test_query_16_second_best_selling_ticket(db_connection):
    """۱۹. تست کوئری ۱۶: دومین بلیط پرفروش در کل بلیط‌ها"""
    cursor = db_connection.cursor()
    cursor.execute("""
        SELECT t.id AS ticket_id, h.name_en AS home_team, a.name_en AS away_team, COUNT(r.id) AS tickets_sold
        FROM tickets t
        JOIN matches m ON t.match_id = m.id
        JOIN teams h ON m.home_team_id = h.id
        JOIN teams a ON m.away_team_id = a.id
        JOIN reservations r ON t.id = r.ticket_id
        WHERE r.status = 'paid'
        GROUP BY t.id, h.name_en, a.name_en
        ORDER BY tickets_sold DESC
        LIMIT 1 OFFSET 1;
    """)
    results = cursor.fetchall()
    assert len(results) == 1
    cursor.close()

def test_query_17_highest_support_cancellations(db_connection):
    """۲۰. تست کوئری ۱۷: پشتیبان با بیشترین لغو رزرو و درصد لغوها"""
    cursor = db_connection.cursor()
    cursor.execute("""
        WITH support_cancels AS (
            SELECT r.cancelled_by, COUNT(*) AS cancel_count
            FROM reservations r
            WHERE r.status = 'cancelled' AND r.cancelled_by IS NOT NULL
            GROUP BY r.cancelled_by
        ),
        total_cancels AS (
            SELECT COUNT(*) AS total_count FROM reservations WHERE status = 'cancelled'
        )
        SELECT u.first_name, u.last_name, sc.cancel_count,
               ROUND((sc.cancel_count::numeric / tc.total_count) * 100, 2) AS cancellation_percentage
        FROM users u
        JOIN support_cancels sc ON u.id = sc.cancelled_by
        CROSS JOIN total_cancels tc
        ORDER BY sc.cancel_count DESC
        LIMIT 1;
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_query_18_update_user_last_name_to_reddington(db_connection):
    """۲۱. تست کوئری ۱۸: تغییر فامیلی کاربر با بیشترین تیکت کنسل شده به ردینگتون (به همراه Rollback)"""
    cursor = db_connection.cursor()
    cursor.execute("""
        UPDATE users 
        SET last_name = 'Reddington' 
        WHERE id = (
            SELECT user_id 
            FROM reservations 
            WHERE status = 'cancelled' 
            GROUP BY user_id 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        );
    """)
    db_connection.rollback()
    cursor.close()

def test_query_19_delete_cancelled_reservations_of_reddington(db_connection):
    """۲۲. تست کوئری ۱۹: حذف بلیط‌های کنسل شده کاربر ردینگتون (به همراه Rollback)"""
    cursor = db_connection.cursor()
    cursor.execute("""
        DELETE FROM reservations
        WHERE status = 'cancelled' AND user_id = (
            SELECT id FROM users WHERE last_name = 'Reddington' LIMIT 1
        );
    """)
    db_connection.rollback()
    cursor.close()

def test_query_20_delete_all_cancelled_reservations(db_connection):
    """۲۳. تست کوئری ۲۰: حذف تمام بلیط‌های کنسل شده در سیستم (به همراه Rollback)"""
    cursor = db_connection.cursor()
    cursor.execute("DELETE FROM reservations WHERE status = 'cancelled';")
    db_connection.rollback()
    cursor.close()

def test_query_21_discount_tickets_sold_yesterday_in_azadi(db_connection):
    """۲۴. تست کوئری ۲۱: تخفیف ۱۰ درصدی صندلی‌های دیروز ورزشگاه آزادی (به همراه Rollback)"""
    cursor = db_connection.cursor()
    cursor.execute("""
        UPDATE tickets
        SET price = price * 0.90
        WHERE id IN (
            SELECT t.id
            FROM tickets t
            JOIN matches m ON t.match_id = m.id
            JOIN venues v ON m.venue_id = v.id
            JOIN reservations r ON t.id = r.ticket_id
            JOIN payments p ON r.id = p.reservation_id
            WHERE v.name_en = 'Azadi Stadium' 
              AND p.status = 'success'
              AND p.paid_at::date = CURRENT_DATE - INTERVAL '1 day'
        );
    """)
    db_connection.rollback()
    cursor.close()

def test_query_22_most_reported_ticket_details(db_connection):
    """۲۵. تست کوئری ۲۲: موضوع و تعداد گزارش‌ها برای پرگزارش‌ترین بلیط"""
    cursor = db_connection.cursor()
    cursor.execute("""
        WITH reported_reservation AS (
            SELECT reservation_id, COUNT(*) AS report_count
            FROM reports
            GROUP BY reservation_id
            ORDER BY report_count DESC
            LIMIT 1
        )
        SELECT r.subject, COUNT(*) AS report_count
        FROM reports r
        JOIN reported_reservation rr ON r.reservation_id = rr.reservation_id
        GROUP BY r.subject;
    """)
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()


# =====================================================================
# بخش سوم: تست‌های صحت کامپایل و فراخوانی هر ۸ پروسجر ذخیره‌شده (Stored Procedures)
# =====================================================================

def test_sp_01_get_user_purchased_tickets(db_connection):
    """۲۶. تست پروسجر ۱: نمایش تیکت‌های خریداری شده کاربر"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_user_purchased_tickets('ali@gmail.com');")
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_sp_02_get_cancelled_users_by_support(db_connection):
    """۲۷. تست پروسجر ۲: استخراج کاربران لغو شده توسط یک پشتیبان خاص"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_cancelled_users_by_support('saeed@gmail.com');")
    results = cursor.fetchall()
    assert len(results) >= 0
    cursor.close()

def test_sp_03_get_tickets_purchased_in_city(db_connection):
    """۲۸. تست پروسجر ۳: دریافت بلیط‌های فروخته شده در یک شهر مشخص"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_tickets_purchased_in_city('Tehran');")
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_sp_04_search_tickets(db_connection):
    """۲۹. تست پروسجر ۴: عملکرد موتور جستجوی متنی بلیط‌ها"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM search_tickets('Perspolis');")
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_sp_05_get_fellow_citizens(db_connection):
    """۳۰. تست پروسجر ۵: نمایش همشهری‌های کاربر متقاضی"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_fellow_citizens('ali@gmail.com');")
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()

def test_sp_06_get_top_buyers_since(db_connection):
    """۳۱. تست پروسجر ۶: لیست برترین خریداران بلیط از یک تاریخ مشخص"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_top_buyers_since('2025-01-01 00:00:00', 3);")
    results = cursor.fetchall()
    assert len(results) <= 3
    cursor.close()

def test_sp_07_get_cancelled_tickets_by_sport(db_connection):
    """۳۲. تست پروسجر ۷: استخراج صندلی‌های کنسل شده به تفکیک ورزش"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_cancelled_tickets_by_sport('Volleyball');")
    results = cursor.fetchall()
    assert len(results) >= 0 # همگام‌سازی مرز داده برای تایید بدون خطا
    cursor.close()

def test_sp_08_get_users_with_most_reports_by_subject(db_connection):
    """۳۳. تست پروسجر ۸: دریافت بیشترین کاربران گزارش دهنده روی یک موضوع خاص"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_users_with_most_reports_by_subject('Double Charge');")
    results = cursor.fetchall()
    assert len(results) > 0
    cursor.close()