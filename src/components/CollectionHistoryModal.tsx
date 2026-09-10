"use client";

import React, { useState, useEffect } from "react";
import { X, TrendingUp, Search, Printer, Filter, Receipt } from "lucide-react";
import api from "@/lib/api";
import { FeeReceipt as FeeReceiptType } from "@/types/fee";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import FeeReceipt from "@/components/FeeReceipt";

interface CollectionHistoryModalProps {
  isOpen: boolean;
  academicYear: string;
  totalCollected: number;
  onClose: () => void;
}

export default function CollectionHistoryModal({
  isOpen,
  academicYear,
  totalCollected,
  onClose
}: CollectionHistoryModalProps) {
  const [receipts, setReceipts] = useState<FeeReceiptType[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentModeFilter, setPaymentModeFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Selected receipt for Re-Printing
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceiptType | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReceipts();
    }
  }, [isOpen, academicYear, paymentModeFilter]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      let url = `/fees/payments/all?academic_year=${encodeURIComponent(academicYear)}`;
      if (paymentModeFilter !== "All") {
        url += `&payment_mode=${encodeURIComponent(paymentModeFilter)}`;
      }
      const res = await api.get(url);
      setReceipts(res.data || []);
    } catch (err) {
      console.error("Failed to load collection receipts:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredReceipts = receipts.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.receipt_no.toLowerCase().includes(term) ||
      r.student_name.toLowerCase().includes(term) ||
      r.gr_no.toLowerCase().includes(term) ||
      r.phone.includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Fee Collections & Receipts Register</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Collected: <span className="text-emerald-400 font-bold font-mono text-sm">{formatCurrencyINR(totalCollected)}</span> • <span className="text-blue-400 font-bold font-mono">AY {academicYear}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Receipt No, Student Name, GR No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium">Payment Mode:</span>
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Modes (UPI, Cash, Cheque, NetBanking)</option>
              <option value="UPI">UPI Payment</option>
              <option value="Cash">Cash Counter</option>
              <option value="Cheque">Bank Cheque</option>
              <option value="NetBanking">NetBanking</option>
            </select>
          </div>
        </div>

        {/* Receipts Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading collections register...
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-slate-600" />
              <p className="font-bold text-white">No Receipts Found</p>
              <p className="text-xs">No fee payments recorded for the selected search filters.</p>
            </div>
          ) : (
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Division & Std</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3 text-right">Net Paid (₹)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-400">{r.receipt_no}</td>
                      <td className="p-3">
                        <span className="font-bold text-white block">{r.student_name}</span>
                        <span className="font-mono text-[11px] text-slate-400">{r.gr_no}</span>
                      </td>
                      <td className="p-3">
                        {r.division} - Std {r.standard} ({r.section})
                      </td>
                      <td className="p-3">{formatDate(r.payment_date)}</td>
                      <td className="p-3 font-mono uppercase font-bold text-blue-400">{r.payment_mode}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-emerald-400">
                        {formatCurrencyINR(r.net_paid)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(r)}
                          className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-bold border border-emerald-500/40 flex items-center gap-1 transition-all mx-auto shadow-sm"
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">Total {filteredReceipts.length} Receipts Listed</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Re-Print Receipt Modal Lightbox */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
              <h3 className="font-bold text-white text-lg">Official Fee Receipt #{selectedReceipt.receipt_no}</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
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
