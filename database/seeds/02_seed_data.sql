-- ==========================================
-- درج داده‌های تستی اولیه چندزبانه با حفظ کامل رکوردها
-- ==========================================

-- ۱. استان‌ها
INSERT INTO provinces (name_en, name_fa) VALUES 
('Tehran', 'تهران'), ('Isfahan', 'اصفهان'), ('Fars', 'فارس'), 
('Khorasan Razavi', 'خراسان رضوی'), ('East Azerbaijan', 'آذربایجان شرقی'),
('Alborz', 'البرز'), ('Mazandaran', 'مازندران'), ('Gilan', 'گیلان'), 
('Khuzestan', 'خوزستان'), ('Yazd', 'یزد');

-- ۲. شهرها
INSERT INTO cities (province_id, name_en, name_fa) VALUES 
(1, 'Tehran', 'تهران'), (1, 'Rey', 'ری'), (2, 'Isfahan', 'اصفهان'), 
(2, 'Kashan', 'کاشان'), (3, 'Shiraz', 'شیراز'), (4, 'Mashhad', 'مشهد'), 
(5, 'Tabriz', 'تبریز'), (6, 'Karaj', 'کرج'), (7, 'Sari', 'ساری'), (8, 'Rasht', 'رشت');

-- ۳. نقش‌ها
INSERT INTO roles (name) VALUES ('visitor'), ('support');

-- ۴. کاربران
INSERT INTO users (role_id, city_id, first_name, last_name, email, phone, password_hash, status, created_at) VALUES 
(1, 1, 'Ali', 'Rezaei', 'ali@gmail.com', '+989121111111', '$2b$10$tJ9F0/bE/N5FpXQOfG8N.O3gX/VvHe8R6nZszV.fHeXg8lBvB.X0q', 'active', '2023-01-10 10:00:00'),
(1, 3, 'Mohammad', 'Ahmadi', 'mohammad@gmail.com', '+989122222222', 'hash2', 'active', '2023-02-15 11:30:00'),
(1, 5, 'Sara', 'Karimi', 'sara@gmail.com', '+989123333333', 'hash3', 'active', '2023-03-20 14:15:00'),
(1, 1, 'Reza', 'Mohammadi', 'reza@gmail.com', '+989124444444', 'hash4', 'active', '2023-04-05 09:00:00'),
(1, 6, 'Zahra', 'Hosaini', 'zahra@gmail.com', '+989125555555', 'hash5', 'active', '2023-05-12 16:45:00'),
(1, 7, 'Ehsan', 'Nouri', 'ehsan@gmail.com', '+989126666666', 'hash6', 'active', '2023-06-18 12:00:00'),
(2, 1, 'Saeed', 'Yavari', 'saeed@gmail.com', '+989127777777', 'hash7', 'active', '2023-01-01 08:00:00'),
(2, 3, 'Maryam', 'Sadati', 'maryam@gmail.com', '+989128888888', 'hash8', 'active', '2023-01-05 08:30:00'),
(1, 1, 'Amir', 'Taji', 'amir@gmail.com', '+989129999999', 'hash9', 'active', '2023-07-22 17:30:00'),
(1, 4, 'Neda', 'Amini', 'neda@gmail.com', '+989131111111', 'hash10', 'active', '2023-08-30 19:10:00'),
(1, 2, 'Hassan', 'Shakeri', 'hassan@gmail.com', '+989142222222', 'hash11', 'active', '2023-09-05 10:00:00');

-- ۵. ورزشگاه‌ها
INSERT INTO venues (city_id, name_en, name_fa, address_en, address_fa, capacity) VALUES 
(1, 'Azadi Stadium', 'ورزشگاه آزادی', 'Tehran, West', 'تهران، غرب تهران، مجموعه ورزشی آزادی', 80000),
(1, 'Takhti Stadium', 'ورزشگاه تختی', 'Tehran, East', 'تهران، شرق تهران، تختی', 30000),
(3, 'Naghsh-e-Jahan Stadium', 'ورزشگاه نقش جهان', 'Isfahan, North', 'اصفهان، شمال اصفهان', 60000),
(7, 'Yadegar-e-Emam Stadium', 'ورزشگاه یادگار امام', 'Tabriz, South', 'تبریز، جنوب تبریز', 50000),
(6, 'Samen Stadium', 'ورزشگاه ثامن', 'Mashhad, West', 'مشهد، مجموعه ثامن الائمه', 35000),
(5, 'Shiraz Hall', 'سالن شیراز', 'Shiraz, Central', 'شیراز، بخش مرکزی', 5000),
(1, 'Tehran 12000 Hall', 'تالار ۱۲۰۰۰ نفری آزادی', 'Tehran, West', 'تهران، مجموعه ورزشی آزادی', 12000),
(3, 'Isfahan Volleyball Arena', 'سالن والیبال اصفهان', 'Isfahan, Center', 'اصفهان، مرکز شهر', 6000),
(7, 'Tabriz Basketball Arena', 'سالن بسکتبال تبریز', 'Tabriz, Shahgoli', 'تبریز، شاهگلی', 4000),
(10, 'Rasht Arena', 'سالن رشت', 'Rasht, Golsar', 'رشت، گلسار', 3000);

