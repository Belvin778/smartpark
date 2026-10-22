"use client";

import { useEffect, useState } from "react";
import {
  History,
  Search,
  Filter,
  Car,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ParkingCircle,
  Calendar,
} from "lucide-react";

interface ParkingSession {
  id: string;
  entryTime: string;
  exitTime: string | null;
  durationMinutes: number | null;
  feeAmount: number | null;
  status: string;
  notes: string | null;
  vehicle: {
    displayPlate: string;
    vehicleType: string;
    owner: {
      fullName: string;
    };
  };
  facility: {
    name: string;
    code: string;
  };
  entryGate: {
    name: string;
  } | null;
  exitGate: {
    name: string;
  } | null;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [plateQuery, setPlateQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [page, statusFilter]);

  const fetchSessions = async (overridePlate?: string) => {
    setLoading(true);
    const searchPlate = overridePlate !== undefined ? overridePlate : plateQuery;
    let url = `/api/v1/parking/sessions?page=${page}&limit=15`;
    if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
    if (searchPlate.trim()) url += `&plate=${encodeURIComponent(searchPlate.trim())}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setSessions(json.sessions || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
          setTotalCount(json.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSessions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Parking History & Audit Log
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete, tamper-resistant record of vehicle entries, exits, durations, and calculated fees.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={plateQuery}
              onChange={(e) => setPlateQuery(e.target.value)}
              placeholder="Search by license plate (e.g. ABC-1234)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-xl border border-slate-300 text-sm font-semibold outline-none bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Currently Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Plate</th>
                <th className="py-3.5 px-4">Vehicle / Owner</th>
                <th className="py-3.5 px-4">Facility</th>
                <th className="py-3.5 px-4">Gates (In / Out)</th>
                <th className="py-3.5 px-4">Entry Time</th>
                <th className="py-3.5 px-4">Exit Time</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Fee</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : sessions.length > 0 ? (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                      {session.vehicle.displayPlate}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{session.vehicle.owner.fullName}</div>
                      <div className="text-[11px] text-slate-400">{session.vehicle.vehicleType}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{session.facility.name}</span>
                      <span className="block text-[11px] font-mono text-slate-400">{session.facility.code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>In: {session.entryGate?.name || "Standard Gate"}</div>
                      <div>Out: {session.exitGate?.name || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {new Date(session.entryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {session.exitTime
                        ? new Date(session.exitTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {session.durationMinutes ? `${session.durationMinutes}m` : "Active"}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {session.feeAmount ? `$${session.feeAmount.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          session.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No parking sessions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {sessions.length} of {totalCount} total sessions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
