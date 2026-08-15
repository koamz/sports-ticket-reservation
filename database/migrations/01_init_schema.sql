CREATE TABLE provinces (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(100) UNIQUE NOT NULL,
    name_fa VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    province_id INT REFERENCES provinces(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_fa VARCHAR(100) NOT NULL,
    UNIQUE (province_id, name_en),
    UNIQUE (province_id, name_fa)
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id) ON DELETE RESTRICT,
    city_id INT REFERENCES cities(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) UNIQUE CHECK (phone ~* '^\+?[0-9]{10,15}$'),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE RESTRICT,
    name_en VARCHAR(150) NOT NULL,
    name_fa VARCHAR(150) NOT NULL,
    address_en TEXT NOT NULL,
    address_fa TEXT NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE sports (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(50) UNIQUE NOT NULL,
    name_fa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    sport_id INT REFERENCES sports(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_fa VARCHAR(100) NOT NULL,
    UNIQUE (sport_id, name_en),
    UNIQUE (sport_id, name_fa)
);

CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    sport_id INT REFERENCES sports(id) ON DELETE CASCADE,
    venue_id INT REFERENCES venues(id) ON DELETE CASCADE,
    home_team_id INT REFERENCES teams(id) ON DELETE RESTRICT,
    away_team_id INT REFERENCES teams(id) ON DELETE RESTRICT,
    match_time TIMESTAMP NOT NULL,
    CONSTRAINT chk_teams CHECK (home_team_id <> away_team_id)
);

CREATE TABLE ticket_categories (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(50) UNIQUE NOT NULL,
    name_fa VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE,
    category_id INT REFERENCES ticket_categories(id) ON DELETE RESTRICT,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    total_capacity INT NOT NULL CHECK (total_capacity > 0),
    remaining_capacity INT NOT NULL CHECK (remaining_capacity >= 0 AND remaining_capacity <= total_capacity),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold_out'))
);

CREATE TABLE football_details (
    id SERIAL PRIMARY KEY,
    ticket_id INT UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    league_name VARCHAR(150) NOT NULL,
    stadium_name VARCHAR(150) NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    row_number VARCHAR(50) NOT NULL,
    seat_number VARCHAR(50) NOT NULL,
    facilities TEXT
);

CREATE TABLE volleyball_details (
    id SERIAL PRIMARY KEY,
    ticket_id INT UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    league_name VARCHAR(150) NOT NULL,
    hall_name VARCHAR(150) NOT NULL,
    section_number VARCHAR(100) NOT NULL,
    row_number VARCHAR(50) NOT NULL,
    seat_number VARCHAR(50) NOT NULL,
    facilities TEXT
);

CREATE TABLE basketball_details (
    id SERIAL PRIMARY KEY,
    ticket_id INT UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    league_name VARCHAR(150) NOT NULL,
    hall_name VARCHAR(150) NOT NULL,
    section_number VARCHAR(100) NOT NULL,
    row_number VARCHAR(50) NOT NULL,
    seat_number VARCHAR(50) NOT NULL,
    facilities TEXT
);

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ticket_id INT UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reserved', 'paid', 'cancelled', 'expired')),
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    cancelled_by INT REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_res_dates CHECK (expires_at >= reserved_at)
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    reservation_id INT UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    method VARCHAR(50) NOT NULL CHECK (method IN ('card', 'wallet', 'crypto')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending')),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    reservation_id INT REFERENCES reservations(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_matches_time ON matches(match_time);
CREATE INDEX idx_tickets_price ON tickets(price);
CREATE INDEX idx_tickets_match_new ON tickets(match_id);
CREATE INDEX idx_reservations_user_new ON reservations(user_id);
CREATE INDEX idx_payments_date_new ON payments(paid_at);
CREATE INDEX idx_payments_status ON payments(status);