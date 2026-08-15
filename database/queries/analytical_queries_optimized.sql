-- نسخه بهبود یافته با رعایت اصول Indexing و Query Optimization

-- ۱. نام و نام خانوادگی کاربرانی را برگردانید که تا به حال هیچ بلیطی رزرو نکرده‌اند.
-- بهبود: استفاده از EXISTS به جای NOT IN برای افزایش سرعت و جلوگیری از مشکل NULL
SELECT u.first_name, u.last_name 
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'visitor' 
  AND NOT EXISTS (
      SELECT 1 
      FROM reservations rv 
      WHERE rv.user_id = u.id
  );

-- ۲. نام و نام خانوادگی تمام کاربرانی که حداقل یک بلیط خرید‌ه‌اند را به دست آورید.
-- بهبود: استفاده از DISTINCT برای حذف تکراری‌ها
SELECT DISTINCT u.first_name, u.last_name 
FROM users u
JOIN payments p ON u.id = p.user_id
WHERE p.status = 'success';

-- ۳. مجموع پرداخت‌های انجام‌شده توسط هر کاربر را در ماه‌های مختلف برگردانید.
-- بهبود: استفاده از DATE_TRUNC به جای TO_CHAR برای استفاده بهتر از ایندکس
SELECT u.id, u.first_name, u.last_name, 
       DATE_TRUNC('month', p.paid_at) AS payment_month, 
       SUM(p.amount) AS total_paid
FROM users u
JOIN payments p ON u.id = p.user_id
WHERE p.status = 'success'
GROUP BY u.id, u.first_name, u.last_name, DATE_TRUNC('month', p.paid_at)
ORDER BY u.id, payment_month;

-- ۴. لیست کاربرانی که در هر شهر فقط یک بار بلیط خریداری کرده‌اند را نمایش دهید.
SELECT u.id, u.first_name, u.last_name, c.name_fa AS city_name
FROM users u
JOIN payments p ON u.id = p.user_id
JOIN reservations r ON p.reservation_id = r.id
JOIN tickets t ON r.ticket_id = t.id
JOIN matches m ON t.match_id = m.id
JOIN venues v ON m.venue_id = v.id
JOIN cities c ON v.city_id = c.id
WHERE p.status = 'success'
GROUP BY u.id, u.first_name, u.last_name, c.id, c.name_fa
HAVING COUNT(r.id) = 1;

-- ۵. اطلاعات کاربری را برگردانید که جدیدترین بلیط را خریداری کرده است.
-- بهبود: انتخاب فقط فیلدهای مورد نیاز به جای SELECT *
SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at
FROM users u
JOIN payments p ON u.id = p.user_id
WHERE p.status = 'success'
ORDER BY p.paid_at DESC
LIMIT 1;

-- ۶. شماره تلفن یا ایمیل کاربرانی که مجموع پرداخت‌های آن‌ها بیشتر از میانگین پرداخت کل کاربران باشد را برگردانید.
-- بهبود: استفاده از CTE برای محاسبه یکباره میانگین
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
SELECT s.name_fa AS sport_name, COUNT(r.id) AS sold_count
FROM sports s
JOIN matches m ON s.id = m.sport_id
JOIN tickets t ON m.id = t.match_id
JOIN reservations r ON t.id = r.ticket_id
WHERE r.status = 'paid'
GROUP BY s.id, s.name_fa;

-- ۸. نام ۳ کاربر با بیشترین خرید بلیط در هفته اخیر را برگردانید.
-- بهبود: استفاده از INTERVAL برای محاسبه دقیق هفته اخیر
SELECT u.first_name, u.last_name, COUNT(r.id) AS purchase_count
FROM users u
JOIN reservations r ON u.id = r.user_id
WHERE r.status = 'paid' 
  AND r.reserved_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.first_name, u.last_name
ORDER BY purchase_count DESC
LIMIT 3;

