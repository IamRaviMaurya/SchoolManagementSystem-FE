"use client";

import { useState } from "react";
import { FeeReceipt as FeeReceiptType } from "@/types/fee";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { Printer, FileText, Building2 } from "lucide-react";

interface FeeReceiptProps {
  receipt: FeeReceiptType;
}

export default function FeeReceipt({ receipt }: FeeReceiptProps) {
  const [printMode, setPrintMode] = useState<"A4" | "THERMAL">("A4");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Non-printable Action Controls */}
      <div className="no-print glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">
            Receipt Format Preview:
          </span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPrintMode("A4")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                printMode === "A4"
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Standard A4 Paper
            </button>
            <button
              onClick={() => setPrintMode("THERMAL")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                printMode === "THERMAL"
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              80mm Thermal Receipt
            </button>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Printer className="w-4 h-4" />
          Print Official Receipt
        </button>
      </div>

      {/* Printable Receipt Container in Parchment #f3f1e4 Background */}
      <div
        style={{ backgroundColor: "#f3f1e4", color: "#1e293b" }}
        className={`mx-auto shadow-2xl rounded-2xl transition-all duration-300 ${
          printMode === "THERMAL"
            ? "thermal-mode max-w-[80mm] p-4 text-xs font-mono border-t-4 border-amber-900"
            : "a4-mode max-w-3xl p-8 border-2 border-amber-900/30 font-sans"
        }`}
      >
        {/* Header Block with Official Logo */}
        <div className="text-center border-b-2 border-amber-900/30 pb-4 mb-4 space-y-2">
          {/* Official Trust & School Emblem Logo */}
          <div className="flex justify-center items-center mb-2">
            <img
              src="/school_logo.png"
              alt="Shree Surendra Education Trust - Avdhoot Bhagwan Ram Vidyalaya"
              className={printMode === "THERMAL" ? "h-20 object-contain" : "h-32 object-contain drop-shadow-md"}
            />
          </div>

          <div>
            <h4 className={`font-bold tracking-wide text-amber-950 uppercase ${printMode === "THERMAL" ? "text-[11px]" : "text-xs"}`}>
              SHREE SURENDRA EDUCATION TRUST (REGD.)
            </h4>
            <h1
              className={`font-black tracking-tight text-amber-950 uppercase ${
                printMode === "THERMAL" ? "text-sm font-bold" : "text-2xl font-extrabold"
              }`}
            >
              AVDHOOT BHAGWAN RAM VIDYALAYA
            </h1>
            <p className={printMode === "THERMAL" ? "text-[9px] text-slate-700" : "text-xs text-slate-700 font-semibold"}>
              Pre-Primary, Primary, High School & Junior College (Arts, Science, Commerce)
            </p>
            <p className={printMode === "THERMAL" ? "text-[8px] text-slate-600" : "text-[11px] text-slate-600 mt-0.5"}>
              Affiliation & Regd No: SSET/ABRV/2026 | Educational Campus, Maharashtra
            </p>
          </div>
        </div>

        {/* Title Badge */}
        <div className="text-center mb-5">
          <span
            style={{ backgroundColor: "#e8e4d0", borderColor: "#78350f" }}
            className={`inline-block font-black uppercase tracking-widest text-amber-950 px-4 py-1 rounded-md border ${
              printMode === "THERMAL" ? "text-[10px]" : "text-xs shadow-sm"
            }`}
          >
            OFFICIAL FEE PAYMENT RECEIPT
          </span>
        </div>

        {/* Details Grid */}
        <div
          className={`grid mb-5 gap-x-6 gap-y-2 border-b border-amber-900/20 pb-4 ${
            printMode === "THERMAL" ? "grid-cols-1 text-[10px]" : "grid-cols-2 text-xs"
          }`}
        >
          <div>
            <span className="font-bold text-slate-700">Receipt Number: </span>
            <span className="font-mono font-bold text-amber-950">{receipt.receipt_no}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Payment Date: </span>
            <span className="font-semibold text-slate-950">{formatDate(receipt.payment_date)}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">GR Number: </span>
            <span className="font-mono font-bold text-blue-900">{receipt.gr_no}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Student Name: </span>
            <span className="font-bold text-amber-950 uppercase">{receipt.student_name}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Division & Class: </span>
            <span className="font-semibold text-slate-900">
              {receipt.division} - Std {receipt.standard} ({receipt.section})
            </span>
          </div>
          {receipt.stream && (
            <div>
              <span className="font-bold text-slate-700">Stream: </span>
              <span className="font-semibold text-slate-900">{receipt.stream}</span>
            </div>
          )}
          <div>
            <span className="font-bold text-slate-700">Mother / Parent Name: </span>
            <span className="font-semibold text-slate-900">{receipt.parent_name}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">Contact Number: </span>
            <span className="font-semibold text-slate-900">{receipt.phone}</span>
          </div>
        </div>

        {/* Fee Breakdown Table */}
        <table className="w-full text-left mb-5 border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#e2ddc7" }} className="border-b-2 border-amber-950/40 text-amber-950">
              <th className="py-2 px-3 font-bold">#</th>
              <th className="py-2 px-3 font-bold">Fee Head Category / Description</th>
              <th className="py-2 px-3 font-bold text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-900/10">
            {receipt.items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-2 px-3 text-slate-600 font-medium">{idx + 1}</td>
                <td className="py-2 px-3 font-bold text-slate-900">{item.fee_head}</td>
                <td className="py-2 px-3 text-right font-bold text-amber-950 font-mono">
                  {formatCurrencyINR(item.amount)}
                </td>
              </tr>
            ))}
            {receipt.late_fine > 0 && (
              <tr className="text-amber-950 font-bold bg-amber-200/30">
                <td className="py-2 px-3">-</td>
                <td className="py-2 px-3">Late Payment Fine (+)</td>
                <td className="py-2 px-3 text-right font-mono">
                  +{formatCurrencyINR(receipt.late_fine)}
                </td>
              </tr>
            )}
            {receipt.discount > 0 && (
              <tr className="text-emerald-950 font-bold bg-emerald-200/30">
                <td className="py-2 px-3">-</td>
                <td className="py-2 px-3">Concession / Scholarship Discount (-)</td>
                <td className="py-2 px-3 text-right font-mono">
                  -{formatCurrencyINR(receipt.discount)}
                </td>
              </tr>
            )}
            {receipt.advance_used && receipt.advance_used > 0 ? (
              <tr className="text-amber-950 font-bold bg-amber-200/30">
                <td className="py-2 px-3">-</td>
                <td className="py-2 px-3">Advance Credit Applied (-)</td>
                <td className="py-2 px-3 text-right font-mono">
                  -{formatCurrencyINR(receipt.advance_used)}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {/* Totals & Payment Mode Summary */}
        <div style={{ backgroundColor: "#e5dfc9" }} className="border-2 border-amber-900/30 p-4 rounded-xl space-y-1.5 mb-6">
          <div className="flex justify-between font-black text-base border-b border-amber-900/20 pb-2">
            <span className="text-amber-950 uppercase tracking-wide">Total Paid Amount:</span>
            <span className="text-emerald-950 font-mono text-lg font-extrabold">
              {formatCurrencyINR(receipt.net_paid)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-800 pt-1">
            <span className="font-bold">Payment Mode:</span>
            <span className="font-bold uppercase font-mono">{receipt.payment_mode}</span>
          </div>
          {receipt.transaction_ref && (
            <div className="flex justify-between text-xs text-slate-800">
              <span className="font-bold">Transaction Ref / UTR:</span>
              <span className="font-mono font-semibold">{receipt.transaction_ref}</span>
            </div>
          )}
          {receipt.advance_balance_remaining && receipt.advance_balance_remaining > 0 ? (
            <div className="flex justify-between text-xs text-amber-900 font-bold">
              <span>Remaining Advance Credit Balance:</span>
              <span className="font-mono">{formatCurrencyINR(receipt.advance_balance_remaining)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-xs border-t border-dashed border-amber-900/30 pt-1 mt-1">
            <span className="font-bold text-slate-700">Remaining Balance Dues:</span>
            <span className="font-mono font-bold text-rose-800">
              {formatCurrencyINR(receipt.pending_due)}
            </span>
          </div>
        </div>

        {/* Previous Payment History Section (if student paid earlier) */}
        {receipt.previous_payments && receipt.previous_payments.length > 0 && (
          <div className="mb-6 pt-3 border-t-2 border-amber-950/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 mb-2">
              📜 Previous Payment History & Transaction Statement
            </h4>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#e2ddc7" }} className="border-b border-amber-950/30 text-amber-950">
                  <th className="py-1.5 px-2 font-bold">Receipt #</th>
                  <th className="py-1.5 px-2 font-bold">Date</th>
                  <th className="py-1.5 px-2 font-bold">Mode</th>
                  <th className="py-1.5 px-2 font-bold">Fee Heads Paid</th>
                  <th className="py-1.5 px-2 font-bold text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 text-slate-800 font-medium">
                {receipt.previous_payments.map((prev, pIdx) => (
                  <tr key={prev.id || pIdx}>
                    <td className="py-1.5 px-2 font-mono font-bold text-amber-900">{prev.receipt_no}</td>
                    <td className="py-1.5 px-2">{formatDate(prev.payment_date)}</td>
                    <td className="py-1.5 px-2 font-mono uppercase">{prev.payment_mode}</td>
                    <td className="py-1.5 px-2 text-[11px] text-slate-700">{prev.items_summary}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-900">
                      {formatCurrencyINR(prev.net_paid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature & Disclaimer Block */}
        <div className="mt-8 pt-4 border-t border-amber-900/30 flex items-end justify-between">
          <div className="text-[10px] text-slate-700 space-y-0.5 font-medium">
            <p>Issued By: <span className="font-bold">{receipt.collected_by}</span></p>
            <p>Computer generated official fee receipt. Valid without seal if printed.</p>
          </div>
          <div className="text-center space-y-1">
            <div className="w-36 border-b-2 border-slate-700 mb-1"></div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-950">Authorized Signatory / Cashier</p>
          </div>
        </div>
      </div>
    </div>
  );
}
