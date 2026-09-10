"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Image as ImageIcon, 
  Printer, 
  DollarSign, 
  Receipt,
  Sparkles,
  ExternalLink,
  Pencil
} from "lucide-react";
import api from "@/lib/api";
import { StudentFullLedger, Student } from "@/types/student";
import { FeeReceipt as FeeReceiptType } from "@/types/fee";
import FeeReceipt from "@/components/FeeReceipt";

interface StudentLedgerModalProps {
  grNoOrId: string | number | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectForCollection?: (studentId: number) => void;
  onEditStudent?: (student: Student) => void;
}

export default function StudentLedgerModal({
  grNoOrId,
  isOpen,
  onClose,
  onSelectForCollection,
  onEditStudent
}: StudentLedgerModalProps) {
  const [data, setData] = useState<StudentFullLedger | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"FINANCIAL" | "FORM" | "DOCUMENTS" | "RECEIPTS">("FINANCIAL");

  // Lightbox modal for document viewing
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Selected receipt for Re-Printing
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceiptType | null>(null);

  useEffect(() => {
    if (isOpen && grNoOrId) {
      fetchStudentLedger();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, grNoOrId]);

  const fetchStudentLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/students/${grNoOrId}/full-ledger`);
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load student ledger:", err);
      setError(err.response?.data?.detail || "Failed to load student record details.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatCurrencyINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const student = data?.student;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-wrap gap-4">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-slate-800 rounded w-48"></div>
              <div className="h-4 bg-slate-800 rounded w-32"></div>
            </div>
          ) : student ? (
            <div className="flex items-center gap-4">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.full_name}
                  onClick={() => setPreviewImage({ url: student.photo_url!, title: `${student.full_name} - Photo` })}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/40 cursor-pointer hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-lg">
                  {student.first_name[0]}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-extrabold text-white">{student.full_name}</h2>
                  <span className="font-mono px-3 py-0.5 text-xs bg-blue-950 text-blue-300 rounded-lg border border-blue-800 font-bold">
                    {student.gr_no}
                  </span>
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {student.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  <span className="text-slate-200 font-semibold">{student.division}</span> • Std {student.standard} ({student.section})
                  {student.stream && <span className="text-blue-400 font-semibold"> • Stream: {student.stream}</span>}
                </p>
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-bold text-white">Student Details & Ledger</h2>
          )}

          <div className="flex items-center gap-3">
            {student && onEditStudent && (
              <button
                type="button"
                onClick={() => {
                  onEditStudent(student);
                  onClose();
                }}
                className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
            {student && onSelectForCollection && (
              <button
                type="button"
                onClick={() => {
                  onSelectForCollection(student.id);
                  onClose();
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>Collect Fee Now</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: "FINANCIAL", label: "📊 Fee Ledger & Dues Breakdown" },
            { id: "FORM", label: "📝 Admission Form Profile" },
            { id: "DOCUMENTS", label: "📷 Uploaded Documents" },
            { id: "RECEIPTS", label: `🧾 Receipts History (${data?.payment_history.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-t-xl font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-white bg-slate-800/80"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading student ledger record...
            </div>
          ) : !data || !student ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No record found for student GR No: {grNoOrId}
            </div>
          ) : (
            <>
              {/* TAB 1: FINANCIAL LEDGER & BREAKDOWN */}
              {activeTab === "FINANCIAL" && (
                <div className="space-y-6">
                  {/* Financial KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <span className="text-slate-400 text-xs block font-medium">Total Structure Due</span>
                      <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                        {formatCurrencyINR(data.total_due)}
                      </span>
                    </div>
                    <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30">
                      <span className="text-emerald-400 text-xs block font-bold">Total Amount Paid</span>
                      <span className="text-xl font-extrabold text-emerald-300 font-mono mt-1 block">
                        {formatCurrencyINR(data.total_paid)}
                      </span>
                    </div>
                    <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-500/30">
                      <span className="text-amber-400 text-xs block font-bold">Advance Credit</span>
                      <span className="text-xl font-extrabold text-amber-300 font-mono mt-1 block">
                        {formatCurrencyINR(data.advance_balance)}
                      </span>
                    </div>
                    <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-500/30">
                      <span className="text-rose-400 text-xs block font-extrabold">Net Pending Due</span>
                      <span className="text-xl font-extrabold text-rose-300 font-mono mt-1 block">
                        {formatCurrencyINR(data.pending_balance)}
                      </span>
                    </div>
                  </div>

                  {/* Fee Head Items Table */}
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Itemized Fee Structure & Collection Status
                      </h3>
                      <span className="text-xs text-slate-400">AY {student.academic_year}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-3">Fee Head / Term</th>
                            <th className="p-3 text-right">Total Due</th>
                            <th className="p-3 text-right">Paid Amount</th>
                            <th className="p-3 text-right">Remaining</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Payment Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {data.structures.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-3">
                                <span className="font-bold text-white block">{st.category}</span>
                                <span className="text-[11px] text-slate-400 font-mono">({st.term})</span>
                              </td>
                              <td className="p-3 text-right font-mono font-medium">{formatCurrencyINR(st.amount)}</td>
                              <td className="p-3 text-right font-mono font-bold text-emerald-400">
                                {formatCurrencyINR(st.paid_amount || 0)}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-rose-400">
                                {formatCurrencyINR(st.remaining_due || 0)}
                              </td>
                              <td className="p-3 text-center">
                                {st.status === "PAID" ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                    FULLY PAID
                                  </span>
                                ) : st.status === "PARTIAL" ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-950 text-amber-400 border border-amber-800">
                                    PARTIAL PAID
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800">
                                    UNPAID
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {st.paid_date ? (
                                  <div className="text-[11px] space-y-0.5">
                                    <span className="text-slate-400 block">{formatDate(st.paid_date)}</span>
                                    <span className="font-mono text-emerald-400 font-bold">REC #{st.receipt_no}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-600 text-[11px] italic">Not Collected</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ADMISSION FORM & PERSONAL DETAILS */}
              {activeTab === "FORM" && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic & Candidate Details */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2">
                        Candidate & Demographic Info
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-slate-300">
                        <div>
                          <span className="text-slate-500 block">First Name</span>
                          <span className="font-semibold text-white">{student.first_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Middle Name</span>
                          <span className="font-semibold text-white">{student.middle_name || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Last Name / Surname</span>
                          <span className="font-semibold text-white">{student.last_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Mother's Name</span>
                          <span className="font-semibold text-white">{student.mother_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Date of Birth</span>
                          <span className="font-semibold text-white">{formatDate(student.dob)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Gender</span>
                          <span className="font-semibold text-white">{student.gender}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Religion</span>
                          <span className="font-semibold text-white">{student.religion}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Category</span>
                          <span className="font-semibold text-white">{student.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Place of Birth</span>
                          <span className="font-semibold text-white">{student.place_of_birth}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Aadhar Card No</span>
                          <span className="font-semibold text-white font-mono">{student.aadhar_no}</span>
                        </div>
                      </div>
                    </div>

                    {/* Address & Contact Info */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2">
                        Address & Contact Info
                      </h4>
                      <div className="space-y-3 text-slate-300">
                        <div>
                          <span className="text-slate-500 block">Parent Mobile Number</span>
                          <span className="font-bold text-emerald-400 font-mono text-sm">{student.phone}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Email Address</span>
                          <span className="font-semibold text-white">{student.email || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Residential Address</span>
                          <span className="font-semibold text-white block mt-0.5">{student.address}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">PIN Code</span>
                          <span className="font-semibold text-white font-mono">{student.pin_code}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: UPLOADED DOCUMENTS */}
              {activeTab === "DOCUMENTS" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Uploaded Proof Documents & Images
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { title: "Candidate Photo", url: student.photo_url },
                      { title: "Candidate Signature", url: student.signature_url },
                      { title: "Aadhar Front", url: student.aadhar_front_url },
                      { title: "Aadhar Back", url: student.aadhar_back_url },
                    ].map((doc, i) => (
                      <div
                        key={i}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-2"
                      >
                        <span className="text-xs font-bold text-slate-300">{doc.title}</span>
                        {doc.url ? (
                          <div
                            onClick={() => setPreviewImage({ url: doc.url!, title: doc.title })}
                            className="relative group cursor-pointer w-full h-36 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center"
                          >
                            <img src={doc.url} alt={doc.title} className="max-h-full max-w-full object-contain" />
                            <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                              <ExternalLink className="w-4 h-4" /> View Full
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-36 rounded-xl border border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 text-xs">
                            <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                            <span>Not Uploaded</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: RECEIPTS HISTORY */}
              {activeTab === "RECEIPTS" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    All Payment Receipts Issued
                  </h4>
                  {data.payment_history.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4">No payment receipts issued yet for this student.</p>
                  ) : (
                    <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-3">Receipt No</th>
                            <th className="p-3">Payment Date</th>
                            <th className="p-3">Mode</th>
                            <th className="p-3 text-right">Net Paid (₹)</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {data.payment_history.map((receipt) => (
                            <tr key={receipt.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-3 font-mono font-bold text-amber-400">{receipt.receipt_no}</td>
                              <td className="p-3">{formatDate(receipt.payment_date)}</td>
                              <td className="p-3 font-mono uppercase">{receipt.payment_mode}</td>
                              <td className="p-3 text-right font-mono font-bold text-emerald-400">
                                {formatCurrencyINR(receipt.net_paid)}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReceipt(receipt)}
                                  className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-bold border border-blue-500/40 flex items-center gap-1.5 transition-all mx-auto"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>View Receipt</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">Student ID: {student?.id || "N/A"}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col p-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
              <span className="text-sm font-bold text-white">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center">
              <img src={previewImage.url} alt={previewImage.title} className="max-h-[80vh] max-w-full object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* Re-Print Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative bg-slate-900 border border-slate-800 max-w-3xl w-full rounded-2xl p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Receipt #{selectedReceipt.receipt_no}</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FeeReceipt receipt={selectedReceipt} />
          </div>
        </div>
      )}
    </div>
  );
}
