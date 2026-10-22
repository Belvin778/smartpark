import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "SmartPark — Enterprise Smart Parking Management Platform",
  description:
    "Production-grade smart parking management system with cryptographic QR access, real-time occupancy tracking, and operator gate management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-sm text-slate-500 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} SmartPark Platform. Enterprise Concurrency & Cryptographic QR Access.</p>
            <div className="flex items-center space-x-4 text-xs">
              <span className="flex items-center text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                System Operational
              </span>
              <span>•</span>
              <span>API v1 Ready</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
