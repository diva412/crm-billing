# CRM Billing System

A full-stack CRM and Billing Management System built with **Next.js 15 (App Router)**, **TypeScript**, **Prisma ORM**, **Supabase PostgreSQL**, and **Tailwind CSS**.

---

## Tech Stack

| Layer      | Technology                            |
|------------|---------------------------------------|
| Frontend   | Next.js 15 (App Router) + TypeScript  |
| Styling    | Tailwind CSS + CSS custom properties  |
| Backend    | Next.js API Route Handlers            |
| ORM        | Prisma ORM                            |
| Database   | Supabase PostgreSQL                   |
| Auth       | JWT (httpOnly cookie) + bcryptjs      |
| Validation | Zod (frontend + backend)              |

---

## Modules

| Module       | Features                                                                 |
|--------------|--------------------------------------------------------------------------|
| Auth         | Login / Logout with JWT cookie session                                   |
| Dashboard    | Auto-calculated stats + recent records from all modules                  |
| Leads        | Create, View, Edit, Delete, Search, Status filter                        |
| Customers    | CRUD + convert lead to customer                                          |
| Follow-ups   | Schedule calls, WhatsApp, emails, meetings against leads or customers    |
| Quotations   | GST-inclusive entry, auto-calculates subtotal & GST amount               |
| Invoices     | Created from quotations, enforces total ≤ quotation amount               |
| Payments     | Advance (quotation-linked) and invoice payments with balance tracking    |
| Projects     | Linked to customer + quotation, full status lifecycle                    |
| Expenses     | Categorised expenses with monthly filter and totals                      |
| Tax          | Mark quotations as tax-filed, track GST filed vs pending                 |
| Reports      | Income, Expense, Profit, Pending/Received Payments, Projects, Tax        |

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/crm-billing.git
cd crm-billing
```

### 2. Install Dependencies

```bash
npm install
```

---

## Environment Setup

### 3. Create your environment file

```bash
cp .env.example .env
```


## Database Setup

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run Migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables in your Supabase database.

> If you get a **drift error**, run:
> ```bash
> npx prisma db push
> ```

### 6. Seed Default Admin Account

```bash
npx prisma db seed
```

Expected output:
```
✓ Admin created: admin@crmbilling.com
```

---

## How to Run the Project

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

---

## Default Login Credentials

| Field    | Value                    |
|----------|--------------------------|
| Email    | `admin@crmbilling.com`   |
| Password | `ChangeMe123!`           |

> You can change these in your `.env` file before running the seed.

---

## Project Structure

```
crm-billing/
├── app/
│   ├── api/                    # All API Route Handlers
│   │   ├── auth/               # login, logout
│   │   ├── dashboard/          # aggregated stats
│   │   ├── leads/              # CRUD + search + filter
│   │   ├── customers/          # CRUD + lead conversion
│   │   ├── followups/          # CRUD
│   │   ├── quotations/         # CRUD + GST computation
│   │   ├── invoices/           # CRUD + quota enforcement
│   │   ├── payments/           # CRUD + balance guards
│   │   ├── projects/           # CRUD
│   │   ├── expenses/           # CRUD + month filter
│   │   ├── tax/                # Mark quotations filed/pending
│   │   ├── reports/            # 9 report types with date filter
│   │   └── profile/            # Get/update user profile + password
│   ├── dashboard/
│   ├── leads/
│   ├── customers/
│   ├── followups/
│   ├── quotations/
│   ├── invoices/
│   ├── payments/
│   ├── projects/
│   ├── expenses/
│   ├── reports/
│   ├── tax/
│   ├── profile/
│   └── login/
├── components/
│   ├── layout/                 # Sidebar, Header, AppShell
│   ├── ui/                     # Toast, ConfirmDialog, StatusBadge, Spinner
│   └── cards/                  # StatCard
├── lib/
│   ├── prisma.ts               # Singleton Prisma client
│   ├── auth.ts                 # JWT sign/verify + bcrypt
│   ├── utils.ts 
         cloudinary.ts               # GST math + invoice balance logic
│   └── validations.ts          # Zod schemas for all modules
├── types/
│   └── index.ts                # TypeScript interfaces
├── prisma/
│   ├── schema.prisma           # All models and relationships
│   └── seed.ts                 # Default admin account seeder
├── middleware.ts               # Route protection (JWT cookie check)
├── .env.example                # Environment variable template
└── README.md
```

---

## Key Business Logic

### GST-Inclusive Billing
All amounts are entered as **final amount including GST**. System auto-calculates:
```
Subtotal  = FinalAmount / (1 + GSTPercent / 100)
GSTAmount = FinalAmount - Subtotal
```
Example: ₹20,000 at 18% GST → Subtotal ₹16,949.15 + GST ₹3,050.85

### Invoice Constraints
- Invoices must be created from a quotation
- Sum of all invoices **cannot exceed** the quotation final amount
- Enforced server-side — cannot be bypassed from UI

### Payment & Balance Logic
- **Advance payment** — linked to quotation before any invoice is created
- **Direct payment** — linked to an invoice
- Balance = `invoice amount − direct payments − unused advance`
- GST figures are **never changed** by payments

### Tax Management
- Each quotation can be marked as **Tax Filed** or **Tax Pending**
- Dashboard shows real counts from database
- Reports show full GST breakdown per filed/pending quotation

---

## API Endpoints

| Module      | Endpoints                                                        |
|-------------|------------------------------------------------------------------|
| Auth        | `POST /api/auth/login` `POST /api/auth/logout`                  |
| Dashboard   | `GET /api/dashboard`                                             |
| Leads       | `GET POST /api/leads` · `GET PUT DELETE /api/leads/[id]`        |
| Customers   | `GET POST /api/customers` · `GET PUT DELETE /api/customers/[id]`|
| Follow-ups  | `GET POST /api/followups` · `GET PUT DELETE /api/followups/[id]`|
| Quotations  | `GET POST /api/quotations` · `GET PUT DELETE /api/quotations/[id]`|
| Invoices    | `GET POST /api/invoices` · `GET DELETE /api/invoices/[id]`      |
| Payments    | `GET POST /api/payments` · `GET DELETE /api/payments/[id]`      |
| Projects    | `GET POST /api/projects` · `GET PUT DELETE /api/projects/[id]`  |
| Expenses    | `GET POST /api/expenses` · `GET PUT DELETE /api/expenses/[id]`  |
| Tax         | `GET /api/tax` · `PATCH /api/tax`                               |
| Reports     | `GET /api/reports?type=&from=&to=`                              |
| Profile     | `GET PUT PATCH /api/profile`                                     |

---

## Deployment (Optional)

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all variables from `.env.example` in:
**Vercel Dashboard → Project → Settings → Environment Variables**

---

## Git Commit History

```
feat: implement GST-inclusive billing chain — Quotations, Invoices, Payments
feat: add Dashboard and Reports API routes
feat: build shared UI component library
feat: login page with client-side + server-side validation
feat: dashboard page — 15 stat cards + 6 recent-record tables
feat: add Tax management module — mark quotations filed/pending
feat: add Profile page — edit details and change password
feat: Leads, Customers, FollowUps, Projects, Expenses pages
feat: Quotations, Invoices, Payments pages with live GST preview
feat: Reports page with 9 report types and date range filter
chore: add Prisma schema with all models and relationships
chore: add core lib layer — auth, billing math, validation, types
```
