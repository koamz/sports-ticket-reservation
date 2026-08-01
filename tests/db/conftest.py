import os
import pytest
import psycopg2

# مشخصات اتصال به دیتابیس تست (منطبق بر docker-compose)
DB_DSN = "dbname=sports_ticket_db user=test_user password=test_password host=localhost port=5432"

def run_sql_file(cursor, file_path):
    """تابع کمکی برای خواندن و اجرای فایل‌های SQL بزرگ"""
    with open(file_path, 'r', encoding='utf-8') as f:
        sql = f.read()
        cursor.execute(sql)

@pytest.fixture(scope="session")
def db_connection():
    """برقراری اتصال سراسری به دیتابیس تست"""
    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = True
    yield conn
    conn.close()

@pytest.fixture(scope="session", autouse=True)
def setup_database(db_connection):
    """مقداردهی اولیه ساختار جداول، پروسجرها و داده‌های تست"""
    cursor = db_connection.cursor()
    
    # آدرس فایل‌ها بر اساس ساختار درختی پروژه
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    schema_path = os.path.join(base_dir, "database/migrations/01_init_schema.sql")
    seed_path = os.path.join(base_dir, "database/seeds/02_seed_data.sql")
    procedures_path = os.path.join(base_dir, "database/procedures/stored_procedures.sql")

    # پاک‌سازی دیتابیس در صورت وجود جداول قبلی
    cursor.execute("""
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
    """)

    # ۱. اجرای ساختار جداول (DDL)
    run_sql_file(cursor, schema_path)
    
    # ۲. اجرای توابع و پروسجرها
    run_sql_file(cursor, procedures_path)
    
    # ۳. درج داده‌های تستی (Seed Data)
    run_sql_file(cursor, seed_path)
    
    cursor.close()