# InventoPro - Inventory Management System

A production-ready **Inventory Management System** built with React, Vite, Tailwind CSS, and Supabase.

## 🚀 Features

- **Authentication** — Login, Forgot/Reset Password, Session persistence
- **Role-Based Access** — Admin, Manager, Staff, Viewer roles with RLS
- **Dashboard** — Real-time stats, charts, low-stock alerts
- **Products** — Full CRUD, search, filter, CSV export
- **Categories** — Add/edit/delete with product association guard
- **Suppliers & Customers** — Full management
- **Purchases** — Purchase order creation with atomic inventory update
- **Sales (POS)** — Cart-based sales with stock validation
- **Inventory** — Stock overview with status badges
- **Stock Adjustments** — Multiple types with history
- **Reports** — Sales, Purchase, Stock, Profit with CSV export
- **Notifications** — Real-time notification system
- **Audit Logs** — Complete action history (admin-only)
- **Settings** — Profile, business, and app settings
- **Dark Mode** — Full dark mode support
- **Responsive** — Mobile, tablet, and desktop support

## ⚙️ Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create Supabase Project
Go to [supabase.com](https://supabase.com) and create a project.

### 3. Run Database Schema
In Supabase SQL Editor, run the contents of `supabase/schema.sql`.

### 4. Configure Environment
```bash
cp .env.example .env
```
Fill in your Supabase URL and anon key from **Settings → API**.

### 5. Create First Admin User
In Supabase Auth, create a user then run:
```sql
UPDATE profiles SET role = 'admin', full_name = 'Your Name' WHERE email = 'your@email.com';
```

### 6. Start Development Server
```bash
npm run dev
```

## 🔐 User Roles

| Role | Access |
|------|--------|
| Admin | Full access |
| Manager | Dashboard, Products, Categories, Stock, Purchases, Suppliers, Sales, Customers, Reports, Settings |
| Staff | Products, Sales, Stock |
| Viewer | Dashboard, Products, Stock, Reports (read-only) |

## 🔒 Security
- Uses only Supabase anon key (never service role key)
- RLS policies enforce data access at database level
- Critical operations use SECURITY DEFINER RPC functions
