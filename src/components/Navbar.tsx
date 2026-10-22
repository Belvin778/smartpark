"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Car,
  Shield,
  QrCode,
  Scan,
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Radio,
} from "lucide-react";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "VEHICLE_OWNER";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/v1/auth/me", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  const navLinks = [
    { href: "/live", label: "Live Availability", icon: Radio, public: true },
    ...(user
      ? [
          { href: "/dashboard", label: "My Vehicles", icon: LayoutDashboard, roles: ["VEHICLE_OWNER", "ADMIN"] },
          { href: "/vehicles/new", label: "Add Vehicle", icon: Car, roles: ["VEHICLE_OWNER", "ADMIN"] },
          { href: "/operator", label: "Gate Scanner", icon: Scan, roles: ["OPERATOR", "ADMIN"] },
          { href: "/history", label: "Parking History", icon: History, roles: ["VEHICLE_OWNER", "OPERATOR", "ADMIN"] },
          { href: "/admin", label: "Admin Center", icon: Settings, roles: ["ADMIN"] },
        ]
      : []),
  ];

  const filteredLinks = navLinks.filter(
    (link) => link.public || (user && (!link.roles || link.roles.includes(user.role)))
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Car className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  Smart<span className="text-blue-600">Park</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase -mt-1">
                  Enterprise Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:items-center md:space-x-1 ml-6">
              {filteredLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {!loading && user ? (
              <div className="flex items-center space-x-3">
                {/* Role badge */}
                <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-800">{user.fullName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : user.role === "OPERATOR"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {user.role === "VEHICLE_OWNER" ? "Vehicle Owner" : user.role}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : !loading ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:shadow"
                >
                  Register
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5 mr-3 text-slate-400" />
                {link.label}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2">
                <div>
                  <div className="text-base font-medium text-slate-800">{user.fullName}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2 px-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full py-2 border border-slate-300 rounded-lg text-slate-700 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full py-2 bg-blue-600 text-white font-medium rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
