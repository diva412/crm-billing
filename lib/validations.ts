import { z } from "zod";

/** Auth */
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** Shared fragments */
const mobileSchema = z
  .string()
  .regex(/^[0-9]{10}$/, "Mobile number must be 10 digits");

const positiveAmount = z
  .number()
  .gt(0, "Amount must be greater than zero");

const gstPercentSchema = z
  .number()
  .min(0, "GST percentage cannot be negative")
  .max(100, "GST percentage cannot exceed 100");

/** Lead */
export const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: mobileSchema,
  email: z.string().email().optional().or(z.literal("")),
  businessName: z.string().optional(),
  interestedService: z.string().optional(),
  source: z.string().optional(),
  status: z
    .enum(["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "LOST"])
    .default("NEW"),
  notes: z.string().optional(),
});

/** Customer */
export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  mobile: mobileSchema,
  email: z.string().email().optional().or(z.literal("")),
  businessName: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  status: z.string().optional(),
});

/** FollowUp — exactly one of leadId / customerId must be present */
export const followUpSchema = z
  .object({
    leadId: z.string().optional(),
    customerId: z.string().optional(),
    date: z.coerce.date(),
    time: z.string().min(1, "Time is required"),
    type: z.enum(["CALL", "WHATSAPP", "EMAIL", "MEETING"]),
    notes: z.string().optional(),
    status: z.enum(["PENDING", "COMPLETED", "MISSED"]).default("PENDING"),
  })
  .refine((data) => !!data.leadId !== !!data.customerId, {
    message: "Follow-up must be linked to exactly one of lead or customer",
  });

/** Quotation — user enters only the GST-inclusive final amount + GST% */
export const quotationSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  service: z.string().min(1, "Service is required"),
  description: z.string().optional(),
  finalAmount: positiveAmount,
  gstPercent: gstPercentSchema,
});

/** Invoice — created from a quotation, also GST-inclusive */
export const invoiceSchema = z.object({
  quotationId: z.string().min(1, "Quotation is required"),
  finalAmount: positiveAmount,
});

/** Payment — must link to exactly one of quotation or invoice */
export const paymentSchema = z
  .object({
    quotationId: z.string().optional(),
    invoiceId: z.string().optional(),
    amount: positiveAmount,
    paidAt: z.coerce.date().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => !!data.quotationId !== !!data.invoiceId, {
    message: "Payment must be linked to exactly one of quotation or invoice",
  });

/** Project */
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  customerId: z.string().min(1, "Customer is required"),
  quotationId: z.string().optional(),
  startDate: z.coerce.date(),
  deadline: z.coerce.date().optional(),
  status: z
    .enum(["CURRENT", "COMPLETED", "ON_HOLD", "CANCELLED"])
    .default("CURRENT"),
  notes: z.string().optional(),
});

/** Expense */
export const expenseSchema = z.object({
  name: z.string().min(1, "Expense name is required"),
  category: z.enum([
    "SALARY",
    "SOFTWARE",
    "DOMAIN",
    "SERVER",
    "MARKETING",
    "OFFICE",
    "TRAVEL",
    "OTHERS",
  ]),
  amount: positiveAmount,
  date: z.coerce.date(),
  notes: z.string().optional(),
});
