"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  UserCheck, 
  Calendar, 
  FileSpreadsheet, 
  Briefcase, 
  BellRing,
  Wallet,
  Clock,
  Printer,
  CheckCircle2,
  Plus
} from "lucide-react";

interface TimetableItem {
  id: number;
  day_of_week: string;
  period_no: number;
  standard: string;
  section: string;
  subject: string;
  classroom: string | null;
}

interface TeacherLeave {
  id: number;
  leave_type: string; // CASUAL, SICK, EARNED
  start_date: string;
  end_date: string;
  reason: string;
  status: string; // PENDING, APPROVED, REJECTED
  teacher_name?: string;
}

interface SubstitutionAlert {
  id: number;
  absent_teacher_name: string;
  day: string;
  period: string;
  class_assigned: string;
  subject: string;
}

interface PaySlip {
  month: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_paid: number;
  payment_date: string;
  payment_mode: string;
}

export default function TeacherSelfServicePage() {
  const [activeTab, setActiveTab] = useState<"schedule" | "leaves" | "payroll">("schedule");

  // Schedule & Timetable states
  const [timetableList, setTimetableList] = useState<TimetableItem[]>([]);
  const [subAlerts, setSubAlerts] = useState<SubstitutionAlert[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Leave states
  const [leavesList, setLeavesList] = useState<TeacherLeave[]>([]);
  const [leaveType, setLeaveType] = useState("CASUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [applyingLeave, setApplyingLeave] = useState(false);
  const [leavesLoading, setLeavesLoading] = useState(false);

  // Payroll states
  const [paySlips, setPaySlips] = useState<PaySlip[]>([]);
  const [selectedPaySlip, setSelectedPaySlip] = useState<PaySlip | null>(null);
  const [payrollLoading, setPayrollLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "schedule") {
      fetchScheduleAndAlerts();
    } else if (activeTab === "leaves") {
      fetchLeaves();
    } else {
      fetchPaySlips();
    }
  }, [activeTab]);

  const fetchScheduleAndAlerts = async () => {
    setScheduleLoading(true);
    try {
      // Fetch Timetable for Verma Sir (Teacher 1)
      const resTimetable = await api.get("/academic/teachers/1/timetable");
      setTimetableList(resTimetable.data || []);

      // Fetch Substitution Alerts
      const resAlerts = await api.get("/academic/teachers/substitution-alerts");
      setSubAlerts(resAlerts.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setScheduleLoading(false);
    }
  };

  const fetchLeaves = async () => {
    setLeavesLoading(true);
    try {
      // Fetch Leaves for Verma Sir (Teacher 1)
      const res = await api.get("/academic/teachers/1/leaves");
      setLeavesList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLeavesLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;
    setApplyingLeave(true);

    try {
      await api.post("/academic/teachers/leaves", {
        teacher_id: 1, // Default Verma Sir
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason
      });

      setStartDate("");
      setEndDate("");
      setReason("");
      fetchLeaves();
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingLeave(false);
    }
  };

  const fetchPaySlips = async () => {
    setPayrollLoading(true);
    try {
      // Fetch Pay Slips for Verma Sir (Teacher 1)
      const res = await api.get("/academic/teachers/1/pay-slips");
      setPaySlips(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedPaySlip(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPayrollLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-500" />
            <span>Teacher HR & Self-Service</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Check your personal teaching schedule, substitution lectures alerts, apply for HR leaves, and view payroll monthly pay slips.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "schedule" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            My Timetable & Alerts
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "leaves" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Leave Application
          </button>
          <button
            onClick={() => setActiveTab("payroll")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              activeTab === "payroll" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Payroll & Pay Slips
          </button>
        </div>
      </div>

      {/* Timetable & Schedule Tab */}
      {activeTab === "schedule" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          {/* Left panel: Substitution Alerts */}
          <div className="space-y-4 h-fit">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BellRing className="w-4 h-4 text-rose-500 animate-bounce" />
                <span>Substitution Alerts</span>
              </span>
            </div>

            {subAlerts.length === 0 ? (
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                No substitution duties assigned for today.
              </div>
            ) : (
              <div className="space-y-4">
                {subAlerts.map(alert => (
                  <div key={alert.id} className="glass-panel p-4.5 rounded-2xl border border-rose-800/40 bg-rose-950/10 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-rose-400 font-mono uppercase">
                      <span>{alert.period}</span>
                      <span>{alert.day}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">Cover Class: {alert.class_assigned}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Covering for <span className="text-slate-300 font-semibold">{alert.absent_teacher_name}</span> for {alert.subject}.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Regular Timetable */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Teaching Schedule (Verma Sir)</span>
              </span>
            </div>

            {scheduleLoading ? (
              <div className="glass-panel p-8 text-center text-slate-400 text-sm">Loading schedule...</div>
            ) : timetableList.length === 0 ? (
              <div className="glass-panel p-12 text-center text-slate-400 text-sm">No regular schedule found.</div>
            ) : (
              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[11px] tracking-wider font-bold">
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Classroom</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {timetableList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4 text-xs font-bold text-white">{item.day_of_week}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-300 font-mono">Period {item.period_no}</td>
                        <td className="py-3.5 px-4 text-xs font-bold text-blue-400">Std {item.standard} ({item.section})</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-white">{item.subject}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">{item.classroom || "Room 101"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave Application Tab */}
      {activeTab === "leaves" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          {/* Left panel: Leave Request Form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Apply for HR Leave</span>
            </h2>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick Leave (SL)</option>
                  <option value="EARNED">Earned Leave (EL)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Leave</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State your reason for application..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={applyingLeave}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer text-center"
              >
                {applyingLeave ? "Submitting..." : "Apply Leave Request"}
              </button>
            </form>
          </div>

          {/* Right panel: Leave status logs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>My HR Leave Applications History</span>
              </span>
            </div>

            {leavesLoading ? (
              <div className="glass-panel p-8 text-center text-slate-400">Loading leave requests...</div>
            ) : leavesList.length === 0 ? (
              <div className="glass-panel p-12 text-center text-slate-400 text-xs">No leave requests logged yet.</div>
            ) : (
              <div className="space-y-4">
                {leavesList.map(l => (
                  <div key={l.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 bg-indigo-600/10 border border-indigo-500/20 rounded-md text-[9px] text-indigo-400 font-bold uppercase font-mono">
                          {l.leave_type} Leave
                        </span>
                        <div className="text-xs font-bold text-white mt-1">Duration: {l.start_date} to {l.end_date}</div>
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          l.status === "PENDING"
                            ? "bg-amber-950/40 text-amber-300 border-amber-800/40"
                            : l.status === "APPROVED"
                            ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40 animate-pulse"
                            : "bg-rose-950/40 text-rose-300 border-rose-800/40"
                        }`}>
                          {l.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 italic">"Reason: {l.reason}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payroll & Pay Slips Tab */}
      {activeTab === "payroll" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Slips Selector */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 h-fit no-print">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Payroll Pay Slips</h2>
            <div className="space-y-2">
              {paySlips.map((slip, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPaySlip(slip)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border ${
                    selectedPaySlip?.month === slip.month
                      ? "bg-indigo-600/20 border-indigo-500/40 text-white"
                      : "bg-slate-900/40 border-transparent text-slate-400 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{slip.month}</span>
                    <span className="font-mono text-slate-300 font-bold">₹{slip.net_paid.toLocaleString()}</span>
                  </div>
                </button>
              ))}
              {paySlips.length === 0 && (
                <div className="text-slate-500 text-center text-xs py-4">No payroll registers loaded.</div>
              )}
            </div>
          </div>

          {/* Right Pay Slip Document View */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between no-print">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span>Monthly Pay Slip Details Sheet</span>
              </span>
              {selectedPaySlip && (
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Pay Slip</span>
                </button>
              )}
            </div>

            {selectedPaySlip ? (
              <div className="p-8 bg-[#fdfcf7] text-slate-900 border-2 border-slate-300 rounded-3xl space-y-6 shadow-2xl relative select-text leading-normal max-w-2xl mx-auto font-serif">
                
                {/* School Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <h3 className="text-lg font-black uppercase text-slate-950 tracking-wider">
                    Avdhoot Bhagwan Ram Vidyalaya
                  </h3>
                  <p className="text-[11px] font-sans font-semibold text-slate-600">
                    B-402, Gokul Heights, Suburban Colony, Mumbai • PIN: 400001
                  </p>
                  <div className="inline-block mt-2 px-4 py-0.5 border border-slate-900 bg-slate-950 text-white text-[10px] font-sans font-bold uppercase tracking-wider">
                    Salary Payment Advice Pay Slip ({selectedPaySlip.month})
                  </div>
                </div>

                {/* Teacher Profile */}
                <div className="grid grid-cols-2 gap-4 text-xs font-sans border-b border-slate-200 pb-4">
                  <div className="space-y-1">
                    <div>Teacher Name: <span className="font-bold text-slate-950">Verma Sir (Maths)</span></div>
                    <div>Designation: <span className="font-semibold text-slate-700">Class Teacher (7th-B)</span></div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div>Payment Date: <span className="font-mono font-bold text-slate-950">{selectedPaySlip.payment_date}</span></div>
                    <div>Payment Mode: <span className="font-bold text-slate-950">{selectedPaySlip.payment_mode}</span></div>
                  </div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="grid grid-cols-2 gap-6 pt-2 text-xs font-sans">
                  {/* Earnings */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Earnings & Allowances
                    </span>
                    <table className="w-full text-left border border-slate-300">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-2 px-3 font-semibold bg-slate-50">Basic Salary</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">₹{selectedPaySlip.basic_salary.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold bg-slate-50">Allowances (HRA/DA)</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">₹{selectedPaySlip.allowances.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Deductions
                    </span>
                    <table className="w-full text-left border border-slate-300">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-2 px-3 font-semibold bg-slate-50">Provident Fund (PF)</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">₹{(selectedPaySlip.deductions * 0.8).toFixed(0)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold bg-slate-50">Professional Tax (PT)</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">₹{(selectedPaySlip.deductions * 0.2).toFixed(0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Net Summary Block */}
                <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl flex justify-between items-center text-sm font-sans font-bold uppercase tracking-wide">
                  <span className="text-slate-700">Net Payable Remittance:</span>
                  <span className="text-slate-950 font-mono text-lg">₹{selectedPaySlip.net_paid.toLocaleString()}</span>
                </div>

                {/* Note */}
                <p className="text-[10px] font-sans font-medium text-slate-500 italic text-center pt-2">
                  "This is an electronically generated salary advice payload slip, and does not require signature stamps."
                </p>

              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">Select a pay slip month from left to load details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
