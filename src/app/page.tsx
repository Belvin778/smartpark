"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Car,
  QrCode,
  Scan,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Clock,
  Radio,
} from "lucide-react";

interface FacilityPreview {
  id: string;
  name: string;
  code: string;
  totalCapacity: number;
  currentOccupancy: number;
  availableSpaces: number;
  occupancyRate: number;
  hourlyRate: number;
  isFull: boolean;
}

export default function LandingPage() {
  const [facilities, setFacilities] = useState<FacilityPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await fetch("/api/v1/parking/availability");
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities || []);
      }
    } catch (err) {
      console.error("Failed to load facilities:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Next-Gen Smart Parking Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Seamless Vehicle Access with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Cryptographic QR
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          High-performance parking management engineered for rock-solid concurrency, atomic capacity enforcement,
          sub-second barrier gate scanning, and live occupancy telemetry.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="inline-flex items-center px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Car className="w-5 h-5 mr-2" />
            Register Vehicle
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>

          <Link
            href="/operator"
            className="inline-flex items-center px-6 py-3.5 rounded-xl text-base font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Scan className="w-5 h-5 mr-2 text-indigo-600" />
            Gate Scanner Console
          </Link>

          <Link
            href="/live"
            className="inline-flex items-center px-6 py-3.5 rounded-xl text-base font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Radio className="w-5 h-5 mr-2 text-emerald-600 animate-pulse" />
            Live Availability Board
          </Link>
        </div>
      </section>

      {/* Live Facility Availability Teaser */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Live Facility Capacity
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Authoritative real-time occupancy counts synced directly with backend transaction locks.
            </p>
          </div>
          <Link
            href="/live"
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View Full Live Stream Board
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-slate-400">Loading live facility data...</div>
          ) : facilities.length > 0 ? (
            facilities.map((facility) => {
              const isHigh = facility.occupancyRate >= 80;
              const isFull = facility.isFull;

              return (
                <div
                  key={facility.id}
                  className="rounded-xl border border-slate-200 p-5 bg-gradient-to-b from-white to-slate-50/50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                        {facility.code}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{facility.name}</h3>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        isFull
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : isHigh
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {isFull ? "Full" : `${facility.availableSpaces} Available`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Occupancy: {facility.currentOccupancy} / {facility.totalCapacity}</span>
                      <span>{facility.occupancyRate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isFull
                            ? "bg-red-500"
                            : isHigh
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.min(100, facility.occupancyRate)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Rate: ${facility.hourlyRate.toFixed(2)}/hour</span>
                    <span className="font-semibold text-blue-600">Gate scanning online</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 py-8 text-center text-slate-500">No facilities registered yet.</div>
          )}
        </div>
      </section>

      {/* System Pillars */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Cryptographic QR</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            High-entropy 256-bit opaque tokens hashed with SHA-256. Instant token revocation and zero sensitive data
            in QR payload.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Atomic Concurrency</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Interactive database transactions prevent overbooking race conditions when multiple gates scan for the
            last spot simultaneously.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Real-Time Telemetry</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Server-Sent Events (SSE) broadcast occupancy and gate events instantly to dashboards with no manual
            page refresh required.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Tamper-Proof Audit</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Complete audit trail recording all administrative updates, manual overrides, and gate scans with actor
            metadata.
          </p>
        </div>
      </section>

      {/* Role Walkthrough Section */}
      <section className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-8 sm:p-12 space-y-8">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-400">Engineered for Every Stakeholder</span>
          <h2 className="text-3xl font-extrabold tracking-tight">Three Tailored Operational Experiences</h2>
          <p className="text-slate-300 text-sm sm:text-base">
            Role-Based Access Control (RBAC) securely separates driver permits, gate operations, and facility administration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vehicle Owner */}
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-white">Vehicle Owner</h4>
            </div>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                Register vehicles with plate normalization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                Download and print QR access passes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                One-click revoke for lost or copied passes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                Track active parking sessions & history
              </li>
            </ul>
          </div>

          {/* Operator */}
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Scan className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-white">Gate Operator</h4>
            </div>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                Mobile camera QR scanner integration
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                Large color-coded authorization displays
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                Manual plate entry fallback with audit notes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                Exit duration and automated fee calculation
              </li>
            </ul>
          </div>

          {/* Admin */}
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-white">System Admin</h4>
            </div>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                Manage facilities, zones, spaces, and gates
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                Configure hourly pricing and total capacities
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                Assign operator roles and manage user permissions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                Inspect immutable audit logs & revenue analytics
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
