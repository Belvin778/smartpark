"use client";

import { useEffect, useState } from "react";
import {
  Radio,
  Car,
  ParkingCircle,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Layers,
  Zap,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface Zone {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentOccupancy: number;
  availableSpaces: number;
  occupancyRate: number;
}

interface Facility {
  id: string;
  name: string;
  code: string;
  address: string;
  totalCapacity: number;
  currentOccupancy: number;
  availableSpaces: number;
  occupancyRate: number;
  isFull: boolean;
  hourlyRate: number;
  status: string;
  zones: Zone[];
}

interface LiveEvent {
  id: string;
  type: "ENTRY" | "EXIT";
  plate: string;
  time: string;
  facilityName: string;
}

export default function LiveBoardPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [sseConnected, setSseConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
    setupSSE();
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await fetch("/api/v1/parking/availability");
      if (res.ok) {
        const json = await res.json();
        setFacilities(json.facilities || []);
      }
    } catch (err) {
      console.error("Failed to load initial availability:", err);
    } finally {
      setLoading(false);
    }
  };

  const setupSSE = () => {
    try {
      const evtSource = new EventSource("/api/v1/parking/live-stream");

      evtSource.addEventListener("connected", () => {
        setSseConnected(true);
      });

      evtSource.addEventListener("parking:entry", (event) => {
        const data = JSON.parse(event.data);
        updateFacilityOccupancy(data.facilityId, data.currentOccupancy, data.totalCapacity);
        addLiveEvent({
          id: `entry_${Date.now()}`,
          type: "ENTRY",
          plate: data.plate,
          time: new Date().toLocaleTimeString(),
          facilityName: "Metro Facility",
        });
      });

      evtSource.addEventListener("parking:exit", (event) => {
        const data = JSON.parse(event.data);
        updateFacilityOccupancy(data.facilityId, data.currentOccupancy, data.totalCapacity);
        addLiveEvent({
          id: `exit_${Date.now()}`,
          type: "EXIT",
          plate: data.plate,
          time: new Date().toLocaleTimeString(),
          facilityName: "Metro Facility",
        });
      });

      evtSource.onerror = () => {
        setSseConnected(false);
      };

      return () => {
        evtSource.close();
      };
    } catch (err) {
      console.error("SSE connection error:", err);
    }
  };

  const updateFacilityOccupancy = (facilityId: string, occupancy: number, total: number) => {
    setFacilities((prev) =>
      prev.map((f) => {
        if (f.id === facilityId) {
          const avail = Math.max(0, total - occupancy);
          const rate = total > 0 ? Math.round((occupancy / total) * 100) : 0;
          return {
            ...f,
            currentOccupancy: occupancy,
            totalCapacity: total,
            availableSpaces: avail,
            occupancyRate: rate,
            isFull: occupancy >= total,
          };
        }
        return f;
      })
    );
  };

  const addLiveEvent = (event: LiveEvent) => {
    setLiveEvents((prev) => [event, ...prev.slice(0, 14)]);
  };

  const totalCap = facilities.reduce((sum, f) => sum + f.totalCapacity, 0);
  const totalOccupied = facilities.reduce((sum, f) => sum + f.currentOccupancy, 0);
  const totalAvailable = Math.max(0, totalCap - totalOccupied);
  const overallRate = totalCap > 0 ? Math.round((totalOccupied / totalCap) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                sseConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            ></span>
            <span
              className={`text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${
                sseConnected
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {sseConnected ? "Real-Time Telemetry Live" : "Connecting Live Stream..."}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Live Parking Availability Board
          </h1>
          <p className="text-sm text-slate-500">
            Real-time occupancy across all parking facilities, zones, and entry/exit barriers.
          </p>
        </div>

        <button
          onClick={fetchInitialData}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Counts
        </button>
      </div>

      {/* Network-wide KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Available</span>
          <div className="text-3xl font-black text-emerald-600">{totalAvailable}</div>
          <span className="text-[11px] text-slate-500">Vacant slots across network</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Currently Parked</span>
          <div className="text-3xl font-black text-slate-900">{totalOccupied}</div>
          <span className="text-[11px] text-slate-500">Active vehicle permits</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Capacity</span>
          <div className="text-3xl font-black text-slate-900">{totalCap}</div>
          <span className="text-[11px] text-slate-500">Across {facilities.length} facilities</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Network Utilization</span>
          <div className="text-3xl font-black text-blue-600">{overallRate}%</div>
          <span className="text-[11px] text-slate-500">Total occupancy load</span>
        </div>
      </div>

      {/* Facilities Cards & Live Stream Event Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Facilities Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ParkingCircle className="w-5 h-5 text-blue-600" />
            Facility Occupancy & Zone Telemetry
          </h2>

          {loading ? (
            <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading facilities...
            </div>
          ) : (
            facilities.map((facility) => {
              const isFull = facility.isFull;
              const isHigh = facility.occupancyRate >= 85;

              return (
                <div
                  key={facility.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 uppercase">
                          {facility.code}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <span className="text-xs text-slate-500">{facility.address}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900">{facility.name}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">${facility.hourlyRate.toFixed(2)}/hr</span>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                          isFull
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : isHigh
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {isFull ? "FACILITY FULL" : `${facility.availableSpaces} SPACES LEFT`}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Occupancy Level</span>
                      <span>
                        {facility.currentOccupancy} / {facility.totalCapacity} ({facility.occupancyRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? "bg-red-600" : isHigh ? "bg-amber-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.min(100, facility.occupancyRate)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Zones Breakdown */}
                  {facility.zones && facility.zones.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        Zone Breakdown
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {facility.zones.map((zone) => (
                          <div
                            key={zone.id}
                            className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 text-xs space-y-1.5"
                          >
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{zone.name}</span>
                              <span className="text-emerald-700">{zone.availableSpaces} left</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(100, zone.occupancyRate)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Code: {zone.code}</span>
                              <span>
                                {zone.currentOccupancy}/{zone.capacity} occupied
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Live SSE Stream Event Feed (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
              Live Gate Event Ticker
            </h2>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">SSE Stream</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 min-h-[360px]">
            {liveEvents.length > 0 ? (
              <div className="space-y-2">
                {liveEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 ${
                      evt.type === "ENTRY"
                        ? "bg-blue-50/60 border-blue-200 text-blue-900"
                        : "bg-indigo-50/60 border-indigo-200 text-indigo-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {evt.type === "ENTRY" ? (
                        <ArrowDownCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      ) : (
                        <ArrowUpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-mono font-black">{evt.plate}</span>
                        <div className="text-[10px] opacity-75">{evt.type} Authorized</div>
                      </div>
                    </div>

                    <div className="text-right text-[10px] opacity-75 font-mono">{evt.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs space-y-2">
                <Radio className="w-8 h-8 text-slate-300 animate-pulse" />
                <p>Listening for real-time gate barrier scans...</p>
                <p className="text-[10px] text-slate-400">Scans processed by gate operators appear here in real-time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
