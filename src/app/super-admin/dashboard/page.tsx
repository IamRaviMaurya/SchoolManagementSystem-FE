"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Building2, Users, IndianRupee, CheckCircle2, ChevronDown, ArrowUpDown, Settings2,
  Plus, RefreshCw, X, Eye, Check, Ban, KeyRound, ExternalLink, AlertCircle,
} from "lucide-react";

interface TenantSchool {
  id: string;
  school_name: string;
  slug: string;
  contact_email: string;
  contact_phone: string;
  status: "PENDING" | "VERIFIED" | "SUSPENDED" | "REJECTED";
  subscription_plan: "FREE_TRIAL" | "BASIC" | "PREMIUM";
  student_limit: number;
  subscription_expires_at?: string;
  created_at?: string;
}

interface Analytics {
  total_schools: number;
  active_schools: number;
  pending_verifications: number;
  total_students_across_all_tenants: number;
  estimated_mrr_inr: number;
  plans_breakdown: { FREE_TRIAL: number; BASIC: number; PREMIUM: number };
  trends?: { months: string[]; schools: number[]; students: number[]; mrr: number[]; new_students_last_month: number };
}

type Filter = "ALL" | "PENDING" | "VERIFIED" | "SUSPENDED";

/* ────────── tiny chart primitives (pure SVG, theme-aware via CSS vars) ────────── */
function Sparkline({ data, height = 56 }: { data: number[]; height?: number }) {
  const w = 220;
  const pts = data.length > 1 ? data : [0, ...(data.length ? data : [0])];
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const step = w / (pts.length - 1);
  const y = (v: number) => height - 6 - ((v - min) / (max - min || 1)) * (height - 14);
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L${w},${height} L0,${height} Z`;
  const id = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--hc-chart-fill)" />
          <stop offset="100%" stopColor="var(--hc-chart-fill)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke="var(--hc-chart)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-sm"
          style={{ height: `${Math.max(12, (v / max) * 100)}%`, background: i === data.length - 1 ? "var(--hc-chart)" : "var(--hc-border-strong)", opacity: i === data.length - 1 ? 1 : 0.55 }}
        />
      ))}
    </div>
  );
}

function planPill(plan: TenantSchool["subscription_plan"]) {
  if (plan === "PREMIUM") return <span className="hc-pill hc-pill-amber">Premium</span>;
  if (plan === "BASIC") return <span className="hc-pill hc-pill-blue">Basic</span>;
  return <span className="hc-pill hc-pill-muted">Trial</span>;
}

function statusPill(status: TenantSchool["status"]) {
  if (status === "VERIFIED") return <span className="hc-pill hc-pill-success">Verified</span>;
  if (status === "PENDING") return <span className="hc-pill hc-pill-amber">Pending</span>;
  if (status === "SUSPENDED") return <span className="hc-pill hc-pill-danger">Suspended</span>;
  return <span className="hc-pill hc-pill-muted">Rejected</span>;
}

/* ────────── page ────────── */
export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<TenantSchool[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sortAsc, setSortAsc] = useState(true);
  // Row action menu is rendered position:fixed so the table's overflow container cannot clip it.
  const [menu, setMenu] = useState<{ id: string; top: number; right: number } | null>(null);
  const menuFor = menu?.id ?? null;
  const setMenuFor = (id: string | null) => setMenu(id ? { id, top: 0, right: 0 } : null);
  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    if (menu?.id === id) return setMenu(null);
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({ id, top: r.bottom + 4, right: window.innerWidth - r.right });
  };
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [creds, setCreds] = useState<any | null>(null);
  const [regForm, setRegForm] = useState({
    school_name: "", slug: "", contact_email: "", contact_phone: "", address: "", subscription_plan: "BASIC",
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, a] = await Promise.all([api.get("/super-admin/schools"), api.get("/super-admin/analytics")]);
      setSchools(s.data);
      setAnalytics(a.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not load platform data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // A fixed-position menu must not outlive the layout it was measured against.
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const act = async (school: TenantSchool, status: "VERIFIED" | "SUSPENDED" | "REJECTED") => {
    setMenuFor(null);
    if (status !== "VERIFIED" && !confirm(`${status === "SUSPENDED" ? "Suspend" : "Reject"} ${school.school_name}? Their users will be locked out immediately.`)) return;
    try {
      setProcessingId(school.id);
      const res = await api.patch(`/super-admin/schools/${school.id}/verify`, { status, student_limit: 500, subscription_days: 365 });
      if (res.data.credentials) setCreds(res.data.credentials);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const resetPassword = async (school: TenantSchool) => {
    setMenuFor(null);
    if (!confirm(`Issue a new temporary admin password for ${school.school_name}?`)) return;
    try {
      setProcessingId(school.id);
      const res = await api.post(`/super-admin/schools/${school.id}/reset-admin-password`);
      setCreds(res.data.credentials);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Reset failed");
    } finally {
      setProcessingId(null);
    }
  };

  const inspect = (school: TenantSchool) => {
    localStorage.setItem("tenant_id", school.id);
    localStorage.setItem("tenant_slug", school.slug);
    localStorage.setItem("schoolName", school.school_name);
    router.push("/dashboard");
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcessingId("NEW");
      await api.post("/super-admin/register-school", regForm);
      setShowRegister(false);
      setRegForm({ school_name: "", slug: "", contact_email: "", contact_phone: "", address: "", subscription_plan: "BASIC" });
      await load();
    } catch (err: any) {
      const d = err.response?.data?.detail;
      alert(Array.isArray(d) ? d.map((x: any) => x.msg).join("\n") : d || "Registration failed");
    } finally {
      setProcessingId(null);
    }
  };

  const rows = useMemo(() => {
    const list = schools.filter((s) => filter === "ALL" || s.status === filter);
    return [...list].sort((a, b) => sortAsc
      ? a.school_name.localeCompare(b.school_name)
      : b.school_name.localeCompare(a.school_name));
  }, [schools, filter, sortAsc]);

  const t = analytics?.trends;
  const mrr = analytics?.estimated_mrr_inr || 0;

  return (
    <div className="space-y-6" onClick={() => menuFor && setMenuFor(null)}>
      {/* Title row */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold hc-text">Super Admin Dashboard</h2>
        <div className="ml-auto flex items-center gap-2">
          <button className="hc-btn" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button className="hc-btn hc-btn-primary" onClick={() => setShowRegister(true)}>
            <Plus className="w-4 h-4" /> Register School
          </button>
        </div>
      </div>

      {error && (
        <div className="hc-card p-4 flex items-center gap-2 text-sm hc-danger">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="hc-card hc-card-glow p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="hc-kpi-label"><Building2 className="w-4 h-4" /> Total Schools</div>
            <span className="hc-icon-btn !w-8 !h-8 border hc-border"><ArrowUpDown className="w-3.5 h-3.5" /></span>
          </div>
          {loading ? <div className="hc-skeleton h-9 w-16" /> : <div className="hc-kpi-value">{analytics?.total_schools ?? 0}</div>}
          <div className="text-xs font-semibold hc-success">{analytics?.active_schools ?? 0} Active</div>
          <Sparkline data={t?.schools || []} />
          <div className="hc-kpi-sub">Last 6 months</div>
        </div>

        <div className="hc-card hc-card-glow p-5 space-y-3">
          <div className="hc-kpi-label"><Users className="w-4 h-4" /> Total Students</div>
          <div className="flex items-end justify-between gap-3">
            {loading ? <div className="hc-skeleton h-9 w-16" /> : <div className="hc-kpi-value">{analytics?.total_students_across_all_tenants ?? 0}</div>}
            <Bars data={t?.students || []} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="hc-text-3">New students<div className="hc-text font-bold">{t?.new_students_last_month ?? 0} <span className="hc-text-3 font-normal">this month</span></div></div>
            <div className="hc-text-3">Verified schools<div className="hc-text font-bold">{analytics?.active_schools ?? 0}</div></div>
          </div>
        </div>

        <div className="hc-card hc-card-glow p-5 space-y-3">
          <div className="hc-kpi-label"><IndianRupee className="w-4 h-4" /> Platform MRR</div>
          {loading ? <div className="hc-skeleton h-9 w-28" /> : (
            <div className="hc-kpi-value">₹{mrr.toLocaleString("en-IN")} <span className="text-base hc-text-3 font-semibold">₹$</span></div>
          )}
          <Sparkline data={t?.mrr || []} />
          <div className="hc-kpi-sub">Basic {analytics?.plans_breakdown.BASIC ?? 0} · Premium {analytics?.plans_breakdown.PREMIUM ?? 0} · Trial {analytics?.plans_breakdown.FREE_TRIAL ?? 0}</div>
        </div>

        <div className="hc-card hc-card-glow p-5 space-y-3">
          <div className="hc-kpi-label">Pending Verifications</div>
          <div className="flex items-center justify-between">
            {loading ? <div className="hc-skeleton h-9 w-12" /> : <div className="hc-kpi-value">{analytics?.pending_verifications ?? 0}</div>}
            <div className="w-16 h-16 rounded-full grid place-items-center" style={{ background: "var(--hc-success-soft)" }}>
              <CheckCircle2 className="w-9 h-9" style={{ color: "var(--hc-success)" }} />
            </div>
          </div>
          <div className="hc-kpi-sub">
            {analytics?.pending_verifications ? "Schools waiting for KYC approval" : "Queue is clear"}
          </div>
          {analytics?.pending_verifications ? (
            <button className="hc-btn w-full justify-center" onClick={() => setFilter("PENDING")}>Review queue</button>
          ) : null}
        </div>
      </div>

      {/* Tenant directory */}
      <div className="hc-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b hc-border">
          <h3 className="text-base font-bold hc-text">Tenant Directory</h3>
          <div className="ml-auto hc-segment">
            {(["ALL", "PENDING", "VERIFIED", "SUSPENDED"] as Filter[]).map((f) => (
              <button key={f} className={filter === f ? "is-active" : ""} onClick={() => setFilter(f)}>
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="hc-table">
            <thead>
              <tr>
                <th>
                  <button className="inline-flex items-center gap-1" onClick={() => setSortAsc((v) => !v)}>
                    Name <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>Slug</th>
                <th>Contact Info</th>
                <th>Subscription Plan</th>
                <th>Status</th>
                <th className="text-right"><span className="inline-flex items-center gap-1">Actions <Settings2 className="w-3.5 h-3.5" /></span></th>
              </tr>
            </thead>
            <tbody>
              {loading && schools.length === 0 ? (
                [0, 1, 2].map((i) => (
                  <tr key={i}>{[0, 1, 2, 3, 4, 5].map((j) => <td key={j}><div className="hc-skeleton h-4 w-full" /></td>)}</tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 hc-text-3">No schools match this filter.</td></tr>
              ) : rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="font-bold hc-text">{s.school_name}</div>
                    <div className="text-xs hc-text-3">{s.student_limit} student limit</div>
                  </td>
                  <td>
                    <a href={`/${s.slug}/login`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs hc-accent">
                      /{s.slug}/login <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td>
                    <div className="hc-text">{s.contact_phone}</div>
                    <div className="text-xs hc-text-3">{s.contact_email}</div>
                  </td>
                  <td><div className="flex gap-1.5">{planPill(s.subscription_plan)}</div></td>
                  <td>{statusPill(s.status)}</td>
                  <td className="text-right">
                    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="hc-btn"
                        disabled={processingId === s.id}
                        onClick={(e) => openMenu(e, s.id)}
                      >
                        {processingId === s.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                        Inspect Data <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {menuFor === s.id && (
                        <div className="hc-menu w-52" style={{ position: "fixed", top: menu?.top, right: menu?.right }}>
                          <button className="hc-menu-item" onClick={() => inspect(s)}><Eye className="w-4 h-4" /> Inspect Data</button>
                          {s.status === "PENDING" && (
                            <button className="hc-menu-item hc-success" onClick={() => act(s, "VERIFIED")}><Check className="w-4 h-4" /> Approve & Onboard</button>
                          )}
                          {s.status === "SUSPENDED" && (
                            <button className="hc-menu-item hc-success" onClick={() => act(s, "VERIFIED")}><Check className="w-4 h-4" /> Re-activate</button>
                          )}
                          {s.status !== "PENDING" && (
                            <button className="hc-menu-item" onClick={() => resetPassword(s)}><KeyRound className="w-4 h-4" /> Reset admin password</button>
                          )}
                          {s.status === "VERIFIED" && (
                            <button className="hc-menu-item hc-danger" onClick={() => act(s, "SUSPENDED")}><Ban className="w-4 h-4" /> Suspend</button>
                          )}
                          {s.status === "PENDING" && (
                            <button className="hc-menu-item hc-danger" onClick={() => act(s, "REJECTED")}><X className="w-4 h-4" /> Reject</button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register modal */}
      {showRegister && (
        <div className="hc-overlay" onClick={() => setShowRegister(false)}>
          <form onSubmit={register} onClick={(e) => e.stopPropagation()} className="hc-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold hc-text">Register New School</h3>
              <button type="button" className="hc-icon-btn" onClick={() => setShowRegister(false)}><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="hc-label">School name</label>
              <input className="hc-input" required value={regForm.school_name} onChange={(e) => setRegForm({ ...regForm, school_name: e.target.value })} placeholder="Greenwood High International" />
            </div>
            <div>
              <label className="hc-label">Slug (login URL)</label>
              <input className="hc-input font-mono" required value={regForm.slug} onChange={(e) => setRegForm({ ...regForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="greenwood" />
              <div className="text-xs hc-text-3 mt-1">/{regForm.slug || "slug"}/login</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="hc-label">Contact email</label>
                <input className="hc-input" type="email" required value={regForm.contact_email} onChange={(e) => setRegForm({ ...regForm, contact_email: e.target.value })} />
              </div>
              <div>
                <label className="hc-label">Contact phone</label>
                <input className="hc-input" required value={regForm.contact_phone} onChange={(e) => setRegForm({ ...regForm, contact_phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="hc-label">Subscription plan</label>
              <select className="hc-input" value={regForm.subscription_plan} onChange={(e) => setRegForm({ ...regForm, subscription_plan: e.target.value })}>
                <option value="FREE_TRIAL">Free Trial (50 students)</option>
                <option value="BASIC">Basic (500 students)</option>
                <option value="PREMIUM">Premium (unlimited)</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" className="hc-btn flex-1 justify-center" onClick={() => setShowRegister(false)}>Cancel</button>
              <button type="submit" className="hc-btn hc-btn-primary flex-1 justify-center" disabled={processingId === "NEW"}>Register</button>
            </div>
          </form>
        </div>
      )}

      {/* Credentials modal */}
      {creds && (
        <div className="hc-overlay" onClick={() => setCreds(null)}>
          <div className="hc-card hc-card-glow w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" style={{ color: "var(--hc-success)" }} />
              <h3 className="text-lg font-bold hc-text">School admin credentials</h3>
            </div>
            <p className="text-sm hc-text-2">Share these with the principal. The temporary password is shown only once and must be changed at first login.</p>
            <div className="rounded-xl p-4 text-sm font-mono space-y-2" style={{ background: "var(--hc-surface-2)", border: "1px solid var(--hc-border)" }}>
              <div><span className="hc-text-3">Email:</span> <span className="hc-text">{creds.admin_email}</span></div>
              <div><span className="hc-text-3">Temp password:</span> <span className="font-bold" style={{ color: "var(--hc-warning)" }}>{creds.temporary_password}</span></div>
              <div><span className="hc-text-3">Login:</span> <a className="hc-accent underline" href={creds.login_path} target="_blank" rel="noreferrer">{creds.login_path}</a></div>
            </div>
            <button className="hc-btn hc-btn-primary w-full justify-center" onClick={() => setCreds(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
