# Finora FX — Investment Platform

A full-stack web investment platform built for Burundi. Users deposit funds, purchase VIP plans, earn daily profits, and refer others for commissions.

---

## 🗂️ Project Structure

```
finora-fx/
├── backend/          # Node.js + Express + PostgreSQL
└── frontend/         # React + Vite + TailwindCSS
```

---

## ⚙️ Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

## 🚀 Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials and secrets

# 3. Create the database
psql -U postgres -c "CREATE DATABASE finora_fx;"

# 4. Run migrations (creates all tables)
npm run migrate

# 5. Seed default data (admin account + VIP plans + settings)
npm run seed

# 6. Start the server
npm run dev        # development
npm start          # production
```

The backend runs on **http://localhost:5000**

**Default admin credentials:**
- Email: `admin@finora.com`
- Password: `Admin@123456`

---

## 🎨 Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start development server
npm start
```

The frontend runs on **http://localhost:3000**

API requests are proxied to the backend automatically in development.

---

## 📦 Build for Production

```bash
# Frontend
cd frontend && npm run build

# Serve the dist/ folder with nginx or any static host
# Point backend to serve frontend or use a reverse proxy
```

---

## 🔑 Key Features

| Feature | Details |
|---|---|
| **Auth** | JWT-based, bcrypt passwords |
| **VIP Plans** | 4 default plans (20K–200K FBu) |
| **Daily Profits** | Automated via cron job (Africa/Bujumbura timezone) |
| **Referrals** | 2-level: 10% (L1), 5% (L2) |
| **Deposits** | Manual approval with proof image upload |
| **Withdrawals** | Manual approval workflow |
| **Admin Panel** | Full management of users, plans, transactions |
| **Languages** | French (default) + English |
| **Audit Logs** | All admin actions tracked |

---

## 🌐 Routes

### Public
- `/` — Homepage
- `/login` — User login
- `/register` — User registration
- `/admin/login` — Admin login

### User Dashboard
- `/dashboard` — Overview
- `/dashboard/plans` — VIP plans
- `/dashboard/deposit` — Deposit funds
- `/dashboard/withdraw` — Request withdrawal
- `/dashboard/transactions` — Transaction history
- `/dashboard/referrals` — Referral team
- `/dashboard/notifications` — Notifications

### Admin Panel
- `/admin` — Stats overview
- `/admin/users` — User management
- `/admin/deposits` — Deposit approvals
- `/admin/withdrawals` — Withdrawal processing
- `/admin/vip-plans` — Plan management
- `/admin/settings` — Site settings
- `/admin/announcements` — Announcements
- `/admin/audit-logs` — Activity logs

---

## 📁 Database Tables

`users` · `admins` · `vip_plans` · `user_vips` · `deposits` · `withdrawals` · `transactions` · `referrals` · `referral_commissions` · `notifications` · `announcements` · `settings` · `audit_logs` · `support_messages`

---

## 🔒 Security

- JWT authentication with role separation (user vs admin)
- bcrypt password hashing (12 rounds)
- Rate limiting on all API routes
- Helmet.js HTTP security headers
- File upload type/size validation
- Audit logging of all admin actions

---

## 📞 Support

Configure WhatsApp links in **Admin → Settings**.
