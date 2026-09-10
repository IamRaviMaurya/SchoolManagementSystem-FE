"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import FeeReceipt from "./FeeReceipt";
import FeeStructureManager from "./FeeStructureManager";
import StudentLedgerModal from "./StudentLedgerModal";
import { Student } from "@/types/student";
import { FeeStructure, FeeCollectRequest, Defaulter, FeeReceipt as FeeReceiptType } from "@/types/fee";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { 
  Search, 
  CreditCard, 
  Receipt, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Calculator,
  X,
  User,
  PhoneCall,
  Sparkles,
  Check,
  Printer,
  Building2,
  Eye
} from "lucide-react";

export default function FeeCollectionDesk() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"COLLECT" | "STRUCTURE" | "DEFAULTERS">("COLLECT");

  // Selected Student Ledger Modal State
  const [ledgerStudentGr, setLedgerStudentGr] = useState<string | null>(null);

  // Search & Student selection state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentFeeStructures, setStudentFeeStructures] = useState<FeeStructure[]>([]);

  // Fee collection form state
  const [selectedHeads, setSelectedHeads] = useState<{ [key: string]: boolean }>({});
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: number }>({});
  const [lateFine, setLateFine] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [advanceUsed, setAdvanceUsed] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>("UPI");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Re-Print Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceiptType | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  const handleFetchAndShowReceipt = async (paymentId: number) => {
    setIsLoadingReceipt(true);
    try {
      const res = await api.get(`/fees/receipt/${paymentId}`);
      setSelectedReceipt(res.data);
    } catch (err) {
      console.error("Failed to fetch receipt:", err);
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  // Defaulters tab state
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [defaulterDivision, setDefaulterDivision] = useState<string>("All");
  const [loadingDefaulters, setLoadingDefaulters] = useState<boolean>(false);

  const [isSearching, setIsSearching] = useState<boolean>(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search student handler with live debouncing and loading state
  useEffect(() => {
    if (searchQuery.trim().length >= 1 && !selectedStudent) {
      setIsSearching(true);
      setShowDropdown(true);
      const delayDebounceFn = setTimeout(async () => {
        try {
          const res = await api.get(`/students?search=${encodeURIComponent(searchQuery)}`);
          setSearchResults(res.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      }, 250);
      return () => clearTimeout(delayDebounceFn);
    } else if (searchQuery.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
    }
  }, [searchQuery, selectedStudent]);

  // Select student and load fee structure
  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setShowDropdown(false);
    setSearchResults([]);
    setSearchQuery(student.full_name);
    setErrorMsg(null);
    setAdvanceUsed(0);

    try {
      const res = await api.get(`/fees/structures/student/${student.id}`);
      const structures: FeeStructure[] = res.data || [];
      setStudentFeeStructures(structures);

      // Default select ONLY unpaid/partial fee heads
      const initialMap: { [key: string]: boolean } = {};
      const initialAmounts: { [key: string]: number } = {};

      structures.forEach((st) => {
        const key = `${st.category} (${st.term})`;
        if (!st.is_paid) {
          initialMap[key] = true;
          initialAmounts[key] = st.remaining_due ?? st.amount;
        }
      });
      setSelectedHeads(initialMap);
      setCustomAmounts(initialAmounts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setStudentFeeStructures([]);
    setSelectedHeads({});
    setCustomAmounts({});
    setLateFine(0);
    setDiscount(0);
    setAdvanceUsed(0);
    setTransactionRef("");
    setErrorMsg(null);
  };

  const handleSelectQuarter = (startIdx: number, endIdx: number) => {
    const months = [
      "June 2026", "July 2026", "August 2026", "September 2026",
      "October 2026", "November 2026", "December 2026", "January 2027",
      "February 2027", "March 2027", "April 2027", "May 2027"
    ];
    const targetMonths = months.slice(startIdx, endIdx);
    
    setSelectedHeads((prev) => {
      const updated = { ...prev };
      studentFeeStructures.forEach((st) => {
        const key = `${st.category} (${st.term})`;
        if (targetMonths.includes(st.term) && !st.is_paid) {
          updated[key] = true;
        }
      });
      return updated;
    });
  };

  const handleSelectAllMonths = (status: boolean) => {
    setSelectedHeads((prev) => {
      const updated = { ...prev };
      studentFeeStructures.forEach((st) => {
        const key = `${st.category} (${st.term})`;
        if (!st.is_paid) {
          updated[key] = status;
        }
      });
      return updated;
    });
  };

  // Calculate totals
  const subtotal = studentFeeStructures.reduce((acc, st) => {
    const key = `${st.category} (${st.term})`;
    if (selectedHeads[key] && !st.is_paid) {
      const amountToPay = customAmounts[key] !== undefined ? customAmounts[key] : (st.remaining_due ?? st.amount);
      return acc + Number(amountToPay);
    }
    return acc;
  }, 0);

  const netPayable = Math.max(0, subtotal + Number(lateFine) - Number(discount) - Number(advanceUsed));

  // Submit payment
  const handleCollectPayment = async () => {
    if (!selectedStudent) {
      setErrorMsg("Please search and select a student first.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    const items = studentFeeStructures
      .filter((st) => selectedHeads[`${st.category} (${st.term})`] && !st.is_paid)
      .map((st) => {
        const key = `${st.category} (${st.term})`;
        const amountToPay = customAmounts[key] !== undefined ? customAmounts[key] : (st.remaining_due ?? st.amount);
        return {
          fee_head: key,
          amount: Number(amountToPay),
          total_due_amount: st.amount,
          remaining_due: st.remaining_due ?? st.amount,
        };
      });

    if (items.length === 0) {
      setErrorMsg("Please select at least one fee head to collect payment.");
      setSubmitting(false);
      return;
    }

    const payload: FeeCollectRequest = {
      student_id: selectedStudent.id,
      payment_mode: paymentMode,
      transaction_ref: transactionRef || undefined,
      items,
      late_fine: Number(lateFine),
      discount: Number(discount),
      advance_used: Number(advanceUsed),
      pending_due: 0,
      collected_by: "Accounts Counter 1",
    };

    try {
      const res = await api.post("/fees/collect", payload);
      if (res.data && res.data.id) {
        router.push(`/receipt/${res.data.id}`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to record payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Load defaulters list
  const fetchDefaulters = async () => {
    setLoadingDefaulters(true);
    try {
      const res = await api.get(`/fees/defaulters?division=${defaulterDivision}`);
      setDefaulters(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDefaulters(false);
    }
  };

  useEffect(() => {
    if (activeTab === "DEFAULTERS") {
      fetchDefaulters();
    }
  }, [activeTab, defaulterDivision]);

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="glass-panel p-2 rounded-xl flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("COLLECT")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "COLLECT"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Receipt className="w-4 h-4" />
            Fast Collection Desk
          </button>
          <button
            onClick={() => setActiveTab("STRUCTURE")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "STRUCTURE"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            Fee Structure Setup
          </button>
          <button
            onClick={() => setActiveTab("DEFAULTERS")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "DEFAULTERS"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Pending Dues / Defaulter List
          </button>
        </div>
      </div>

      {/* Tab 2: Fee Structure Setup */}
      {activeTab === "STRUCTURE" && (
        <FeeStructureManager />
      )}

      {/* Tab 1: Collection Desk */}
      {activeTab === "COLLECT" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Search & Fee Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            {/* Search Input Box */}
            <div className="glass-panel p-6 rounded-2xl relative z-30" ref={searchContainerRef}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Search Student (GR No, Name or Mobile Number)
              </label>
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. GR-2026-0002 or Ananya Sharma"
                  value={searchQuery}
                  onFocus={() => {
                    if (searchResults.length > 0 && !selectedStudent) {
                      setShowDropdown(true);
                    }
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedStudent) {
                      setSelectedStudent(null);
                    }
                  }}
                  className="w-full pl-12 pr-10 py-3.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-colors font-medium"
                />
                {selectedStudent && (
                  <button
                    onClick={handleClearStudent}
                    className="absolute right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Auto-suggest Dropdown Popover */}
              {showDropdown && !selectedStudent && (
                <div className="absolute left-6 right-6 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-800 animate-fadeIn">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching candidates...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => handleSelectStudent(st)}
                        className="p-3.5 hover:bg-blue-600/30 cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2 group-hover:text-blue-300">
                            <span>{st.full_name}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono border border-blue-800">
                              {st.gr_no}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {st.division} - Std {st.standard} ({st.section}) | Mother: {st.mother_name}
                          </div>
                        </div>
                        <UserCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      No student found matching "<span className="text-white font-bold">{searchQuery}</span>". Try searching by GR No (e.g. GR-2026-0001) or candidate name.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Student Information Card */}
            {selectedStudent ? (
              <div className="glass-panel p-6 rounded-2xl border border-blue-500/40 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-lg border border-blue-500/30">
                      {selectedStudent.first_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{selectedStudent.full_name}</h3>
                      <p className="text-xs text-slate-400">
                        Mother: <span className="text-slate-200">{selectedStudent.mother_name}</span> | Phone: <span className="text-slate-200">{selectedStudent.phone}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono px-3 py-1 bg-blue-950 text-blue-300 rounded-lg border border-blue-800 font-bold block">
                      {selectedStudent.gr_no}
                    </span>
                    <button
                      onClick={handleClearStudent}
                      className="text-[11px] text-rose-400 hover:text-rose-300 mt-1 font-semibold underline"
                    >
                      Select Different Student
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Division</span>
                    <span className="font-semibold text-white">{selectedStudent.division}</span>
                  </div>
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Standard & Section</span>
                    <span className="font-semibold text-white">
                      Std {selectedStudent.standard} ({selectedStudent.section})
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Stream</span>
                    <span className="font-semibold text-blue-400">
                      {selectedStudent.stream || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Checklist of Fee Heads */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Monthly & Term Fee Heads
                    </h4>
                    <span className="text-[11px] text-blue-400 font-medium">Check/Uncheck heads to collect</span>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Quick Select:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllMonths(true)}
                      className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-md font-bold text-[11px] border border-blue-500/30 transition-all"
                    >
                      All Months
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectQuarter(0, 3)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md font-semibold text-[11px] border border-slate-700 transition-all"
                    >
                      Q1 (Jun-Aug)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectQuarter(3, 6)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md font-semibold text-[11px] border border-slate-700 transition-all"
                    >
                      Q2 (Sep-Nov)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectQuarter(6, 9)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md font-semibold text-[11px] border border-slate-700 transition-all"
                    >
                      Q3 (Dec-Feb)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectQuarter(9, 12)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md font-semibold text-[11px] border border-slate-700 transition-all"
                    >
                      Q4 (Mar-May)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllMonths(false)}
                      className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-md font-semibold text-[11px] border border-rose-800/40 transition-all ml-auto"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {studentFeeStructures.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">Loading fee structures...</p>
                    ) : (
                      studentFeeStructures.map((st) => {
                        const key = `${st.category} (${st.term})`;
                        const isChecked = !!selectedHeads[key];
                        const isPaid = st.status === "PAID" || st.is_paid;
                        const isPartial = st.status === "PARTIAL";

                        const currentAmountToPay = customAmounts[key] !== undefined ? customAmounts[key] : (st.remaining_due ?? st.amount);

                        return (
                          <div
                            key={st.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isPaid
                                ? "bg-emerald-950/30 border-emerald-500/40 text-slate-300 opacity-90"
                                : isChecked
                                ? "bg-blue-950/50 border-blue-500/60 text-white shadow-md shadow-blue-900/20"
                                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div
                                onClick={() => {
                                  if (!isPaid) {
                                    setSelectedHeads((prev) => ({ ...prev, [key]: !prev[key] }));
                                  }
                                }}
                                className="flex items-center gap-3 cursor-pointer flex-1"
                              >
                                {isPaid ? (
                                  <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 text-white font-bold">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div
                                    className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                      isChecked
                                        ? "bg-blue-600 border-blue-500 text-white"
                                        : "border-slate-700 bg-slate-900"
                                    }`}
                                  >
                                    {isChecked && <CheckCircle2 className="w-4 h-4" />}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">{st.category}</span>
                                    <span className="text-xs text-slate-400 font-mono">({st.term})</span>
                                  </div>
                                  
                                  {/* Status Breakdown Badges */}
                                  {isPaid ? (
                                    <div className="text-[11px] text-emerald-400 font-semibold flex flex-wrap items-center gap-2 mt-1">
                                      <span>Fully Paid on {formatDate(st.paid_date || "")}</span>
                                      <span className="font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                                        Receipt #{st.receipt_no}
                                      </span>
                                      {st.payment_id && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFetchAndShowReceipt(st.payment_id!);
                                          }}
                                          className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-bold border border-blue-500/40 flex items-center gap-1 transition-all shadow-sm"
                                        >
                                          <Printer className="w-3 h-3" />
                                          Re-Print
                                        </button>
                                      )}
                                    </div>
                                  ) : isPartial ? (
                                    <div className="text-[11px] text-amber-400 font-semibold flex flex-wrap items-center gap-2 mt-1">
                                      <span>Paid: {formatCurrencyINR(st.paid_amount || 0)}</span>
                                      <span className="text-slate-400">•</span>
                                      <span className="text-rose-400 font-bold">Remaining Due: {formatCurrencyINR(st.remaining_due || 0)}</span>
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                      Total Due: {formatCurrencyINR(st.amount)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Amount Display or Partial Input Field */}
                              <div className="text-right flex flex-col items-end gap-1">
                                {isPaid ? (
                                  <div>
                                    <span className="font-bold text-sm text-slate-200 block font-mono">
                                      {formatCurrencyINR(st.amount)}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mt-0.5">FULLY PAID</span>
                                  </div>
                                ) : isChecked ? (
                                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-xs text-slate-400 font-bold">Pay (₹):</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max={st.remaining_due || st.amount}
                                      value={currentAmountToPay}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setCustomAmounts((prev) => ({ ...prev, [key]: val }));
                                      }}
                                      className="w-24 bg-slate-950 border border-blue-500/80 text-emerald-400 font-bold text-xs rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-bold text-sm text-slate-400 block font-mono">
                                      {formatCurrencyINR(st.remaining_due ?? st.amount)}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-amber-400 block mt-0.5">
                                      {isPartial ? "PARTIAL DUE" : "UNPAID DUE"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 rounded-2xl text-center border border-dashed border-slate-800 text-slate-400 space-y-3">
                <Search className="w-12 h-12 mx-auto text-blue-500/60" />
                <h4 className="text-base font-bold text-white">Search & Select Student</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Type candidate GR Number, Name or Mobile Number in the search box above to load student profile and fee heads.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Payment Counter Calculator & Receipt Action */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-400" />
                  Collection Counter
                </h3>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  FY 2026-27
                </span>
              </div>

              {/* Error Message Alert */}
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Subtotal & Calculations */}
              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Selected Heads Subtotal:</span>
                  <span className="font-bold text-white">{formatCurrencyINR(subtotal)}</span>
                </div>

                {/* Late Fine Input */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-amber-400">Late Payment Fine (+):</label>
                  <input
                    type="number"
                    min="0"
                    value={lateFine}
                    onChange={(e) => setLateFine(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-right text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Discount Input */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-emerald-400">Concession / Discount (-):</label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-right text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Advance Credit Usage */}
                {selectedStudent && (selectedStudent.advance_balance || 0) > 0 && (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Advance Credit Available:
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatCurrencyINR(selectedStudent.advance_balance || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Use Advance Credit (-):</label>
                      <input
                        type="number"
                        min="0"
                        max={selectedStudent.advance_balance || 0}
                        value={advanceUsed}
                        onChange={(e) => setAdvanceUsed(Math.min(selectedStudent.advance_balance || 0, Number(e.target.value)))}
                        className="w-32 px-3 py-1 bg-slate-950 border border-amber-500/60 rounded-lg text-right text-amber-300 font-mono text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Net Payable Highlight Box */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 border border-blue-500/40 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-blue-200 block">
                      Net Total Collectable
                    </span>
                    <span className="text-2xl font-extrabold text-white">
                      {formatCurrencyINR(netPayable)}
                    </span>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-400 opacity-80" />
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["UPI", "Cash", "Cheque", "NetBanking"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all ${
                        paymentMode === mode
                          ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {paymentMode !== "Cash" && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Transaction Ref / UTR / Cheque No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI/998124/8890"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Collect & Print Button */}
              <button
                type="button"
                onClick={handleCollectPayment}
                disabled={!selectedStudent || submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <Receipt className="w-5 h-5" />
                    <span>Collect Payment & Print Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Defaulters List */}
      {activeTab === "DEFAULTERS" && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Fee Defaulters & Pending Dues Report
              </h3>
              <p className="text-xs text-slate-400">
                Filter active students with outstanding fee balances
              </p>
            </div>

            {/* Division Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Division:</span>
              <select
                value={defaulterDivision}
                onChange={(e) => setDefaulterDivision(e.target.value)}
                className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Divisions</option>
                <option value="Pre-Primary">Pre-Primary</option>
                <option value="School Section">School Section</option>
                <option value="Junior College">Junior College</option>
              </select>
            </div>
          </div>

          {/* Defaulters Table */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            {loadingDefaulters ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Loading defaulter records...
              </div>
            ) : defaulters.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm space-y-2">
                <Check className="w-10 h-10 mx-auto text-emerald-400" />
                <p className="font-bold text-white">No Outstanding Defaulters</p>
                <p className="text-xs">All active students in this division have cleared their fee dues.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-300 uppercase tracking-wider font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-4">GR No</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Division & Standard</th>
                      <th className="p-4">Parent Mobile</th>
                      <th className="p-4 text-right">Total Fee</th>
                      <th className="p-4 text-right">Paid Amount</th>
                      <th className="p-4 text-right">Pending Due</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {defaulters.map((d) => (
                      <tr key={d.student_id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => setLedgerStudentGr(d.gr_no)}
                            className="font-mono font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-1 text-left transition-colors"
                          >
                            <span>{d.gr_no}</span>
                            <Eye className="w-3 h-3 text-blue-400" />
                          </button>
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => setLedgerStudentGr(d.gr_no)}
                            className="font-bold text-white hover:text-blue-300 text-left transition-colors"
                          >
                            {d.full_name}
                          </button>
                        </td>
                        <td className="p-4">
                          {d.division} - Std {d.standard} ({d.section})
                        </td>
                        <td className="p-4 font-mono">{d.phone}</td>
                        <td className="p-4 text-right font-medium">{formatCurrencyINR(d.total_due)}</td>
                        <td className="p-4 text-right font-semibold text-emerald-400">
                          {formatCurrencyINR(d.total_paid)}
                        </td>
                        <td className="p-4 text-right font-bold text-rose-400">
                          {formatCurrencyINR(d.pending_balance)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setLedgerStudentGr(d.gr_no)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-colors text-[11px] flex items-center gap-1 border border-slate-700"
                            >
                              <Eye className="w-3 h-3 text-blue-400" />
                              <span>View Ledger</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("COLLECT");
                                handleSelectStudent({
                                  id: d.student_id,
                                  gr_no: d.gr_no,
                                  full_name: d.full_name,
                                  first_name: d.full_name.split(" ")[0],
                                  last_name: d.full_name.split(" ").slice(-1)[0] || "",
                                  mother_name: d.parent_name || "Mother",
                                  address: "",
                                  pin_code: "",
                                  phone: d.phone,
                                  place_of_birth: "",
                                  dob: "",
                                  aadhar_no: "",
                                  gender: "Male",
                                  religion: "Non-Minority",
                                  category: "OPEN",
                                  division: d.division,
                                  standard: d.standard,
                                  section: d.section,
                                  academic_year: "2026-2027",
                                  status: "Active",
                                });
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-[11px] shadow-sm shadow-blue-600/30"
                            >
                              Collect Fee
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Full Financial & Profile Ledger Modal */}
      <StudentLedgerModal
        grNoOrId={ledgerStudentGr}
        isOpen={!!ledgerStudentGr}
        onClose={() => setLedgerStudentGr(null)}
        onSelectForCollection={async (studentId) => {
          try {
            const res = await api.get(`/students/${studentId}`);
            handleSelectStudent(res.data);
            setActiveTab("COLLECT");
          } catch (e) {
            console.error("Failed to load student for collection:", e);
          }
        }}
      />

      {/* Re-Print Receipt Modal Lightbox */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-lg">Re-Print Official Fee Receipt #{selectedReceipt.receipt_no}</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Parchment Receipt View */}
            <FeeReceipt receipt={selectedReceipt} />
          </div>
        </div>
      )}
    </div>
  );
}
