# Sports Ticketing & Reservation Platform
**Database Course Final Project**  
**Instructor:** Dr. Pishgoo  
**Institution:** K. N. Toosi University of Technology - Faculty of Computer Engineering  
**Academic Semester:** Spring Semester 1404-05  

---

> ## Team Members
> * **Sarina NaserMoghadasi** (Student ID: `40222083`)  
> * **Kosar Amouzgar** (Student ID: `40215133`) 
> * **Ali KashiPazha** (Student ID: `40224641`)  

---

## 1. Project Overview
This platform is a comprehensive, middleman-free sports ticket reservation and purchasing system. The project utilizes a hybrid database architecture:
* **Relational Database (PostgreSQL):** Manages structured data, relational integrity (FKs, PKs), transactions (ACID), and enforces normalization up to the **3NF** level.
* **In-Memory Cache (Redis):** Handles transient state management including One-Time Passwords (OTP) with active TTLs, robust ticket lock mechanisms (10-minute reservation locks), and dynamic cache invalidation.
* **Distributed Search Engine (Elasticsearch):** Powers high-speed, fuzzy text queries and matches multilingual terms using custom analyzers for live autocompletion.

---

## 2. Repository Directory Tree
The repository structure is organized in a highly modular, decoupled fashion:

```text
sports-ticket-reservation
├── README.md                     # Project main documentation
├── docker-compose.yml            # Multi-container orchestration script
│
├── backend/                      # Server-side Application (Node.js)
│   ├── Dockerfile                # Docker build instructions for Backend
│   ├── package.json              # Node.js dependencies and scripts
│   ├── src/
│   │   ├── app.js                # Express app config & static client serving
│   │   ├── server.js             # Entry point & automated reservation cleanup job
│   │   ├── config/               # Raw Database & caching connection drivers
│   │   ├── controllers/          # HTTP request/response handlers (JSON API)
│   │   ├── middleware/           # Security guards (JWT & Role controllers)
│   │   ├── models/               # Domain validation schemas & entities
│   │   ├── repositories/         # Parameterized raw SQL queries (No ORM)
│   │   ├── routes/               # REST API route declarations
│   │   └── services/             # Core business logic & Redis cache invalidations
│   └── tests/                    # Server testing suite (Jest)
│       ├── integration/          # HTTP API integration tests
│       └── unit/                 # Isolated business logic unit tests
│
├── database/                     # Relational Database Scripts
│   ├── erd/                      # Entity Relationship Diagram (ERD) source & image
│   ├── migrations/               # Physical table creation DDL
│   ├── procedures/               # PostgreSQL PL/pgSQL Stored Procedures
│   ├── queries/                  # 22 complex analytical SQL queries
│   └── seeds/                    # Seed mock dataset for testing (10+ records per table)
│
├── docs/                         # Dynamic progress reports
│   ├── project_report.md
│   └── project_report.docx
│
├── frontend/                     # Client Application (Single Page Application)
│   └── index.html                # Responsive web client UI (Tailwind CSS)
│
└── tests/                        # Database verification suite (Python)
    ├── db/
    │   ├── conftest.py           # Database transaction testing fixtures
    │   └── test_database.py      # 33 rigorous raw SQL testing cases
    └── requirements.txt          # Python testing dependencies
```

---

## 3. System Prerequisites
Ensure the following tools are installed on your environment before proceeding:
* **Docker Desktop** (with Docker Compose support)
* **Node.js** (v18 or higher - only required for running the backend locally without Docker)
* **Python** (v3.10 or higher - only required for running the local Python database tests)

---

## 4. Run & Deploy with Docker (Recommended)

The entire system is orchestrated via Docker Compose. Follow these steps to build and launch all services simultaneously:

### Step 1: Verify PostgreSQL Initialization Mounts
Ensure the `volumes` section of the `postgres_db` service in your `docker-compose.yml` mounts all three files in the correct sequence. The folder initialization is alphanumeric, so `stored_procedures.sql` will naturally run after migrations and seed data:

```yaml
    volumes:
      - pgdata_production:/var/lib/postgresql/data
      - ./database/migrations/01_init_schema.sql:/docker-entrypoint-initdb.d/01_init_schema.sql
      - ./database/seeds/02_seed_data.sql:/docker-entrypoint-initdb.d/02_seed_data.sql
      - ./database/procedures/stored_procedures.sql:/docker-entrypoint-initdb.d/stored_procedures.sql # Runs after seeds
```

### Step 2: Build and Run Containers
Open a terminal in the project root directory and execute:

```bash
docker-compose up --build
```

This command automatically:
1. Downloads the necessary base alpine images for PostgreSQL, Redis, and Elasticsearch.
2. Initializes the database schema, loads the 10+ mock dataset, and compiles the stored procedures.
3. Configures the Elasticsearch index mappings, including analyzers for Persian and English.
4. Starts the Node.js backend server on port `3000`.

