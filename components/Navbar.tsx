"use client";

import Link from "next/link";
import { Lock, ShieldCheck, Terminal } from "lucide-react";

export default function Navbar() {
  return (
    <header className="w-full border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-emerald-950/80 text-emerald-400 rounded-xl border border-emerald-800/60 shadow-inner group-hover:border-emerald-500/80 transition-colors">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base tracking-tight text-neutral-100 group-hover:text-emerald-300 transition-colors">
              Cloaker
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Zero-Knowledge
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 justify-end">
          <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 bg-neutral-900/80 px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Terminal className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline" />
            <span className="hidden sm:inline">AES-256-GCM</span>
          </div>
        </div>
      </div>
    </header>
  );
}
