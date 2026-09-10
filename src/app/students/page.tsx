"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Student } from "@/types/student";
import EditStudentModal from "@/components/EditStudentModal";
import StudentLedgerModal from "@/components/StudentLedgerModal";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  GraduationCap, 
  Receipt,
  UserCheck,
  Pencil,
  Eye
} from "lucide-react";

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("admin");
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState("All");
  const [standard, setStandard] = useState("All");
  const [section, setSection] = useState("All");
  const [stream, setStream] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

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

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Ledger Modal State
  const [ledgerStudentGr, setLedgerStudentGr] = useState<string | null>(null);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/students?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`;
      if (division !== "All") url += `&division=${encodeURIComponent(division)}`;
      if (standard !== "All") url += `&standard=${encodeURIComponent(standard)}`;
      if (section !== "All") url += `&section=${encodeURIComponent(section)}`;
      if (stream !== "All") url += `&stream=${encodeURIComponent(stream)}`;
      if (statusFilter !== "All") url += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await api.get(url);
      setStudents(res.data || []);

      const totalHeader = res.headers["x-total-count"];
      if (totalHeader) {
        setTotalCount(parseInt(totalHeader, 10));
      } else {
        setTotalCount((res.data || []).length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [division, standard, section, stream, statusFilter]);

  // Fetch students whenever filters, search, or pagination params change
  useEffect(() => {
    fetchStudents();
  }, [division, standard, section, stream, statusFilter, page, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setIsEditOpen(true);
  };

  // Available standard options based on division
  const getStandardOptions = () => {
    if (division === "Pre-Primary") return ["Nursery", "Jr. KG", "Sr. KG"];
    if (division === "School Section") return ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
    if (division === "Junior College") return ["11th", "12th"];
    return ["Nursery", "Jr. KG", "Sr. KG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-400" />
            Student Directory & Official GR Register
          </h2>
          <p className="text-sm text-slate-400">
            View & update student records with mandatory document verification for Name & DOB changes
          </p>
        </div>

        {["admin", "SUPER_ADMIN", "SCHOOL_ADMIN"].includes(role) && (
          <Link
            href="/admission"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add New Student
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by GR No, Name, Aadhar No, Surname, Parent Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/30"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters Grid */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Filters:</span>
          </div>

          {/* Division Filter */}
          <select
            disabled={role === "teacher"}
            value={division}
            onChange={(e) => {
              setDivision(e.target.value);
              setStandard("All");
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-blue-500 disabled:opacity-60"
          >
            <option value="All">All Divisions</option>
            <option value="Pre-Primary">Pre-Primary</option>
            <option value="School Section">School Section</option>
            <option value="Junior College">Junior College</option>
          </select>

          {/* Standard / Class Filter */}
          <select
            disabled={role === "teacher"}
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-blue-500 disabled:opacity-60"
          >
            <option value="All">All Standards / Classes</option>
            {getStandardOptions().map((std) => (
              <option key={std} value={std}>
                Std {std}
              </option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            disabled={role === "teacher"}
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-blue-500 disabled:opacity-60"
          >
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>

          {/* Stream Filter */}
          {(division === "Junior College" || division === "All") && (
            <select
              value={stream}
              onChange={(e) => setStream(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Streams</option>
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
              <option value="Arts">Arts</option>
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Passed">Passed</option>
            <option value="Left">Left</option>
          </select>

          {/* Reset Filters */}
          {(division !== "All" || standard !== "All" || section !== "All" || stream !== "All" || statusFilter !== "All" || search !== "") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDivision("All");
                setStandard("All");
                setSection("All");
                setStream("All");
                setStatusFilter("All");
              }}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl font-bold border border-rose-800/40 transition-all ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading student directory...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium">No student records found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">GR Number</th>
                  <th className="py-3.5 px-4">Candidate Full Name</th>
                  <th className="py-3.5 px-4">Mother's Name</th>
                  <th className="py-3.5 px-4">Aadhar Number</th>
                  <th className="py-3.5 px-4">Division & Class</th>
                  <th className="py-3.5 px-4">Category / Religion</th>
                  <th className="py-3.5 px-4">Mobile & Address</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setLedgerStudentGr(st.gr_no)}
                        className="font-mono font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-1 text-left transition-colors"
                      >
                        <span>{st.gr_no}</span>
                        <Eye className="w-3 h-3 text-blue-400" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setLedgerStudentGr(st.gr_no)}
                        className="font-semibold text-white hover:text-blue-300 text-left transition-colors"
                      >
                        <div>{st.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">DOB: {st.dob} ({st.gender})</div>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">{st.mother_name}</td>
                    <td className="py-3.5 px-4 text-xs font-mono font-medium text-slate-300">
                      {st.aadhar_no}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div>{st.division}</div>
                      <div className="text-[11px] font-semibold text-blue-400">
                        Std {st.standard} ({st.section}) {st.stream ? `[${st.stream}]` : ""}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold text-[10px] border border-amber-800/60 block w-fit mb-1">
                        {st.category}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{st.religion}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      <div>{st.phone}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                        {st.address} (PIN: {st.pin_code})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLedgerStudentGr(st.gr_no)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1"
                          title="View Full Ledger & Profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>Ledger</span>
                        </button>
                        {["admin", "SUPER_ADMIN", "SCHOOL_ADMIN"].includes(role) && (
                          <>
                            <button
                              onClick={() => handleEditClick(st)}
                              className="px-2.5 py-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white rounded-lg text-xs font-semibold border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                              title="Edit Student Record"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <Link
                              href="/fees"
                              className="px-2.5 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold border border-blue-500/30 transition-all flex items-center gap-1"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Fee</span>
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && students.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Items per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-slate-500 font-mono">
              Showing {Math.min((page - 1) * limit + 1, totalCount)} to {Math.min(page * limit, totalCount)} of {totalCount} students
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-950/40 disabled:text-slate-600 border border-slate-700 disabled:border-slate-800 rounded-xl transition-all"
            >
              First
            </button>
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-950/40 disabled:text-slate-600 border border-slate-700 disabled:border-slate-800 rounded-xl transition-all"
            >
              Prev
            </button>

            <span className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl font-mono">
              Page {page} of {Math.max(Math.ceil(totalCount / limit), 1)}
            </span>

            <button
              onClick={() => setPage(p => Math.min(p + 1, Math.ceil(totalCount / limit)))}
              disabled={page >= Math.ceil(totalCount / limit)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-950/40 disabled:text-slate-600 border border-slate-700 disabled:border-slate-800 rounded-xl transition-all"
            >
              Next
            </button>
            <button
              onClick={() => setPage(Math.ceil(totalCount / limit))}
              disabled={page >= Math.ceil(totalCount / limit)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-950/40 disabled:text-slate-600 border border-slate-700 disabled:border-slate-800 rounded-xl transition-all"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Student Comprehensive Ledger Modal */}
      <StudentLedgerModal
        grNoOrId={ledgerStudentGr}
        isOpen={!!ledgerStudentGr}
        onClose={() => setLedgerStudentGr(null)}
        onSelectForCollection={() => router.push("/fees")}
        onEditStudent={(st) => {
          setLedgerStudentGr(null);
          handleEditClick(st);
        }}
      />

      {/* Edit Modal */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={fetchStudents}
        />
      )}
    </div>
  );
}
