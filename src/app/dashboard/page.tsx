"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { formatCurrencyINR } from "@/lib/utils";
import StudentCountModal from "@/components/StudentCountModal";
import CollectionHistoryModal from "@/components/CollectionHistoryModal";
import DefaultersSummaryModal from "@/components/DefaultersSummaryModal";
import DivisionsOverviewModal from "@/components/DivisionsOverviewModal";
import StudentLedgerModal from "@/components/StudentLedgerModal";
import { 
  Users, 
  Receipt, 
  AlertTriangle, 
  TrendingUp, 
  UserPlus, 
  GraduationCap, 
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Eye,
  Clock,
  Megaphone,
  UserCheck,
  BookmarkCheck,
  CheckCircle2,
  Plus,
  Award
} from "lucide-react";



export default function DashboardPage() {
  const [schoolName, setSchoolName] = useState("Avdhoot Bhagwan Ram Vidyalaya");
  const [role, setRole] = useState("admin");
  const [fullName, setFullName] = useState("Teacher");
  const [assignedClass, setAssignedClass] = useState("7th");
  const [assignedSection, setAssignedSection] = useState("B");
  const [teacherId, setTeacherId] = useState("1");

  const [selectedYear, setSelectedYear] = useState<string>("2026-2027");
  const [stats, setStats] = useState({
    academic_year: "2026-2027",
    total_collected: 0,
    total_receipts: 0,
    total_students: 0,
    total_pending: 0,
    defaulter_count: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal states for interactive cards
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
  const [isDefaultersModalOpen, setIsDefaultersModalOpen] = useState(false);
  const [isDivisionsModalOpen, setIsDivisionsModalOpen] = useState(false);
  const [ledgerStudentGr, setLedgerStudentGr] = useState<string | null>(null);

  // Teacher dashboard states
  const [teacherStats, setTeacherStats] = useState({
    studentsCount: 0,
    attendanceStatus: "Pending",
    syllabusAvg: 0,
    timetableCount: 0,
  });
  const [teacherTimetable, setTeacherTimetable] = useState<any[]>([]);
  const [teacherLessons, setTeacherLessons] = useState<any[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<any[]>([]);
  
  // Teacher notice composer states
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeDesc, setNoticeDesc] = useState("");
  const [noticePosting, setNoticePosting] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState<string | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") || "admin";
    setRole(savedRole);
    setSchoolName(localStorage.getItem("schoolName") || "Avdhoot Bhagwan Ram Vidyalaya");
    setFullName(localStorage.getItem("fullName") || "Teacher");
    setAssignedClass(localStorage.getItem("assignedClass") || "7th");
    setAssignedSection(localStorage.getItem("assignedSection") || "B");
    setTeacherId(localStorage.getItem("teacherId") || "1");
  }, []);

  useEffect(() => {
    if (role === "admin") {
      fetchStats();
    } else if (role === "teacher") {
      fetchTeacherData();
    }
  }, [role, selectedYear, assignedClass, assignedSection, teacherId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fees/stats?academic_year=${encodeURIComponent(selectedYear)}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      // 1. Fetch class students count & list
      const stdRes = await api.get(`/students?standard=${encodeURIComponent(assignedClass)}&section=${assignedSection}&limit=6`);
      const countHeader = stdRes.headers["x-total-count"];
      const studentsCount = countHeader ? parseInt(countHeader, 10) : (stdRes.data || []).length;
      setTeacherStudents(stdRes.data || []);

      // 2. Fetch timetable
      const ttRes = await api.get(`/academic/teachers/${teacherId}/timetable`);
      const timetableData = ttRes.data || [];
      setTeacherTimetable(timetableData);

      // 3. Fetch lesson plans
      const lpRes = await api.get(`/academic/lesson-plan?standard=${encodeURIComponent(assignedClass)}`);
      const lessons = lpRes.data || [];
      setTeacherLessons(lessons);
      const avgProgress = lessons.length > 0 
        ? Math.round(lessons.reduce((acc: number, item: any) => acc + item.completion_percentage, 0) / lessons.length)
        : 0;

      // 4. Fetch today's attendance status
      const today = new Date().toISOString().split("T")[0];
      const getDivisionFromStandard = (std: string) => {
        if (["Nursery", "Jr. KG", "Sr. KG"].includes(std)) return "Pre-Primary";
        if (["11th", "12th"].includes(std)) return "Junior College";
        return "School Section";
      };
      const div = getDivisionFromStandard(assignedClass);
      const attRes = await api.get(`/academic/attendance?date=${today}&division=${encodeURIComponent(div)}&standard=${encodeURIComponent(assignedClass)}&section=${assignedSection}`);
      const marked = (attRes.data || []).some((item: any) => item.id > 0);

      setTeacherStats({
        studentsCount,
        attendanceStatus: marked ? "Marked Today" : "Pending Today",
        syllabusAvg: avgProgress,
        timetableCount: timetableData.length,
      });
    } catch (err) {
      console.error("Error loading teacher dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeDesc) return;
    setNoticePosting(true);
    setNoticeSuccess(null);

    try {
      const payload = {
        title: noticeTitle,
        description: noticeDesc,
        target_type: "STANDARD",
        target_value: `${assignedClass}-${assignedSection}`
      };
      await api.post("/academic/notices", payload);
      setNoticeSuccess("Notice broadcasted successfully to your class!");
      setNoticeTitle("");
      setNoticeDesc("");
    } catch (err) {
      console.error(err);
    } finally {
      setNoticePosting(false);
    }
  };

  const renderTeacherDashboard = () => {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Welcome Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Assigned Room: Std {assignedClass} - {assignedSection}</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome Back, {fullName}!
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Academic Teacher Management Console. Mark class register, post notice updates, and follow lesson plan completion rates.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/attendance"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all"
            >
              <UserCheck className="w-4.5 h-4.5" />
              <span>Attendance Register</span>
            </Link>
            <Link
              href="/academic"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-all"
            >
              <Megaphone className="w-4.5 h-4.5" />
              <span>Homework & Lessons</span>
            </Link>
            <Link
              href="/exams"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Award className="w-4.5 h-4.5" />
              <span>Marks Sheet</span>
            </Link>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Class Strength Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class Strength</span>
              <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-md">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-black text-white font-mono block">
                {loading ? "..." : `${teacherStats.studentsCount} Students`}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Assigned Class Roster</span>
            </div>
            <Link
              href="/students"
              className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>View Student List</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Today's Attendance Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's Attendance</span>
              <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-md">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <span className={`text-2xl font-black font-mono block ${
                teacherStats.attendanceStatus.includes("Pending") ? "text-amber-400" : "text-emerald-400"
              }`}>
                {loading ? "..." : teacherStats.attendanceStatus}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase"> Roster Marker status</span>
            </div>
            <Link
              href="/attendance"
              className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Mark Attendance Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Syllabus Progress Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Syllabus Progress</span>
              <div className="p-2.5 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-md">
                <BookmarkCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-black text-white font-mono block">
                {loading ? "..." : `${teacherStats.syllabusAvg}%`}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Average syllabus progress</span>
            </div>
            <Link
              href="/academic"
              className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>Update Chapters Tracker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Timetable Slots Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Timetable slots</span>
              <div className="p-2.5 rounded-xl bg-amber-600/10 text-amber-400 border border-amber-500/20 shadow-md">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-black text-white font-mono block">
                {loading ? "..." : `${teacherStats.timetableCount} Lectures`}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Daily Period Slots</span>
            </div>
            <Link
              href="/academic"
              className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>View Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom Split Grid: Timetable & Notices */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Today's schedule slots */}
          <div className="xl:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Today's Lecture Schedule Timeline</span>
            </h3>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading timetable slots...</div>
            ) : teacherTimetable.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No timetable allocated for this teacher profile.</div>
            ) : (
              <div className="relative border-l border-slate-800 pl-4 space-y-6 py-2 ml-2">
                {teacherTimetable.map((slot, idx) => (
                  <div key={slot.id} className="relative group">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-slate-900 group-hover:scale-110 transition-transform"></div>
                    <div className="glass-panel p-4 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">
                          Period {slot.period_no} • {slot.day_of_week}
                        </span>
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                          {slot.subject}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold uppercase">
                          Std {slot.standard} - {slot.section}
                        </span>
                        {slot.classroom && (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-bold uppercase">
                            Room: {slot.classroom}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick notice composer */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-400" />
              <span>Broadcast Notice to Class</span>
            </h3>

            {noticeSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300">
                {noticeSuccess}
              </div>
            )}

            <form onSubmit={handlePostNotice} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target Class</label>
                <input
                  type="text"
                  disabled
                  value={`Std ${assignedClass} - ${assignedSection} (Your Assigned Class)`}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500 font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit Test 1 Syllabus Details"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Notice Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write clear instructions for parents & students..."
                  value={noticeDesc}
                  onChange={(e) => setNoticeDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-semibold resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={noticePosting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{noticePosting ? "Publishing..." : "Broadcast Notice"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (role === "teacher") {
    return renderTeacherDashboard();
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner & Academic Year Selector */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Current Session: {selectedYear}</span>
            </div>

            {/* Academic Year Filter Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400 font-medium">Session:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="2026-2027" className="bg-slate-900 text-white">AY 2026-2027 (Current)</option>
                <option value="2025-2026" className="bg-slate-900 text-white">AY 2025-2026</option>
                <option value="2024-2025" className="bg-slate-900 text-white">AY 2024-2025</option>
                <option value="2023-2024" className="bg-slate-900 text-white">AY 2023-2024</option>
                <option value="All" className="bg-slate-900 text-white">All Academic Sessions</option>
              </select>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {schoolName} Console
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Real-time dashboard for Student Admissions, Class-wise Distribution, Dynamic Fee POS & Defaulter Tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admission"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            New Admission
          </Link>
          <Link
            href="/fees"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Receipt className="w-4 h-4" />
            Fee Collection Desk
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Interactive Total Enrolled Students KPI Card */}
        <div
          onClick={() => setIsCountModalOpen(true)}
          className="hc-card hc-card-glow p-6 rounded-2xl hover:-translate-y-0.5 transition-all cursor-pointer group space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-400 transition-colors">
              Total Enrolled Students
            </span>
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-white font-mono block">
              {loading ? "..." : stats.total_students}
            </span>
            <span className="text-[10px] text-slate-500 group-hover:text-blue-300 font-bold transition-colors">
              Pre-Primary to 12th Std
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Std Breakdown
            </span>
            <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Interactive Total Collections KPI Card */}
        <div
          onClick={() => setIsCollectionsModalOpen(true)}
          className="hc-card hc-card-glow p-6 rounded-2xl hover:-translate-y-0.5 transition-all cursor-pointer group space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-400 transition-colors">
              Total Collections
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-emerald-400 font-mono block truncate">
              {loading ? "..." : formatCurrencyINR(stats.total_collected)}
            </span>
            <span className="text-[10px] text-slate-500 group-hover:text-emerald-300 font-bold transition-colors">
              Across {stats.total_receipts} Receipts ({selectedYear})
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Receipts Register
            </span>
            <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Interactive Outstanding Dues KPI Card */}
        <div
          onClick={() => setIsDefaultersModalOpen(true)}
          className="hc-card hc-card-glow p-6 rounded-2xl hover:-translate-y-0.5 transition-all cursor-pointer group space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-rose-400 transition-colors">
              Outstanding Dues
            </span>
            <div className="p-2.5 rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-rose-400 font-mono block truncate">
              {loading ? "..." : formatCurrencyINR(stats.total_pending)}
            </span>
            <span className="text-[10px] text-slate-500 group-hover:text-rose-300 font-bold transition-colors">
              {stats.defaulter_count} Defaulter Students
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-rose-400 group-hover:text-rose-300 transition-colors">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Defaulters List
            </span>
            <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Interactive Academic Divisions KPI Card */}
        <div
          onClick={() => setIsDivisionsModalOpen(true)}
          className="hc-card hc-card-glow p-6 rounded-2xl hover:-translate-y-0.5 transition-all cursor-pointer group space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-400 transition-colors">
              Academic Divisions
            </span>
            <div className="p-2.5 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-white font-mono block">
              3 Divisions
            </span>
            <span className="text-[10px] text-slate-500 group-hover:text-purple-300 font-bold transition-colors">
              Pre-Primary, School, Jr. College
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Overview
            </span>
            <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Academic Divisions Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-400" />
          Academic Divisions Supported
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pre-Primary */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 text-xs font-bold">
                Division 1
              </span>
              <span className="text-xs text-slate-400">CBSE Pattern</span>
            </div>
            <h4 className="text-xl font-bold text-white">Pre-Primary Section</h4>
            <p className="text-xs text-slate-400">
              Classes: Nursery, Jr. KG, Sr. KG. Focused on early childhood foundation & activity fees.
            </p>
            <Link
              href="/students?division=Pre-Primary"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              <span>View Enrolled Students</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* School Section */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
                Division 2
              </span>
              <span className="text-xs text-slate-400">State / CBSE Board</span>
            </div>
            <h4 className="text-xl font-bold text-white">School Section</h4>
            <p className="text-xs text-slate-400">
              Classes 1st to 10th. Includes Tuition, Term Fee, Development & Computer Lab Fee heads.
            </p>
            <Link
              href="/students?division=School Section"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              <span>View Enrolled Students</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Junior College */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
                Division 3
              </span>
              <span className="text-xs text-slate-400">HSC / Higher Sec</span>
            </div>
            <h4 className="text-xl font-bold text-white">Junior College</h4>
            <p className="text-xs text-slate-400">
              Classes 11th & 12th. Streams: Science (Lab Fee), Commerce (Computer Tally), and Arts.
            </p>
            <Link
              href="/students?division=Junior College"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              <span>View Enrolled Students</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Student Count Breakdown Modal */}
      <StudentCountModal
        isOpen={isCountModalOpen}
        academicYear={selectedYear}
        onClose={() => setIsCountModalOpen(false)}
      />

      {/* Collection History / Receipts Register Modal */}
      <CollectionHistoryModal
        isOpen={isCollectionsModalOpen}
        academicYear={selectedYear}
        totalCollected={stats.total_collected}
        onClose={() => setIsCollectionsModalOpen(false)}
      />

      {/* Defaulters Outstanding Dues Modal */}
      <DefaultersSummaryModal
        isOpen={isDefaultersModalOpen}
        totalPending={stats.total_pending}
        defaulterCount={stats.defaulter_count}
        onClose={() => setIsDefaultersModalOpen(false)}
        onOpenLedger={(grNo) => setLedgerStudentGr(grNo)}
      />

      {/* Divisions Overview Modal */}
      <DivisionsOverviewModal
        isOpen={isDivisionsModalOpen}
        onClose={() => setIsDivisionsModalOpen(false)}
      />

      {/* Student Profile & Full Ledger Modal */}
      {ledgerStudentGr && (
        <StudentLedgerModal
          grNoOrId={ledgerStudentGr}
          isOpen={!!ledgerStudentGr}
          onClose={() => setLedgerStudentGr(null)}
        />
      )}
    </div>
  );
}
