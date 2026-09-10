import { FeeStructure, FeeReceipt } from "./fee";

export interface Student {
  id: number;
  gr_no: string;
  
  // Official Form Breakdown (4a - 4d)
  last_name: string;
  first_name: string;
  middle_name?: string;
  mother_name: string;
  full_name: string;
  parent_name?: string;

  // Address & Contact (5 & 6)
  address: string;
  pin_code: string;
  phone: string;
  email?: string;

  // Birth & Govt Identity (7 - 9)
  place_of_birth: string;
  dob: string;
  aadhar_no: string;

  // Classifications (10 - 12)
  gender: string;      // Male, Female, Trans Gender
  religion: string;    // Non-Minority, Muslim, Christian, Buddhist, Sikh, Parsi, Jain
  category: string;    // OPEN, SC, ST, VJ(A), NT(B), NT(C), NT(D), OBC, SBC, MARATHA, MUSLIM

  // Photo, Signature & Document Base64 Data (Optional)
  photo_url?: string;
  signature_url?: string;
  aadhar_front_url?: string;
  aadhar_back_url?: string;

  // Academic Setup
  division: string;    // Pre-Primary, School Section, Junior College
  standard: string;    // Nursery - 12th
  section: string;     // A, B, C
  stream?: string;      // Science, Commerce, Arts
  academic_year: string;
  advance_balance?: number;
  status: "Active" | "Passed" | "Left";  // Active, Passed, Left
  created_at?: string;
}

export type StudentCreate = Omit<Student, 'id' | 'full_name' | 'parent_name' | 'status' | 'created_at'> & {
  gr_no?: string;
};

export interface StudentFullLedger {
  student: Student;
  structures: FeeStructure[];
  payment_history: FeeReceipt[];
  total_due: number;
  total_paid: number;
  advance_balance: number;
  pending_balance: number;
}
