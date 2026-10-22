import Link from "next/link";
import { Car, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="py-24 text-center max-w-md mx-auto space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
        <Car className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <h2 className="text-xl font-bold text-slate-800">Parking Space Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested SmartPark terminal page or facility record could not be located.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Return Home
      </Link>
    </div>
  );
}
