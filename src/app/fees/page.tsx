import FeeCollectionDesk from "@/components/FeeCollectionDesk";
import { Receipt } from "lucide-react";

export const metadata = {
  title: "Fee Management & Collection Desk | School Management System",
};

export default function FeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <Receipt className="w-7 h-7 text-emerald-400" />
            Fee Management & Collection Desk
          </h2>
          <p className="text-sm text-slate-400">
            Search student, calculate late fine, collect payment & issue thermal/A4 receipts
          </p>
        </div>
      </div>

      <FeeCollectionDesk />
    </div>
  );
}
