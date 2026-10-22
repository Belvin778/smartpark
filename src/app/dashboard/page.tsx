"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Car,
  QrCode,
  Plus,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ParkingCircle,
  Calendar,
  DollarSign,
} from "lucide-react";

interface Vehicle {
  id: string;
  displayPlate: string;
  normalizedPlate: string;
  vehicleType: string;
  make: string | null;
  model: string | null;
  color: string | null;
  status: string;
  activeCredential: {
    id: string;
    rawTokenPreview: string;
    status: string;
    expiresAt: string;
  } | null;
  currentParkingSession: {
    id: string;
    entryTime: string;
    facility: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
}

interface ParkingSession {
  id: string;
  entryTime: string;
  exitTime: string | null;
  durationMinutes: number | null;
  feeAmount: number | null;
  status: string;
  facility: {
    name: string;
    code: string;
  };
  vehicle: {
    displayPlate: string;
  };
}

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentSessions, setRecentSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [vehiclesRes, sessionsRes] = await Promise.all([
        fetch("/api/v1/vehicles"),
        fetch("/api/v1/parking/sessions?limit=5"),
      ]);

      if (vehiclesRes.ok) {
        const vData = await vehiclesRes.json();
        setVehicles(vData.vehicles || []);
      }

      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        setRecentSessions(sData.sessions || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const parkedVehicles = vehicles.filter((v) => v.currentParkingSession !== null);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Vehicle Owner Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your registered vehicles, view active parking sessions, and access QR barrier credentials.
          </p>
        </div>

        <Link
          href="/vehicles/new"
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all gap-2"
        >
          <Plus className="w-4 h-4" />
          Register New Vehicle
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Registered Vehicles</span>
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{vehicles.length}</div>
          <p className="text-xs text-slate-500">Active passes configured</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Currently Parked</span>
            <ParkingCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{parkedVehicles.length}</div>
          <p className="text-xs text-emerald-600 font-medium">
            {parkedVehicles.length > 0 ? "Occupying parking slots" : "All vehicles on the road"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Recent Activity</span>
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{recentSessions.length}</div>
          <p className="text-xs text-slate-500">Sessions recorded</p>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            My Registered Vehicles
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading vehicles...
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const isParked = vehicle.currentParkingSession !== null;

              return (
                <div
                  key={vehicle.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Plate & Status */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-mono text-xl font-black text-slate-900 tracking-wider bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 inline-block">
                          {vehicle.displayPlate}
                        </span>
                        <div className="text-xs text-slate-500">
                          {vehicle.make} {vehicle.model} {vehicle.color ? `• ${vehicle.color}` : ""}
                        </div>
                      </div>

                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          isParked
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {isParked && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                        {isParked ? "Parked" : "Active"}
                      </span>
                    </div>

                    {/* Parked Status Details Banner */}
                    {isParked && vehicle.currentParkingSession && (
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <ParkingCircle className="w-4 h-4 text-emerald-600" />
                          <span>{vehicle.currentParkingSession.facility.name}</span>
                        </div>
                        <div className="text-emerald-700">
                          Entered: {new Date(vehicle.currentParkingSession.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}

                    {/* QR Credential Info */}
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                      <span>Credential:</span>
                      <span className="font-mono text-slate-700 font-medium">
                        {vehicle.activeCredential ? vehicle.activeCredential.rawTokenPreview : "None"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100">
                    <Link
                      href={`/vehicles/${vehicle.id}/qr`}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors gap-2"
                    >
                      <QrCode className="w-4 h-4 text-blue-600" />
                      View & Print QR Pass
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No vehicles registered yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Add your vehicle registration plate to generate an instant cryptographic QR parking credential.
              </p>
            </div>
            <Link
              href="/vehicles/new"
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Register First Vehicle
            </Link>
          </div>
        )}
      </div>

      {/* Recent Parking History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Recent Parking Sessions
          </h2>
          <Link href="/history" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View All History →
          </Link>
        </div>

        {recentSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4">Exit Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Fee</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {session.vehicle.displayPlate}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{session.facility.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(session.entryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {session.exitTime
                        ? new Date(session.exitTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {session.durationMinutes ? `${session.durationMinutes} mins` : "In Progress"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {session.feeAmount ? `$${session.feeAmount.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          session.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">No recent parking sessions recorded.</div>
        )}
      </div>
    </div>
  );
}
