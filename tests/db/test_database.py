import pytest
from datetime import datetime, timedelta
from psycopg2.errors import CheckViolation, ForeignKeyViolation, UniqueViolation

# ==========================================
# گروه اول: تست‌های صحت ساختار و روابط (DDL)
# ==========================================

def test_tables_created(db_connection):
    """۱. بررسی اینکه تمامی ۱۶ جدول اصلی پایگاه داده به درستی ساخته شده‌اند"""
    cursor = db_connection.cursor()
    tables = [
        'provinces', 'cities', 'roles', 'users', 'venues', 'sports', 'teams', 
        'matches', 'ticket_categories', 'tickets', 'football_details', 
        'volleyball_details', 'basketball_details', 'reservations', 'payments', 'reports'
    ]
    for table in tables:
        cursor.execute(f"SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '{table}');")
        assert cursor.fetchone()[0] is True, f"Table {table} does not exist."
    cursor.close()


# ==========================================
# گروه دوم: تست‌های قیود سخت‌گیرانه دیتابیس (Constraints)
# ==========================================

def test_negative_ticket_price_constraint(db_connection):
    """۲. بررسی قید CHECK: قیمت بلیط نمی‌تواند منفی باشد"""
    cursor = db_connection.cursor()
    with pytest.raises(CheckViolation):
        cursor.execute("""
            INSERT INTO tickets (match_id, category_id, price, total_capacity, remaining_capacity) 
            VALUES (1, 1, -500.00, 100, 100);
        """)
    db_connection.rollback()
    cursor.close()

def test_invalid_email_format_constraint(db_connection):
    """۳. بررسی قید CHECK: ساختار ایمیل کاربر باید معتبر باشد (Regex)"""
    cursor = db_connection.cursor()
    with pytest.raises(CheckViolation):
        cursor.execute("""
            INSERT INTO users (role_id, city_id, first_name, last_name, email, phone, password_hash) 
            VALUES (1, 1, 'John', 'Doe', 'invalid_email_at_domain_dot_com', '+989129999911', 'hash');
        """)
    db_connection.rollback()
    cursor.close()

def test_invalid_phone_format_constraint(db_connection):
    """۴. بررسی قید CHECK: ساختار شماره تماس کاربر باید معتبر باشد (عددی و بین ۱۰ تا ۱۵ رقم)"""
    cursor = db_connection.cursor()
    with pytest.raises(CheckViolation):
        cursor.execute("""
            INSERT INTO users (role_id, city_id, first_name, last_name, email, phone, password_hash) 
            VALUES (1, 1, 'John', 'Doe', 'john@gmail.com', 'abc123456789', 'hash');
        """)
    db_connection.rollback()
    cursor.close()

def test_ticket_capacity_bounds_constraint(db_connection):
    """۵. بررسی قید CHECK: ظرفیت باقی‌مانده بلیط نمی‌تواند از ظرفیت کل بیشتر باشد"""
    cursor = db_connection.cursor()
    with pytest.raises(CheckViolation):
        cursor.execute("""
            INSERT INTO tickets (match_id, category_id, price, total_capacity, remaining_capacity) 
            VALUES (1, 1, 150000.00, 50, 60); -- ظرفیت باقی‌مانده ۶۰ از ۵۰ غیرمجاز است
        """)
    db_connection.rollback()
    cursor.close()

def test_match_teams_must_be_distinct_constraint(db_connection):
    """۶. بررسی قید CHECK: تیم میزبان و میهمان در یک مسابقه نمی‌توانند یکسان باشند"""
    cursor = db_connection.cursor()
    with pytest.raises(CheckViolation):
        cursor.execute("""
            INSERT INTO matches (sport_id, venue_id, home_team_id, away_team_id, match_time) 
            VALUES (1, 1, 1, 1, '2025-06-10 18:00:00'); -- تیم ۱ با خودش نمی‌تواند بازی کند
        """)
    db_connection.rollback()
    cursor.close()

def test_reservation_date_logical_constraint(db_connection):
    """۷. بررسی قید CHECK: زمان انقضای رزرو نمی‌تواند قبل از زمان شروع رزرو باشد"""
    cursor = db_connection.cursor()
    now = datetime.now()
    past = now - timedelta(minutes=10)
    with pytest.raises(CheckViolation):
        cursor.execute("""
            INSERT INTO reservations (user_id, ticket_id, status, reserved_at, expires_at) 
            VALUES (1, 10, 'pending', %s, %s);
        """, (now, past))
    db_connection.rollback()
    cursor.close()

def test_invalid_payment_method_constraint(db_connection):
    """۸. بررسی قید CHECK: روش پرداخت فقط باید شامل موارد مجاز (card, wallet, crypto) باشد"""
    cursor = db_connection.cursor()
    with pytest.raises(CheckViolation):
        cursor.execute("""
            INSERT INTO payments (user_id, reservation_id, amount, method, status) 
            VALUES (1, 1, 150000.00, 'paypal', 'pending'); -- روش paypal غیرمجاز است
        """)
    db_connection.rollback()
    cursor.close()


