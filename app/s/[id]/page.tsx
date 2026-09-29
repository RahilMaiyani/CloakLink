"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { decryptSecret } from "@/lib/crypto";
import {
  ShieldAlert,
  Flame,
  Check,
  Copy,
  Lock,
  Download,
  Terminal,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function RevealPage() {
  const { id } = useParams<{ id: string }>();
  const [key, setKey] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [secretContent, setSecretContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const parsedKey = hash.startsWith("#k=") ? hash.replace("#k=", "") : null;
      setKey(parsedKey);
    }

    async function checkMetadata() {
      try {
        const res = await fetch(`/api/secrets/${id}/meta`);
        if (res.ok) {
          setExists(true);
        } else {
          setExists(false);
        }
      } catch {
        setError("Network error contacting security service.");
      } finally {
        setMetaLoading(false);
      }
    }

    checkMetadata();
  }, [id]);

  async function handleReveal() {
    if (!key) {
      setError("Decryption key missing from URL fragment.");
      return;
    }

    setIsBurning(true);
    try {
      const res = await fetch(`/api/secrets/${id}/burn`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Secret has expired or was already read.",
        );
      }

      const plainText = await decryptSecret(data.ciphertext, data.iv, key);
      setSecretContent(plainText);

      window.history.replaceState(null, "", window.location.pathname);
    } catch (err: any) {
      setError(err.message || "Failed to decrypt. Note may be corrupted.");
    } finally {
      setIsBurning(false);
    }
  }

  function handleCopy() {
    if (!secretContent) return;
    navigator.clipboard.writeText(secretContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!secretContent) return;
    const blob = new Blob([secretContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `secret-${id.slice(0, 8)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (metaLoading) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center font-mono text-xs gap-3 p-4">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span>Verifying cryptographic state...</span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full flex flex-col justify-center items-center py-6 px-3.5 sm:p-6 md:p-10 font-mono">
      <div className="w-full max-w-4xl min-h-[80dvh] sm:min-h-0 flex flex-col justify-between bg-neutral-900/50 border border-neutral-700 rounded-2xl p-5 sm:p-8 md:p-10 shadow-2xl backdrop-blur-sm my-auto">
        {!exists || error ? (
          <div className="text-center space-y-5 py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center justify-center mx-auto text-red-400 shadow-inner">
              <Flame className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-bold text-neutral-200">
                Secret Expired or Destroyed
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed px-2">
                {error ||
                  "This note was already accessed and burned, exceeded its lifetime window, or never existed."}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition"
              >
                Create a New Secret <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : !secretContent ? (
          <div className="flex-1 flex flex-col justify-center space-y-6 py-4">
            <div className="p-4 sm:p-5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-300 text-xs sm:text-sm flex gap-3.5 items-start">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div className="space-y-1">
                <p className="font-semibold text-emerald-200">
                  Self-Destruction Warning
                </p>
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  Revealing this note triggers an atomic deletion request on our
                  storage layer. Once decrypted, it will be wiped from memory
                  and cannot be recovered.
                </p>
              </div>
            </div>

            <button
              onClick={handleReveal}
              disabled={isBurning}
              className="w-full h-12 sm:h-14 bg-emerald-700/90 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition shadow-lg shadow-emerald-950/50 cursor-pointer active:scale-[0.99]"
            >
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
              {isBurning
                ? "Destroying on Server & Decrypting..."
                : "Reveal & Permanently Destroy"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Decrypted Payload Terminal */}
            <div className="w-full border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/90 shadow-inner">
              <div className="bg-neutral-900/90 px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2.5 text-xs select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-semibold tracking-wide text-[11px] sm:text-xs">
                    DECRYPTED PAYLOAD (
                    {formatBytes(new Blob([secretContent]).size)})
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 px-2.5 py-1.5 sm:px-3 rounded-lg transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[11px] text-neutral-950 font-bold bg-neutral-100 hover:bg-white px-2.5 py-1.5 sm:px-3 rounded-lg transition cursor-pointer active:scale-95"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? "Copied" : "Copy Raw"}</span>
                  </button>
                </div>
              </div>

              <div className="h-[46dvh] min-h-85 sm:h-auto sm:min-h-65 sm:max-h-115 overflow-auto font-mono text-xs sm:text-sm leading-6 scheme-dark max-w-full">
                <div className="flex min-w-full w-max min-h-full sm:min-h-65">
                  <div className="sticky left-0 z-10 w-9 sm:w-12 py-3 sm:py-3.5 bg-neutral-950 border-r border-neutral-800 text-neutral-600 select-none text-right pr-2 sm:pr-3.5 font-medium shrink-0">
                    {secretContent.split("\n").map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  <pre className="flex-1 p-3 sm:p-3.5 text-neutral-200 whitespace-pre selection:bg-emerald-950 selection:text-emerald-300 font-mono">
                    {secretContent}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-neutral-500 pt-1 gap-2.5 text-center sm:text-left">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                Ciphertext destroyed on server
              </span>
              <Link
                href="/"
                className="text-white bg-emerald-700/60 rounded-full p-1.5 px-2 hover:text-emerald-300 transition"
              >
                <span className="flex items-center gap-1 font-medium">
                  Send your own secret <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
