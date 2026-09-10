"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ShieldCheck, Lock, User, AlertCircle, Sparkles, Building2, ArrowRight } from "lucide-react";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/login", {
        username,
        password,
      });

      // Save token & user details
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("username", username);
      localStorage.setItem("userRole", res.data.user_role);
      localStorage.setItem("fullName", res.data.full_name || "Platform Super Admin");

      if (res.data.user_role === "SUPER_ADMIN") {
        // Super Admin acts on one school at a time; the backend validates the X-Tenant-ID header.
        if (!localStorage.getItem("tenant_id")) {
          localStorage.setItem("tenant_id", "default-tenant-001");
          localStorage.setItem("tenant_slug", "main");
          localStorage.setItem("schoolName", "Avdhoot Bhagwan Ram Vidyalaya");
        }
        router.replace("/super-admin/dashboard");
      } else {
        localStorage.setItem("tenant_id", res.data.tenant_id || "");
        localStorage.setItem("tenant_slug", res.data.tenant_slug || "");
        localStorage.setItem("schoolName", res.data.school_name || "");
        router.replace("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Incorrect Super Admin credentials. Default: admin@gmail.com / Admin@123"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="max-w-md w-full space-y-8 glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative">
        
        {/* Title / Super Admin Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PLATFORM CONTROL CENTER</span>
            </div>
            <h2 className="mt-3 text-2xl font-black text-white tracking-tight">
              Super Administrator
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Multi-Tenant SaaS Platform & School Control Console
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

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Super Admin Email / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="admin@gmail.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Super Admin Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Info Box */}
          <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl text-center">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
              🔑 SUPER ADMIN CREDENTIALS
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Platform operator account (configured via SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD)
            </div>
          </div>

          {/* Client Tenant URL Quick Switcher */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2 text-center">
              Client School Login Portals (Path URLs):
            </div>
            <div className="flex justify-center gap-2 text-xs">
              <a href="/main/login" className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-blue-400 rounded-lg transition-all font-mono">
                /main/login
              </a>
              <a href="/greenwood/login" className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-emerald-400 rounded-lg transition-all font-mono">
                /greenwood/login
              </a>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
