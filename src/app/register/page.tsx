"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Lock, Mail, Phone, ArrowRight, AlertCircle, Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"VEHICLE_OWNER" | "OPERATOR" | "ADMIN">("VEHICLE_OWNER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, phone, role }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed. Please check your inputs.");
        return;
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "OPERATOR") {
        router.push("/operator");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Create an Account</h1>
        <p className="text-sm text-slate-500">Register to generate instant QR parking permits</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sarah Jenkins"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.com"
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Account Role</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole("VEHICLE_OWNER")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  role === "VEHICLE_OWNER"
                    ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Vehicle Owner
              </button>

              <button
                type="button"
                onClick={() => setRole("OPERATOR")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  role === "OPERATOR"
                    ? "bg-amber-50 border-amber-600 text-amber-800 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Operator
              </button>

              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  role === "ADMIN"
                    ? "bg-purple-50 border-purple-600 text-purple-700 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Administrator
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "Creating Account..." : "Create Account"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
