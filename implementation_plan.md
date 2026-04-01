# Finance Dashboard Backend — Implementation Plan

## Problem Summary

Build a backend for a Finance Dashboard system where users interact with financial records based on roles. The system must store financial data, manage users and roles, enforce permissions, and provide summary-level analytics.

---

## Assumptions

1. **Authentication**: JWT-based auth will be implemented (optional enhancement, but essential for real RBAC enforcement).
2. **Database**: SQLite via `better-sqlite3` — zero external dependencies, file-based persistence, perfect for this scope. Provides real SQL for proper aggregation queries.
3. **Default Admin**: A seed admin user is created on first startup for bootstrapping.
4. **Single-tenant**: No multi-org/tenant isolation needed.
5. **Soft delete**: Records use a `deleted_at` field (optional enhancement, cleanly integrated).
6. **Pagination**: Implemented via `page` + `limit` query params with sensible defaults.
7. **Dates**: Stored as ISO 8601 strings; filtering uses date range queries.
8. **No file uploads**: Financial records are structured data only.

---

## Tech Stack Justification

| Choice | Why |
|---|---|
| **Node.js + Express** | Requested preference. Battle-tested, minimal boilerplate. |
| **SQLite (better-sqlite3)** | Zero config, file-based, real SQL for aggregation queries (SUM, GROUP BY, date functions). Synchronous API = simpler code. No external DB server needed. |
| **JWT (jsonwebtoken)** | Stateless auth, industry standard for RBAC. |
| **bcryptjs** | Password hashing — pure JS, no native deps. |
| **express-validator** | Declarative input validation, integrates cleanly with Express middleware. |
| **uuid** | Unique IDs for records and users. |

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────┐
│                   Express App                     │
├──────────────────────────────────────────────────┤
│  Routes → Middleware (Auth + RBAC) → Controllers  │
│                     ↓                             │
│               Service Layer                       │
│                     ↓                             │
│            Data Access (Models/DB)                │
│                     ↓                             │
│              SQLite Database                      │
└──────────────────────────────────────────────────┘
```

**Separation of Concerns:**
- **Routes**: Define endpoints and wire middleware
- **Middleware**: Auth (JWT verification), RBAC (role checks), validation
- **Controllers**: Handle HTTP request/response, delegate to services
- **Services**: Business logic, orchestration
- **Models/DB**: Data access, queries, schema

---

## Folder Structure

```
finance-dashboard-backend/
├── src/
│   ├── config/
│   │   └── database.js          # SQLite connection + schema init
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   ├── rbac.js              # Role-based access control middleware
│   │   ├── validate.js          # Validation error handler
│   │   └── errorHandler.js      # Global error handler
│   ├── routes/
│   │   ├── auth.routes.js       # Login/register
│   │   ├── user.routes.js       # User management (admin)
│   │   ├── record.routes.js     # Financial records CRUD
│   │   └── dashboard.routes.js  # Analytics/summary
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── record.controller.js
│   │   └── dashboard.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── record.service.js
│   │   └── dashboard.service.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   └── record.validator.js
│   ├── utils/
│   │   └── apiResponse.js       # Standardized response helpers
│   └── app.js                   # Express app setup
├── database/                    # SQLite file stored here
├── seed.js                      # Seed script for default admin
├── server.js                    # Entry point
├── package.json
├── .env.example
└── README.md
```

---

## Data Models / Schema

### Users Table
```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK(role IN ('viewer', 'analyst', 'admin')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Financial Records Table
```sql
CREATE TABLE financial_records (
  id          TEXT PRIMARY KEY,
  amount      REAL NOT NULL CHECK(amount >= 0),
  type        TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  category    TEXT NOT NULL,
  date        TEXT NOT NULL,
  description TEXT,
  created_by  TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT DEFAULT NULL
);
```

> [!NOTE]
> `deleted_at` enables soft delete — records are filtered out by default but can be restored.

---

## Access Control Design

### Role Permission Matrix

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| View dashboard summary | ✅ | ✅ | ✅ |
| View financial records | ❌ | ✅ | ✅ |
| View analytics/insights | ❌ | ✅ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Update records | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

### Implementation

**Middleware chain**: `authenticate → authorize(roles) → controller`

```js
// rbac.js
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
```

This is **clean, reusable, and declarative** — each route specifies exactly which roles can access it.

---

## API Design

### Auth Endpoints
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login, get JWT | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### User Management (Admin only)
| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| PATCH | `/api/users/:id/role` | Update user role | Admin |
| PATCH | `/api/users/:id/status` | Activate/deactivate user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Financial Records
| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| POST | `/api/records` | Create record | Admin |
| GET | `/api/records` | List records (with filters) | Analyst, Admin |
| GET | `/api/records/:id` | Get single record | Analyst, Admin |
| PUT | `/api/records/:id` | Update record | Admin |
| DELETE | `/api/records/:id` | Soft-delete record | Admin |

**Query filters for GET /api/records:**
- `?type=income|expense`
- `?category=salary`
- `?startDate=2026-01-01&endDate=2026-03-31`
- `?page=1&limit=20`

### Dashboard / Analytics
| Method | Endpoint | Purpose | Roles |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Income, expenses, net balance | All authenticated |
| GET | `/api/dashboard/category-totals` | Category-wise breakdown | Analyst, Admin |
| GET | `/api/dashboard/trends` | Monthly trends | Analyst, Admin |
| GET | `/api/dashboard/recent-activity` | Latest records | Analyst, Admin |

---

## Proposed Changes

### [NEW] Project Setup Files

#### [NEW] [package.json](file:///c:/Users/Lenovo/Finance%20Data%20Processing%20and%20Access%20Control%20Backend/package.json)
Dependencies: express, better-sqlite3, jsonwebtoken, bcryptjs, express-validator, uuid, dotenv, cors, helmet, express-rate-limit

#### [NEW] [.env.example](file:///c:/Users/Lenovo/Finance%20Data%20Processing%20and%20Access%20Control%20Backend/.env.example)
Environment variable template

#### [NEW] [server.js](file:///c:/Users/Lenovo/Finance%20Data%20Processing%20and%20Access%20Control%20Backend/server.js)
Entry point — starts Express server

#### [NEW] [seed.js](file:///c:/Users/Lenovo/Finance%20Data%20Processing%20and%20Access%20Control%20Backend/seed.js)
Seeds default admin user + sample financial records

#### [NEW] [README.md](file:///c:/Users/Lenovo/Finance%20Data%20Processing%20and%20Access%20Control%20Backend/README.md)
Setup instructions, API docs, example usage

---

### Config & Database

#### [NEW] [src/config/database.js](file:///c:/Users/Lenovo/Finance%20Data%20Processing%20and%20Access%20Control%20Backend/src/config/database.js)
SQLite initialization, table creation, WAL mode

---

### Middleware (4 files)

#### [NEW] src/middleware/auth.js
JWT verification, attaches `req.user`

#### [NEW] src/middleware/rbac.js
Role-based access control factory function

#### [NEW] src/middleware/validate.js
Express-validator error collector

#### [NEW] src/middleware/errorHandler.js
Global error handler with structured responses

---

### Routes, Controllers, Services (12 files)

One route + controller + service file for each domain: **auth**, **users**, **records**, **dashboard**

---

### Validators (3 files)

Validation rules for auth, user management, and record operations

---

### Utilities

#### [NEW] src/utils/apiResponse.js
Standardized `success()` and `error()` response helpers

---

## Verification Plan

### Automated Testing
1. Start the server and verify it boots without errors
2. Run seed script to populate test data
3. Test all API endpoints via curl commands covering:
   - Auth flow (register → login → get profile)
   - RBAC enforcement (viewer cannot create records, analyst can read but not write)
   - CRUD operations on financial records
   - Dashboard analytics accuracy
   - Validation error responses
   - Pagination and filtering

### Manual Verification
- Provide comprehensive curl examples in README for manual testing
- Include Postman-compatible examples

---

## Open Questions

> [!IMPORTANT]
> **Registration access**: Should user registration be open (anyone can register) or admin-only? My default plan is: open registration creates users as **Viewer** role, and only Admins can promote roles. Let me know if you prefer admin-only registration.

> [!NOTE]
> **Analytics scope**: The dashboard summary endpoint will show totals across ALL records (not per-user), which makes sense for a shared finance dashboard. Confirm if per-user filtering is also needed.
