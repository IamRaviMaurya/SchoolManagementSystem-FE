"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  BookOpen, 
  Upload, 
  Calendar, 
  ListTodo, 
  BookmarkCheck, 
  Clock, 
  CheckCircle,
  FileText,
  Plus
} from "lucide-react";

interface Homework {
  id: number;
  division: string;
  standard: string;
  section: string;
  subject: string;
  title: string;
  description: string;
  attachment_url: string | null;
  deadline: string;
  created_at: string;
}

interface LessonPlan {
  id: number;
  standard: string;
  subject: string;
  chapter_name: string;
  completion_percentage: number;
  status: string; // IN_PROGRESS, COMPLETED
}

interface TimetableItem {
  id: number;
  day_of_week: string;
  period_no: number;
  standard: string;
  section: string;
  subject: string;
  classroom: string | null;
}

export default function AcademicPage() {
  const [activeTab, setActiveTab] = useState<"homework" | "syllabus" | "timetable">("homework");
  
  // Filters for Homework upload & list
  const [role, setRole] = useState("admin");
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
      setPlanStandard(teacherClass);
      
      const getDivisionFromStandard = (std: string) => {
        if (["Nursery", "Jr. KG", "Sr. KG"].includes(std)) return "Pre-Primary";
        if (["11th", "12th"].includes(std)) return "Junior College";
        return "School Section";
      };
      setDivision(getDivisionFromStandard(teacherClass));
    }
  }, []);

  // Homework Upload States
  const [subject, setSubject] = useState("Mathematics");
  const [hwTitle, setHwTitle] = useState("");
  const [hwDesc, setHwDesc] = useState("");
  const [hwDeadline, setHwDeadline] = useState("");
  const [hwAttachment, setHwAttachment] = useState("");
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [uploading, setUploading] = useState(false);

  // Syllabus tracker states
  const [syllabusList, setSyllabusList] = useState<LessonPlan[]>([]);
  const [planStandard, setPlanStandard] = useState("7th");
  const [newChapter, setNewChapter] = useState("");
  const [newPlanSubject, setNewPlanSubject] = useState("Mathematics");
  const [syllabusLoading, setSyllabusLoading] = useState(false);

  // Timetable states
  const [timetableList, setTimetableList] = useState<TimetableItem[]>([]);
  const [timetableLoading, setTimetableLoading] = useState(false);

  // Options
  const getStandardOptions = (div: string) => {
    if (div === "Pre-Primary") return ["Nursery", "Jr. KG", "Sr. KG"];
    if (div === "School Section") return ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
    if (div === "Junior College") return ["11th", "12th"];
    return [];
  };

  useEffect(() => {
    if (activeTab === "homework") {
      fetchHomework();
    } else if (activeTab === "syllabus") {
      fetchSyllabus();
    } else {
      fetchTimetable();
    }
  }, [activeTab, division, standard, section, planStandard]);

  // Handle standard reset
  useEffect(() => {
    if (role === "teacher") return;
    const opts = getStandardOptions(division);
    if (opts.length > 0 && !opts.includes(standard)) {
      setStandard(opts[0]);
    }
  }, [division, role]);

  const fetchHomework = async () => {
    try {
      const res = await api.get(
        `/academic/homework?division=${encodeURIComponent(division)}&standard=${encodeURIComponent(standard)}&section=${section}`
      );
      setHomeworkList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle || !hwDesc || !hwDeadline) return;
    setUploading(true);

    try {
      const payload = {
        division,
        standard,
        section,
        subject,
        title: hwTitle,
        description: hwDesc,
        attachment_url: hwAttachment || null,
        deadline: hwDeadline
      };

      await api.post("/academic/homework", payload);
      setHwTitle("");
      setHwDesc("");
      setHwDeadline("");
      setHwAttachment("");
      fetchHomework();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const fetchSyllabus = async () => {
    setSyllabusLoading(true);
    try {
      const res = await api.get(`/academic/lesson-plan?standard=${encodeURIComponent(planStandard)}`);
      setSyllabusList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSyllabusLoading(false);
    }
  };

  const handleCreateLessonPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapter) return;
    try {
      await api.post("/academic/lesson-plan", {
        standard: planStandard,
        subject: newPlanSubject,
        chapter_name: newChapter,
        completion_percentage: 0,
        status: "IN_PROGRESS"
      });
      setNewChapter("");
      fetchSyllabus();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProgress = async (id: number, val: number) => {
    try {
      await api.put(`/academic/lesson-plan/${id}/progress?progress=${val}`);
      // Optimistic state update
      setSyllabusList(prev => 
        prev.map(item => item.id === id ? { ...item, completion_percentage: val, status: val === 100 ? "COMPLETED" : "IN_PROGRESS" } : item)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetable = async () => {
    setTimetableLoading(true);
    try {
      const teacherId = localStorage.getItem("teacherId") || "1";
      const res = await api.get(`/academic/teachers/${teacherId}/timetable`);
      setTimetableList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTimetableLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-500" />
            <span>Academic & Syllabus Console</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish daily homework assignments, schedule lesson planners, track syllabus, and manage schedules.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("homework")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "homework" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Homework Upload
          </button>
          <button
            onClick={() => setActiveTab("syllabus")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "syllabus" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Syllabus Tracker
          </button>
          <button
            onClick={() => setActiveTab("timetable")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "timetable" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            My Timetable
          </button>
        </div>
      </div>

      {/* Homework Tab */}
      {activeTab === "homework" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Upload Form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 h-fit">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Upload Homework Assignment</span>
            </h2>

            <form onSubmit={handleUploadHomework} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Standard</label>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 3: Exercise 3.2 Solutions"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain details of assignment questions to complete..."
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attachment URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. http://schoolstorage.com/pdf/ex3_math.pdf"
                  value={hwAttachment}
                  onChange={(e) => setHwAttachment(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submission Deadline</label>
                <input
                  type="date"
                  required
                  value={hwDeadline}
                  onChange={(e) => setHwDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? "Publishing..." : "Publish Assignment"}
              </button>
            </form>
          </div>

          {/* Right panel: Active homework list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Published Homework assignments for Class {standard} ({section})
              </span>
            </div>

            {homeworkList.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400 space-y-2">
                <ListTodo className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">No homework posted for this class selection yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {homeworkList.map((hw) => (
                  <div key={hw.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3.5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600/10 border-l border-b border-indigo-500/20 rounded-bl-xl text-[10px] text-indigo-400 font-bold uppercase">
                      {hw.subject}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{hw.title}</h3>
                      <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">"{hw.description}"</p>
                    </div>

                    {hw.attachment_url && (
                      <a 
                        href={hw.attachment_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 font-semibold hover:border-blue-500 hover:text-white transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Download Handout / Reference PDF</span>
                      </a>
                    )}

                    <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      <span>Posted: {new Date(hw.created_at).toLocaleDateString()}</span>
                      <span className="text-rose-400">Deadline: {hw.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Syllabus Tab */}
      {activeTab === "syllabus" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Add Syllabus item */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Add Chapter to Syllabus</span>
            </h2>

            <form onSubmit={handleCreateLessonPlan} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Std</label>
                <select
                  disabled={role === "teacher"}
                  value={planStandard}
                  onChange={(e) => setPlanStandard(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold disabled:opacity-60"
                >
                  <option value="7th">7th Standard</option>
                  <option value="9th">9th Standard</option>
                  <option value="11th">11th Standard</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                <select
                  value={newPlanSubject}
                  onChange={(e) => setNewPlanSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Physics">Physics</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chapter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Fractions & Decimals"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Add Lesson Chapter</span>
              </button>
            </form>
          </div>

          {/* Right panel: Syllabus progress list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Syllabus & Lesson Chapters Progress for {planStandard} Std
              </span>
            </div>

            {syllabusLoading ? (
              <div className="glass-panel p-8 rounded-2xl text-center text-slate-400">Loading syllabus tracker...</div>
            ) : syllabusList.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400 space-y-2">
                <BookmarkCheck className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">No syllabus plan registered for {planStandard} Std.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {syllabusList.map((plan) => (
                  <div key={plan.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 bg-indigo-600/10 border border-indigo-500/20 rounded-md text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                          {plan.subject}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1">{plan.chapter_name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.completion_percentage === 100 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>COMPLETED</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-950/40 text-blue-400 border border-blue-800/40 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            <span>IN PROGRESS</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Slider bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-bold">
                        <span>Completion Progress</span>
                        <span>{plan.completion_percentage}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={plan.completion_percentage}
                          onChange={(e) => handleUpdateProgress(plan.id, parseInt(e.target.value, 10))}
                          className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-900 border border-slate-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === "timetable" && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          {timetableLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading timetable sheet...</div>
          ) : timetableList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">No timetable entries seeded for Verma Sir.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[11px] tracking-wider font-bold">
                    <th className="py-3.5 px-4">Day of Week</th>
                    <th className="py-3.5 px-4">Period</th>
                    <th className="py-3.5 px-4">Class Standard</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Room / Lecture Lab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {timetableList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-white font-bold">{item.day_of_week}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-300">
                        Period {item.period_no}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-blue-400">
                        Std {item.standard} ({item.section})
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-white">{item.subject}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {item.classroom || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