# ==========================================
# گروه سوم: تست‌های رفتار یکپارچگی کلید خارجی (Integrity)
# ==========================================

def test_unique_seat_reservation_conflict(db_connection):
    """۹. بررسی قید UNIQUE رزرو: یک بلیط را نمی‌توان به طور همزمان برای دو کاربر متمایز رزرو کرد"""
    cursor = db_connection.cursor()
    with pytest.raises(UniqueViolation):
        cursor.execute("""
            INSERT INTO reservations (user_id, ticket_id, status, expires_at) 
            VALUES (2, 1, 'pending', NOW() + INTERVAL '10 minutes'); -- بلیط ۱ قبلاً توسط علی رزرو شده
        """)
    db_connection.rollback()
    cursor.close()

def test_foreign_key_violation_on_delete_restrict(db_connection):
    """۱۰. بررسی یکپارچگی ارجاعی: عدم امکان حذف فیزیکی شهری که برای آن ورزشگاه ثبت شده است (Restrict)"""
    cursor = db_connection.cursor()
    with pytest.raises(ForeignKeyViolation):
        cursor.execute("DELETE FROM cities WHERE id = 1;") # شهر ۱ دارای ورزشگاه آزادی است
    db_connection.rollback()
    cursor.close()


# ==========================================
# گروه چهارم: تست‌های صحت‌سنجی پروسجرها و توابع دیتابیس (Stored Procedures)
# ==========================================

def test_sp_get_user_purchased_tickets(db_connection):
    """۱۱. بررسی پروسجر ۱: استخراج دقیق بلیط‌های خریداری شده بر اساس ایمیل یا تلفن"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_user_purchased_tickets('ali@gmail.com');")
    results = cursor.fetchall()
    
    assert len(results) == 2
    away_teams = {row[2] for row in results}
    assert 'Esteghlal' in away_teams
    assert 'Sepahan' in away_teams
    cursor.close()

def test_sp_get_cancelled_users_by_support(db_connection):
    """۱۲. بررسی پروسجر ۲: لیست کردن کاربرانی که رزرو آن‌ها توسط یک پشتیبان مشخص لغو شده است"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_cancelled_users_by_support('saeed@gmail.com');")
    results = cursor.fetchall()
    
    assert len(results) > 0
    # پشتیبان سعید (آی‌دی ۷) رزرو کاربر امیر تاجی را لغو کرده است
    buyer_last_names = [row[1] for row in results]
    assert 'Taji' in buyer_last_names
    cursor.close()

def test_sp_get_tickets_purchased_in_city(db_connection):
    """۱۳. بررسی پروسجر ۳: دریافت بلیط‌های به فروش رفته در یک شهر خاص"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_tickets_purchased_in_city('Tehran');")
    results = cursor.fetchall()
    
    assert len(results) > 0
    # بررسی صحت ساختار داده‌های استخراج شده
    for row in results:
        assert row[3] in ['Azadi Stadium', 'Tehran 12000 Hall']
    cursor.close()

def test_sp_search_tickets(db_connection):
    """۱۴. بررسی پروسجر ۴: موتور جستجوی متنی بلیط‌ها بر اساس تیم‌ها، دسته‌بندی و تماشاگران"""
    cursor = db_connection.cursor()
    # جستجو بر اساس کلمه "Perspolis"
    cursor.execute("SELECT * FROM search_tickets('Perspolis');")
    results = cursor.fetchall()
    
    assert len(results) > 0
    for row in results:
        assert 'Perspolis' in row[2] # فیلد عنوان مسابقه باید حاوی پرسپولیس باشد
    cursor.close()

def test_sp_get_fellow_citizens(db_connection):
    """۱۵. بررسی پروسجر ۵: استخراج کاربران ساکن در شهر یکسان با یک کاربر مشخص"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_fellow_citizens('ali@gmail.com');")
    results = cursor.fetchall()
    
    assert len(results) > 0
    names = [row[0] for row in results]
    assert 'Reza' in names
    assert 'Ali' not in names # کاربر اصلی نباید در خروجی باشد
    cursor.close()

def test_sp_get_top_buyers_since(db_connection):
    """۱۶. بررسی پروسجر ۶: لیست کاربران با بیشترین خرید از یک تاریخ مشخص به بعد"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_top_buyers_since('2025-01-01 00:00:00', 3);")
    results = cursor.fetchall()
    
    assert len(results) <= 3
    # کاربر علی با ۲ خرید باید در صدر خروجی باشد
    assert results[0][1] == 'Ali'
    cursor.close()

def test_sp_get_cancelled_tickets_by_sport(db_connection):
    """۱۷. بررسی پروسجر ۷: استخراج بلیط‌های کنسل شده برای یک رشته ورزشی خاص"""
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM get_cancelled_tickets_by_sport('Volleyball');")
    results = cursor.fetchall()
    
    assert len(results) > 0
    # مسابقه والیبال کنسل شده مربوط به سایپا و کاله بوده است
    assert 'Saipa' in results[0][1]
    cursor.close()