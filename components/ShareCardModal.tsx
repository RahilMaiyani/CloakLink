"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Share2,
  Copy,
  Check,
  X,
  Flame,
  Hourglass,
  KeyRound,
  ShieldCheck,
  Tag,
  User,
  QrCode,
} from "lucide-react";

import { toPng } from 'html-to-image';

interface CreatorInfo {
  name?: string;
  email?: string;
  subject?: string;
}

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  creator?: CreatorInfo | null;
  burnOnRead?: boolean;
  ttl?: number;
  hasPasscode?: boolean;
}

export function ShareCardModal({
  isOpen,
  onClose,
  url,
  creator,
  burnOnRead = true,
  ttl = 86400,
  hasPasscode = false,
}: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!isOpen || !url || !qrContainerRef.current) return;

    let isMounted = true;

    async function initQR() {
      try {
        const QRCodeStyling = (await import("qr-code-styling")).default;

        const qrCode = new QRCodeStyling({
          width: 230,
          height: 230,
          type: "svg",
          data: url,
          margin: 4,
          qrOptions: {
            errorCorrectionLevel: "M",
          },
          dotsOptions: {
            type: 'dots',
            gradient: {
              type: "linear",
              rotation: 45,
              colorStops: [
                { offset: 0, color: "#10b981" },
                { offset: 1, color: "#6ee7b7" },
              ],
            },
          },
          backgroundOptions: {
            color: "#09090b",
          },
          cornersSquareOptions: {
            type: "rounded",
            color: "#10b981",
          },
          cornersDotOptions: {
            type: "square",
            color: "#34d399",
          },
        });

        if (isMounted && qrContainerRef.current) {
          qrContainerRef.current.innerHTML = "";
          qrCode.append(qrContainerRef.current);
        }

      } catch (err) {
        console.error("Failed to render QR Code", err);
      }
    }

    initQR();

    return () => {
      isMounted = false;
    };
  }, [isOpen, url]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose])

  if (!isOpen) return null;

  const ttlLabel =
    ttl === 300 ? '5m'
      : ttl === 3600 ? '1h'
        : ttl === 86400 ? '24h'
          : "7d";

  async function handleDownloadCard() {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#09090b",
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `cloaker-secret-card-${Date.now().toString(36)}.png`;
      a.click();
    }
    catch (err) {
      console.error("Failed to export card image", err);
      alert("Could not export card image. Please try again.");
    }
    finally {
      setIsDownloading(false);
    }
  }

  async function handleShare() {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          const dataUrl = await toPng(cardRef.current, {
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: "#09090b",
          });
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], "cloaker-secret-card.png", {
            type: "image/png",
          });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: creator?.subject || "Encrypted Secret Card",
              text: "Scan or tap to decrypt this zero-knowledge secret on Cloaker.",
            });
            return;
          }
        } catch {
          // File share not supported or aborted; gracefully fall back to text/url
        }

        await navigator.share({
          title: creator?.subject || "Encrypted Secret Link",
          text: "Decrypt this zero-knowledge secret with cloaker:",
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

    }
    catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Share error", err);
      }
    } finally {
      setIsSharing(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md my-auto flex flex-col items-center gap-3.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar (Close Button) */}
        <div className="w-full flex items-center justify-between px-1 text-xs text-neutral-400 font-mono">
          <span className="flex items-center gap-1.5 text-neutral-300 font-semibold">
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            Secret Share Card
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* ─── UNIFIED MODAL CARD CONTAINER ─── */}
        <div className="w-full bg-[#09090b] border border-neutral-800/90 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden font-mono flex flex-col select-none">
          {/* ─── THE EXPORTABLE CARD CANVAS (CAPTURED BY toPng) ─── */}
          <div
            ref={cardRef}
            id="cloaker-secret-card"
            className="w-full bg-[#09090b] p-5 sm:p-6 relative overflow-hidden flex flex-col gap-4"
          >
            {/* Subtle Ambient Emerald Lighting */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Card Header: Brand & Security Badge */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-emerald-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 7A8.5 8.5 0 1 0 18 17" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-100 tracking-tight leading-none">
                    CLOAKER
                  </div>
                  <div className="text-[9px] text-emerald-400/90 uppercase tracking-widest font-semibold mt-0.5">
                    Zero-Knowledge
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[10px] text-emerald-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AES-256-GCM
              </div>
            </div>

            {/* Optional Subject & Creator Attribution */}
            {creator && (creator.subject || creator.name || creator.email) && (
              <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3 space-y-1.5 text-left">
                {creator.subject && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-100 truncate">
                    <Tag className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{creator.subject}</span>
                  </div>
                )}
                {(creator.name || creator.email) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate">
                    <User className="w-3 h-3 text-neutral-500 shrink-0" />
                    <span className="truncate">
                      From:{" "}
                      {creator.name && (
                        <span className="text-neutral-200 font-semibold">
                          {creator.name}
                        </span>
                      )}
                      {creator.name && creator.email && " "}
                      {creator.email && (
                        <span className="text-neutral-500">
                          ({creator.email})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Center Stylized QR Code Box */}
            <div className="relative mx-auto p-3.5 bg-neutral-950 border border-neutral-800/90 rounded-2xl shadow-[0_0_24px_rgba(16,185,129,0.12)] flex items-center justify-center">
              <div
                ref={qrContainerRef}
                className="flex items-center justify-center [&>canvas]:rounded-xl [&>svg]:rounded-xl"
              />
            </div>

            {/* Instructional & Policy Badges */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
              {/* Policy Badge */}
              <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-neutral-900/80 border border-neutral-800/80 rounded-lg text-neutral-300">
                {burnOnRead ? (
                  <>
                    <Flame className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="truncate">Burn on Read</span>
                  </>
                ) : (
                  <>
                    <Hourglass className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">Valid {ttlLabel}</span>
                  </>
                )}
              </div>
              {/* Passcode Protection Badge */}
              <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-neutral-900/80 border border-neutral-800/80 rounded-lg text-neutral-300">
                {hasPasscode ? (
                  <>
                    <KeyRound className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">PIN Protected</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">Direct Access</span>
                  </>
                )}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center pt-1 border-t border-neutral-800/60 space-y-0.5">
              <div className="text-[10px] text-neutral-400">
                Point camera or QR scanner to decrypt
              </div>
              <div className="text-[9px] text-neutral-600">
                Key resides in URL fragment (#k=) • Never stored on server
              </div>
            </div>
          </div>

          {/* ─── DOCKED BOTTOM ACTION BAR (INSIDE CONTAINER, EXCLUDED FROM cardRef) ─── */}
          <div className="px-4 py-3.5 sm:px-5 sm:py-4 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center gap-2 font-mono">
            {/* Download Card PNG */}
            <button
              onClick={handleDownloadCard}
              disabled={isDownloading}
              className="flex-1 min-w-0 h-10 sm:h-11 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95 truncate"
            >
              {isDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="truncate">Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Download Card</span>
                </>
              )}
            </button>

            {/* Native Share (Fixed width: w-20 sm:w-22 shrink-0) */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-20 sm:w-22 shrink-0 h-10 sm:h-11 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Share via device"
            >
              {isSharing ? (
                <div className="w-3.5 h-3.5 border-2 border-neutral-200 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span>Share</span>
            </button>

            {/* Copy Link (Fixed width: w-20 sm:w-22 shrink-0 so Copy -> Copied never resizes anything) */}
            <button
              onClick={handleCopy}
              className="w-20 sm:w-22 shrink-0 h-10 sm:h-11 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Copy Secret Link"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}