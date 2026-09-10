"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Megaphone, 
  Send, 
  Users, 
  UserCheck, 
  Volume2, 
  AlertCircle,
  FileText,
  Calendar
} from "lucide-react";

interface Notice {
  id: number;
  target_type: string;
  target_value: string | null;
  title: string;
  message: string;
  created_at: string;
}

interface Student {
  id: number;
  gr_no: string;
  full_name: string;
  division: string;
  standard: string;
  section: string;
}

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<"broadcast" | "conduct">("broadcast");
  
  // Notice broadcast states
  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [targetValue, setTargetValue] = useState("");
  const [noticesList, setNoticesList] = useState<Notice[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Conduct remark states
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [behaviorType, setBehaviorType] = useState("Achievement");
  const [conductRemark, setConductRemark] = useState("");
  const [conductLoading, setConductLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "broadcast") {
      fetchNotices();
    } else {
      fetchStudents();
    }
  }, [activeTab]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/academic/notices");
      setNoticesList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !messageText) return;
    setSubmitting(true);

    try {
      const payload = {
        target_type: targetType,
        target_value: targetType === "ALL" ? null : targetValue,
        title,
        message: messageText
      };

      await api.post("/academic/notices", payload);
      setTitle("");
      setMessageText("");
      setTargetValue("");
      fetchNotices();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchStudents = async () => {
    setConductLoading(true);
    try {
      const res = await api.get("/students?limit=20");
      setStudentsList(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedStudent(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConductLoading(false);
    }
  };

  const handleSaveConductRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !conductRemark) return;

    try {
      // Reuse co-curricular update for saving general conduct remarks
      await api.post("/academic/co-curricular", {
        student_id: selectedStudent.id,
        sports_grade: "A",
        behavior_grade: behaviorType === "Disciplinary Issue" ? "C" : "A",
        attendance_percentage: 100.0,
        remarks: `[${behaviorType}] ${conductRemark}`
      });
      setConductRemark("");
      alert("Conduct remark saved in student ledger database successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-indigo-500" />
            <span>Communication & Parent Noticeboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Broadcast emergency alerts, school announcements, circular notices, and log individual student behavior remarks.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "broadcast" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            School Board Broadcast
          </button>
          <button
            onClick={() => setActiveTab("conduct")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "conduct" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Conduct Remark Log
          </button>
        </div>
      </div>

      {/* Broadcast tab */}
      {activeTab === "broadcast" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Broadcast notice form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4.5 h-4.5 text-blue-400" />
              <span>Compose Circular Notice</span>
            </h2>

            <form onSubmit={handleBroadcastNotice} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Audience</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="ALL">All Students & Parents</option>
                  <option value="CLASS">Specific Class Standard</option>
                  <option value="STUDENT">Individual Student (via GR)</option>
                </select>
              </div>

              {targetType !== "ALL" && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {targetType === "CLASS" ? "Class Name (e.g. School Section-7th-B)" : "Student GR No"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={targetType === "CLASS" ? "e.g. School Section-7th-B" : "e.g. GR-2026-0001"}
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Circular Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parent-Teacher Meeting Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notice Message Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write clear announcement information here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Broadcasting..." : "Broadcast Notice"}</span>
              </button>
            </form>
          </div>

          {/* Right sent circular list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Sent Announcements & Circulars</span>
            </div>

            {loading ? (
              <div className="glass-panel p-8 text-center text-slate-400">Loading notices board...</div>
            ) : noticesList.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400 space-y-2">
                <Volume2 className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">No announcements posted on notice board.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {noticesList.map((n) => (
                  <div key={n.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3.5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600/10 border-l border-b border-blue-500/20 rounded-bl-xl text-[9px] text-blue-400 font-mono font-bold uppercase">
                      Target: {n.target_type} {n.target_value ? `(${n.target_value})` : ""}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>{n.title}</span>
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">"{n.message}"</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sent Date: {new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conduct Remark log tab */}
      {activeTab === "conduct" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Student Selector */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 h-fit no-print">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Select Student</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {studentsList.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStudent(st)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedStudent?.id === st.id
                      ? "bg-indigo-600/20 border-indigo-500/40 text-white"
                      : "bg-slate-900/40 border-transparent text-slate-400 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="font-mono text-[10px] text-slate-500">{st.gr_no}</div>
                  <div>{st.full_name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Inputs Card */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Log Behavior & Conduct Remark</span>
            </h3>

            {selectedStudent ? (
              <form onSubmit={handleSaveConductRemark} className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-0.5 text-xs">
                  <div>Logging For Student: <span className="font-bold text-white">{selectedStudent.full_name}</span></div>
                  <div>GR Number: <span className="font-mono text-slate-300">{selectedStudent.gr_no}</span></div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Behavior Event Type</label>
                  <select
                    value={behaviorType}
                    onChange={(e) => setBehaviorType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="Achievement">Scholastic / Co-Scholastic Achievement</option>
                    <option value="Conduct Alert">General Conduct Remark</option>
                    <option value="Disciplinary Issue">Disciplinary Misconduct Alert</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Behavior / Disciplinary Remarks Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe student behavior incident or achievements detail for parents views..."
                    value={conductRemark}
                    onChange={(e) => setConductRemark(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Save Remark to Ledger
                </button>
              </form>
            ) : (
              <div className="text-center text-slate-500 py-8">Select a student from left to load remark sheet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
