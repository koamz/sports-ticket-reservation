erDiagram
    PROVINCE {
        int id PK
        string name UK
    }
    CITY {
        int id PK
        int province_id FK
        string name
    }
    ROLE {
        int id PK
        string name UK
    }
    USER {
        int id PK
        int role_id FK
        int city_id FK
        string first_name
        string last_name
        string email UK
        string phone UK
        string password_hash
        string status "active / inactive / suspended"
        timestamp created_at
    }
    VENUE {
        int id PK
        int city_id FK
        string name
        string address
        int capacity
    }
    SPORT {
        int id PK
        string name UK
    }
    TEAM {
        int id PK
        int sport_id FK
        string name
    }
    MATCH {
        int id PK
        int sport_id FK
        int venue_id FK
        int home_team_id FK
        int away_team_id FK
        timestamp match_time
    }
    TICKET_CATEGORY {
        int id PK
        string name UK
    }
    TICKET {
        int id PK
        int match_id FK
        int category_id FK
        decimal price
        int total_capacity
        int remaining_capacity
        string status "available / sold_out"
    }
    FOOTBALL_DETAILS {
        int id PK
        int ticket_id FK, UK
        string league_name
        string stadium_name
        string section_name
        string row_number
        string seat_number
        string facilities
    }
    VOLLEYBALL_DETAILS {
        int id PK
        int ticket_id FK, UK
        string league_name
        string hall_name
        string section_number
        string row_number
        string seat_number
        string facilities
    }
    BASKETBALL_DETAILS {
        int id PK
        int ticket_id FK, UK
        string league_name
        string hall_name
        string section_number
        string row_number
        string seat_number
        string facilities
    }
    RESERVATION {
        int id PK
        int user_id FK
        int ticket_id FK, UK
        string status "pending / reserved / paid / cancelled / expired"
        timestamp reserved_at
        timestamp expires_at
        int cancelled_by FK "Support User ID (nullable)"
    }
    PAYMENT {
        int id PK
        int user_id FK
        int reservation_id FK, UK
        decimal amount
        string method "card / wallet / crypto"
        string status "success / failed / pending"
        timestamp paid_at
    }
    REPORT {
        int id PK
        int user_id FK
        int reservation_id FK
        string category
        string subject
        string description
        string status "pending / reviewed"
        timestamp created_at
    }

    PROVINCE ||--o{ CITY : "province_id"
    CITY ||--o{ USER : "city_id"
    CITY ||--o{ VENUE : "city_id"
    ROLE ||--o{ USER : "role_id"
    VENUE ||--o{ MATCH : "venue_id"
    SPORT ||--o{ TEAM : "sport_id"
    SPORT ||--o{ MATCH : "sport_id"
    TEAM ||--o{ MATCH : "home_team_id"
    TEAM ||--o{ MATCH : "away_team_id"
    MATCH ||--o{ TICKET : "match_id"
    TICKET_CATEGORY ||--o{ TICKET : "category_id"
    USER ||--o{ RESERVATION : "user_id"
    TICKET ||--|| RESERVATION : "ticket_id"
    USER ||--o{ RESERVATION : "cancelled_by"
    USER ||--o{ PAYMENT : "user_id"
    RESERVATION ||--|o PAYMENT : "reservation_id"
    USER ||--o{ REPORT : "user_id"
    RESERVATION ||--o{ REPORT : "reservation_id"
    
    TICKET ||--o| FOOTBALL_DETAILS : "ticket_id"
    TICKET ||--o| VOLLEYBALL_DETAILS : "ticket_id"
    TICKET ||--o| BASKETBALL_DETAILS : "ticket_id"