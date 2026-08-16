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

```directory
sports-ticket-reservation
├── README.md                                             # Main project documentation and run guide
├── backend                                               # Server-side application directory (Node.js/Express)
│   ├── Dockerfile                                        # Multi-stage production container build instructions
│   ├── package-lock.json                                 # Locked npm dependency tree for backend
│   ├── package.json                                      # Node.js dependencies, scripts, and Jest configurations
│   ├── src                                               # Main backend source code
│   │   ├── app.js                                        # Express application configuration & static client hosting
│   │   ├── config                                        # Database, cache, and search engine connection drivers
│   │   │   ├── db.js                                     # PostgreSQL raw connection pool instance
│   │   │   ├── elasticsearch.js                          # Elasticsearch client instance & configuration
│   │   │   └── redis.js                                  # Redis cache & session client connection
│   │   ├── controllers                                   # HTTP request handlers and JSON response dispatchers
│   │   │   ├── reportController.js                       # Handlers for issue reporting and admin review
│   │   │   ├── reservationController.js                  # Handlers for ticket reservation, payment, and cancellation
│   │   │   ├── ticketController.js                       # Handlers for ticket search and detail fetching
│   │   │   └── userController.js                         # Handlers for OTP auth, registration, and user profiles
│   │   ├── middleware                                    # Custom Express security middlewares
│   │   │   └── auth.js                                   # JWT authentication guard and role-based access controller
│   │   ├── models                                        # Domain models and input validation schemas (No ORM)
│   │   │   ├── Reservation.js                            # Reservation domain model and state validator
│   │   │   ├── Ticket.js                                 # Ticket domain model and availability checker
│   │   │   └── User.js                                   # User domain model and signup input validation
│   │   ├── repositories                                  # Parameterized raw SQL query execution layer
│   │   │   ├── reportRepository.js                       # Raw SQL queries for issue reports and admin oversight
│   │   │   ├── reservationRepository.js                  # Raw SQL transactions for reservations, payments, and refunds
│   │   │   ├── ticketRepository.js                       # Raw SQL queries for ticket catalog and sport details
│   │   │   └── userRepository.js                         # Raw SQL queries for user authentication and profiles
│   │   ├── routes                                        # API route declarations
│   │   │   └── api.js                                    # Consolidated RESTful API routes
│   │   ├── server.js                                     # Application entry point & automated reservation cleanup scheduler
│   │   └── services                                      # Business logic, caching layer, and search orchestrators
│   │       ├── elasticsearchService.js                   # Elasticsearch index management, live synchronization, and autocomplete
│   │       ├── reportService.js                          # Business logic for issue submission and processing
│   │       ├── reservationService.js                     # Reservation timeout locks, payments, and cancellation penalties
│   │       ├── ticketService.js                          # Ticket search aggregation and Redis cache invalidation
│   │       └── userService.js                            # OTP generation, verification, and user profile management
│   └── tests                                             # Backend automated testing suite (Jest)
│       ├── integration                                   # HTTP API end-to-end integration tests
│       │   ├── api.test.js                               # Integration tests for endpoints and security guards
│       │   └── verification.test.js                      # Rigorous sports ticketing bug verification suite
│       └── unit                                          # Isolated business logic unit tests
│           ├── elasticsearchService.test.js              # Unit tests for Elasticsearch query builders & analyzers
│           ├── reservationService.test.js                # Unit tests for cancellation penalty calculation rules
│           └── ticketService.test.js                     # Unit tests for Redis cache hit/miss behaviors
├── database                                              # Relational database resources and scripts
│   ├── erd                                               # Entity Relationship Diagram (ERD) assets
│   │   ├── ER_Diagram.drawio                             # Editable source diagram in Draw.io format
│   │   └── ER_Diagram.png                                # Rendered physical database schema diagram image
│   ├── migrations                                        # Database migration scripts (DDL)
│   │   └── 01_init_schema.sql                            # PostgreSQL physical schema creation script with constraints
│   ├── procedures                                        # Database stored routines (PL/pgSQL)
│   │   └── stored_procedures.sql                         # 8 PL/pgSQL stored procedures for analytical tasks
│   ├── queries                                           # Analytical and informational SQL queries
│   │   ├── analytical_queries.sql                        # 22 required analytical SQL queries
│   │   └── analytical_queries_optimized.sql              # Query-optimized analytical SQL queries with index hints
│   └── seeds                                             # Sample dataset scripts (DML)
│       └── 02_seed_data.sql                              # Initial mock dataset (10+ records per table)
├── docker-compose.yml                                    # Multi-container orchestration (PostgreSQL, Redis, Elasticsearch, Backend)
├── docs                                                  # Academic reports and requirement specifications
│   ├── phase1-report.md                                  # Phase 1 delivery report (ERD & Database design)
│   ├── project_report.md                                 # Comprehensive dynamic final project report (Markdown format)
│   ├── project_requirements.md                           # Complete system requirements and professor's specification
│   └── tables_visual.drawio                              # Draw.io diagram visually mapping normalized physical tables
├── frontend                                              # Client-side web application implementations
│   ├── index.html                                        # Lightweight standalone single-page web client (Tailwind CSS)
│   └── ticket-app                                        # Modern single-page web application (React + TypeScript + Vite)
│       ├── README.md                                     # Frontend application documentation and setup guide
│       ├── index.html                                    # Vite HTML entry point for the React application
│       ├── package-lock.json                             # Locked npm dependency tree for frontend
│       ├── package.json                                  # React dependencies, scripts, and build tools
│       ├── public                                        # Static public assets
│       │   ├── favicon.svg                               # Website vector favicon
│       │   └── icons.svg                                 # Sprite SVG icons
│       ├── src                                           # React application source code
│       │   ├── App.css                                   # Global custom stylesheet
│       │   ├── App.tsx                                   # Main root React component layout
│       │   ├── api                                       # API client integrations
│       │   │   └── client.ts                             # API client wrapper for backend endpoints
│       │   ├── assets                                    # Static graphics and vector assets
│       │   │   ├── hero.png                              # Landing hero banner image
│       │   │   ├── react.svg                             # React vector logo
│       │   │   └── vite.svg                              # Vite vector logo
│       │   ├── components                                # Modular UI React components
│       │   │   ├── AuthModal.tsx                         # OTP authentication and registration modal dialog
│       │   │   ├── BookingsTable.tsx                     # User booking history and cancellation control table
│       │   │   ├── Dashboard.tsx                         # User dashboard view displaying active bookings
│       │   │   ├── Header.tsx                            # Application header navigation bar
│       │   │   ├── Hero.tsx                              # Hero banner section
│       │   │   ├── SearchFilters.tsx                     # Search bar component with live Elasticsearch autocomplete
│       │   │   ├── TicketCard.tsx                        # Individual ticket card displaying match info & pricing
│       │   │   └── TicketsGrid.tsx                       # Grid component displaying available tickets
│       │   ├── hooks                                     # Custom React hooks for state management
│       │   │   ├── useAuth.ts                            # Hook for managing authentication state and token storage
│       │   │   ├── useBookings.ts                        # Hook for fetching and cancelling user reservations
│       │   │   └── useTickets.ts                         # Hook for fetching and searching tickets via Elasticsearch
│       │   ├── index.css                                 # Tailwind CSS styles and custom font configurations
│       │   ├── main.tsx                                  # React DOM bootstrap and rendering entry point
│       │   └── types                                     # TypeScript interface and type definitions
│       │       └── index.ts                              # Centralized domain types (Ticket, User, Reservation, etc.)
│       ├── tsconfig.app.json                             # TypeScript compiler configuration for application code
│       ├── tsconfig.json                                 # Root TypeScript configuration
│       ├── tsconfig.node.json                            # TypeScript compiler configuration for Vite Node environment
│       └── vite.config.ts                                # Vite bundler configuration and dev-server proxy settings
├── openapi.yaml                                          # Complete OpenAPI 3.0 (Swagger) specification for all API endpoints
└── tests                                                 # Python database verification suite
    ├── db                                                # Database testing files
    │   ├── conftest.py                                   # Pytest fixtures and database connection hooks
    │   └── test_database.py                              # 33 database integration test cases (Constraints, Queries, SPs)
    └── requirements.txt                                  # Python dependencies for running database test suite
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