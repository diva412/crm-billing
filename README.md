# RITS CRM — Mini CRM & Billing Management System

A full-stack CRM and billing system built with **Next.js (App Router)**, **TypeScript**, **Prisma ORM**, **Supabase PostgreSQL**, and **Tailwind CSS**.

---

## Tech Stack

| Layer      | Technology                           |
|------------|--------------------------------------|
| Frontend   | Next.js 15 (App Router) + TypeScript |
| Styling    | Tailwind CSS + CSS custom properties |
| Backend    | Next.js API Route Handlers           |
| ORM        | Prisma ORM                           |
| Database   | Supabase PostgreSQL                  |
| Auth       | JWT (httpOnly cookie) + bcryptjs     |
| Validation | Zod (frontend + backend)             |

---

## Modules

- **Auth** — Login / Logout with JWT cookie session
- **Dashboard** — Auto-calculated stats from all modules + recent records
- **Leads** — Create, view, edit, delete, search, status filter
- **Customers** — CRUD + convert lead to customer
- **Follow-ups** — Schedule calls, WhatsApp, emails, meetings against leads or customers
- **Quotations** — GST-inclusive entry, auto-calculates subtotal & GST
- **Invoices** — Created from quotations, enforces total ≤ quotation amount
- **Payments** — Advance (quotation) and invoice payments with balance tracking
- **Projects** — Linked to customer + quotation, status lifecycle
- **Expenses** — Categorised expenses with monthly filter
- **Reports** — Income, Expense, Profit, Pending/Received Payments, Projects, Tax

---

## Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- npm

---

## Installation

```bash
git clone https://github.com/your-username/crm-billing.git
cd crm-billing
npm install
```

---

## Environment Setup

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
JWT_SECRET="your-random-secret"
DEFAULT_ADMIN_EMAIL="admin@ritssoftware.com"
DEFAULT_ADMIN_PASSWORD="ChangeMe123!"
```

> DATABASE_URL uses port 6543 (pooled). DIRECT_URL uses port 5432 (direct, for migrations).

---

## Database Setup & Prisma Migrations

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Run migrations — creates all tables in Supabase
npx prisma migrate dev --name init

# 3. Seed the default admin account
npx prisma db seed
```

---

## How to Run the Project

```bash
npm run dev
# Open http://localhost:3000
```

---

## Default Login Credentials

| Field    | Value                     |
|----------|---------------------------|
| Email    | admin@ritssoftware.com    |
| Password | ChangeMe123!              |

---

## Project Structure

```
crm-billing/
├── app/
│   ├── api/               # All API Route Handlers (no DB access from UI)
│   │   ├── auth/          # login, logout
│   │   ├── dashboard/     # aggregated stats
│   │   ├── leads/         # CRUD + search + filter
│   │   ├── customers/     # CRUD + lead conversion
│   │   ├── followups/     # CRUD
│   │   ├── quotations/    # CRUD + GST computation
│   │   ├── invoices/      # CRUD + quota enforcement
│   │   ├── payments/      # CRUD + balance guards
│   │   ├── projects/      # CRUD
│   │   ├── expenses/      # CRUD + month filter
│   │   └── reports/       # 9 report types
│   ├── dashboard/
│   ├── leads/ customers/ followups/ quotations/
│   ├── invoices/ payments/ projects/ expenses/ reports/
│   └── login/
├── components/
│   ├── layout/            # Sidebar, Header, AppShell
│   ├── ui/                # Toast, ConfirmDialog, StatusBadge, Spinner
│   └── cards/             # StatCard
├── lib/
│   ├── prisma.ts          # Singleton Prisma client
│   ├── auth.ts            # JWT + bcrypt
│   ├── utils.ts           # GST math + invoice balance (pure functions)
│   └── validations.ts     # Zod schemas used by every API route
├── types/index.ts         # TypeScript interfaces
├── prisma/
│   ├── schema.prisma      # All models and relationships
│   └── seed.ts            # Admin seeder
├── middleware.ts           # Auth middleware (JWT guard on all protected routes)
└── .env.example
```

---

## Key Business Logic

### GST-Inclusive Billing
```
Subtotal  = FinalAmount / (1 + GSTPercent / 100)
GSTAmount = FinalAmount - Subtotal
```
Formula lives only in `lib/utils.ts → calculateGstBreakdown()`.

### Invoice Constraints
- Must be created from a quotation
- Sum of all invoices for a quotation cannot exceed the quotation finalAmount
- Enforced server-side in `POST /api/invoices` via `assertInvoiceWithinQuotation()`

### Payment & Balance Logic
- **Advance**: linked to quotation (before any invoice)
- **Direct**: linked to invoice
- Balance = `invoice.finalAmount − directPayments − unusedAdvance`
- Advance consumed by invoices in creation order
- Payments never affect GST figures — only reduce balance

---

## Deployment

### Vercel
```bash
npm install -g vercel && vercel
```
Add all `.env.example` variables in Vercel Project → Settings → Environment Variables.
