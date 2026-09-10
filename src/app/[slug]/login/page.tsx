"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { GraduationCap, Lock, User, AlertCircle, Sparkles, Building2, ShieldCheck, ArrowRight } from "lucide-react";

interface TenantInfo {
  id: string;
  school_name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  status?: string;
}

export default function TenantLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || "main";

  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingTenant, setFetchingTenant] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenantBranding() {
      try {
        setFetchingTenant(true);
        const res = await api.get(`/super-admin/tenant-info/${slug}`);
        setTenantInfo(res.data);
        if (res.data?.id) {
          localStorage.setItem("tenant_id", res.data.id);
          localStorage.setItem("tenant_slug", res.data.slug);
          localStorage.setItem("schoolName", res.data.school_name);
        }
      } catch (err) {
        console.error("Failed to fetch tenant branding:", err);
        setTenantInfo(null);
        setError(`School "${slug}" was not found. Check the login URL with your school administrator.`);
      } finally {
        setFetchingTenant(false);
      }
    }

    if (slug) {
      fetchTenantBranding();
    }
  }, [slug]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/login", {
        username,
        password,
        tenant: tenantInfo?.id || slug,
      });

      // Clear previous tokens and save new tenant credentials
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("username", username);
      localStorage.setItem("userRole", res.data.user_role);
      localStorage.setItem("fullName", res.data.full_name);
      localStorage.setItem("assignedClass", res.data.assigned_class || "");
      localStorage.setItem("assignedSection", res.data.assigned_section || "");
      localStorage.setItem("teacherId", res.data.teacher_id ? res.data.teacher_id.toString() : "");

      // The token is bound to exactly one school; mirror what the server says.
      localStorage.setItem("tenant_id", res.data.tenant_id || tenantInfo?.id || "");
      localStorage.setItem("tenant_slug", res.data.tenant_slug || tenantInfo?.slug || slug);
      localStorage.setItem("schoolName", res.data.school_name || tenantInfo?.school_name || "");

      if (res.data.must_change_password) {
        alert("You are using a temporary password. Please change it as soon as possible.");
      }

      // Redirect to dashboard
      router.replace("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        `Incorrect credentials for ${tenantInfo?.school_name || slug.toUpperCase()}.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearSession = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="max-w-md w-full space-y-6 glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative">
        
        {/* Title / Dynamic Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            {tenantInfo?.logo_url ? (
              <img src={tenantInfo.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <Building2 className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{slug.toUpperCase()} CLIENT PORTAL</span>
            </div>
            
            {fetchingTenant ? (
              <div className="h-7 w-56 bg-slate-800 animate-pulse rounded mx-auto mt-3"></div>
            ) : (
              <h2 className="mt-3 text-2xl font-black text-white tracking-tight">
                {tenantInfo?.school_name || "School Portal"}
              </h2>
            )}
            
            <p className="text-xs text-slate-400 mt-1">
              Administrative & Learning Management Desk
            </p>
            <p className="text-[10px] text-slate-500 mt-2">
              Admin / Teacher: e-mail + password. Student / Parent: GR No or phone + date of birth (YYYY-MM-DD).
            </p>
          </div>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-6 space-y-5" onSubmit={handleLoginSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username / Email / GR No
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                  placeholder={`Enter ${tenantInfo?.school_name || slug} credentials`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !tenantInfo}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to {tenantInfo?.school_name || slug.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Reset / Switch Session Options */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <button onClick={handleClearSession} className="hover:text-amber-400 transition-colors">
            Clear Active Session
          </button>
          <a href="/login" className="hover:text-blue-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Console</span>
          </a>
        </div>

      </div>
    </div>
  );
}
