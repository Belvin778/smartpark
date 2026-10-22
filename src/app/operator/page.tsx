"use client";

import { useEffect, useState, useRef } from "react";
import {
  Scan,
  CheckCircle2,
  XCircle,
  Car,
  ParkingCircle,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Camera,
  Keyboard,
  Clock,
  DollarSign,
  AlertTriangle,
  Radio,
  Zap,
} from "lucide-react";

interface Facility {
  id: string;
  name: string;
  code: string;
  totalCapacity: number;
  currentOccupancy: number;
  availableSpaces: number;
  gates: Array<{
    id: string;
    name: string;
    code: string;
    gateType: string;
  }>;
}

interface ScanResult {
  success: boolean;
  type: "ENTRY" | "EXIT";
  timestamp: string;
  plate: string;
  message: string;
  durationMinutes?: number;
  feeAmount?: number;
  availableSpaces?: number;
  currentOccupancy?: number;
  totalCapacity?: number;
}

export default function OperatorPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [selectedGateId, setSelectedGateId] = useState<string>("");
  const [mode, setMode] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [inputMethod, setInputMethod] = useState<"CAMERA" | "MANUAL">("MANUAL");

  // Inputs
  const [manualToken, setManualToken] = useState("");
  const [manualPlate, setManualPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await fetch("/api/v1/parking/availability");
      if (res.ok) {
        const json = await res.json();
        setFacilities(json.facilities || []);
        if (json.facilities?.length > 0) {
          const first = json.facilities[0];
          setSelectedFacilityId(first.id);
          if (first.gates?.length > 0) {
            setSelectedGateId(first.gates[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load facilities:", err);
    }
  };

  const playBeep = (success: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15); // E3
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // AudioContext may be blocked before interaction
    }
  };

  const handleProcessScan = async (overrideToken?: string, overridePlate?: string) => {
    if (!selectedFacilityId) {
      alert("Please select a parking facility.");
      return;
    }

    const tokenToSend = overrideToken !== undefined ? overrideToken : manualToken;
    const plateToSend = overridePlate !== undefined ? overridePlate : manualPlate;

    if (!tokenToSend.trim() && !plateToSend.trim()) {
      alert("Please scan a QR code or enter a vehicle plate number.");
      return;
    }

    setLoading(true);

    const endpoint = mode === "ENTRY" ? "/api/v1/parking/entry" : "/api/v1/parking/exit";
    const idempotencyKey = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrToken: tokenToSend.trim() || undefined,
          plate: plateToSend.trim().toUpperCase() || undefined,
          facilityId: selectedFacilityId,
          gateId: selectedGateId || undefined,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      const success = res.ok && data.success;

      playBeep(success);

      const result: ScanResult = {
        success,
        type: mode,
        timestamp: new Date().toLocaleTimeString(),
        plate: data.vehicle?.displayPlate || plateToSend.toUpperCase() || "UNKNOWN",
        message: data.message || data.error || (success ? "Operation authorized" : "Operation rejected"),
        durationMinutes: data.durationMinutes,
        feeAmount: data.feeAmount,
        availableSpaces: data.availableSpaces,
        currentOccupancy: data.facility?.currentOccupancy,
        totalCapacity: data.facility?.totalCapacity,
      };

      setLastResult(result);
      setRecentScans((prev) => [result, ...prev.slice(0, 9)]);

      // Clear manual fields
      if (!overrideToken && !overridePlate) {
        setManualToken("");
        setManualPlate("");
      }

      // Refresh facilities to update occupancy badge
      fetchFacilities();
    } catch (err) {
      console.error("Scan processing error:", err);
      playBeep(false);
      const failResult: ScanResult = {
        success: false,
        type: mode,
        timestamp: new Date().toLocaleTimeString(),
        plate: plateToSend.toUpperCase() || "UNKNOWN",
        message: "Network communication error with barrier controller",
      };
      setLastResult(failResult);
    } finally {
      setLoading(false);
    }
  };

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  return (
    <div className="space-y-8">
      {/* Header & Gate Setup */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Barrier Terminal Online
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Gate Operator Console
          </h1>
          <p className="text-sm text-slate-500">
            Process vehicle entry and exit scans with sub-second atomic occupancy enforcement.
          </p>
        </div>

        {/* Facility & Gate Selector Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Facility</label>
            <select
              value={selectedFacilityId}
              onChange={(e) => {
                setSelectedFacilityId(e.target.value);
                const fac = facilities.find((f) => f.id === e.target.value);
                if (fac && fac.gates?.length > 0) {
                  setSelectedGateId(fac.gates[0].id);
                }
              }}
              className="p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-sm outline-none shadow-sm"
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.currentOccupancy}/{fac.totalCapacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Gate Barrier</label>
            <select
              value={selectedGateId}
              onChange={(e) => setSelectedGateId(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-sm outline-none shadow-sm"
            >
              {selectedFacility?.gates?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.gateType})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mode Switcher Banner (ENTRY vs EXIT) */}
      <div className="grid grid-cols-2 gap-3 bg-slate-200/80 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setMode("ENTRY");
            setLastResult(null);
          }}
          className={`py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
            mode === "ENTRY"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.01]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ArrowDownCircle className="w-5 h-5" />
          ENTRY GATE MODE
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("EXIT");
            setLastResult(null);
          }}
          className={`py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
            mode === "EXIT"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.01]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ArrowUpCircle className="w-5 h-5" />
          EXIT GATE MODE
        </button>
      </div>

      {/* Large Authorization Feedback Banner */}
      {lastResult && (
        <div
          className={`rounded-2xl p-6 sm:p-8 text-white shadow-lg transition-all animate-in fade-in zoom-in-95 duration-200 ${
            lastResult.success
              ? "bg-gradient-to-r from-emerald-600 to-teal-700 shadow-emerald-500/20"
              : "bg-gradient-to-r from-red-600 to-rose-700 shadow-red-500/20"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                {lastResult.success ? (
                  <CheckCircle2 className="w-10 h-10 text-white" />
                ) : (
                  <XCircle className="w-10 h-10 text-white" />
                )}
              </div>

              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest bg-black/20 px-3 py-1 rounded-full">
                  {lastResult.type} {lastResult.success ? "APPROVED" : "REJECTED"}
                </span>
                <h2 className="text-3xl font-black tracking-tight mt-1">{lastResult.message}</h2>
                <div className="text-sm text-white/90 font-mono mt-1">
                  Plate: <span className="font-bold underline">{lastResult.plate}</span> • Scan Time: {lastResult.timestamp}
                </div>
              </div>
            </div>

            {/* Quick Metrics on Result */}
            {lastResult.success && (
              <div className="bg-black/20 backdrop-blur rounded-xl p-4 sm:text-right space-y-1">
                {lastResult.type === "EXIT" && (
                  <>
                    <div className="text-xs text-white/70">Duration Parked</div>
                    <div className="text-xl font-black">{lastResult.durationMinutes} Minutes</div>
                    {lastResult.feeAmount !== undefined && (
                      <div className="text-sm font-bold text-emerald-200">
                        Fee: ${lastResult.feeAmount.toFixed(2)}
                      </div>
                    )}
                  </>
                )}

                {lastResult.type === "ENTRY" && (
                  <>
                    <div className="text-xs text-white/70">Remaining Spaces</div>
                    <div className="text-2xl font-black">{lastResult.availableSpaces} Available</div>
                    <div className="text-xs text-white/80">
                      Occupancy: {lastResult.currentOccupancy}/{lastResult.totalCapacity}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scanner & Manual Entry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            {/* Input Method Selector */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Scan className="w-5 h-5 text-blue-600" />
                Gate Scanner Terminal
              </h3>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInputMethod("MANUAL")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    inputMethod === "MANUAL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Manual / Barcode Gun
                </button>
                <button
                  type="button"
                  onClick={() => setInputMethod("CAMERA")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    inputMethod === "CAMERA" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Device Camera
                </button>
              </div>
            </div>

            {/* Camera View Mode */}
            {inputMethod === "CAMERA" && (
              <div className="space-y-4">
                <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 flex flex-col items-center justify-center p-6 text-center text-white">
                  <Camera className="w-12 h-12 text-slate-500 mb-2 animate-pulse" />
                  <div className="font-bold text-sm">Camera QR Scanner</div>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Align the vehicle QR pass in front of your camera. Or use the manual barcode field below.
                  </p>

                  <div className="absolute inset-x-8 inset-y-8 border-2 border-dashed border-blue-500/50 rounded-xl pointer-events-none"></div>
                </div>
              </div>
            )}

            {/* Manual Form Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessScan();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Scanned QR Credential Token
                </label>
                <div className="relative">
                  <Keyboard className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Scan QR token or paste SPK_... here"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-mono outline-none"
                  />
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs uppercase font-bold text-slate-400">OR BY LICENSE PLATE</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  License Plate Number Override
                </label>
                <div className="relative">
                  <Car className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={manualPlate}
                    onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC-1234"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold uppercase outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl text-white font-extrabold text-base transition-all shadow-md flex items-center justify-center gap-2 ${
                  mode === "ENTRY"
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25"
                } disabled:bg-slate-400`}
              >
                {loading ? "Authorizing Gate Barrier..." : `Authorize ${mode} Gate Access`}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            {/* Quick Demo Simulator Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick Test Vehicles:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleProcessScan(undefined, "ABC-1234")}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold"
                >
                  ABC-1234 (Active Parked)
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessScan(undefined, "XYZ-9876")}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold"
                >
                  XYZ-9876 (Available)
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessScan(undefined, "MOTO-555")}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold"
                >
                  MOTO-555 (Motorcycle)
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessScan(undefined, "UNREGISTERED-999")}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-mono font-bold"
                >
                  UNREG-999 (Test Reject)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Facility Occupancy & Recent Gate Feed */}
        <div className="space-y-6">
          {/* Facility Occupancy Gauge Card */}
          {selectedFacility && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    {selectedFacility.code}
                  </span>
                  <h3 className="font-bold text-slate-900">{selectedFacility.name}</h3>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    selectedFacility.availableSpaces === 0
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {selectedFacility.availableSpaces === 0 ? "FULL" : "ONLINE"}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Occupancy</span>
                  <span>
                    {selectedFacility.currentOccupancy} / {selectedFacility.totalCapacity}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedFacility.currentOccupancy >= selectedFacility.totalCapacity
                        ? "bg-red-600"
                        : "bg-blue-600"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedFacility.currentOccupancy / selectedFacility.totalCapacity) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-slate-400 font-medium">Available</span>
                  <span className="text-xl font-black text-emerald-600">{selectedFacility.availableSpaces}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-slate-400 font-medium">Parked</span>
                  <span className="text-xl font-black text-slate-800">{selectedFacility.currentOccupancy}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Scans Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Live Gate Activity Feed
            </h3>

            {recentScans.length > 0 ? (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {recentScans.map((scan, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      scan.success ? "bg-emerald-50/50 border-emerald-200" : "bg-red-50/50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {scan.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-mono font-bold text-slate-900">{scan.plate}</span>
                        <div className="text-[10px] text-slate-500">{scan.message}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-[10px] uppercase text-slate-600">{scan.type}</span>
                      <div className="text-[10px] text-slate-400">{scan.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">Waiting for gate barrier scan...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
