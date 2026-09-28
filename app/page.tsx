"use client";

import { useState, useMemo, useRef } from "react";
import { encryptSecret } from "@/lib/crypto";
import {
  Lock,
  Copy,
  Check,
  ShieldAlert,
  FileCode2,
  Terminal,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";

const MAX_BYTES = 512 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [ttl, setTtl] = useState(86400);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const byteSize = useMemo(() => new Blob([text]).size, [text]);
  const isOverLimit = byteSize > MAX_BYTES;
  const usagePercent = Math.min((byteSize / MAX_BYTES) * 100, 100);

  const lineCount = useMemo(() => {
    if (!text) return 1;
    return text.split("\n").length;
  }, [text]);

  const lineNumbers = useMemo(() => {
    return Array.from({ length: Math.max(lineCount, 10) }, (_, i) => i + 1);
  }, [lineCount]);

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  async function handleCreateSecret(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isOverLimit) return;

    setIsEncrypting(true);
    try {
      const { ciphertext, iv, keyString } = await encryptSecret(text);

      const res = await fetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext, iv, ttl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShareableUrl(`${window.location.origin}/s/${data.id}#k=${keyString}`);
      setText("");
    } catch {
      alert("Encryption or storage failed. Please check size bounds.");
    } finally {
      setIsEncrypting(false);
    }
  }

  function handleCopy() {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-dvh w-full flex flex-col justify-center items-center py-6 px-3.5 sm:p-6 md:p-10 font-mono">
      {/* my-auto dynamically balances vertical margins on tall screens */}
      <div className="w-full z-2 max-w-4xl bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 sm:p-8 md:p-10 shadow-2xl backdrop-blur-md my-auto">
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 sm:pb-6 sm:mb-6 border-b border-neutral-800 gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-emerald-950/80 text-emerald-400 rounded-xl border border-emerald-800/80 shadow-inner shrink-0">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-100">
                  CloakLink
                </h1>
                <span className="text-[10px] uppercase font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  Zero-Knowledge
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
                Client-side encrypted payload dispatcher
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto flex items-center gap-2 text-[11px] sm:text-xs text-neutral-400 bg-neutral-950/80 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-neutral-800 shrink-0">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>AES-256-GCM / 512 KB</span>
          </div>
        </div>

        {!shareableUrl ? (
          <form
            onSubmit={handleCreateSecret}
            className="space-y-5 sm:space-y-6"
          >
            {/* Editor Workspace */}
            <div className="w-full border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/90 shadow-inner focus-within:border-neutral-700 transition">
              <div className="bg-neutral-900/90 px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400 select-none">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700/80" />
                  </div>
                  <span className="ml-1 sm:ml-2 font-medium text-neutral-300 flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                    payload.env
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
                  <span>
                    {lineCount} {lineCount === 1 ? "line" : "lines"}
                  </span>
                  <span className="text-neutral-700">|</span>
                  <span
                    className={
                      isOverLimit
                        ? "text-red-400 font-bold"
                        : "text-neutral-400"
                    }
                  >
                    {formatBytes(byteSize)} / 512 KB
                  </span>
                </div>
              </div>

              <div className="relative flex h-64 sm:h-80 md:h-96 overflow-hidden font-mono text-xs sm:text-sm">
                <div
                  ref={lineNumbersRef}
                  className="w-9 sm:w-12 py-3 sm:py-3.5 bg-neutral-950/80 border-r border-neutral-800 text-neutral-600 select-none overflow-hidden text-right pr-2 sm:pr-3.5 leading-6 font-medium shrink-0"
                >
                  {lineNumbers.map((num) => (
                    <div key={num}>{num}</div>
                  ))}
                </div>

                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onScroll={handleScroll}
                  placeholder="# Paste sensitive configs, credentials, or keys..."
                  required
                  spellCheck={false}
                  className="flex-1 p-3 sm:p-3.5 bg-transparent text-neutral-200 placeholder-neutral-600 focus:outline-none resize-none leading-6 overflow-y-auto whitespace-pre font-mono selection:bg-emerald-950 selection:text-emerald-300 [color-scheme:dark]"
                />
              </div>

              <div className="h-1 w-full bg-neutral-900 overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    isOverLimit
                      ? "bg-red-500"
                      : usagePercent > 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end">
              <div className="w-full sm:w-2/5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 sm:mb-2">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  Destruction Window
                </label>
                <select
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  className="w-full h-11 sm:h-12 bg-neutral-950/80 border border-neutral-800 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark] cursor-pointer"
                >
                  <option value={300}>5 Minutes</option>
                  <option value={3600}>1 Hour</option>
                  <option value={86400}>24 Hours</option>
                  <option value={604800}>7 Days</option>
                </select>
              </div>

              <div className="w-full sm:w-3/5">
                <button
                  type="submit"
                  disabled={isEncrypting || !text.trim() || isOverLimit}
                  className="w-full h-11 sm:h-12 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-[0.99]"
                >
                  {isEncrypting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      Encrypting In-Memory...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Encrypted Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-5 py-2">
            <div className="p-4 sm:p-5 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs sm:text-sm flex gap-3.5 items-start">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div className="space-y-1">
                <p className="font-semibold text-emerald-200">
                  Zero-Knowledge Link Generated
                </p>
                <p className="text-xs text-emerald-400/90 leading-relaxed">
                  The key resides only in the URL fragment (
                  <span className="font-mono">#k=...</span>) and was never sent
                  over HTTP. Once viewed, it is erased permanently.
                </p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl break-all text-xs sm:text-sm text-emerald-400 font-mono select-all shadow-inner leading-relaxed">
              {shareableUrl}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={handleCopy}
                className="w-full sm:flex-1 h-11 sm:h-12 bg-neutral-100 text-neutral-950 hover:bg-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied to Clipboard" : "Copy Ephemeral Link"}
              </button>
              <button
                onClick={() => setShareableUrl(null)}
                className="w-full sm:w-auto h-11 sm:h-12 px-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <RefreshCw className="w-4 h-4" />
                New Secret
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
