"use client";

import React, { useState, useEffect } from "react";
import { X, Users, Building2, GraduationCap, ArrowRight, BookOpen, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface DivisionItem {
  division: string;
  count: number;
}

interface StandardItem {
  division: string;
  standard: string;
  count: number;
}

interface SectionItem {
  division: string;
  standard: string;
  section: string;
  count: number;
}

interface StreamItem {
  standard: string;
  stream: string;
  count: number;
}

interface CountBreakdownData {
  academic_year: string;
  total_students: number;
  division_breakdown: DivisionItem[];
  standard_breakdown: StandardItem[];
  section_breakdown: SectionItem[];
  stream_breakdown: StreamItem[];
}

interface StudentCountModalProps {
  isOpen: boolean;
  academicYear: string;
  onClose: () => void;
}

export default function StudentCountModal({ isOpen, academicYear, onClose }: StudentCountModalProps) {
  const router = useRouter();
  const [data, setData] = useState<CountBreakdownData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"DIVISION" | "STANDARD" | "SECTION" | "STREAM">("STANDARD");

  useEffect(() => {
    if (isOpen) {
      fetchBreakdown();
    }
  }, [isOpen, academicYear]);

  const fetchBreakdown = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/count-breakdown?academic_year=${encodeURIComponent(academicYear)}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load student count breakdown:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Student Enrollment Distribution</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Class-wise & Division-wise Breakdown • <span className="text-blue-400 font-bold font-mono">Academic Year {academicYear}</span>
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

        {/* Tab Selection */}
        <div className="px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: "STANDARD", label: "🏫 Standard / Class Wise", icon: GraduationCap },
            { id: "DIVISION", label: "🏢 Division Wise", icon: Building2 },
            { id: "SECTION", label: "📚 Section Wise (Sec A/B/C)", icon: Layers },
            { id: "STREAM", label: "🔬 Stream Wise (Junior College)", icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-t-xl font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-white bg-slate-800/80"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Calculating student distribution counts...
            </div>
          ) : !data ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No count data available for Academic Year {academicYear}
            </div>
          ) : (
            <>
              {/* Total Summary Banner */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-blue-400 block">
                    Total Active Enrolled Students
                  </span>
                  <span className="text-3xl font-black text-white font-mono mt-0.5 block">
                    {data.total_students} Students
                  </span>
                </div>
                <div className="text-right text-xs text-slate-300">
                  <span className="block font-bold">Avdhoot Bhagwan Ram Vidyalaya</span>
                  <span className="text-slate-400">AY {data.academic_year}</span>
                </div>
              </div>

              {/* TAB 1: STANDARD / CLASS WISE */}
              {activeTab === "STANDARD" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.standard_breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onClose();
                        router.push(`/students?division=${encodeURIComponent(item.division)}&standard=${encodeURIComponent(item.standard)}`);
                      }}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase block">{item.division}</span>
                        <span className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors">
                          Std {item.standard}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400 font-mono block">
                          {item.count}
                        </span>
                        <span className="text-[10px] text-blue-400 flex items-center gap-0.5 justify-end font-semibold">
                          View Students <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: DIVISION WISE */}
              {activeTab === "DIVISION" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.division_breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onClose();
                        router.push(`/students?division=${encodeURIComponent(item.division)}`);
                      }}
                      className="p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-blue-950 text-blue-300 text-xs font-bold rounded-lg border border-blue-800">
                          {item.division}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div className="flex items-baseline justify-between pt-2">
                        <span className="text-xs text-slate-400 font-medium">Enrolled Students:</span>
                        <span className="text-2xl font-black text-white font-mono">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: SECTION WISE */}
              {activeTab === "SECTION" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.section_breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onClose();
                        router.push(`/students?division=${encodeURIComponent(item.division)}&standard=${encodeURIComponent(item.standard)}&section=${encodeURIComponent(item.section)}`);
                      }}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block">{item.division}</span>
                        <span className="text-sm font-extrabold text-white">
                          Std {item.standard} (<span className="text-blue-400 font-mono">Sec {item.section}</span>)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400 font-mono block">
                          {item.count}
                        </span>
                        <span className="text-[10px] text-blue-400 flex items-center gap-0.5 justify-end font-semibold">
                          View <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: STREAM WISE */}
              {activeTab === "STREAM" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.stream_breakdown.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 col-span-3">No stream breakdown recorded for Junior College.</p>
                  ) : (
                    data.stream_breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onClose();
                          router.push(`/students?division=Junior%20College&standard=${encodeURIComponent(item.standard)}&stream=${encodeURIComponent(item.stream)}`);
                        }}
                        className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 block">Junior College</span>
                          <span className="text-sm font-extrabold text-white">
                            Std {item.standard} [<span className="text-purple-400">{item.stream}</span>]
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-emerald-400 font-mono block">
                            {item.count}
                          </span>
                          <span className="text-[10px] text-blue-400 flex items-center gap-0.5 justify-end font-semibold">
                            View <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">Click any class card to filter in Student Directory</span>
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
