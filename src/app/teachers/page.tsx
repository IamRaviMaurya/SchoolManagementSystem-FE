"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  Users, UserPlus, Phone, Mail, Award, Check, 
  AlertCircle, ShieldAlert, KeyRound, Sparkles,
  Pencil, Trash2, X, Eye, EyeOff, Copy
} from "lucide-react";

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  assigned_class: string;
  assigned_section: string;
  status: string;
  password?: string;
}

export default function TeachersPage() {
  const router = useRouter();
  const [role, setRole] = useState<string>("admin");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [assignedClass, setAssignedClass] = useState("7th");
  const [assignedSection, setAssignedSection] = useState("B");
  const [password, setPassword] = useState("teacher123");
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [selectedEditTeacher, setSelectedEditTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole") || "admin";
    setRole(userRole);
    const isAuthorized = ["admin", "SUPER_ADMIN", "SCHOOL_ADMIN"].includes(userRole);
    if (!isAuthorized) {
      router.replace("/dashboard");
      return;
    }
    fetchTeachers();
  }, [router]);

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/academic/teachers/all");
      setTeachers(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch teachers directory.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete teacher "${name}"?`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/academic/teachers/${teacherId}/delete`);
      setSuccess(`Teacher "${name}" deleted successfully.`);
      fetchTeachers();
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete teacher profile.");
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name,
        email,
        phone,
        assigned_class: assignedClass,
        assigned_section: assignedSection,
        status: "Active",
        password
      };
      await api.post("/academic/teachers/create", payload);
      setSuccess(`Teacher ${name} registered successfully! Default Password: ${password}`);
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setPassword("teacher123");
      fetchTeachers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create new teacher profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAuthorized = ["admin", "SUPER_ADMIN", "SCHOOL_ADMIN"].includes(role);
  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4 text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500" />
        <h2 className="text-lg font-black text-white uppercase tracking-wider">Access Denied</h2>
        <p className="text-xs">Only administrators are authorized to access the Teachers module.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-500" />
            <span>Teacher & Staff Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register new teachers, update login credentials, and assign primary classroom duties.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Form: Add Teacher */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 h-fit">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4.5 h-4.5 text-blue-500" />
            <span>Add New Teacher Profile</span>
          </h2>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAddTeacher} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Verma Sir (Maths)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email (Username)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. name@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9898012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Standard</label>
                <select
                  value={assignedClass}
                  onChange={(e) => setAssignedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="Nursery">Nursery</option>
                  <option value="Jr. KG">Jr. KG</option>
                  <option value="Sr. KG">Sr. KG</option>
                  {Array.from({ length: 12 }, (_, i) => `${i + 1}th`).map(std => (
                    <option key={std} value={std}>{std}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Section</label>
                <select
                  value={assignedSection}
                  onChange={(e) => setAssignedSection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-blue-400" />
                <span>Login Password</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <span>{submitting ? "Registering..." : "Create Teacher Account"}</span>
            </button>
          </form>
        </div>

        {/* Right List: Teacher Profiles */}
        <div className="xl:col-span-2 space-y-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Active Staff Listing</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total: {teachers.length} profiles</span>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Fetching teachers records...</div>
            ) : teachers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No teacher profiles created yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[11px] tracking-wider font-bold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4 text-center">Class Duty</th>
                      <th className="py-3 px-4 text-center">Default Password</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4 text-xs font-bold text-white">{t.name}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{t.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{t.phone}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-bold">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 whitespace-nowrap text-[10px]">
                            {t.assigned_class} - {t.assigned_section}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-mono">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={visiblePasswords[t.id] ? "text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20" : "text-slate-500"}>
                              {visiblePasswords[t.id] ? (t.password || "teacher123") : "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(t.id)}
                              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title={visiblePasswords[t.id] ? "Hide Password" : "Show Password"}
                            >
                              {visiblePasswords[t.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            t.status === "Active" 
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedEditTeacher(t)}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                              title="Edit Details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(t.id, t.name)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      </div>

      {selectedEditTeacher && (
        <EditTeacherModal
          teacher={selectedEditTeacher}
          onClose={() => setSelectedEditTeacher(null)}
          onSuccess={() => {
            setSelectedEditTeacher(null);
            setSuccess("Teacher details updated successfully.");
            fetchTeachers();
          }}
        />
      )}
    </div>
  );
}

interface EditTeacherModalProps {
  teacher: Teacher;
  onClose: () => void;
  onSuccess: () => void;
}

function EditTeacherModal({ teacher, onClose, onSuccess }: EditTeacherModalProps) {
  const [name, setName] = useState(teacher.name);
  const [email, setEmail] = useState(teacher.email);
  const [phone, setPhone] = useState(teacher.phone);
  const [assignedClass, setAssignedClass] = useState(teacher.assigned_class);
  const [assignedSection, setAssignedSection] = useState(teacher.assigned_section);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(teacher.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        email,
        phone,
        assigned_class: assignedClass,
        assigned_section: assignedSection,
        status,
        // Empty = keep the current password
        password: password || undefined,
      };
      await api.put(`/academic/teachers/${teacher.id}/update`, payload);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to update teacher profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-800 space-y-5 shadow-2xl relative animate-scaleIn">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Pencil className="w-4.5 h-4.5 text-blue-400" />
            <span>Edit Teacher Account</span>
          </h3>
          <p className="text-[10px] text-slate-400">Modify login username, credentials, and room duty rosters.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Teacher Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email (Username)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Class Duty</label>
              <select
                value={assignedClass}
                onChange={(e) => setAssignedClass(e.target.value)}
                className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="Nursery">Nursery</option>
                <option value="Jr. KG">Jr. KG</option>
                <option value="Sr. KG">Sr. KG</option>
                {Array.from({ length: 12 }, (_, i) => `${i + 1}th`).map(std => (
                  <option key={std} value={std}>{std}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Section Duty</label>
              <select
                value={assignedSection}
                onChange={(e) => setAssignedSection(e.target.value)}
                className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">New Password (leave blank to keep)</label>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/20"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
