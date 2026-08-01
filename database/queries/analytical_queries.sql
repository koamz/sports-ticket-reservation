-- ==========================================
-- بازنویسی کوئری‌ها بر اساس الگوهای ارتباطی جدید
-- ==========================================

-- ۱. نام و نام خانوادگی کاربرانی را برگردانید که تا به حال هیچ بلیطی رزرو نکرده‌اند.
SELECT u.first_name, u.last_name 
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'visitor' AND u.id NOT IN (SELECT DISTINCT user_id FROM reservations);

-- ۲. نام و نام خانوادگی تمام کاربرانی که حداقل یک بلیط خرید‌ه‌اند را به دست آورید.
SELECT DISTINCT u.first_name, u.last_name 
FROM users u
JOIN payments p ON u.id = p.user_id
WHERE p.status = 'success';

-- ۳. مجموع پرداخت‌های انجام‌شده توسط هر کاربر را در ماه‌های مختلف برگردانید.
SELECT u.id, u.first_name, u.last_name, 
       TO_CHAR(p.paid_at, 'YYYY-MM') AS payment_month, 
       SUM(p.amount) AS total_paid
FROM users u
JOIN payments p ON u.id = p.user_id
WHERE p.status = 'success'
GROUP BY u.id, u.first_name, u.last_name, TO_CHAR(p.paid_at, 'YYYY-MM')
ORDER BY u.id, payment_month;

-- ۴. لیست کاربرانی که در هر شهر فقط یک بار بلیط خریداری کرده‌اند را نمایش دهید.
SELECT u.id, u.first_name, u.last_name, c.name AS city_name
FROM users u
JOIN payments p ON u.id = p.user_id
JOIN reservations r ON p.reservation_id = r.id
JOIN tickets t ON r.ticket_id = t.id
JOIN matches m ON t.match_id = m.id
JOIN venues v ON m.venue_id = v.id
JOIN cities c ON v.city_id = c.id
WHERE p.status = 'success'
GROUP BY u.id, u.first_name, u.last_name, c.id, c.name
HAVING COUNT(r.id) = 1;

-- ۵. اطلاعات کاربری را برگردانید که جدیدترین بلیط را خریداری کرده است.
SELECT u.* 
FROM users u
JOIN payments p ON u.id = p.user_id
WHERE p.status = 'success'
ORDER BY p.paid_at DESC
LIMIT 1;

-- ۶. شماره تلفن یا ایمیل کاربرانی که مجموع پرداخت‌های آن‌ها بیشتر از میانگین پرداخت کل کاربران باشد را برگردانید.
WITH user_totals AS (
    SELECT user_id, SUM(amount) AS total_amount
    FROM payments
    WHERE status = 'success'
    GROUP BY user_id
)
SELECT u.first_name, u.last_name, u.email, u.phone
FROM users u
JOIN user_totals ut ON u.id = ut.user_id
WHERE ut.total_amount > (SELECT AVG(total_amount) FROM user_totals);

-- ۷. تعداد بلیط‌های فروخته‌شده به ازای هر نوع مسابقه ورزشی (فوتبال، والیبال، بسکتبال) را نمایش دهید.
SELECT s.name AS sport_name, COUNT(r.id) AS sold_count
FROM sports s
JOIN matches m ON s.id = m.sport_id
JOIN tickets t ON m.id = t.match_id
JOIN reservations r ON t.id = r.ticket_id
WHERE r.status = 'paid'
GROUP BY s.id, s.name;

-- ۸. نام ۳ کاربر با بیشترین خرید بلیط در هفته اخیر را برگردانید.
SELECT u.first_name, u.last_name, COUNT(r.id) AS purchase_count
FROM users u
JOIN reservations r ON u.id = r.user_id
WHERE r.status = 'paid' AND r.reserved_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.first_name, u.last_name
ORDER BY purchase_count DESC
LIMIT 3;

-- ۹. تعداد بلیط‌های فروخته‌شده در استان تهران را به تفکیک شهر نمایش دهید.
SELECT c.name AS city_name, COUNT(r.id) AS sold_count
FROM provinces pr
JOIN cities c ON pr.id = c.province_id
JOIN venues v ON c.id = v.city_id
JOIN matches m ON v.id = m.venue_id
JOIN tickets t ON m.id = t.match_id
JOIN reservations r ON t.id = r.ticket_id
WHERE pr.name = 'Tehran' AND r.status = 'paid'
GROUP BY c.id, c.name;

-- ۱۰. نام شهرهایی که قدیمی‌ترین کاربر ثبت‌نام‌شده در سیستم از آنجا خرید داشته است را لیست کنید.
WITH oldest_user AS (
    SELECT u.id FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE r.name = 'visitor' 
    ORDER BY u.created_at ASC LIMIT 1
)
SELECT DISTINCT c.name AS city_name
FROM oldest_user ou
JOIN reservations r ON ou.id = r.user_id
JOIN tickets t ON r.ticket_id = t.id
JOIN matches m ON t.match_id = m.id
JOIN venues v ON m.venue_id = v.id
JOIN cities c ON v.city_id = c.id
WHERE r.status = 'paid';

