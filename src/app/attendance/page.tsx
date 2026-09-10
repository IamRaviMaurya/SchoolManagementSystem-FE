"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Check, 
  X, 
  Clock, 
  Percent, 
  CalendarDays, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  UserCheck
} from "lucide-react";

interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  gr_no: string;
  date: string;
  status: string; // PRESENT, ABSENT, LATE, HALF_DAY
  lecture_no: number;
  marked_by_teacher_id: number | null;
}

interface StudentLeave {
  id: number;
  student_id: number;
  student_name: string;
  gr_no: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string; // PENDING, APPROVED, REJECTED
  actioned_by: string | null;
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<"mark" | "leaves" | "records">("mark");
  const [loading, setLoading] = useState(false);
  
  // Mark Attendance States
  const [role, setRole] = useState("admin");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [division, setDivision] = useState("School Section");
  const [standard, setStandard] = useState("7th");
  const [section, setSection] = useState("B");

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") || "admin";
    setRole(savedRole);
    if (savedRole === "teacher") {
      const teacherClass = localStorage.getItem("assignedClass") || "7th";
      const teacherSection = localStorage.getItem("assignedSection") || "B";
      setStandard(teacherClass);
      setSection(teacherSection);
      
      const getDivisionFromStandard = (std: string) => {
        if (["Nursery", "Jr. KG", "Sr. KG"].includes(std)) return "Pre-Primary";
        if (["11th", "12th"].includes(std)) return "Junior College";
        return "School Section";
      };
      setDivision(getDivisionFromStandard(teacherClass));
    }
  }, []);
  const [lectureNo, setLectureNo] = useState(0); // 0 = Full Day, 1-5 = Lectures
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Auto clear popup notification after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Student Leaves States
  const [leavesList, setLeavesList] = useState<StudentLeave[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);

  // Attendance History States
  const [historyType, setHistoryType] = useState<"attendance" | "leaves">("attendance");
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("week");
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split("T")[0]);
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyAttendanceList, setHistoryAttendanceList] = useState<any[]>([]);
  const [historyLeavesList, setHistoryLeavesList] = useState<any[]>([]);

  // Available standards based on division
  const getStandardOptions = () => {
    if (division === "Pre-Primary") return ["Nursery", "Jr. KG", "Sr. KG"];
    if (division === "School Section") return ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
    if (division === "Junior College") return ["11th", "12th"];
    return [];
  };

  const getWeekRange = (baseDateStr: string) => {
    const baseDate = new Date(baseDateStr);
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(baseDate.setDate(diff));
    
    const weekDates = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d.toISOString().split("T")[0]);
    }
    return weekDates;
  };

  const fetchHistoryData = async () => {
    setHistoryLoading(true);
    try {
      let start = "";
      let end = "";
      
      if (timeframe === "week") {
        const weekDates = getWeekRange(historyDate);
        start = weekDates[0];
        end = weekDates[5];
      } else if (timeframe === "month") {
        start = `${historyMonth}-01`;
        const year = parseInt(historyMonth.split("-")[0]);
        const month = parseInt(historyMonth.split("-")[1]);
        const lastDay = new Date(year, month, 0).getDate();
        end = `${historyMonth}-${String(lastDay).padStart(2, "0")}`;
      } else {
        // Year-wise: academic session 2026-2027
        start = "2026-06-01";
        end = "2027-04-30";
      }

      if (historyType === "attendance") {
        const res = await api.get(`/academic/attendance/history`, {
          params: {
            start_date: start,
            end_date: end,
            division,
            standard,
            section
          }
        });
        setHistoryAttendanceList(res.data || []);
      } else {
        const res = await api.get(`/academic/student-leaves`, {
          params: {
            start_date: start,
            end_date: end,
            standard,
            section
          }
        });
        setHistoryLeavesList(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to load history records.", type: "error" });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "mark") {
      fetchAttendance();
    } else if (activeTab === "leaves") {
      fetchLeaves();
    }
  }, [activeTab, date, division, standard, section, lectureNo]);

  useEffect(() => {
    if (activeTab === "records") {
      fetchHistoryData();
    }
  }, [activeTab, historyType, timeframe, historyDate, historyMonth, division, standard, section]);

  // Handle standard reset when division changes
  useEffect(() => {
    if (role === "teacher") return;
    const opts = getStandardOptions();
    if (opts.length > 0 && !opts.includes(standard)) {
      setStandard(opts[0]);
    }
  }, [division, role]);

  const fetchAttendance = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get(
        `/academic/attendance?date=${date}&division=${encodeURIComponent(division)}&standard=${encodeURIComponent(standard)}&section=${section}&lecture_no=${lectureNo}`
      );
      setAttendanceList(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to fetch student attendance list.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    setLeavesLoading(true);
    try {
      const res = await api.get("/academic/student-leaves");
      setLeavesList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLeavesLoading(false);
    }
  };

  const handleStatusChange = (studentId: number, status: string) => {
    setAttendanceList(prev => 
      prev.map(item => item.student_id === studentId ? { ...item, status } : item)
    );
  };

  const handleMarkAllPresent = () => {
    setAttendanceList(prev => prev.map(item => ({ ...item, status: "PRESENT" })));
  };

  const handleSaveAttendance = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        date,
        division,
        standard,
        section,
        lecture_no: lectureNo,
        teacher_id: 1, // Default Verma Sir
        records: attendanceList.map(item => ({
          student_id: item.student_id,
          date: item.date,
          status: item.status,
          lecture_no: item.lecture_no,
          marked_by_teacher_id: 1
        }))
      };

      await api.post("/academic/attendance/bulk", payload);
      setMessage({ text: "Attendance sheet updated successfully!", type: "success" });
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to save attendance register.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionLeave = async (leaveId: number, status: "APPROVED" | "REJECTED") => {
    try {
      const adminName = localStorage.getItem("fullName") || "Verma Sir";
      await api.put(`/academic/student-leaves/${leaveId}/status?status=${status}&actioned_by=${encodeURIComponent(adminName)}`);
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-blue-500" />
            <span>Attendance & Leave Desk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track daily class presence, lecture attendance register & parent leave request approvals.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-fit flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("mark")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "mark" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mark Daily Attendance
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "leaves" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Student Leave Requests
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "records" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Attendance & Leaves Records
          </button>
        </div>
      </div>

      {/* Mark Attendance Tab */}
      {activeTab === "mark" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="glass-panel p-4 rounded-2xl grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

             <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Division</label>
              <select
                disabled={role === "teacher"}
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold disabled:opacity-60"
              >
                <option value="Pre-Primary">Pre-Primary</option>
                <option value="School Section">School Section</option>
                <option value="Junior College">Junior College</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class / Std</label>
              <select
                disabled={role === "teacher"}
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold disabled:opacity-60"
              >
                {getStandardOptions().map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section</label>
              <select
                disabled={role === "teacher"}
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold disabled:opacity-60"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lecture Type</label>
              <select
                value={lectureNo}
                onChange={(e) => setLectureNo(parseInt(e.target.value, 10))}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="0">Full Day Attendance</option>
                <option value="1">Lecture 1 (Morning)</option>
                <option value="2">Lecture 2</option>
                <option value="3">Lecture 3</option>
                <option value="4">Lecture 4</option>
                <option value="5">Lecture 5 (Afternoon)</option>
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="w-full py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Mark All Present</span>
              </button>
            </div>
          </div>

          {/* Message notification as premium pop-up toast */}
          {message && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce transition-all">
              <div className={`p-4 px-6 rounded-2xl text-xs font-bold flex items-center gap-3 border shadow-2xl backdrop-blur-md ${
                message.type === "success" 
                  ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10" 
                  : "bg-rose-950/90 border-rose-500/30 text-rose-400 shadow-rose-500/10"
              }`}>
                {message.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                )}
                <span>{message.text}</span>
                <button 
                  onClick={() => setMessage(null)}
                  className="ml-3 text-slate-400 hover:text-white font-bold transition-colors"
                  title="Close Notification"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* List panel */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Fetching student roster...</div>
            ) : attendanceList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">No active students registered for this class.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[11px] tracking-wider font-bold">
                      <th className="py-3 px-4">GR No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Class Room Details</th>
                      <th className="py-3 px-4 text-center">Attendance Register Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {attendanceList.map((rec) => (
                      <tr key={rec.student_id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-300 font-semibold">{rec.gr_no}</td>
                        <td className="py-3.5 px-4 text-xs font-bold text-white">{rec.student_name}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          Std {standard} ({section}) • {division}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                            {/* Present */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rec.student_id, "PRESENT")}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                rec.status === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow shadow-emerald-600/35"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Present
                            </button>
                            {/* Absent */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rec.student_id, "ABSENT")}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                rec.status === "ABSENT"
                                  ? "bg-rose-600 text-white shadow shadow-rose-600/35"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Absent
                            </button>
                            {/* Late */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rec.student_id, "LATE")}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                rec.status === "LATE"
                                  ? "bg-amber-600 text-white shadow shadow-amber-600/35"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Late
                            </button>
                            {/* Half Day */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rec.student_id, "HALF_DAY")}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                rec.status === "HALF_DAY"
                                  ? "bg-blue-600 text-white shadow shadow-blue-600/35"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Half-Day
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

          {/* Save Action */}
          {attendanceList.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleSaveAttendance}
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Save Attendance Register</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Leave Requests Tab */}
      {activeTab === "leaves" && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          {leavesLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading leave applications...</div>
          ) : leavesList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">No student leave requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[11px] tracking-wider font-bold">
                    <th className="py-3 px-4">GR No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Leave Duration</th>
                    <th className="py-3 px-4">Reason for Absence</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {leavesList.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300 font-semibold">{l.gr_no}</td>
                      <td className="py-3.5 px-4 text-xs font-bold text-white">{l.student_name}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 font-mono">
                        {l.start_date} to {l.end_date}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 italic max-w-xs truncate" title={l.reason}>
                        "{l.reason}"
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          l.status === "PENDING"
                            ? "bg-amber-950/40 text-amber-300 border-amber-800/50"
                            : l.status === "APPROVED"
                            ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                            : "bg-rose-950/40 text-rose-300 border-rose-800/50"
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {l.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleActionLeave(l.id, "APPROVED")}
                              className="px-2 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold border border-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleActionLeave(l.id, "REJECTED")}
                              className="px-2 py-1 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-bold border border-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            Actioned by: {l.actioned_by || "Admin"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "records" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Records Filters */}
          <div className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-end justify-between">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Type Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Records Type</label>
                <select
                  value={historyType}
                  onChange={(e) => setHistoryType(e.target.value as "attendance" | "leaves")}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="attendance">Attendance History</option>
                  <option value="leaves">Leaves History</option>
                </select>
              </div>

              {/* Timeframe Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timeframe Group</label>
                <div className="inline-flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                  {(["week", "month", "year"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTimeframe(t)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        timeframe === t
                          ? "bg-blue-600 text-white shadow shadow-blue-600/35"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Range selector values based on timeframe */}
              {timeframe === "week" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Week of Date</label>
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              )}

              {timeframe === "month" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Month</label>
                  <input
                    type="month"
                    value={historyMonth}
                    onChange={(e) => setHistoryMonth(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              )}

              {timeframe === "year" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Session</label>
                  <span className="inline-block px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-bold">
                    AY 2026-2027 (Current)
                  </span>
                </div>
              )}
            </div>

            <div className="text-right text-[10px] font-bold text-slate-500 font-mono">
              Std {standard}-{section} • {division}
            </div>
          </div>

          {/* History Contents Grid */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            {historyLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Fetching historical logs...</div>
            ) : historyType === "attendance" ? (
              historyAttendanceList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No attendance entries found for this range.</div>
              ) : timeframe === "week" ? (
                /* Week-wise attendance grid table rendering */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-3 px-4">GR No</th>
                        <th className="py-3 px-4">Student Name</th>
                        {getWeekRange(historyDate).map((dayStr) => {
                          const dateObj = new Date(dayStr);
                          const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                          const displayDate = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                          return (
                            <th key={dayStr} className="py-3 px-3 text-center">
                              <div>{dayName}</div>
                              <div className="text-[9px] font-mono text-slate-500 font-normal">{displayDate}</div>
                            </th>
                          );
                        })}
                        <th className="py-3 px-2 text-center text-emerald-400">P</th>
                        <th className="py-3 px-2 text-center text-rose-400">A</th>
                        <th className="py-3 px-2 text-center text-amber-400">L</th>
                        <th className="py-3 px-2 text-center text-blue-400">H</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {historyAttendanceList.map((student) => {
                        const weekDates = getWeekRange(historyDate);
                        const statuses = weekDates.map((dayStr) => student.attendance[dayStr]);
                        const pCount = statuses.filter((s) => s === "PRESENT").length;
                        const aCount = statuses.filter((s) => s === "ABSENT").length;
                        const lCount = statuses.filter((s) => s === "LATE").length;
                        const hCount = statuses.filter((s) => s === "HALF_DAY").length;

                        return (
                          <tr key={student.student_id} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs text-slate-300 font-semibold">{student.gr_no}</td>
                            <td className="py-3 px-4 text-xs font-bold text-white">{student.student_name}</td>
                            {weekDates.map((dayStr) => {
                              const status = student.attendance[dayStr];
                              return (
                                <td key={dayStr} className="py-3 px-3 text-center">
                                  {status === "PRESENT" ? (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold" title="Present">P</span>
                                  ) : status === "ABSENT" ? (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold" title="Absent">A</span>
                                  ) : status === "LATE" ? (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold" title="Late">L</span>
                                  ) : status === "HALF_DAY" ? (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold" title="Half Day">H</span>
                                  ) : (
                                    <span className="text-slate-600 text-xs font-bold">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-3 px-2 text-center text-xs text-emerald-400 font-bold font-mono">{pCount}</td>
                            <td className="py-3 px-2 text-center text-xs text-rose-400 font-bold font-mono">{aCount}</td>
                            <td className="py-3 px-2 text-center text-xs text-amber-400 font-bold font-mono">{lCount}</td>
                            <td className="py-3 px-2 text-center text-xs text-blue-400 font-bold font-mono">{hCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Month-wise / Year-wise stats summaries rendering */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-3 px-4">GR No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4 text-center">Days Marked</th>
                        <th className="py-3 px-4 text-center text-emerald-400">Present (P)</th>
                        <th className="py-3 px-4 text-center text-rose-400">Absent (A)</th>
                        <th className="py-3 px-4 text-center text-amber-400">Late (L)</th>
                        <th className="py-3 px-4 text-center text-blue-400">Half-Day (H)</th>
                        <th className="py-3 px-4 text-right">Attendance Rate %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {historyAttendanceList.map((student) => {
                        const records = Object.values(student.attendance);
                        const daysMarked = records.length;
                        const present = records.filter(s => s === "PRESENT").length;
                        const absent = records.filter(s => s === "ABSENT").length;
                        const late = records.filter(s => s === "LATE").length;
                        const halfDay = records.filter(s => s === "HALF_DAY").length;
                        
                        const netPresent = present + late + (halfDay * 0.5);
                        const rate = daysMarked > 0 ? Math.round((netPresent / daysMarked) * 100) : 0;

                        return (
                          <tr key={student.student_id} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs text-slate-300 font-semibold">{student.gr_no}</td>
                            <td className="py-3 px-4 text-xs font-bold text-white">{student.student_name}</td>
                            <td className="py-3 px-4 text-center text-xs text-slate-300 font-semibold font-mono">{daysMarked}</td>
                            <td className="py-3 px-4 text-center text-xs text-emerald-400 font-bold font-mono">{present}</td>
                            <td className="py-3 px-4 text-center text-xs text-rose-400 font-bold font-mono">{absent}</td>
                            <td className="py-3 px-4 text-center text-xs text-amber-400 font-bold font-mono">{late}</td>
                            <td className="py-3 px-4 text-center text-xs text-blue-400 font-bold font-mono">{halfDay}</td>
                            <td className="py-3 px-4 text-right text-xs">
                              <span className={`px-2 py-0.5 rounded-full font-bold font-mono text-[10px] ${
                                rate >= 85 ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" :
                                rate >= 75 ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                                "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                              }`}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* Leaves History Content */
              historyLeavesList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No leave requests found for this timeframe.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-3 px-4">GR No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Leave Duration</th>
                        <th className="py-3 px-4">Reason for Absence</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actioned By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {historyLeavesList.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-800/10 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs text-slate-300 font-semibold">{l.gr_no}</td>
                          <td className="py-3 px-4 text-xs font-bold text-white">{l.student_name}</td>
                          <td className="py-3 px-4 text-xs text-slate-300 font-mono">{l.start_date} to {l.end_date}</td>
                          <td className="py-3 px-4 text-xs text-slate-400 italic max-w-xs truncate" title={l.reason}>"{l.reason}"</td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                              l.status === "PENDING"
                                ? "bg-amber-950/40 text-amber-300 border-amber-800/50"
                                : l.status === "APPROVED"
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                                : "bg-rose-950/40 text-rose-300 border-rose-800/50"
                            }`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-slate-500 font-semibold">
                            {l.actioned_by || "Admin"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
