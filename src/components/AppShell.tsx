"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, UserPlus, Users, Receipt, BookUser, CalendarDays, BookOpen,
  FileSpreadsheet, Megaphone, UserCheck, LogOut, Sun, Moon, Bell, HelpCircle,
  ChevronDown, Menu, X, ShieldCheck, Building2, GraduationCap, Check, KeyRound,
} from "lucide-react";
import api from "@/lib/api";

interface TenantSchool {
  id: string;
  school_name: string;
  slug: string;
  status: string;
}

type NavItem = { label: string; href: string; icon: any };

const SCHOOL_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Admissions", href: "/admission", icon: UserPlus },
  { label: "Teachers", href: "/teachers", icon: Users },
  { label: "Fee Desk", href: "/fees", icon: Receipt },
  { label: "Directory", href: "/students", icon: BookUser },
  { label: "Attendance", href: "/attendance", icon: CalendarDays },
  { label: "Academics", href: "/academic", icon: BookOpen },
  { label: "Exams", href: "/exams", icon: FileSpreadsheet },
  { label: "Notices", href: "/communication", icon: Megaphone },
  { label: "HR Portal", href: "/teacher-self-service", icon: UserCheck },
];
const ADMIN_ONLY = new Set(["/admission", "/teachers", "/fees"]);

const TITLES: Record<string, string> = {
  "/super-admin/dashboard": "Platform Dashboard",
  "/dashboard": "Dashboard",
  "/admission": "Admissions",
  "/teachers": "Teachers",
  "/fees": "Fee Desk",
  "/students": "Student Directory",
  "/attendance": "Attendance",
  "/academic": "Academics",
  "/exams": "Examinations",
  "/communication": "Notices & Circulars",
  "/teacher-self-service": "HR Portal",
  "/receipt": "Fee Receipt",
};

