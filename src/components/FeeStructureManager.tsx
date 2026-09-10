"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { FeeStructure } from "@/types/fee";
import { formatCurrencyINR } from "@/lib/utils";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Building2, 
  Check, 
  X, 
  AlertCircle,
  Sparkles
} from "lucide-react";

const MONTHS = [
  "June 2026", "July 2026", "August 2026", "September 2026",
  "October 2026", "November 2026", "December 2026", "January 2027",
  "February 2027", "March 2027", "April 2027", "May 2027",
  "Term 1", "Term 2", "Annual"
];

const CATEGORIES = [
  "Monthly Tuition Fee",
  "Development Fee",
  "Computer & Lab Fee",
  "Exam & Laboratory Fee",
  "Activity & Play Fee",
  "Admission / Term Fee",
  "Library Fee"
];

export default function FeeStructureManager() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDivision, setFilterDivision] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    category: "Monthly Tuition Fee",
    division: "School Section",
    standard: "All",
    stream: "",
    term: "June 2026",
    amount: 3000,
    academic_year: "2026-2027",
  });

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fees/structures/all?division=${filterDivision}`);
      setStructures(res.data || []);
    } catch (err) {
      console.error("Failed to load fee structures:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, [filterDivision]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      category: "Monthly Tuition Fee",
      division: "School Section",
      standard: "All",
      stream: "",
      term: "June 2026",
      amount: 3000,
      academic_year: "2026-2027",
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (st: FeeStructure) => {
    setEditingId(st.id);
    setFormData({
      category: st.category,
      division: st.division,
      standard: st.standard || "All",
      stream: st.stream || "",
      term: st.term,
      amount: st.amount,
      academic_year: st.academic_year || "2026-2027",
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount) {
      setErrorMsg("Category and Amount are required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const payload = {
      ...formData,
      amount: Number(formData.amount),
      stream: formData.stream || undefined,
    };

    try {
      if (editingId) {
        await api.put(`/fees/structures/${editingId}`, payload);
      } else {
        await api.post("/fees/structures", payload);
      }
      setIsModalOpen(false);
      fetchStructures();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to save fee structure.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; category: string; term: string; division: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDeleteModal = (st: FeeStructure) => {
    setDeleteTarget({
      id: st.id,
      category: st.category,
      term: st.term,
      division: st.division,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/fees/structures/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchStructures();
    } catch (err) {
      console.error("Failed to delete fee structure:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = structures.filter((st) => {
    const query = searchQuery.toLowerCase();
    return (
      st.category.toLowerCase().includes(query) ||
      st.term.toLowerCase().includes(query) ||
      st.division.toLowerCase().includes(query) ||
      st.standard.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Actions & Filters */}
      <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            Fee Structure Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Add, update, or remove monthly and annual fee heads for academic divisions
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Fee Head
        </button>
      </div>

      {/* Filter Bar & Search */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Filter Division:</span>
          {["All", "Pre-Primary", "School Section", "Junior College"].map((div) => (
            <button
              key={div}
              onClick={() => setFilterDivision(div)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterDivision === div
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white border border-slate-300 dark:border-slate-800"
              }`}
            >
              {div}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by category or term..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Fee Structures Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading fee structures...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No fee structure heads found for division "<span className="text-slate-300 font-bold">{filterDivision}</span>".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Fee Head Category</th>
                  <th className="py-3.5 px-4">Division & Class</th>
                  <th className="py-3.5 px-4">Stream</th>
                  <th className="py-3.5 px-4">Month / Term</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                {filteredItems.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white">{st.category}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold border border-blue-300 dark:border-blue-800 text-[11px]">
                        {st.division} (Std {st.standard})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-600">
                      {st.stream || "N/A"}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-500">{st.term}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      {formatCurrencyINR(st.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(st)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
                          title="Edit Fee Head"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(st)}
                          className="p-1.5 bg-rose-50 dark:bg-slate-800 hover:bg-rose-600 dark:hover:bg-rose-600 text-rose-700 dark:text-slate-300 hover:text-white dark:hover:text-white rounded-lg transition-colors border border-rose-200 dark:border-slate-700"
                          title="Delete Fee Head"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Fee Structure Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                {editingId ? "Update Fee Structure Head" : "Add New Fee Structure Head"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Fee Head Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  list="category-suggestions"
                  placeholder="e.g. Monthly Tuition Fee"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                />
                <datalist id="category-suggestions">
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Academic Division</label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Pre-Primary">Pre-Primary</option>
                    <option value="School Section">School Section</option>
                    <option value="Junior College">Junior College</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Standard / Class</label>
                  <select
                    value={formData.standard}
                    onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="All">All Standards</option>
                    <option value="Nursery">Nursery</option>
                    <option value="Jr. KG">Jr. KG</option>
                    <option value="Sr. KG">Sr. KG</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="3rd">3rd</option>
                    <option value="4th">4th</option>
                    <option value="5th">5th</option>
                    <option value="6th">6th</option>
                    <option value="7th">7th</option>
                    <option value="8th">8th</option>
                    <option value="9th">9th</option>
                    <option value="10th">10th</option>
                    <option value="11th">11th</option>
                    <option value="12th">12th</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Stream (Jr. College)</label>
                  <select
                    value={formData.stream}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None / Not Applicable</option>
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Month / Term</label>
                  <input
                    type="text"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    list="month-suggestions"
                    placeholder="e.g. June 2026 or Annual"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="month-suggestions">
                    {MONTHS.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Fee Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-sm rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  {isSaving ? "Saving..." : editingId ? "Update Fee Head" : "Create Fee Head"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center relative">
            {/* Warning Icon */}
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-bold text-white text-lg">Confirm Deletion</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete this fee structure head? This action cannot be undone.
              </p>
            </div>

            {/* Target Item Card */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Fee Head Category:</span>
                <span className="font-bold text-white">{deleteTarget.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Month / Term:</span>
                <span className="font-mono font-semibold text-blue-300">{deleteTarget.term}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Division:</span>
                <span className="font-semibold text-slate-200">{deleteTarget.division}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeleting ? "Deleting..." : "Yes, Delete Head"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
