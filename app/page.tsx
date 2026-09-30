"use client";

import { useState, useMemo, useRef } from "react";
import { encryptSecret, hashPasscode, generateSalt } from "@/lib/crypto";
import {
  Copy,
  Check,
  ShieldAlert,
  FileCode2,
  Clock,
  Sparkles,
  RefreshCw,
  Settings2,
  ChevronDown,
  Plus,
  Minus,
  Flame,
  Hourglass,
  Layers,
  KeyRound,
} from "lucide-react";
import { PasscodeInput } from "@/components/PasscodeInput";



const MAX_BYTES = 512 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [ttl, setTtl] = useState(86400);
  const [burnOnRead, setBurnOnRead] = useState(true);
  const [linkCount, setLinkCount] = useState(1);

  const [isEncrypting, setIsEncrypting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [generatedLinks, setGeneratedLinks] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const [passcode, setPasscode] = useState("");

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

  async function handleCreateSecret(e: React.SubmitEvent) {
    e.preventDefault();
    if (!text.trim() || isOverLimit) return;

    setIsEncrypting(true);
    try {
      const { ciphertext, iv, keyString } = await encryptSecret(text);

      if (passcode && passcode.length !== 6) {
        alert("Passcode must be exactly 6 digits (or leave blank).");
        return;
      }

      let passcodeHash: string | null = null;
      let passcodeSalt: string | null = null;

      if (passcode.length === 6) {
        passcodeSalt = generateSalt();
        passcodeHash = await hashPasscode(passcode, passcodeSalt);
      }

      const res = await fetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext,
          iv,
          ttl,
          burnOnRead,
          linkCount,
          passcodeHash,
          passcodeSalt
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          alert(data.error);
          return;
        }
        throw new Error(data.error || "Storage failed");
      }

      const links = data.linkIds.map((id: string) => `${window.location.origin}/s/${id}#k=${keyString}`);
      setGeneratedLinks(links);
      setText("");
      setPasscode("");
    } catch {
      alert("Encryption or storage failed. Please check size bounds.");
    } finally {
      setIsEncrypting(false);
    }
  }

  function handleCopy(url: string, index: number) {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleCopyAll() {
    navigator.clipboard.writeText(generatedLinks.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start pt-8 sm:pt-12 md:pt-16 pb-14 px-3.5 sm:px-6 md:px-8 font-mono">
      <div className="w-full max-w-4xl flex flex-col bg-neutral-900/50 border border-neutral-700 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-sm">
        {generatedLinks.length === 0 ? (
          <form
            onSubmit={handleCreateSecret}
            className="space-y-4 sm:space-y-5"
          >
            <div className="w-full border border-neutral-900 rounded-xl overflow-hidden bg-neutral-950/90 shadow-inner focus-within:border-neutral-700 transition">
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

              <div className="relative flex h-[38dvh] min-h-56 sm:h-72 md:h-80 overflow-hidden font-mono text-xs sm:text-sm">
                <div
                  ref={lineNumbersRef}
                  className="w-9 sm:w-11 py-3 sm:py-3.5 bg-neutral-950/80 border-r border-neutral-800 text-neutral-600 select-none overflow-hidden text-right pr-2 sm:pr-3 leading-6 font-medium shrink-0"
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
                  className="flex-1 p-3 sm:p-3.5 bg-transparent text-neutral-200 placeholder-neutral-600 focus:outline-none resize-none leading-6 overflow-y-auto whitespace-pre font-mono selection:bg-emerald-950 selection:text-emerald-300 scheme-dark"
                />
              </div>

              <div className="h-1 w-full bg-neutral-900 overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${isOverLimit
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
            <div>
              {/* Standard Controls */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end">
                <div className="w-full sm:w-2/5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 sm:mb-2">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    Destruction Window
                  </label>
                  <select
                    value={ttl}
                    onChange={(e) => setTtl(Number(e.target.value))}
                    className="w-full h-11 sm:h-12 bg-neutral-950/80 border border-neutral-800 rounded-xl px-3.5 text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 transition-colors scheme-dark cursor-pointer"
                  >
                    <option value={300}>5 Minutes</option>
                    <option value={3600}>1 Hour</option>
                    <option value={86400}>24 Hours</option>
                    <option value={604800}>7 Days</option>
                  </select>
                </div>

                {/* Advanced Settings Toggle Button */}
                <div className="w-full sm:w-3/5">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen((prev) => !prev)}
                    className="w-full h-11 sm:h-12 px-4 bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-emerald-400" />
                      Advanced Policy & Links
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {/* Advanced Settings Accordion Body (Spacious & Decongested) */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${advancedOpen
                  ? "max-h-[900px] opacity-100 mt-4"
                  : "max-h-0 opacity-0 mt-0 pointer-events-none"
                  }`}
              >
                <div className="space-y-4">
                  {/* Card 1: Destruction Policy */}
                  <div className="p-4 sm:p-5 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Destruction Policy
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBurnOnRead(true)}
                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${burnOnRead
                          ? "bg-emerald-950/40 border-emerald-500/70 text-neutral-100 shadow-[0_0_14px_rgba(16,185,129,0.12)]"
                          : "bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700"
                          }`}
                      >
                        <Flame className={`w-4 h-4 mt-0.5 shrink-0 ${burnOnRead ? "text-emerald-400" : "text-neutral-500"}`} />
                        <div>
                          <div className="text-xs font-semibold">Delete after reading</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">Link destroys instantly once opened</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBurnOnRead(false)}
                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${!burnOnRead
                          ? "bg-emerald-950/40 border-emerald-500/70 text-neutral-100 shadow-[0_0_14px_rgba(16,185,129,0.12)]"
                          : "bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700"
                          }`}
                      >
                        <Hourglass className={`w-4 h-4 mt-0.5 shrink-0 ${!burnOnRead ? "text-emerald-400" : "text-neutral-500"}`} />
                        <div>
                          <div className="text-xs font-semibold">Destroy on expire only</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">Reusable until time window elapses</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Generated Links (Pointer References) */}
                  <div className="p-4 sm:p-5 bg-neutral-950/80 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Multi-Link Generation
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Create 1–3 independent links sharing 1 encrypted master payload
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto bg-neutral-900/90 border border-neutral-800 rounded-lg p-1">
                      <button
                        type="button"
                        disabled={linkCount <= 1}
                        onClick={() => setLinkCount((c) => Math.max(1, c - 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300 transition cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-neutral-200">
                        {linkCount}
                      </span>
                      <button
                        type="button"
                        disabled={linkCount >= 3}
                        onClick={() => setLinkCount((c) => Math.min(3, c + 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card 3: 6-Digit Passcode Gate */}
                  <div className="p-4 sm:p-5 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                          6-Digit Passcode Gate (Optional)
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          Self-destructs if recipient fails 3 passcode attempts
                        </div>
                      </div>

                      {passcode.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setPasscode("")}
                          className="text-[11px] text-neutral-400 hover:text-red-400 transition cursor-pointer"
                        >
                          Clear PIN
                        </button>
                      )}
                    </div>

                    <div className="pt-1">
                      <PasscodeInput
                        value={passcode}
                        onChange={setPasscode}
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                disabled={isEncrypting || !text.trim() || isOverLimit}
                className="w-full mt-4 h-11 sm:h-12 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-[0.99]"
              >
                {isEncrypting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    Encrypting In-Memory...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {linkCount > 1
                      ? `Create ${linkCount} Encrypted Links`
                      : "Create Encrypted Link"}
                  </>
                )}
              </button>

              {/* Live Settings Status Line */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 select-none mt-2">
                <span>
                  {ttl === 300
                    ? "5 Minutes"
                    : ttl === 3600
                      ? "1 Hour"
                      : ttl === 86400
                        ? "24 Hours"
                        : "7 Days"}
                </span>
                <span>•</span>
                <span>{burnOnRead ? "Delete after read" : "Reusable until expiry"}</span>
                <span>•</span>
                <span>
                  {linkCount === 1
                    ? burnOnRead
                      ? "1 Single-use link"
                      : "1 Reusable link"
                    : `${linkCount} Independent links`}
                </span>
                {passcode.length === 6 && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400/90 font-medium">PIN Protected (3 Strikes)</span>
                  </>
                )}

              </div>
            </div>

          </form>
        ) : (
          <div className="space-y-5 py-2">
            <div className="p-4 sm:p-5 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs sm:text-sm flex gap-3.5 items-start">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div className="space-y-1">
                <p className="font-semibold text-emerald-200">
                  {generatedLinks.length > 1
                    ? `${generatedLinks.length} Zero-Knowledge Links Ready`
                    : "Zero-Knowledge Link Generated"}
                </p>
                <p className="text-xs text-emerald-400/90 leading-relaxed">
                  The key resides only in the URL fragment (<span className="font-mono">#k=...</span>)
                  and was never sent over HTTP.{" "}
                  {burnOnRead
                    ? "Each link will destroy its access pointer once viewed."
                    : "Links remain accessible until the time window expires."}
                </p>
              </div>
            </div>

            {/* Links List */}
            <div className="space-y-3">
              {generatedLinks.map((url, index) => (
                <div
                  key={url}
                  className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 font-mono text-emerald-400 truncate select-all pr-2">
                    {url}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(url, index)}
                    className="shrink-0 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedIndex === index ? "Copied" : `Copy Link ${generatedLinks.length > 1 ? `#${index + 1}` : ""}`}
                  </button>
                </div>
              ))}
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {generatedLinks.length > 1 && (
                <button
                  onClick={handleCopyAll}
                  className="w-full sm:flex-1 h-11 sm:h-12 bg-neutral-100 text-neutral-950 hover:bg-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedAll ? "All Links Copied" : "Copy All Links"}
                </button>
              )}
              <button
                onClick={() => setGeneratedLinks([])}
                className={`w-full ${generatedLinks.length === 1 ? "sm:flex-1" : "sm:w-auto"
                  } h-11 sm:h-12 px-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]`}
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
