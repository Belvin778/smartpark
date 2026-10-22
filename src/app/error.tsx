"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("SmartPark runtime error:", error);
  }, [error]);

  return (
    <div className="py-24 text-center max-w-md mx-auto space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900">System Error Encountered</h1>
        <p className="text-sm text-slate-500">
          An operational fault occurred while processing the request. Barrier safety invariants remain enforced.
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Retry Operation
      </button>
    </div>
  );
}
