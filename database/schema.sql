CREATE DATABASE IF NOT EXISTS sports_ticket_db;

USE sports_ticket_db;

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE cities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,

    role_id INT NOT NULL,
    city_id INT,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    status ENUM('active', 'inactive')
    DEFAULT 'active',

    created_at DATETIME
    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE sports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE teams (
    id INT PRIMARY KEY AUTO_INCREMENT,

    sport_id INT NOT NULL,

    name VARCHAR(100) NOT NULL,

    FOREIGN KEY (sport_id) REFERENCES sports(id)
);

CREATE TABLE venues (
    id INT PRIMARY KEY AUTO_INCREMENT,

    city_id INT NOT NULL,

    name VARCHAR(150) NOT NULL,
    address TEXT,

    capacity INT CHECK (capacity > 0),

    FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE matches (
    id INT PRIMARY KEY AUTO_INCREMENT,

    sport_id INT NOT NULL,
    venue_id INT NOT NULL,

    home_team_id INT NOT NULL,
    away_team_id INT NOT NULL,

    match_time DATETIME NOT NULL,

    FOREIGN KEY (sport_id) REFERENCES sports(id),
    FOREIGN KEY (venue_id) REFERENCES venues(id),
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id),

    CHECK (home_team_id <> away_team_id)
);

CREATE TABLE ticket_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,

    match_id INT NOT NULL,
    category_id INT NOT NULL,

    price DECIMAL(12,2) NOT NULL
    CHECK (price >= 0),

    total_capacity INT NOT NULL
    CHECK (total_capacity > 0),

    remaining_capacity INT NOT NULL
    CHECK (remaining_capacity >= 0),

    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (category_id) REFERENCES ticket_categories(id)
);

CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT NOT NULL,
    ticket_id INT NOT NULL,

    status ENUM('reserved', 'paid', 'cancelled', 'expired')
    DEFAULT 'reserved',

    reserved_at DATETIME
    DEFAULT CURRENT_TIMESTAMP,

    expires_at DATETIME NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),

    CHECK (expires_at > reserved_at)
);

CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT NOT NULL,
    reservation_id INT NOT NULL UNIQUE,

    amount DECIMAL(12,2) NOT NULL
    CHECK (amount >= 0),

    method ENUM('card', 'wallet', 'crypto')
    NOT NULL,

    status ENUM('success', 'failed', 'pending')
    DEFAULT 'pending',

    paid_at DATETIME,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT NOT NULL,
    reservation_id INT,

    subject VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    status ENUM('pending', 'reviewed')
    DEFAULT 'pending',

    created_at DATETIME
    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE football_details (
    id INT PRIMARY KEY AUTO_INCREMENT,

    ticket_id INT NOT NULL UNIQUE,

    league_name VARCHAR(100),
    stadium_name VARCHAR(100),

    section_number VARCHAR(50),
    row_number VARCHAR(50),
    seat_number VARCHAR(50),

    facilities TEXT,

    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE TABLE volleyball_details (
    id INT PRIMARY KEY AUTO_INCREMENT,

    ticket_id INT NOT NULL UNIQUE,

    league_name VARCHAR(100),
    hall_name VARCHAR(100),

    section_number VARCHAR(50),
    row_number VARCHAR(50),
    seat_number VARCHAR(50),

    facilities TEXT,

    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE TABLE basketball_details (
    id INT PRIMARY KEY AUTO_INCREMENT,

    ticket_id INT NOT NULL UNIQUE,

    league_name VARCHAR(100),
    hall_name VARCHAR(100),

    section_number VARCHAR(50),
    row_number VARCHAR(50),
    seat_number VARCHAR(50),

    facilities TEXT,

    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_matches_time ON matches(match_time);
CREATE INDEX idx_tickets_price ON tickets(price);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_payments_status ON payments(status);