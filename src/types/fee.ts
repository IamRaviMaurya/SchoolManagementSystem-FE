export interface FeeStructure {
  id: number;
  category: string;
  division: string;
  standard: string;
  stream?: string;
  term: string;
  amount: number;
  due_date?: string;
  academic_year: string;
  is_paid?: boolean;
  paid_amount?: number;
  remaining_due?: number;
  status?: "PAID" | "PARTIAL" | "UNPAID";
  paid_date?: string;
  receipt_no?: string;
  payment_id?: number;
}

export interface FeeItemCollect {
  fee_head: string;
  amount: number;
  total_due_amount?: number;
  remaining_due?: number;
}

export interface FeeCollectRequest {
  student_id: number;
  payment_mode: string;
  transaction_ref?: string;
  items: FeeItemCollect[];
  late_fine: number;
  discount: number;
  advance_used?: number;
  pending_due: number;
  collected_by: string;
}

export interface PaymentDetail {
  id: number;
  fee_head: string;
  amount: number;
  total_due_amount?: number;
  remaining_due?: number;
}

export interface PreviousPaymentSummary {
  id: number;
  receipt_no: string;
  payment_date: string;
  payment_mode: string;
  net_paid: number;
  items_summary: string;
}

export interface FeeReceipt {
  id: number;
  receipt_no: string;
  student_id: number;
  student_name: string;
  gr_no: string;
  division: string;
  standard: string;
  section: string;
  stream?: string;
  parent_name: string;
  phone: string;
  payment_date: string;
  payment_mode: string;
  transaction_ref?: string;
  total_amount: number;
  late_fine: number;
  discount: number;
  advance_used?: number;
  advance_balance_remaining?: number;
  net_paid: number;
  pending_due: number;
  collected_by: string;
  items: PaymentDetail[];
  previous_payments?: PreviousPaymentSummary[];
  created_at?: string;
}

export interface Defaulter {
  student_id: number;
  gr_no: string;
  full_name: string;
  parent_name: string;
  phone: string;
  division: string;
  standard: string;
  section: string;
  stream?: string;
  total_due: number;
  total_paid: number;
  pending_balance: number;
}