/**
 * High-contrast application shell: fixed sidebar + topbar, shared by every
 * authenticated page. Navigation adapts to the role stored at login
 * (SUPER_ADMIN | admin | teacher | student).
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [schoolsOpen, setSchoolsOpen] = useState(false);
  const [role, setRole] = useState("admin");
  const [fullName, setFullName] = useState("Administrator");
  const [schoolName, setSchoolName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [schools, setSchools] = useState<TenantSchool[]>([]);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const saved = (localStorage.getItem("sms-theme") as "dark" | "light") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
    const r = localStorage.getItem("userRole") || "admin";
    setRole(r);
    setFullName(localStorage.getItem("fullName") || "Administrator");
    setSchoolName(localStorage.getItem("schoolName") || "");
    setTenantId(localStorage.getItem("tenant_id") || "");
    setTenantSlug(localStorage.getItem("tenant_slug") || "");
    if (r === "SUPER_ADMIN") {
      api.get("/super-admin/schools")
        .then((res) => {
          if (Array.isArray(res.data)) {
            setSchools(res.data);
            setPending(res.data.filter((s: TenantSchool) => s.status === "PENDING").length);
          }
        })
        .catch(() => {});
    }
    setOpen(false);
  }, [pathname]);

  const isSuper = role === "SUPER_ADMIN";
  const isAdmin = role === "admin" || isSuper;

  const nav = useMemo(
    () => SCHOOL_NAV.filter((i) => isAdmin || !ADMIN_ONLY.has(i.href)),
    [isAdmin],
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("sms-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const logout = () => {
    const slug = localStorage.getItem("tenant_slug");
    localStorage.clear();
    router.replace(isSuper || !slug ? "/login" : `/${slug}/login`);
  };

  const switchSchool = (s: TenantSchool) => {
    localStorage.setItem("tenant_id", s.id);
    localStorage.setItem("tenant_slug", s.slug);
    localStorage.setItem("schoolName", s.school_name);
    setSchoolsOpen(false);
    window.location.href = "/dashboard";
  };

  const title = TITLES[pathname] || (pathname.startsWith("/receipt") ? "Fee Receipt" : "School Console");
  const roleLabel = isSuper ? "platform" : role === "admin" ? "school admin" : role;

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link href={item.href} className={`hc-nav-item ${active ? "hc-nav-item-active" : ""}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="hc-root min-h-screen flex">
      {/* ── Sidebar ── */}
      <aside className={`hc-sidebar no-print ${open ? "hc-sidebar-open" : ""}`}>
        <div className="flex items-center gap-3 px-4 h-16 border-b hc-border">
          {isSuper ? (
            <div className="hc-logo">SaaS</div>
          ) : (
            <div className="hc-logo" style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", borderColor: "transparent" }}>
              <GraduationCap className="w-5 h-5" />
            </div>
          )}
          <div className="leading-tight min-w-0">
            <div className="text-sm font-bold hc-text truncate">{isSuper ? "Super Admin" : (schoolName || "School")}</div>
            <div className="text-[11px] hc-text-3 truncate">{isSuper ? "Platform" : "School Console"}</div>
          </div>
          <button className="ml-auto lg:hidden hc-icon-btn" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {isSuper && (
            <>
              <div className="hc-nav-section"><ShieldCheck className="w-3.5 h-3.5" /> Platform</div>
              <NavLink item={{ label: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard }} />

              <div className="relative">
                <button
                  className="hc-nav-section w-full text-left hover:opacity-80"
                  onClick={() => setSchoolsOpen((v) => !v)}
                  title="Switch school"
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{schoolName || "Select school"}</span>
                  <ChevronDown className="w-3 h-3 shrink-0" />
                </button>
                {schoolsOpen && (
                  <div className="hc-menu left-0 right-0 mt-1 max-h-64 overflow-y-auto" onMouseLeave={() => setSchoolsOpen(false)}>
                    {schools.length === 0 && <div className="px-3 py-2 text-xs hc-text-3">No schools registered</div>}
                    {schools.map((s) => (
                      <button key={s.id} className="hc-menu-item" onClick={() => switchSchool(s)}>
                        <span className="w-4 shrink-0">{s.id === tenantId && <Check className="w-4 h-4 hc-success" />}</span>
                        <span className="truncate flex-1">{s.school_name}</span>
                        <span className="text-[10px] hc-text-3 font-mono">/{s.slug}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          {!isSuper && <div className="hc-nav-section">Modules</div>}
          {nav.map((item) => <NavLink key={item.href} item={item} />)}
        </nav>

        <div className="px-3 py-3 border-t hc-border space-y-1">
          <button onClick={toggleTheme} className="hc-nav-item w-full">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>
          </button>
          <button onClick={logout} className="hc-nav-item w-full hc-danger">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      {/* ── Main column ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="hc-topbar no-print">
          <button className="hc-icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold hc-text leading-tight truncate">{title}</h1>
            {isSuper && schoolName && pathname !== "/super-admin/dashboard" && (
              <div className="text-[11px] hc-text-3 truncate">Inspecting {schoolName} as Super Admin</div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {isSuper && (
              <Link href="/super-admin/dashboard" className="hc-icon-btn" title="Pending verifications">
                <Bell className="w-[18px] h-[18px]" />
                {pending > 0 && <span className="hc-badge-dot">{pending}</span>}
              </Link>
            )}
            <button className="hc-icon-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hc-icon-btn hidden sm:grid" title="API docs">
              <HelpCircle className="w-[18px] h-[18px]" />
            </a>

            <div className="relative">
              <button onClick={() => setUserOpen((v) => !v)} className="hc-user-btn">
                <span className="hc-avatar">{isSuper ? <ShieldCheck className="w-4 h-4" /> : (fullName.trim().charAt(0) || "U").toUpperCase()}</span>
                <span className="hidden sm:block text-left leading-tight max-w-[160px]">
                  <span className="block text-xs font-bold hc-text truncate">{fullName}</span>
                  <span className="block text-[10px] hc-text-3 truncate">{roleLabel}{tenantSlug && !isSuper ? ` · /${tenantSlug}` : ""}</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 hc-text-3" />
              </button>
              {userOpen && (
                <div className="hc-menu right-0 mt-2 w-52" onMouseLeave={() => setUserOpen(false)}>
                  {!isSuper && role !== "student" && (
                    <button className="hc-menu-item" onClick={() => { setUserOpen(false); window.dispatchEvent(new CustomEvent("sms:change-password")); }}>
                      <KeyRound className="w-4 h-4" /> Change password
                    </button>
                  )}
                  <button className="hc-menu-item" onClick={toggleTheme}>
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} Switch theme
                  </button>
                  <button className="hc-menu-item hc-danger" onClick={logout}>
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto">{children}</main>
        <footer className="no-print px-6 py-4 text-center text-[11px] hc-text-3 border-t hc-border">
          Multi-Tenant School Management Platform · FastAPI + Next.js 14
        </footer>
      </div>

      <ChangePasswordDialog />
    </div>
  );
}

/** Small self-contained dialog opened from the user menu (event driven so it can live in the shell). */
function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = () => { setOpen(true); setMsg(null); setCur(""); setNext(""); };
    window.addEventListener("sms:change-password", h);
    return () => window.removeEventListener("sms:change-password", h);
  }, []);

  if (!open) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api.post("/auth/change-password", { current_password: cur, new_password: next });
      setMsg("Password updated.");
      setTimeout(() => setOpen(false), 900);
    } catch (err: any) {
      const d = err.response?.data?.detail;
      setMsg(Array.isArray(d) ? d.map((x: any) => x.msg).join(", ") : d || "Failed to update password");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="hc-overlay" onClick={() => setOpen(false)}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="hc-card w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-bold hc-text">Change password</h3>
        <div>
          <label className="hc-label">Current password</label>
          <input className="hc-input" type="password" required value={cur} onChange={(e) => setCur(e.target.value)} />
        </div>
        <div>
          <label className="hc-label">New password (min 8 chars)</label>
          <input className="hc-input" type="password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        {msg && <div className="text-xs font-semibold hc-text-2">{msg}</div>}
        <div className="flex gap-2">
          <button type="button" className="hc-btn flex-1 justify-center" onClick={() => setOpen(false)}>Cancel</button>
          <button type="submit" className="hc-btn hc-btn-primary flex-1 justify-center" disabled={busy}>Update</button>
        </div>
      </form>
    </div>
  );
}
