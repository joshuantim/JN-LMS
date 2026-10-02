# JN LMS — Full-Stack Learning Management System

> Enterprise-grade Learning Management System with an **AI Learning Assistant** powered by RAG and PostgreSQL `pgvector`. Inspired by university platforms like Sakai, rebuilt with modern architecture, aesthetic UI, and adaptive learning workflows.

---

## 🌟 Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, TanStack Query, Zustand, React Router 6, Lucide Icons |
| **Backend** | Node.js, Express.js (ES Modules), Prisma ORM |
| **Database** | PostgreSQL 16 + `pgvector` (Vector similarity search for RAG) |
| **Cache & Workers** | Redis 7 + BullMQ (For background text chunking & embedding generation) |
| **Authentication** | JWT stored in HTTP-only cookies, bcrypt (12 rounds), RBAC (`STUDENT`, `INSTRUCTOR`, `ADMIN`) |

---

## 📁 Project Structure

```text
jn-lms/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, ProtectedRoutes, LoadingSpinner
│   │   ├── layouts/            # DashboardLayout, AuthLayout
│   │   ├── pages/              # StudentDashboard, InstructorDashboard, AdminDashboard, Auth
│   │   ├── routes/             # AppRoutes (Role-guarded routing)
│   │   ├── services/           # Axios API client & Auth service
│   │   ├── stores/             # Zustand auth store
│   │   └── App.jsx
│   └── package.json
│
├── server/                     # Express REST API
│   ├── src/
│   │   ├── config/             # DB (Prisma), constants
│   │   ├── controllers/        # Auth, User controllers
│   │   ├── middleware/         # Auth, Role, Validation, Error middlewares
│   │   ├── routes/             # Auth, User API routes
│   │   ├── services/           # Business logic
│   │   ├── utils/              # JWT, bcrypt, response helpers, Zod validators
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Entrypoint with graceful shutdown
│   ├── prisma/
│   │   ├── schema.prisma       # 19 models & enums with pgvector
│   │   └── seed.js             # Demo accounts and course data
│   └── package.json
│
├── docker-compose.yml          # PostgreSQL (pgvector) & Redis
├── .env.example                # Environment configuration template
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [Docker & Docker Compose](https://www.docker.com/)

### 2. Start PostgreSQL with pgvector & Redis
```bash
docker compose up -d
```

### 3. Setup Server
```bash
cd server
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```
> Server runs on `http://localhost:5000`

### 4. Setup Client
```bash
cd ../client
npm install
npm run dev
```
> Client runs on `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Student** | `student@jnlms.edu` | `Student123!` | Dashboard, enrolled courses, AI tutor, assignments, grades |
| **Instructor** | `dr.smith@jnlms.edu` | `Instructor123!` | Course management, question banks, AI quiz gen, grading |
| **Admin** | `admin@jnlms.edu` | `Admin123!` | User administration, course directory, platform telemetry |

*(A 1-click credential selector is also available on the `/login` screen)*

---

## 🧪 Automated Testing

To run the Phase 1 backend integration test suite verifying health checks, authentication, cookie management, and role-based permissions:

```bash
cd server
node test-auth.js
```
