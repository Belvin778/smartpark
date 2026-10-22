"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Printer,
  Download,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Car,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";

interface VehicleQRData {
  vehicle: {
    id: string;
    displayPlate: string;
    vehicleType: string;
    make: string | null;
    model: string | null;
    owner: {
      fullName: string;
      email: string;
    };
  };
  activeCredential: {
    id: string;
    tokenHash: string;
    rawTokenPreview: string;
    status: string;
    createdAt: string;
    expiresAt: string | null;
  } | null;
  allCredentials: Array<{
    id: string;
    rawTokenPreview: string;
    status: string;
    createdAt: string;
    revocationReason: string | null;
  }>;
}

export default function VehicleQRPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";
  const vehicleId = params.id as string;

  const [data, setData] = useState<VehicleQRData | null>(null);
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("Lost or compromised pass");
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchVehicleQR();
  }, [vehicleId]);

  const fetchVehicleQR = async () => {
    try {
      const res = await fetch(`/api/v1/vehicles/${vehicleId}/qr`);
      if (res.ok) {
        const json = await res.json();
        setData(json);

        // If the server doesn't provide rawToken (because it's stored as hash),
        // we can generate a new one if user clicks regenerate, or render a deterministic test QR
        const effectiveToken = rawToken || json.activeCredential?.rawTokenPreview || `SPK_PASS_${vehicleId}`;
        generateQRImage(effectiveToken);
      }
    } catch (err) {
      console.error("Failed to fetch vehicle QR:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateQRImage = async (tokenString: string) => {
    try {
      const url = await QRCode.toDataURL(tokenString, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("QR render error:", err);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Regenerating this pass will immediately revoke your old QR code. Continue?")) return;

    setRegenerating(true);
    try {
      const res = await fetch(`/api/v1/vehicles/${vehicleId}/qr`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        setRawToken(json.rawToken);
        generateQRImage(json.rawToken);
        await fetchVehicleQR();
      }
    } catch (err) {
      console.error("Regenerate error:", err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleRevoke = async () => {
    try {
      const res = await fetch(`/api/v1/vehicles/${vehicleId}/qr/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revokeReason }),
      });
      if (res.ok) {
        setRevokeModalOpen(false);
        setRawToken(null);
        await fetchVehicleQR();
      }
    } catch (err) {
      console.error("Revocation error:", err);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl || !data) return;
    const link = document.createElement("a");
    link.download = `SmartPark_Pass_${data.vehicle.displayPlate}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const textToCopy = rawToken || data?.activeCredential?.rawTokenPreview || "";
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-400">Loading parking pass...</div>;
  }

  if (!data) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Vehicle not found</h2>
        <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isActive = data.activeCredential?.status === "ACTIVE";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Navigation & Alerts */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Permit
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download Pass
          </button>
        </div>
      </div>

      {isNew && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 no-print">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Vehicle registered successfully! Your cryptographic QR access pass is ready.</span>
        </div>
      )}

      {/* Main QR Card — Printable Parking Permit */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg p-8 sm:p-10 text-center space-y-6 relative overflow-hidden">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Car className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Smart<span className="text-blue-600">Park</span> Permit
            </span>
          </div>

          <span
            className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
              isActive
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {isActive ? "Active Credential" : "Revoked"}
          </span>
        </div>

        {/* Plate Display */}
        <div className="space-y-1">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400">Authorized Vehicle</div>
          <div className="inline-block px-6 py-2.5 bg-slate-900 text-white font-mono text-3xl sm:text-4xl font-black rounded-2xl tracking-widest border-2 border-slate-700 shadow-inner">
            {data.vehicle.displayPlate}
          </div>
          <div className="text-sm font-semibold text-slate-700 pt-1">
            {data.vehicle.make} {data.vehicle.model} ({data.vehicle.vehicleType})
          </div>
        </div>

        {/* Large QR Code Display */}
        <div className="flex flex-col items-center justify-center py-2">
          {qrDataUrl ? (
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`SmartPark QR for ${data.vehicle.displayPlate}`}
                className="w-64 h-64 mx-auto object-contain"
              />
            </div>
          ) : (
            <div className="w-64 h-64 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
              Generating QR Code...
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Opaque Token / Preview */}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>Token: {rawToken ? rawToken : data.activeCredential?.rawTokenPreview}</span>
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-blue-600 transition"
              title="Copy token to clipboard for testing"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Owner & Instructions Footer */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 text-left text-xs text-slate-600 gap-4">
          <div>
            <span className="block text-slate-400 font-bold uppercase text-[10px]">Registered Owner</span>
            <span className="font-semibold text-slate-800">{data.vehicle.owner.fullName}</span>
          </div>
          <div className="text-right">
            <span className="block text-slate-400 font-bold uppercase text-[10px]">Security Standard</span>
            <span className="font-semibold text-slate-800">SHA-256 Verified</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
          Present this QR code to the entrance scanner at gate barriers. QR access is contingent upon parking facility capacity.
        </div>
      </div>

      {/* Security Management Card (Revocation & Regeneration) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 no-print">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Credential Security & Loss Prevention
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              If your QR permit is photographed by an unauthorized party or lost, revoke it immediately. You can generate a fresh credential instantly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isActive && (
              <button
                type="button"
                onClick={() => setRevokeModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition"
              >
                Revoke Permit
              </button>
            )}

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating..." : "Regenerate QR Pass"}
            </button>
          </div>
        </div>

        {/* Credential Audit History */}
        {data.allCredentials && data.allCredentials.length > 1 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-600">Past Credentials Issued:</span>
            <div className="space-y-1.5">
              {data.allCredentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <span className="font-mono text-slate-600">{cred.rawTokenPreview}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">
                      {new Date(cred.createdAt).toLocaleDateString([], { dateStyle: 'short' })}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        cred.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {cred.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Revocation Modal */}
      {revokeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Revoke Parking Pass</h3>
                <p className="text-xs text-slate-500">This action will immediately block all barrier gate scans.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">Revocation Reason</label>
              <select
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
              >
                <option value="Lost or compromised pass">Lost or compromised pass</option>
                <option value="Vehicle sold / transferred">Vehicle sold / transferred</option>
                <option value="Suspicious unauthorized scan attempt">Suspicious unauthorized scan attempt</option>
                <option value="Driver requested renewal">Driver requested renewal</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
