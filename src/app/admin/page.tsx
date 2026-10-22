"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Building,
  Users,
  Layers,
  DoorOpen,
  DollarSign,
  Activity,
  Plus,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalCapacity: number;
    currentOccupancy: number;
    availableSpaces: number;
    occupancyRate: number;
    activeSessionsCount: number;
    completedToday: number;
    entriesToday: number;
    revenueToday: number;
    avgDurationMinutes: number;
  };
  facilities: Array<{
    id: string;
    name: string;
    code: string;
    totalCapacity: number;
    currentOccupancy: number;
    availableSpaces: number;
    occupancyRate: number;
    hourlyRate: number;
    status: string;
    zones: Array<{ id: string; name: string; capacity: number }>;
  }>;
}

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "OPERATOR" | "VEHICLE_OWNER";
  createdAt: string;
  _count: { vehicles: number };
}

interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  createdAt: string;
  actor: {
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"ANALYTICS" | "FACILITIES" | "USERS" | "AUDIT">("ANALYTICS");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Facility Form Modal State
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [newFacName, setNewFacName] = useState("");
  const [newFacCode, setNewFacCode] = useState("");
  const [newFacAddress, setNewFacAddress] = useState("");
  const [newFacCapacity, setNewFacCapacity] = useState(50);
  const [newFacRate, setNewFacRate] = useState(3.0);
  const [facSubmitting, setFacSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === "ANALYTICS" || activeTab === "FACILITIES") {
        const res = await fetch("/api/v1/admin/analytics");
        if (res.ok) {
          const json = await res.json();
          setAnalytics(json);
        }
      } else if (activeTab === "USERS") {
        const res = await fetch("/api/v1/admin/users");
        if (res.ok) {
          const json = await res.json();
          setUsers(json.users || []);
        }
      } else if (activeTab === "AUDIT") {
        const res = await fetch("/api/v1/admin/audit-logs?limit=30");
        if (res.ok) {
          const json = await res.json();
          setAuditLogs(json.logs || []);
        }
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole as UserRecord["role"] } : u))
        );
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFacName.trim(),
          code: newFacCode.trim().toUpperCase(),
          address: newFacAddress.trim(),
          totalCapacity: Number(newFacCapacity),
          hourlyRate: Number(newFacRate),
        }),
      });

      if (res.ok) {
        setShowAddFacility(false);
        setNewFacName("");
        setNewFacCode("");
        setNewFacAddress("");
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create facility.");
      }
    } catch (err) {
      console.error("Create facility error:", err);
    } finally {
      setFacSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              System Administrator Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            SmartPark Administration
          </h1>
          <p className="text-sm text-slate-500">
            Configure facilities, manage operator permissions, monitor capacity invariants, and review audit logs.
          </p>
        </div>

        {activeTab === "FACILITIES" && (
          <button
            onClick={() => setShowAddFacility(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Parking Facility
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab("ANALYTICS")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "ANALYTICS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics & Capacity
        </button>

        <button
          onClick={() => setActiveTab("FACILITIES")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "FACILITIES"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building className="w-4 h-4" />
          Facilities & Gates
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "USERS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          User & Operator Roles
        </button>

        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "AUDIT"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Trail & Security Logs
        </button>
      </div>

      {/* Tab 1: Analytics & Capacity */}
      {activeTab === "ANALYTICS" && analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Today&apos;s Revenue</span>
              <div className="text-3xl font-black text-slate-900">
                ${analytics.overview.revenueToday.toFixed(2)}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                From {analytics.overview.completedToday} completed stays
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Active Sessions</span>
              <div className="text-3xl font-black text-blue-600">
                {analytics.overview.activeSessionsCount}
              </div>
              <span className="text-[11px] text-slate-500">Currently parked vehicles</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Entries Today</span>
              <div className="text-3xl font-black text-slate-900">{analytics.overview.entriesToday}</div>
              <span className="text-[11px] text-slate-500">Gate throughput</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Average Duration</span>
              <div className="text-3xl font-black text-indigo-600">
                {analytics.overview.avgDurationMinutes}m
              </div>
              <span className="text-[11px] text-slate-500">Per parking session</span>
            </div>
          </div>

          {/* Facilities Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg">Facility Capacity & Utilization</h3>
            <div className="space-y-4">
              {analytics.facilities.map((fac) => (
                <div key={fac.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-400 uppercase">{fac.code}</span>
                      <h4 className="font-bold text-slate-900 text-base">{fac.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800">
                        {fac.currentOccupancy} / {fac.totalCapacity} Spaces
                      </span>
                      <span className="block text-xs text-slate-500">{fac.occupancyRate}% Full</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, fac.occupancyRate)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Facilities & Gates Management */}
      {activeTab === "FACILITIES" && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analytics.facilities.map((fac) => (
            <div key={fac.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-400 uppercase">{fac.code}</span>
                  <h3 className="text-lg font-bold text-slate-900">{fac.name}</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-emerald-100 text-emerald-800">
                  {fac.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Capacity</span>
                  <span className="font-bold text-slate-800">{fac.totalCapacity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Occupancy</span>
                  <span className="font-bold text-slate-800">{fac.currentOccupancy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Hourly Rate</span>
                  <span className="font-bold text-slate-800">${fac.hourlyRate.toFixed(2)}</span>
                </div>
              </div>

              {fac.zones && fac.zones.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-600">Configured Zones:</span>
                  <div className="space-y-1">
                    {fac.zones.map((z) => (
                      <div key={z.id} className="flex justify-between p-2 rounded-lg bg-slate-50 border">
                        <span className="font-semibold text-slate-800">{z.name}</span>
                        <span className="text-slate-500">Cap: {z.capacity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Users & Operator Roles */}
      {activeTab === "USERS" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Vehicles</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4">Role Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.fullName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{u.phone || "—"}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{u._count.vehicles}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString([], { dateStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none ${
                          u.role === "ADMIN"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : u.role === "OPERATOR"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        <option value="VEHICLE_OWNER">Vehicle Owner</option>
                        <option value="OPERATOR">Gate Operator</option>
                        <option value="ADMIN">System Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Trail */}
      {activeTab === "AUDIT" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4 text-slate-600">{log.entityType}</td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-800">
                      {log.actor ? `${log.actor.fullName} (${log.actor.role})` : "System / Automated"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {log.metadata || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Facility Modal */}
      {showAddFacility && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Add Parking Facility</h3>
              <button onClick={() => setShowAddFacility(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                  placeholder="e.g. Harbor Point Garage"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Facility Code</label>
                <input
                  type="text"
                  required
                  value={newFacCode}
                  onChange={(e) => setNewFacCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FAC-HP03"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-mono uppercase outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={newFacAddress}
                  onChange={(e) => setNewFacAddress(e.target.value)}
                  placeholder="e.g. 250 Harbor Boulevard"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newFacCapacity}
                    onChange={(e) => setNewFacCapacity(parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hourly Rate ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={newFacRate}
                    onChange={(e) => setNewFacRate(parseFloat(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFacility(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={facSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                >
                  {facSubmitting ? "Creating..." : "Save Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
