// ─── Enums ────────────────────────────────────────────────────────────────────

export type LeadStatus = "NEW" | "CONTACTED" | "FOLLOW_UP" | "CONVERTED" | "LOST";
export type FollowUpType = "CALL" | "WHATSAPP" | "EMAIL" | "MEETING";
export type FollowUpStatus = "PENDING" | "COMPLETED" | "MISSED";
export type ProjectStatus = "CURRENT" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
export type ExpenseCategory =
  | "SALARY" | "SOFTWARE" | "DOMAIN" | "SERVER"
  | "MARKETING" | "OFFICE" | "TRAVEL" | "OTHERS";

// ─── Core Models ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName?: string;
  interestedService?: string;
  source?: string;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName?: string;
  address?: string;
  gstNumber?: string;
  status?: string;
  convertedFromLeadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  leadId?: string;
  customerId?: string;
  lead?: Lead;
  customer?: Customer;
  date: string;
  time: string;
  type: FollowUpType;
  notes?: string;
  status: FollowUpStatus;
  createdAt: string;
}

export interface Quotation {
  id: string;
  customerId: string;
  customer?: Customer;
  service: string;
  description?: string;
  finalAmount: number;
  gstPercent: number;
  subtotal: number;
  gstAmount: number;
  taxFiled: boolean;
  taxFiledAt?: string;
  createdAt: string;
  updatedAt: string;
  invoices?: Invoice[];
  payments?: Payment[];
}

export interface Invoice {
  id: string;
  quotationId: string;
  quotation?: Quotation;
  finalAmount: number;
  gstPercent: number;
  subtotal: number;
  gstAmount: number;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
  balance?: number;
  advanceApplied?: number;
  alreadyReceived?: number;
}

export interface Payment {
  id: string;
  quotationId?: string;
  invoiceId?: string;
  quotation?: Quotation;
  invoice?: Invoice;
  amount: number;
  paidAt: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  customerId: string;
  customer?: Customer;
  quotationId?: string;
  quotation?: Quotation;
  startDate: string;
  deadline?: string;
  status: ProjectStatus;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardCards {
  totalLeads: number;
  totalCustomers: number;
  totalQuotations: number;
  totalInvoices: number;
  totalProjects: number;
  currentProjects: number;
  completedProjects: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  currentMonthProfit: number;
  pendingInvoiceAmount: number;
  receivedPayments: number;
  outstandingBalance: number;
  taxFiled: number;
  taxNotFiled: number;
}

export interface DashboardData {
  cards: DashboardCards;
  recent: {
    recentLeads: Lead[];
    upcomingFollowUps: FollowUp[];
    recentQuotations: Quotation[];
    recentInvoices: Invoice[];
    currentProjectsList: Project[];
    recentExpenses: Expense[];
  };
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = T | ApiError;