-- ۱۱. نام پشتیبان‌های سایت را لیست کنید.
SELECT u.first_name, u.last_name 
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'support';

-- ۱۲. نام کاربرانی که حداقل ۲ بلیط در سیستم خریداری کرده‌اند را برگردانید.
SELECT u.first_name, u.last_name, COUNT(r.id) AS ticket_count
FROM users u
JOIN reservations r ON u.id = r.user_id
WHERE r.status = 'paid'
GROUP BY u.id, u.first_name, u.last_name
HAVING COUNT(r.id) >= 2;

-- ۱۳. نام کاربرانی را لیست کنید که حداکثر ۲ بلیط از یک نوع مسابقه ورزشی خاص (مثلاً فوتبال) خریده‌اند.
SELECT u.first_name, u.last_name, COUNT(r.id) AS football_ticket_count
FROM users u
JOIN reservations r ON u.id = r.user_id
JOIN tickets t ON r.ticket_id = t.id
JOIN matches m ON t.match_id = m.id
JOIN sports s ON m.sport_id = s.id
WHERE r.status = 'paid' AND s.name = 'Football'
GROUP BY u.id, u.first_name, u.last_name
HAVING COUNT(r.id) <= 2;

-- ۱۴. ایمیل یا شماره تلفن کاربرانی که از تمام انواع مسابقات ورزشی (فوتبال، والیبال و بسکتبال) حداقل یک بار بلیط خریداری کرده‌اند را برگردانید.
SELECT u.first_name, u.last_name, u.email, u.phone
FROM users u
JOIN reservations r ON u.id = r.user_id
JOIN tickets t ON r.ticket_id = t.id
JOIN matches m ON t.match_id = m.id
WHERE r.status = 'paid'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone
HAVING COUNT(DISTINCT m.sport_id) = (SELECT COUNT(id) FROM sports);

-- ۱۵. اطلاعات بلیط‌های خریداری‌شده امروز را با ترتیب ساعت خرید لیست کنید.
SELECT t.id AS ticket_id, h.name AS home_team, a.name AS away_team, p.paid_at::time AS purchase_time
FROM payments p
JOIN reservations r ON p.reservation_id = r.id
JOIN tickets t ON r.ticket_id = t.id
JOIN matches m ON t.match_id = m.id
JOIN teams h ON m.home_team_id = h.id
JOIN teams a ON m.away_team_id = a.id
WHERE p.status = 'success' AND p.paid_at::date = CURRENT_DATE
ORDER BY p.paid_at::time ASC;

-- ۱۶. دومین بلیط پرفروش در بین کل بلیط‌ها را نمایش دهید.
SELECT t.id AS ticket_id, h.name AS home_team, a.name AS away_team, COUNT(r.id) AS tickets_sold
FROM tickets t
JOIN matches m ON t.match_id = m.id
JOIN teams h ON m.home_team_id = h.id
JOIN teams a ON m.away_team_id = a.id
JOIN reservations r ON t.id = r.ticket_id
WHERE r.status = 'paid'
GROUP BY t.id, h.name, a.name
ORDER BY tickets_sold DESC
LIMIT 1 OFFSET 1;

-- ۱۷. نام پشتیبان با بیشترین تعداد لغو رزرو بلیط، همراه با درصد لغوها را برگردانید.
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

-- ۱۸. نام خانوادگی کاربری که بیشترین تعداد بلیط کنسل‌شده دارد را به "ردینگتون" تغییر دهید.
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

-- ۱۹. تمام بلیط‌های کنسل‌شده کاربر ردینگتون را حذف کنید.
DELETE FROM reservations
WHERE status = 'cancelled' AND user_id = (
    SELECT id FROM users WHERE last_name = 'Reddington' LIMIT 1
);

-- ۲۰. تمام بلیط‌های کنسل‌شده در سیستم را پاک کنید.
DELETE FROM reservations 
WHERE status = 'cancelled';

-- ۲۱. قیمت بلیط‌هایی که دیروز برای مسابقات برگزارشده در ورزشگاه آزادی فروخته شده‌اند را ۱۰٪ کاهش دهید.
UPDATE tickets
SET price = price * 0.90
WHERE id IN (
    SELECT t.id
    FROM tickets t
    JOIN matches m ON t.match_id = m.id
    JOIN venues v ON m.venue_id = v.id
    JOIN reservations r ON t.id = r.ticket_id
    JOIN payments p ON r.id = p.reservation_id
    WHERE v.name = 'Azadi Stadium' 
      AND p.status = 'success'
      AND p.paid_at::date = CURRENT_DATE - INTERVAL '1 day'
);

-- ۲۲. موضوع و تعداد گزارش‌ها را برای بلیط با بیشترین تعداد گزارش، نمایش دهید.
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