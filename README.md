# Student Management System

A full-stack Student Management System built with React (Vite) on the frontend and Node.js/Express + PostgreSQL on the backend.

> **Status note:** This README reflects the project as built through the backend API and the dashboard (list/search/filter/pagination/delete). The Add/Edit student forms and the student detail page are scaffolded (routing works) but their full implementation, plus deployment instructions, are being completed in later steps. This document will be extended as those land.

---

## Technologies Used

**Frontend**
- React 19
- Vite
- React Router DOM
- Axios
- React Hook Form
- React Toastify
- Plain CSS (custom design system, no Tailwind/Bootstrap)

**Backend**
- Node.js
- Express.js
- Multer (photo uploads)
- express-validator
- PostgreSQL (via `pg`)
- dotenv
- cors

**Tooling**
- npm
- nodemon (backend dev auto-restart)
- Git

---

## Project Structure

```
student-management-system/
├── database.sql
├── server/
│   ├── config/           # PostgreSQL connection pool
│   ├── controllers/       # Route handler logic
│   ├── middleware/          # Validators, Multer config, error handler
│   ├── routes/                # Express routers
│   ├── utils/                   # Admission number generator
│   ├── uploads/                   # Uploaded student photos
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── client/
    └── src/
        ├── components/      # Reusable UI (Sidebar, Table, etc.)
        ├── pages/             # Route-level pages
        ├── layouts/             # AdminLayout
        ├── services/              # Axios instance + API calls
        ├── hooks/                   # useStudents, useStudentStats
        ├── styles/                    # Design tokens + global CSS
        ├── App.jsx
        └── main.jsx
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18 LTS or newer |
| npm | comes with Node |
| PostgreSQL | 14+ |
| Git | any recent version |

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd student-management-system
```

### 2. Database setup

Create the database and load the schema:

```bash
psql -U postgres -c "CREATE DATABASE student_management;"
psql -U postgres -d student_management -f database.sql
```

This creates the `students` and `activity_logs` tables, indexes, an auto-update trigger for `updated_at`, and inserts 5 sample students.

Verify it worked:
```bash
psql -U postgres -d student_management -c "SELECT * FROM students;"
```

### 3. Backend setup

```bash
cd server
npm install
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
```

Open `.env` and set your real PostgreSQL credentials (either `DATABASE_URL` or the individual `DB_*` fields):

```
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/student_management
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Run the backend:

```bash
npm run dev
```

You should see:
```
PostgreSQL connected. Server time: ...
Server running on http://localhost:5000
Health check: http://localhost:5000/api/health
```

### 4. Frontend setup

In a separate terminal:

```bash
cd client
npm install
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
```

`.env` should contain:
```
VITE_API_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```

Visit **http://localhost:5173** — you should see the dashboard with the 5 seeded students.

### 5. Running both together

Keep two terminals open:
- Terminal 1: `cd server && npm run dev` (API on port 5000)
- Terminal 2: `cd client && npm run dev` (UI on port 5173)

---

## API Documentation

Base URL: `http://localhost:5000/api`

### Health Check

```
GET /health
```
Returns `{ status: "ok", message, timestamp }`. No parameters.

### List Students

```
GET /students
```

Supports search, filtering, sorting, and server-side pagination via query parameters:

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Matches against name, admission number, or course |
| `course` | string | Filter by course (partial match) |
| `year` | number | Filter by exact year (1–6) |
| `gender` | string | Filter by `Male`, `Female`, or `Other` |
| `sortBy` | string | One of `name`, `admission_number`, `course`, `year`, `created_at` |
| `order` | string | `asc` or `desc` (default `desc`) |
| `page` | number | Page number, default `1` |
| `limit` | number | Results per page, default `10`, max `100` |

**Example:**
```
GET /students?search=Sharma&course=Computer%20Science&page=1&limit=10&sortBy=name&order=asc
```

**Response:**
```json
{
  "success": true,
  "data": [ { "id": 1, "admission_number": "ADM000001", "name": "...", "...": "..." } ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalRecords": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Get Single Student

```
GET /students/:id
```
Returns `{ success: true, data: { ...student } }`, or `404` if not found.

### Create Student

```
POST /students
Content-Type: multipart/form-data
```

| Field | Type | Required |
|---|---|---|
| `name` | text | Yes |
| `course` | text | Yes |
| `year` | number (1–6) | Yes |
| `date_of_birth` | date (YYYY-MM-DD) | Yes |
| `email` | text | Yes |
| `mobile_number` | text (10 digits) | Yes |
| `gender` | `Male` \| `Female` \| `Other` | Yes |
| `address` | text | Yes |
| `photo` | file (jpg/jpeg/png/webp, max 5MB) | No |

The `admission_number` (e.g. `ADM000006`) is generated automatically by the server — do not send it.

Returns `201` with `{ success: true, message, data: { ...newStudent } }`, or `422` with a `errors` array if validation fails.

### Update Student

```
PUT /students/:id
Content-Type: multipart/form-data
```
Same fields as Create. If `photo` is omitted, the student's existing photo is kept unchanged; if a new file is sent, it replaces the old one (and the old file is deleted from disk).

### Delete Student

```
DELETE /students/:id
```
Permanently deletes the student record and their photo file. Also logged in `activity_logs`. Returns `{ success: true, message }`, or `404` if not found.

### Error Response Shape

All errors follow this shape:
```json
{
  "success": false,
  "message": "Human-readable message",
  "errors": [ { "field": "email", "message": "Email must be a valid email address" } ]
}
```
`errors` is only present for `422` validation failures.

---