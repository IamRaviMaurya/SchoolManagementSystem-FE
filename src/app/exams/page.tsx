"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  FileSpreadsheet, 
  Award, 
  GraduationCap, 
  Search,
  Check, 
  Download,
  AlertCircle,
  TrendingUp,
  Printer
} from "lucide-react";

interface ExamMark {
  id: number;
  student_id: number;
  student_name: string;
  gr_no: string;
  exam_type: string;
  subject: string;
  marks_obtained: number;
  max_marks: number;
  remarks: string;
}

interface CoCurricular {
  student_id: number;
  student_name?: string;
  sports_grade: string;
  behavior_grade: string;
  attendance_percentage: number;
  remarks: string;
}

interface Student {
  id: number;
  gr_no: string;
  full_name: string;
  division: string;
  standard: string;
  section: string;
}

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState<"marks" | "grades" | "report-card">("marks");

  // Grid filter states
  const [role, setRole] = useState("admin");
  const [examType, setExamType] = useState("TERM_1");
  const [subject, setSubject] = useState("Mathematics");
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

  // Marks Entry grid list
  const [marksGrid, setMarksGrid] = useState<ExamMark[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Grades / CCE states
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [sportsGrade, setSportsGrade] = useState("A");
  const [behaviorGrade, setBehaviorGrade] = useState("A");
  const [attPercentage, setAttPercentage] = useState(100.0);
  const [cceRemarks, setCceRemarks] = useState("");
  const [cceSaving, setCceSaving] = useState(false);

  // Report Card Engine states
  const [selectedReportStudent, setSelectedReportStudent] = useState<Student | null>(null);
  const [allStudentMarks, setAllStudentMarks] = useState<ExamMark[]>([]);
  const [reportExamType, setReportExamType] = useState("TERM_1");
  const [reportCce, setReportCce] = useState<CoCurricular | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const getStandardOptions = (div: string) => {
    if (div === "Pre-Primary") return ["Nursery", "Jr. KG", "Sr. KG"];
    if (div === "School Section") return ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
    if (div === "Junior College") return ["11th", "12th"];
    return [];
  };

  useEffect(() => {
    if (activeTab === "marks") {
      fetchMarksGrid();
    } else if (activeTab === "grades") {
      fetchStudentsForCce();
    } else {
      fetchStudentsForReportCard();
    }
  }, [activeTab, examType, subject, division, standard, section]);

  // Handle standard reset
  useEffect(() => {
    if (role === "teacher") return;
    const opts = getStandardOptions(division);
    if (opts.length > 0 && !opts.includes(standard)) {
      setStandard(opts[0]);
    }
  }, [division, role]);

  const fetchMarksGrid = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get(
        `/academic/marks?exam_type=${examType}&subject=${encodeURIComponent(subject)}&division=${encodeURIComponent(division)}&standard=${encodeURIComponent(standard)}&section=${section}`
      );
      setMarksGrid(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: number, field: keyof ExamMark, val: string | number) => {
    setMarksGrid(prev => 
      prev.map(item => item.student_id === studentId ? { ...item, [field]: val } : item)
    );
  };

  const handleSaveMarksGrid = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        exam_type: examType,
        subject,
        records: marksGrid.map(item => ({
          student_id: item.student_id,
          exam_type: examType,
          subject,
          marks_obtained: parseFloat(item.marks_obtained.toString()) || 0,
          max_marks: parseFloat(item.max_marks.toString()) || 100.0,
          remarks: item.remarks || ""
        }))
      };

      await api.post("/academic/marks/bulk", payload);
      setMessage("Scholastic marks register updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to save scholastic marks grid.");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchStudentsForCce = async () => {
    try {
      const res = await api.get(`/students?division=${encodeURIComponent(division)}&standard=${encodeURIComponent(standard)}&section=${section}`);
      setStudentsList(res.data || []);
      if (res.data && res.data.length > 0) {
        handleSelectStudentForCce(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectStudentForCce = async (studentId: number) => {
    setSelectedStudentId(studentId);
    try {
      const res = await api.get(`/academic/co-curricular/${studentId}`);
      if (res.data) {
        setSportsGrade(res.data.sports_grade);
        setBehaviorGrade(res.data.behavior_grade);
        setAttPercentage(res.data.attendance_percentage);
        setCceRemarks(res.data.remarks);
      } else {
        setSportsGrade("A");
        setBehaviorGrade("A");
        setAttPercentage(100.0);
        setCceRemarks("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCce = async () => {
    if (!selectedStudentId) return;
    setCceSaving(true);
    try {
      await api.post("/academic/co-curricular", {
        student_id: selectedStudentId,
        sports_grade: sportsGrade,
        behavior_grade: behaviorGrade,
        attendance_percentage: attPercentage,
        remarks: cceRemarks
      });
      alert("CCE record saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setCceSaving(false);
    }
  };

  const fetchStudentsForReportCard = async () => {
    try {
      const res = await api.get(`/students?division=${encodeURIComponent(division)}&standard=${encodeURIComponent(standard)}&section=${section}`);
      setStudentsList(res.data || []);
      if (res.data && res.data.length > 0) {
        handleSelectStudentForReport(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectStudentForReport = async (student: Student) => {
    setSelectedReportStudent(student);
    setReportLoading(true);
    try {
      // Fetch all marks for this student dynamically from database
      const resMarks = await api.get(`/academic/marks/student/${student.id}`);
      setAllStudentMarks(resMarks.data || []);

      // Fetch CCE
      const resCce = await api.get(`/academic/co-curricular/${student.id}`);
      setReportCce(resCce.data || null);

    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  // Helper calculation for grade based on percentage
  const calculateGrade = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 90) return "A1";
    if (pct >= 80) return "A2";
    if (pct >= 70) return "B1";
    if (pct >= 60) return "B2";
    if (pct >= 50) return "C1";
    if (pct >= 40) return "C2";
    return "D (Fail)";
  };

  const renderReportCard = () => {
    if (reportLoading) {
      return <div className="glass-panel p-8 rounded-2xl text-center text-slate-400">Loading student scores...</div>;
    }
    if (!selectedReportStudent) {
      return <div className="glass-panel p-12 text-center text-slate-400">Please select a student.</div>;
    }

    const getExamTypeName = (type: string) => {
      if (type === "UNIT_TEST_1") return "Unit Test 1";
      if (type === "TERM_1") return "Term 1 (Half Yearly)";
      if (type === "UNIT_TEST_2") return "Unit Test 2";
      if (type === "FINALS") return "Final Examinations";
      return type;
    };

    const reportMarks = allStudentMarks.filter(m => m.exam_type === reportExamType);

    return (
      /* High-end report card parchment document style container */
      <div className="p-8 bg-[#fdfcf7] text-slate-900 border-2 border-slate-300 rounded-3xl space-y-6 shadow-2xl relative select-text leading-normal max-w-2xl mx-auto font-serif">
        
        {/* Board Letterhead */}
        <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
          <div className="flex justify-center items-center mb-2">
            <img
              src="/school_logo.png"
              alt="Avdhoot Bhagwan Ram Vidyalaya"
              className="h-20 object-contain drop-shadow-md"
            />
          </div>
          <span className="text-[10px] tracking-widest font-bold uppercase text-slate-500 block">
            Affiliated to CBSE / New Delhi, India
          </span>
          <h2 className="text-xl font-black uppercase text-slate-950 tracking-wider">
            Avdhoot Bhagwan Ram Vidyalaya
          </h2>
          <p className="text-[11px] font-sans font-semibold text-slate-600">
            B-402, Gokul Heights, Suburban Colony, Mumbai • PIN: 400001
          </p>
          <div className="inline-block mt-2 px-4 py-0.5 border border-slate-900 bg-slate-900 text-white text-[10px] font-sans font-bold uppercase tracking-wider">
            Official Student Progress Report Card
          </div>
        </div>

        {/* Candidate Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs font-sans border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div>Candidate Name: <span className="font-bold uppercase text-slate-950">{selectedReportStudent.full_name}</span></div>
            <div>GR Number: <span className="font-mono font-bold text-slate-950">{selectedReportStudent.gr_no}</span></div>
          </div>
          <div className="space-y-1 text-right">
            <div>Class Division: <span className="font-bold text-slate-950">Std {selectedReportStudent.standard} - {selectedReportStudent.section}</span></div>
            <div>Term: <span className="font-bold text-slate-950">{getExamTypeName(reportExamType)} (2026-2027)</span></div>
          </div>
        </div>

        {/* Scholastic Marks Table */}
        <div className="space-y-2">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-600 block">
            Part A: Scholastic Areas (Subject Performance)
          </span>
          <table className="w-full text-left text-xs font-sans border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                <th className="py-2 px-3 border-r border-slate-300">Subject Name</th>
                <th className="py-2 px-3 text-center border-r border-slate-300">Max Marks</th>
                <th className="py-2 px-3 text-center border-r border-slate-300">Marks Obtained</th>
                <th className="py-2 px-3 text-center border-r border-slate-300">Percentage</th>
                <th className="py-2 px-3 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reportMarks.map(m => {
                const pct = ((m.marks_obtained / m.max_marks) * 100).toFixed(1);
                return (
                  <tr key={m.id} className="text-slate-900">
                    <td className="py-2 px-3 border-r border-slate-300 font-semibold">{m.subject}</td>
                    <td className="py-2 px-3 text-center border-r border-slate-300 font-bold">{m.max_marks}</td>
                    <td className="py-2 px-3 text-center border-r border-slate-300 font-bold">{m.marks_obtained}</td>
                    <td className="py-2 px-3 text-center border-r border-slate-300 font-mono font-semibold">{pct}%</td>
                    <td className="py-2 px-3 text-center font-bold text-indigo-700">
                      {calculateGrade(m.marks_obtained, m.max_marks)}
                    </td>
                  </tr>
                );
              })}
              {reportMarks.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-slate-500 italic">No scholastic marks found for the selected term.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Co-Scholastic & Personal Conduct */}
        <div className="grid grid-cols-2 gap-6 pt-3">
          <div className="space-y-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-600 block">
              Part B: Co-Scholastic Activities
            </span>
            <table className="w-full text-left text-xs font-sans border border-slate-300">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-3 font-semibold bg-slate-50">Sports & Fitness</td>
                  <td className="py-2 px-3 text-center font-bold text-slate-950">{reportCce?.sports_grade || "A"}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold bg-slate-50">Behavior & Conduct</td>
                  <td className="py-2 px-3 text-center font-bold text-slate-950">{reportCce?.behavior_grade || "A"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-600 block">
              Attendance & Physical Stats
            </span>
            <table className="w-full text-left text-xs font-sans border border-slate-300">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-3 font-semibold bg-slate-50">Term Attendance</td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-950">{reportCce?.attendance_percentage || 100}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold bg-slate-50">Result Status</td>
                  <td className="py-2 px-3 text-center font-bold text-emerald-700">PROMOTED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-600 block">
            Teacher's Evaluative Remarks
          </span>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-700 italic">
            "{reportCce?.remarks || "Aarav is showing good interest in core curriculum. Regular attendance and active participation has helped improve performance."}"
          </div>
        </div>

        {/* Signature Lines */}
        <div className="pt-10 flex justify-between text-center text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600">
          <div className="space-y-1 border-t border-slate-400 pt-2 w-32">
            <div>Class Teacher</div>
          </div>
          <div className="space-y-1 border-t border-slate-400 pt-2 w-32">
            <div>Principal Signature</div>
          </div>
          <div className="space-y-1 border-t border-slate-400 pt-2 w-32">
            <div>Parent Signature</div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-emerald-500" />
            <span>Examination & Report Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Input scholastic subject marks using grid sheets, grade co-curricular conduct, and generate print-ready student report cards.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("marks")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "marks" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Subject Marks Entry
          </button>
          <button
            onClick={() => setActiveTab("grades")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "grades" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            CCE & Conduct Grades
          </button>
          <button
            onClick={() => setActiveTab("report-card")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "report-card" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Generate Report Card
          </button>
        </div>
      </div>

      {/* Subject Marks Entry Tab */}
      {activeTab === "marks" && (
        <div className="space-y-6 no-print">
          {/* Filter Bar */}
          <div className="glass-panel p-4 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Term</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="UNIT_TEST_1">Unit Test 1</option>
                <option value="TERM_1">Term 1 (Half Yearly)</option>
                <option value="UNIT_TEST_2">Unit Test 2</option>
                <option value="FINALS">Final Examinations</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Std</label>
              <select
                disabled={role === "teacher"}
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold disabled:opacity-60"
              >
                {getStandardOptions(division).map(opt => (
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
          </div>

          {message && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* Excel Grid list */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Fetching subject mark sheets...</div>
            ) : marksGrid.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">No active student records found for this class.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[11px] tracking-wider font-bold">
                      <th className="py-3 px-4">GR No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Marks Obtained</th>
                      <th className="py-3 px-4 text-center">Max Marks</th>
                      <th className="py-3 px-4">Teacher Feedback / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {marksGrid.map((rec) => (
                      <tr key={rec.student_id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-slate-300 font-semibold">{rec.gr_no}</td>
                        <td className="py-3 px-4 text-xs font-bold text-white">{rec.student_name}</td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            step="0.5"
                            value={rec.marks_obtained}
                            onChange={(e) => handleMarkChange(rec.student_id, "marks_obtained", parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-center bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            value={rec.max_marks}
                            onChange={(e) => handleMarkChange(rec.student_id, "max_marks", parseInt(e.target.value, 10) || 100)}
                            className="w-20 px-2 py-1 text-center bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Add behavior or score feedback remark..."
                            value={rec.remarks}
                            onChange={(e) => handleMarkChange(rec.student_id, "remarks", e.target.value)}
                            className="w-full px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {marksGrid.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleSaveMarksGrid}
                disabled={submitting}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                {submitting ? "Saving Marks..." : "Save Marks Grid Sheet"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* CCE & Conduct Grades Tab */}
      {activeTab === "grades" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          {/* Left Student Selector */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 h-fit">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Select Student</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {studentsList.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleSelectStudentForCce(st.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedStudentId === st.id
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
              <Award className="w-4 h-4 text-amber-500" />
              <span>CCE Co-Scholastic Grades &remarks</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sports / Physical Education</label>
                <select
                  value={sportsGrade}
                  onChange={(e) => setSportsGrade(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conduct / Behavior Grade</label>
                <select
                  value={behaviorGrade}
                  onChange={(e) => setBehaviorGrade(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Percentage</label>
                <input
                  type="number"
                  step="0.1"
                  value={attPercentage}
                  onChange={(e) => setAttPercentage(parseFloat(e.target.value) || 100.0)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">General Conduct Remarks</label>
              <textarea
                rows={3}
                placeholder="Write behavior remarks..."
                value={cceRemarks}
                onChange={(e) => setCceRemarks(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleSaveCce}
                disabled={cceSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                {cceSaving ? "Saving CCE..." : "Save CCE Grades"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Card Tab */}
      {activeTab === "report-card" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Student Selector */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 h-fit no-print">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Select Student</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {studentsList.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleSelectStudentForReport(st)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedReportStudent?.id === st.id
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



          {/* Right Printable Report Card Sheet */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between border border-slate-800 no-print gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Report Card Sheet Preview</span>
                <select
                  value={reportExamType}
                  onChange={(e) => setReportExamType(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="UNIT_TEST_1">Unit Test 1</option>
                  <option value="TERM_1">Term 1 (Half Yearly)</option>
                  <option value="UNIT_TEST_2">Unit Test 2</option>
                  <option value="FINALS">Final Examinations</option>
                </select>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Report Card</span>
              </button>
            </div>

            {renderReportCard()}
          </div>
        </div>
      )}
    </div>
  );
}
