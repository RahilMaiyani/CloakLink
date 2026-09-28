"use client";

import { useState } from "react";
import { encryptSecret } from "@/lib/crypto";
import { Lock, Copy, Check, ShieldAlert } from "lucide-react";

export default function HomePage() {
  const [text, setText] = useState("");
  const [ttl, setTtl] = useState(86400);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreateSecret(e: React.SubmitEvent) {
    e.preventDefault();
    if (!text.trim()) return;

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

      const fullUrl = `${window.location.origin}/s/${data.id}#k=${keyString}`;
      setShareableUrl(fullUrl);
      setText("");
    } catch (err) {
      alert("Encryption or storage failed. Please try again.");
    } finally {
      setIsEncrypting(false);
    }
  }

  function copyToClipboard() {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 font-mono">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">CloakLink</h1>
            <p className="text-xs text-neutral-400">
              Zero-knowledge, self-destructing secrets
            </p>
          </div>
        </div>

        {!shareableUrl ? (
          <form onSubmit={handleCreateSecret} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-tight text-neutral-400 mb-2">
                Secret Content (API keys, Credentials, Notes)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste sensitive payload here..."
                rows={6}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-2">
                Lifetime Expiration (TTL)
              </label>
              <select
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value={300}>5 Minutes</option>
                <option value={3600}>1 Hour</option>
                <option value={86400}>24 Hours</option>
                <option value={604800}>7 Days</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isEncrypting || !text.trim()}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg text-sm transition-all"
            >
              {isEncrypting
                ? "Encrypting in browser..."
                : "Generate Ephemeral Link"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>
                Encrypted with AES-256-GCM. The key resides only in the hash
                below. Once opened, it vanishes forever.
              </span>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg break-all text-xs text-neutral-300">
              {shareableUrl}
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2.5 bg-neutral-100 text-neutral-900 hover:bg-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied to Clipboard" : "Copy Secure Link"}
              </button>
              <button
                onClick={() => setShareableUrl(null)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition"
              >
                New
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