-- ۶. ورزش‌ها
INSERT INTO sports (name_en, name_fa) VALUES 
('Football', 'فوتبال'), ('Volleyball', 'والیبال'), ('Basketball', 'بسکتبال');

-- ۷. تیم‌ها
INSERT INTO teams (sport_id, name_en, name_fa) VALUES 
(1, 'Perspolis', 'پرسپولیس'), (1, 'Esteghlal', 'استقلال'), 
(1, 'Sepahan', 'سپاهان'), (1, 'Tractor', 'تراکتور'), 
(2, 'Paykan', 'پیکان'), (2, 'Shahrdari Urmia', 'شهرداری ارومیه'), 
(2, 'Saipa', 'سایپا'), (2, 'Kalleh', 'کاله'),
(3, 'Mahram', 'مهرام'), (3, 'Gorgan', 'گرگان'), 
(3, 'Petrochimi', 'پتروشیمی'), (3, 'Zob Ahan', 'ذوب آهن');

-- ۸. مسابقات
INSERT INTO matches (sport_id, venue_id, home_team_id, away_team_id, match_time) VALUES 
(1, 1, 1, 2, '2025-06-11 21:30:00'),
(1, 3, 3, 4, '2025-06-12 20:30:00'),
(2, 7, 5, 6, '2025-06-13 19:30:00'),
(3, 9, 9, 10, '2025-06-04 15:00:00'),
(1, 1, 1, 3, '2025-05-24 19:00:00'), -- بازی روز قبل (پرسپولیس - سپاهان)
(2, 8, 7, 8, '2025-06-05 16:00:00'),
(3, 9, 11, 12, '2025-06-06 18:00:00'),
(1, 1, 2, 4, '2025-06-07 19:30:00'),
(2, 7, 5, 7, '2025-06-08 17:00:00'),
(3, 9, 9, 12, '2025-06-09 16:00:00');

-- ۹. دسته‌بندی بلیط‌ها
INSERT INTO ticket_categories (name_en, name_fa) VALUES 
('Regular', 'عادی'), ('VIP', 'ویژه'), ('Premium', 'ممتاز');

-- ۱۰. بلیط‌ها
-- توجه: بلیط‌های ۱ تا ۷ به خاطر داشتن رزرو فعال تستی در Seeds، با ظرفیت 0 و sold_out ثبت شدند تا تداخل قید یکتا و باگ تکرار صندلی کلاینت رخ ندهد.
INSERT INTO tickets (match_id, category_id, price, total_capacity, remaining_capacity, status) VALUES 
(1, 1, 150000.00, 1, 0, 'sold_out'),     -- رزرو و پرداخت شده توسط علی
(1, 2, 300000.00, 10, 9, 'available'),   -- بلیط آزاد ویژه مسابقه اول (در دسترس برای رزرو بدون تداخل)
(2, 1, 100000.00, 150, 149, 'available'),
(3, 1, 80000.00, 80, 79, 'available'),
(4, 1, 90000.00, 50, 49, 'available'),
(5, 1, 200000.00, 1, 0, 'sold_out'),     -- رزرو و پرداخت شده توسط علی
(5, 2, 400000.00, 10, 9, 'available'),   -- بلیط آزاد ویژه مسابقه پنجم (در دسترس برای رزرو بدون تداخل)
(6, 1, 70000.00, 60, 60, 'available'),
(7, 3, 120000.00, 40, 40, 'available'),
(8, 1, 150000.00, 200, 200, 'available'),
(9, 1, 80000.00, 80, 80, 'available'),
(10, 1, 100000.00, 50, 50, 'available');

