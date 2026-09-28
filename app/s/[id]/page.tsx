"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { decryptSecret } from "@/lib/crypto";
import { ShieldAlert, Flame, Check, Copy } from "lucide-react";

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

  if (metaLoading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-400 flex items-center justify-center font-mono text-sm">
        Verifying cryptographic state...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 font-mono">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
        {!exists || error ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-red-950/60 border border-red-800/80 rounded-full flex items-center justify-center mx-auto text-red-400">
              <Flame className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-200">
              Secret Expired or Destroyed
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {error ||
                "This note was already viewed, reached its expiration time, or never existed."}
            </p>
          </div>
        ) : !secretContent ? (
          <div className="space-y-6">
            <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-lg text-amber-300 text-xs flex gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>
                Attention: Revealing this note permanently deletes it from the
                database immediately. It cannot be recovered.
              </span>
            </div>

            <button
              onClick={handleReveal}
              disabled={isBurning}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition"
            >
              <Flame className="w-4 h-4" />
              {isBurning
                ? "Destroying & Decrypting..."
                : "Reveal & Permanently Destroy"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Decrypted Payload
              </span>
              <span className="text-[11px] text-neutral-500">
                Deleted from server
              </span>
            </div>

            <pre className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-xs text-neutral-200 whitespace-pre-wrap break-all max-h-80 overflow-y-auto">
              {secretContent}
            </pre>

            <button
              onClick={handleCopy}
              className="w-full py-2.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied" : "Copy to Clipboard"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
