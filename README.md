# Finance Dashboard Backend

A complete RESTful backend for a Finance Dashboard system with user management, financial records CRUD, role-based access control (RBAC), and aggregated analytics.

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express | Web framework |
| SQLite (better-sqlite3) | Database — zero config, file-based, real SQL |
| JWT (jsonwebtoken) | Stateless authentication |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| helmet | Security headers |
| express-rate-limit | Rate limiting |

## Architecture

```
Routes → Middleware (Auth + RBAC) → Controllers → Services → Database
```

- **Routes**: Define endpoints and wire middleware chains
- **Middleware**: JWT auth, role authorization, input validation, error handling
- **Controllers**: Handle HTTP request/response, delegate to services
- **Services**: Business logic and data access
- **Config**: Database setup and schema initialization

## Project Structure

```
├── src/
│   ├── config/
│   │   └── database.js          # SQLite connection + schema
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── rbac.js              # Role-based access control
│   │   ├── validate.js          # Validation error handler
│   │   └── errorHandler.js      # Global error handler
│   ├── routes/
│   │   ├── auth.routes.js       # Register / Login / Profile
│   │   ├── user.routes.js       # User management (admin)
│   │   ├── record.routes.js     # Financial records CRUD
│   │   └── dashboard.routes.js  # Analytics
│   ├── controllers/             # HTTP layer
│   ├── services/                # Business logic
│   ├── validators/              # Input validation rules
│   ├── utils/
│   │   └── apiResponse.js       # Standardized responses
│   └── app.js                   # Express app setup
├── server.js                    # Entry point
├── seed.js                      # Sample data seeder
├── .env                         # Environment config
└── package.json
```

## Setup & Run

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Default values work out of the box for development.

### 3. Seed Database (Optional)

```bash
npm run seed
```

This creates 3 test users and 21 sample financial records:

| User | Email | Password | Role |
|---|---|---|---|
| Admin | admin@finance.com | password123 | admin |
| Analyst | analyst@finance.com | password123 | analyst |
| Viewer | viewer@finance.com | password123 | viewer |

### 4. Start Server

```bash
npm start
```

Server runs at `http://localhost:3000`

## Access Control Matrix

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| View dashboard summary | ✅ | ✅ | ✅ |
| View financial records | ❌ | ✅ | ✅ |
| View analytics/insights | ❌ | ✅ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Update records | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/register    — Register new user (public)
POST /api/auth/login       — Login, get JWT (public)
GET  /api/auth/me          — Get current profile (authenticated)
```

### User Management (Admin only)
```
GET    /api/users           — List all users
GET    /api/users/:id       — Get user by ID
PATCH  /api/users/:id/role  — Update user role
PATCH  /api/users/:id/status — Activate/deactivate
DELETE /api/users/:id       — Delete user
```

### Financial Records
```
POST   /api/records         — Create record (admin)
GET    /api/records         — List with filters (analyst, admin)
GET    /api/records/:id     — Get single record (analyst, admin)
PUT    /api/records/:id     — Update record (admin)
DELETE /api/records/:id     — Soft-delete record (admin)
```

**Query params for GET /api/records:**
- `type` — `income` or `expense`
- `category` — e.g., `salary`, `food`, `transport`
- `startDate` — ISO date (e.g., `2026-01-01`)
- `endDate` — ISO date (e.g., `2026-03-31`)
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 100)

### Dashboard / Analytics
```
GET /api/dashboard/summary          — Totals (all authenticated)
GET /api/dashboard/category-totals  — Category breakdown (analyst, admin)
GET /api/dashboard/trends           — Monthly trends (analyst, admin)
GET /api/dashboard/recent-activity  — Latest records (analyst, admin)
```

## Example API Usage (curl)

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "secret123"}'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@finance.com", "password": "password123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": "...", "name": "Admin User", "role": "admin" }
  }
}
```

### 3. Get Profile

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create a Financial Record (Admin)

```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "amount": 2500,
    "type": "income",
    "category": "freelance",
    "date": "2026-04-01",
    "description": "Consulting project payment"
  }'
```

### 5. Get Records with Filters

```bash
curl "http://localhost:3000/api/records?type=expense&category=food&page=1&limit=10" \
  -H "Authorization: Bearer ANALYST_TOKEN"
```

### 6. Get Dashboard Summary

```bash
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer ANY_TOKEN"
```

### 7. Get Monthly Trends

```bash
curl "http://localhost:3000/api/dashboard/trends?year=2026" \
  -H "Authorization: Bearer ANALYST_TOKEN"
```

### 8. Update User Role (Admin)

```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"role": "analyst"}'
```

### 9. Test Access Denied (Viewer trying to create)

```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VIEWER_TOKEN" \
  -d '{"amount": 100, "type": "income", "category": "salary", "date": "2026-04-01"}'
```

**Response:** `403 Forbidden — Access denied`

## Engineering Approach & Design Decisions

This backend was built with a core philosophy: **Structure and clarity over unnecessary complexity.**

1. **Architecture & Separation of Concerns**: 
   The app follows a strict `Route → Middleware → Controller → Service → DB` flow. Controllers only handle HTTP concerns (req/res), while Services encapsulate all business logic. This makes the codebase highly testable, readable, and easy to extend.

2. **Why SQLite? (Valuing Practicality)**: 
   For an assessment/MVP, introducing a separate MongoDB or PostgreSQL instance adds deployment friction and local setup overhead. SQLite provides zero-config file-based storage while still allowing powerful, real SQL aggregation queries (like grouping monthly trends via `strftime`), proving relational database competency without the bloated setup.

3. **Access Control (RBAC) Strategy**: 
   Instead of scattering `if (user.role !== 'admin')` checks inside business logic, RBAC is handled as a declarative middleware factory (`authorize('admin', 'analyst')`). This keeps routes self-documenting and strictly enforces security at the boundary layer.

4. **Defensive Programming & Validation**: 
   All incoming payloads are validated using `express-validator` before reaching the controllers. If validation fails, a generic validation middleware catches it and returns a standardized `400 Bad Request`. A global error handler catches any database constraints or unhandled exceptions, ensuring the server never crashes and always returns structured JSON.

5. **Soft Deletes for Financial Data**: 
   In FinTech systems, audit trails are critical. Financial records use a `deleted_at` timestamp rather than a destructive `DELETE` operation, ensuring historical stability.

6. **Standardized API Responses**: 
   Every endpoint across the application returns a predictable `{ success, message, data (or errors) }` object. This creates a reliable contract for any frontend consuming this API.

## Valid Categories

`salary`, `freelance`, `investment`, `rental`, `food`, `transport`, `utilities`, `entertainment`, `healthcare`, `education`, `shopping`, `travel`, `other`
