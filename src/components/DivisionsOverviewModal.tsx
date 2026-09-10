"use client";

import React from "react";
import { X, GraduationCap, Building2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface DivisionsOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DivisionsOverviewModal({
  isOpen,
  onClose
}: DivisionsOverviewModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const divisions = [
    {
      name: "Pre-Primary Section",
      code: "Pre-Primary",
      standards: "Nursery, Jr. KG, Sr. KG",
      pattern: "Early Childhood Foundation",
      theme: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      description: "Focused on activity-based learning, basic language foundations, motor skills development, and introductory activity fees structures."
    },
    {
      name: "School Section",
      code: "School Section",
      standards: "1st Standard to 10th Standard",
      pattern: "State / CBSE Pattern",
      theme: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      description: "Primary and secondary education curricula with Tuition, Term, Computer, and Sports fee heads, mapping dynamic payment timelines."
    },
    {
      name: "Junior College",
      code: "Junior College",
      standards: "11th Standard & 12th Standard",
      pattern: "State Board HSC Pattern",
      theme: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      description: "Streams include Science (Lab/Activity Fees), Commerce (Tally/IT Fees), and Arts (General fees), offering custom monthly installment structures."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Academic Divisions Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Overview of school divisions, standard groupings, and board patterns
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {divisions.map((div, idx) => (
              <div
                key={idx}
                className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${div.theme}`}>
                      Division {idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">{div.pattern}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white">{div.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{div.description}</p>
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Covered Classes:</span>
                    <span className="text-xs text-slate-200 font-bold">{div.standards}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/students?division=${encodeURIComponent(div.code)}`);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <span>View Directory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/fees`);
                    }}
                    className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-purple-500/30"
                  >
                    <span>Manage Structures</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">Avdhoot Bhagwan Ram Vidyalaya Administration Console</span>
          <button
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