### Step 3: Database Administration & Visualization (Optional)
To visually inspect table states, execute raw SQL scripts, or oversee system relationships, you can access your preconfigured database manager panel (e.g., Adminer) by navigating to:
* **URL:** `http://localhost:8080`

When logging in, utilize the following parameters:
* **System:** `PostgreSQL`
* **Server:** `host.docker.internal`
* **Username:** `test_user`
* **Password:** `test_password`
* **Database:** `sports_ticket_db`

---

## 5. Interacting with the Web Client

You can interact with the client application using two distinct methods:

### Step 1: Accessing the UI
* **Method A (Developer Mode):**  
  Simply double-click the `frontend/index.html` file on your local machine to open it directly via the `file://` protocol. The client is pre-wired to send all AJAX requests to the explicit API address `http://localhost:3000/api`, ensuring complete functionality.
* **Method B (Production Mode):**  
  Open your web browser and navigate directly to `http://localhost:3000`. The Express server automatically serves the static frontend assets from the root.

### Step 2: Retrieving the OTP Code for Login (Testing Mode)
Since this is a simulated sandbox environment, the system does not connect to real SMS/Email gateways. Instead, you can retrieve the generated One-Time Passwords (OTP) using two simple methods:

* **Method A (Server Console Logs - Recommended):**  
  Open the terminal where your docker containers are running. Whenever you trigger an OTP request on the login page, the generated code is printed directly to the standard stdout server logs:
  ```text
  [OTP DISPATCH] SMS/Email sent to ali@gmail.com with code: 588181
  ```

* **Method B (Direct Redis Query):**  
  Since the OTP is stored in Redis with a 5-minute TTL, you can query the active code directly from your Redis cache container using your command-line interface:
  ```bash
  docker exec -it sports_ticket_redis redis-cli GET otp:ali@gmail.com
  ```

---

## 6. Running Verification Tests

The platform includes two testing suites designed to verify complete software integrity:

### A. Run 28 Backend, Redis & Elasticsearch Tests (Node.js)
Verifies routes, session guards, validation schemas, Redis caches, and Elasticsearch queries.
1. Navigate to the `backend` directory:
```bash
cd backend
```
2. Execute the test command:
```bash
npm run test
```

### B. Run 33 Database Constraints, Queries & Procedures Tests (Python)
Verifies physical database integrity, check constraints, cascading deletes, analytical queries, and compiled stored procedures.
1. Install testing dependencies in the root directory:
```bash
pip install -r tests/requirements.txt
```
2. Execute the pytest command:
```bash
pytest tests/
```

---

## 7. Web API Endpoints Directory

All API requests are stateless and communicate utilizing standard JSON Payloads.

| Function | Method | Endpoint | Authorization | Engine / Caching |
| :--- | :--- | :--- | :--- | :--- |
| Request Login OTP | `POST` | `/api/auth/otp/request` | Public | Redis (TTL: 300s) |
| Verify OTP & Login | `POST` | `/api/auth/otp/verify` | Public | Redis / JWT Generator |
| Register New User | `POST` | `/api/auth/signup` | Public | PostgreSQL (DQL Filter) |
| Fetch Cities & Venues | `GET` | `/api/common/cities-venues` | Public | PostgreSQL / Redis Cache |
| Advanced Ticket Search | `GET` | `/api/tickets/search` | Public | Elasticsearch / Redis Cache |
| Live Autocomplete Suggestions | `GET` | `/api/tickets/autocomplete` | Public | Elasticsearch Autocomplete |
| Fetch Ticket Details | `GET` | `/api/tickets/:id` | Public | PostgreSQL / Redis Cache |
| Fetch User Profile | `GET` | `/api/user/profile` | Visitor | PostgreSQL / Redis Cache |
| Update User Profile | `PUT` | `/api/user/profile` | Visitor | PostgreSQL / Cache Eviction |
| Reserve Seat Temporarily | `POST` | `/api/reservations/reserve` | Visitor | PostgreSQL (DML Update) / ES Sync |
| Confirm Payment & Finalize | `POST` | `/api/reservations/pay` | Visitor | PostgreSQL (Transaction) / ES Sync |
| Check Cancellation Penalty | `GET` | `/api/reservations/:id/penalty`| Visitor | PostgreSQL / Temporal Logic |
| Cancel Ticket & Refund | `POST` | `/api/reservations/cancel` | Visitor | PostgreSQL (Refund) / ES Sync |
| Submit Issue Report | `POST` | `/api/reports/submit` | Visitor | PostgreSQL (DQL Report) |
| Manage Active Bookings | `GET` | `/api/admin/reservations` | Support | PostgreSQL / Role Guard |
| Review Submitted Reports | `GET` | `/api/admin/reports` | Support | PostgreSQL / Role Guard |