-- ۱۱. جزئیات فوتبال
INSERT INTO football_details (ticket_id, league_name, stadium_name, section_name, row_number, seat_number, facilities) VALUES 
(1, 'Persian Gulf Pro League', 'Azadi Stadium', 'Western-A', '10', '12', 'No special amenities'),
(2, 'Persian Gulf Pro League', 'Azadi Stadium', 'VIP-Center', '1', '5', 'Catering, Parking'),
(3, 'Persian Gulf Pro League', 'Naghsh-e-Jahan', 'Eastern-B', '15', '22', 'No special amenities'),
(6, 'Persian Gulf Pro League', 'Azadi Stadium', 'Western-A', '5', '8', 'Catering, Covered Seat'),
(7, 'Persian Gulf Pro League', 'Azadi Stadium', 'VIP-Center', '2', '10', 'Catering, Parking, VIP Entrance'),
(10, 'Persian Gulf Pro League', 'Azadi Stadium', 'Eastern-C', '12', '1', 'No special amenities');

-- ۱۲. جزئیات والیبال
INSERT INTO volleyball_details (ticket_id, league_name, hall_name, section_number, row_number, seat_number, facilities) VALUES 
(4, 'Super League', 'Tehran 12000 Hall', 'Main Hall A', '3', '14', 'Near Court'),
(8, 'Super League', 'Isfahan Arena', 'Balcony B', '8', '2', 'Standard Seat'),
(11, 'Super League', 'Tehran 12000 Hall', 'Main Hall A', '4', '15', 'Near Court');

-- ۱۳. جزئیات بسکتبال
INSERT INTO basketball_details (ticket_id, league_name, hall_name, section_number, row_number, seat_number, facilities) VALUES 
(5, 'Super League', 'Tabriz Arena', 'Zone 1', '2', '20', 'Standard Seat'),
(9, 'Super League', 'Tabriz Arena', 'VIP Box', '1', '3', 'Catering, Private Cabin'),
(12, 'Super League', 'Tabriz Arena', 'Zone 2', '6', '11', 'Standard Seat');

-- ۱۴. رزروها
INSERT INTO reservations (user_id, ticket_id, status, reserved_at, expires_at, cancelled_by) VALUES 
(1, 1, 'paid', '2025-05-25 10:00:00', '2025-05-25 10:10:00', NULL),
(1, 6, 'paid', '2025-05-24 15:00:00', '2025-05-24 15:10:00', NULL),
(1, 3, 'paid', '2025-05-25 12:00:00', '2025-05-25 12:10:00', NULL),
(1, 4, 'paid', '2025-05-25 13:00:00', '2025-05-25 13:10:00', NULL),
(1, 5, 'paid', '2025-05-25 14:00:00', '2025-05-25 14:10:00', NULL),
(1, 2, 'paid', '2025-05-24 15:30:00', '2025-05-24 15:40:00', NULL),
(1, 7, 'paid', '2025-05-24 15:30:00', '2025-05-24 15:40:00', NULL),
(1, 8, 'cancelled', '2025-05-25 09:00:00', '2025-05-25 09:10:00', 2),
(1, 9, 'cancelled', '2025-05-25 18:00:00', '2025-05-25 18:10:00', 2);

-- ۱۵. پرداخت‌ها
INSERT INTO payments (user_id, reservation_id, amount, method, status, paid_at) VALUES 
(1, 1, 150000.00, 'card', 'success', '2025-05-25 10:05:00'),
(1, 2, 300000.00, 'wallet', 'success', '2025-05-25 11:04:00'),
(1, 3, 100000.00, 'card', 'success', '2025-05-25 12:02:00'),
(1, 4, 80000.00, 'card', 'success', '2025-05-25 13:08:00'),
(1, 5, 90000.00, 'crypto', 'success', '2025-05-25 14:03:00'),
(1, 6, 200000.00, 'card', 'success', '2025-05-24 15:05:00'),
(1, 7, 400000.00, 'card', 'success', '2025-05-24 15:35:00'),
(1, 8, 150000.00, 'card', 'failed', '2025-05-25 09:05:00');

-- ۱۶. گزارش‌ها
INSERT INTO reports (user_id, reservation_id, category, subject, description, status, created_at) VALUES 
(1, 1, 'Payment Issue', 'Double Charge', 'I was charged twice for the same reservation.', 'reviewed', '2025-05-25 10:15:00'),
(1, 2, 'Seat Issue', 'Incorrect Seat Number', 'The ticket has a different seat number.', 'pending', '2025-05-25 11:15:00'),
(1, 8, 'Cancellation Issue', 'Sudden Cancellation', 'My reservation was cancelled without warning.', 'pending', '2025-05-25 09:15:00'),
(1, 1, 'Payment Issue', 'Double Charge', 'Another ticket error reported.', 'pending', '2025-05-25 10:20:00');