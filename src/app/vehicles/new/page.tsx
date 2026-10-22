"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Car,
  Bike,
  Truck,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { normalizePlate } from "@/lib/validators";

export default function NewVehiclePage() {
  const router = useRouter();
  const [plate, setPlate] = useState("");
  const [vehicleType, setVehicleType] = useState<"CAR" | "MOTORCYCLE" | "VAN" | "EV" | "TRUCK">("CAR");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalized = normalizePlate(plate);

  const vehicleTypes = [
    { type: "CAR", label: "Car / Sedan / SUV", icon: Car },
    { type: "EV", label: "Electric Vehicle (EV)", icon: Zap },
    { type: "MOTORCYCLE", label: "Motorcycle", icon: Bike },
    { type: "VAN", label: "Van / Minivan", icon: Truck },
    { type: "TRUCK", label: "Commercial Truck", icon: Truck },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (normalized.length < 3) {
      setError("Please enter a valid license plate with at least 3 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate: plate.trim().toUpperCase(),
          vehicleType,
          make: make.trim() || undefined,
          model: model.trim() || undefined,
          color: color.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to register vehicle.");
        return;
      }

      // Redirect directly to the newly generated QR code pass!
      router.push(`/vehicles/${data.vehicle.id}/qr?new=true`);
    } catch {
      setError("Network error while registering vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-6 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Register New Vehicle
        </h1>
        <p className="text-sm text-slate-500">
          Enter your license plate number to automatically generate a cryptographic QR parking pass.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* License Plate Field */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">
              Vehicle Registration / License Plate Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="e.g. ABC-1234 or 7XYZ89"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono font-bold uppercase tracking-wider outline-none transition"
              />
            </div>
            {normalized.length > 0 && (
              <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Normalized Database Key: </span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                  {normalized}
                </span>
              </div>
            )}
          </div>

          {/* Vehicle Type Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">Vehicle Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {vehicleTypes.map((vt) => {
                const Icon = vt.icon;
                const isSelected = vehicleType === vt.type;
                return (
                  <button
                    type="button"
                    key={vt.type}
                    onClick={() => setVehicleType(vt.type)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{vt.label}</div>
                      <div className="text-[11px] text-slate-500">Standard barrier clearance</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Tesla, Toyota..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Model 3, Camry..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="White, Blue..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Automated QR Permit Issuance
            </div>
            <p>
              Upon registration, a 256-bit cryptographically secure credential token will be generated immediately.
              You will be able to print, download, or present it from your smartphone at any parking gate.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Generating Permit..." : "Register & Generate QR Access Pass"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
