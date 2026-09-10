"use client";

import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Eye, CreditCard, Filter, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Defaulter } from "@/types/fee";
import { formatCurrencyINR } from "@/lib/utils";

interface DefaultersSummaryModalProps {
  isOpen: boolean;
  totalPending: number;
  defaulterCount: number;
  onClose: () => void;
  onOpenLedger: (grNo: string) => void;
}

export default function DefaultersSummaryModal({
  isOpen,
  totalPending,
  defaulterCount,
  onClose,
  onOpenLedger
}: DefaultersSummaryModalProps) {
  const router = useRouter();
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [loading, setLoading] = useState(false);
  const [divisionFilter, setDivisionFilter] = useState("All");

  useEffect(() => {
    if (isOpen) {
      fetchDefaulters();
    }
  }, [isOpen, divisionFilter]);

  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      let url = `/fees/defaulters?min_due=1.0`;
      if (divisionFilter !== "All") {
        url += `&division=${encodeURIComponent(divisionFilter)}`;
      }
      const res = await api.get(url);
      setDefaulters(res.data || []);
    } catch (err) {
      console.error("Failed to load defaulters summary:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Outstanding Dues & Fee Defaulters</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Outstanding: <span className="text-rose-400 font-bold font-mono text-sm">{formatCurrencyINR(totalPending)}</span> • <span className="text-amber-400 font-bold font-mono">{defaulterCount} Defaulter Students</span>
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
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium">Division Filter:</span>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-rose-500"
            >
              <option value="All">All Academic Divisions</option>
              <option value="Pre-Primary">Pre-Primary</option>
              <option value="School Section">School Section</option>
              <option value="Junior College">Junior College</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/fees?tab=DEFAULTERS");
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/30"
          >
            <span>Open Defaulters Management</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Defaulters Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading defaulter student balances...
            </div>
          ) : defaulters.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No defaulter students found for division: {divisionFilter}
            </div>
          ) : (
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">GR No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Division & Std</th>
                    <th className="p-3">Parent Phone</th>
                    <th className="p-3 text-right">Total Fee</th>
                    <th className="p-3 text-right">Total Paid</th>
                    <th className="p-3 text-right">Pending Balance</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {defaulters.map((d) => (
                    <tr key={d.student_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenLedger(d.gr_no);
                          }}
                          className="font-mono font-bold text-blue-400 hover:text-blue-300 underline"
                        >
                          {d.gr_no}
                        </button>
                      </td>
                      <td className="p-3 font-bold text-white">{d.full_name}</td>
                      <td className="p-3">
                        {d.division} - Std {d.standard} ({d.section})
                      </td>
                      <td className="p-3 font-mono">{d.phone}</td>
                      <td className="p-3 text-right font-mono font-medium">{formatCurrencyINR(d.total_due)}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrencyINR(d.total_paid)}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-rose-400">
                        {formatCurrencyINR(d.pending_balance)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenLedger(d.gr_no);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[11px] border border-slate-700 flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3 h-3 text-blue-400" />
                          <span>Ledger</span>
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
          <span className="text-xs text-slate-500">Total {defaulters.length} Defaulter Records</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