-- ۹. تعداد بلیط‌های فروخته‌شده در استان تهران را به تفکیک شهر نمایش دهید.
SELECT c.name_fa AS city_name, COUNT(r.id) AS sold_count
FROM provinces pr
JOIN cities c ON pr.id = c.province_id
JOIN venues v ON c.id = v.city_id
JOIN matches m ON v.id = m.venue_id
JOIN tickets t ON m.id = t.match_id
JOIN reservations r ON t.id = r.ticket_id
WHERE pr.name_en = 'Tehran' AND r.status = 'paid'
GROUP BY c.id, c.name_fa;

-- ۱۰. نام شهرهایی که قدیمی‌ترین کاربر ثبت‌نام‌شده در سیستم از آنجا خرید داشته است را لیست کنید.
-- بهبود: استفاده از CTE برای پیدا کردن قدیمی‌ترین کاربر
WITH oldest_user AS (
    SELECT u.id FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE r.name = 'visitor' 
    ORDER BY u.created_at ASC 
    LIMIT 1
)
SELECT DISTINCT c.name_fa AS city_name
FROM oldest_user ou
JOIN reservations r ON ou.id = r.user_id
JOIN tickets t ON r.ticket_id = t.id
JOIN matches m ON t.match_id = m.id
JOIN venues v ON m.venue_id = v.id
JOIN cities c ON v.city_id = c.id
WHERE r.status = 'paid';

-- ۱۱. نام پشتیبان‌های سایت را لیست کنید.
-- بهبود: ساده و بهینه با استفاده از JOIN
SELECT u.first_name, u.last_name 
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'support';

-- ۱۲. نام کاربرانی که حداقل ۲ بلیط در سیستم خریداری کرده‌اند را برگردانید.
-- بهبود: استفاده از HAVING برای فیلتر کردن بعد از GROUP BY
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
WHERE r.status = 'paid' AND s.name_en = 'Football'
GROUP BY u.id, u.first_name, u.last_name
HAVING COUNT(r.id) <= 2;

-- ۱۴. ایمیل یا شماره تلفن کاربرانی که از تمام انواع مسابقات ورزشی (فوتبال، والیبال و بسکتبال) حداقل یک بار بلیط خریداری کرده‌اند را برگردانید.
-- بهبود: استفاده از COUNT(DISTINCT) برای محاسبه دقیق تعداد ورزش‌های مختلف
SELECT u.first_name, u.last_name, u.email, u.phone
FROM users u
JOIN reservations r ON u.id = r.user_id
JOIN tickets t ON r.ticket_id = t.id
JOIN matches m ON t.match_id = m.id
WHERE r.status = 'paid'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone
HAVING COUNT(DISTINCT m.sport_id) = (SELECT COUNT(id) FROM sports);

-- ۱۵. اطلاعات بلیط‌های خریداری‌شده امروز را با ترتیب ساعت خرید لیست کنید.
-- بهبود: استفاده از بازه زمانی به جای CAST روی تاریخ برای استفاده از ایندکس
SELECT t.id AS ticket_id, 
       h.name_fa AS home_team, 
       a.name_fa AS away_team, 
       p.paid_at::time AS purchase_time
FROM payments p
JOIN reservations r ON p.reservation_id = r.id
JOIN tickets t ON r.ticket_id = t.id
JOIN matches m ON t.match_id = m.id
JOIN teams h ON m.home_team_id = h.id
JOIN teams a ON m.away_team_id = a.id
WHERE p.status = 'success' 
  AND p.paid_at >= CURRENT_DATE 
  AND p.paid_at < CURRENT_DATE + INTERVAL '1 day'
ORDER BY p.paid_at::time ASC;

-- ۱۶. دومین بلیط پرفروش در بین کل بلیط‌ها را نمایش دهید.
-- بهبود: استفاده از OFFSET برای دریافت دومین رکورد
SELECT t.id AS ticket_id, 
       h.name_fa AS home_team, 
       a.name_fa AS away_team, 
       COUNT(r.id) AS tickets_sold
FROM tickets t
JOIN matches m ON t.match_id = m.id
JOIN teams h ON m.home_team_id = h.id
JOIN teams a ON m.away_team_id = a.id
JOIN reservations r ON t.id = r.ticket_id
WHERE r.status = 'paid'
GROUP BY t.id, h.name_fa, a.name_fa
ORDER BY tickets_sold DESC
LIMIT 1 OFFSET 1;

