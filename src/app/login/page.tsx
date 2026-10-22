"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Car, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Login failed. Please check your credentials.");
        return;
      }

      // Redirect based on role
      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "OPERATOR") {
        router.push("/operator");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto my-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Sign in to SmartPark</h1>
        <p className="text-sm text-slate-500">Access your vehicles, QR permits, or gate terminal</p>
      </div>

      {/* Demo Credentials Quick-Select Card */}
      <div className="bg-slate-100/80 rounded-xl p-4 border border-slate-200 space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-blue-600" />
          One-Click Demo Credentials
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setDemoCredentials("admin@smartpark.com")}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 text-slate-800 font-semibold transition-all text-center flex flex-col items-center gap-1"
          >
            <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold">Admin</span>
            <span>admin</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials("operator@smartpark.com")}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-slate-800 font-semibold transition-all text-center flex flex-col items-center gap-1"
          >
            <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">Operator</span>
            <span>operator</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials("sarah.owner@example.com")}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 font-semibold transition-all text-center flex flex-col items-center gap-1"
          >
            <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold">Owner</span>
            <span>sarah</span>
          </button>
        </div>
      </div>

      {/* Login Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Authenticating..." : "Sign In"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Register vehicle owner account
          </Link>
        </div>
      </div>
    </div>
  );
}
