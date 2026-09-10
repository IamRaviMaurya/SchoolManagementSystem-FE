"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { FeeReceipt as FeeReceiptType } from "@/types/fee";
import FeeReceipt from "@/components/FeeReceipt";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";

export default function PrintableReceiptPage() {
  const params = useParams();
  const receiptId = params.id;
  const [receipt, setReceipt] = useState<FeeReceiptType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipt() {
      if (!receiptId) return;
      try {
        const res = await api.get(`/fees/receipt/${receiptId}`);
        setReceipt(res.data);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.response?.data?.detail || "Failed to load receipt details.");
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [receiptId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Loading printable receipt #{receiptId}...
      </div>
    );
  }

  if (errorMsg || !receipt) {
    return (
      <div className="max-w-md mx-auto my-12 glass-panel p-8 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Receipt Not Found</h3>
        <p className="text-xs text-slate-400">{errorMsg || "Invalid receipt reference."}</p>
        <Link
          href="/fees"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Fee Collection Desk
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Navigation (hidden during printing) */}
      <div className="no-print flex items-center justify-between">
        <Link
          href="/fees"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collection Desk
        </Link>
      </div>

      {/* Printable Receipt Component */}
      <FeeReceipt receipt={receipt} />
    </div>
  );
}