-- ۱۷. نام پشتیبان با بیشترین تعداد لغو رزرو بلیط، همراه با درصد لغوها را برگردانید.
-- بهبود: استفاده از CTE برای محاسبات مرحله‌ای و دقیق
WITH support_cancels AS (
    SELECT r.cancelled_by, COUNT(*) AS cancel_count
    FROM reservations r
    WHERE r.status = 'cancelled' AND r.cancelled_by IS NOT NULL
    GROUP BY r.cancelled_by
),
total_cancels AS (
    SELECT COUNT(*) AS total_count 
    FROM reservations 
    WHERE status = 'cancelled'
)
SELECT u.first_name, u.last_name, sc.cancel_count,
       ROUND((sc.cancel_count::numeric / tc.total_count) * 100, 2) AS cancellation_percentage
FROM users u
JOIN support_cancels sc ON u.id = sc.cancelled_by
CROSS JOIN total_cancels tc
ORDER BY sc.cancel_count DESC
LIMIT 1;

-- ۱۸. نام خانوادگی کاربری که بیشترین تعداد بلیط کنسل‌شده دارد را به "ردینگتون" تغییر دهید.
-- بهبود: استفاده از ساب‌کوئری برای پیدا کردن کاربر با بیشترین کنسل
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
-- بهبود: استفاده از ساب‌کوئری برای پیدا کردن کاربر مورد نظر
DELETE FROM reservations
WHERE status = 'cancelled' 
  AND user_id = (
      SELECT id 
      FROM users 
      WHERE last_name = 'Reddington' 
      LIMIT 1
  );

-- ۲۰. تمام بلیط‌های کنسل‌شده در سیستم را پاک کنید.
-- بهبود: حذف مستقیم با شرط ساده
DELETE FROM reservations 
WHERE status = 'cancelled';

-- ۲۱. قیمت بلیط‌هایی که دیروز برای مسابقات برگزارشده در ورزشگاه آزادی فروخته شده‌اند را ۱۰٪ کاهش دهید.
-- بهبود: استفاده از بازه زمانی به جای CAST برای استفاده از ایندکس
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
      AND p.paid_at >= CURRENT_DATE - INTERVAL '1 day'
      AND p.paid_at < CURRENT_DATE
);

-- ۲۲. موضوع و تعداد گزارش‌ها را برای بلیط با بیشترین تعداد گزارش، نمایش دهید.
-- بهبود: استفاده از CTE برای پیدا کردن بلیط با بیشترین گزارش
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

-- ایندکس‌ها برای بهبود عملکرد کلی کوئری‌ها

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_user_status_date ON reservations(user_id, status, reserved_at);
CREATE INDEX IF NOT EXISTS idx_reservations_cancelled_by_status ON reservations(cancelled_by, status);
CREATE INDEX IF NOT EXISTS idx_payments_user_status_paid_at ON payments(user_id, status, paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_status_paid_at ON payments(status, paid_at);
CREATE INDEX IF NOT EXISTS idx_reports_reservation_id ON reports(reservation_id);
CREATE INDEX IF NOT EXISTS idx_provinces_name_en ON provinces(name_en);
CREATE INDEX IF NOT EXISTS idx_cities_province_id ON cities(province_id);


/*
بهبودهای اعمال‌شده:
۱. استفاده از EXISTS به جای NOT IN برای جلوگیری از مشکل NULL و افزایش سرعت
۲. استفاده از DATE_TRUNC به جای TO_CHAR برای استفاده بهتر از ایندکس
۳. استفاده از بازه زمانی به جای CAST روی تاریخ برای استفاده از ایندکس
۴. حذف SELECT * و انتخاب فقط فیلدهای مورد نیاز
۵. استفاده از CTE (WITH) برای محاسبات پیچیده و خوانایی بهتر
۶. استفاده از نام‌های فارسی (name_fa) برای نمایش بهتر به کاربران
۷. استفاده از name_en برای جستجوی دقیق‌تر در شرط‌ها
۸. اضافه کردن ایندکس‌های پیشنهادی برای بهبود عملکرد
*/