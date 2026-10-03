"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

type ToastListener = (toast: Omit<ToastItem, "id">) => void;
let globalListener: ToastListener | null = null;

export const toast = {
    show: (message: string, type: ToastType = "info", duration = 4000) => {
        if (globalListener) {
            globalListener({ message, type, duration });
        }
    },
    error: (message: string, duration = 4500) => toast.show(message, "error", duration),
    success: (message: string, duration = 3500) => toast.show(message, "success", duration),
    warning: (message: string, duration = 4000) => toast.show(message, "warning", duration),
    info: (message: string, duration = 3500) => toast.show(message, "info", duration),
};

const ToastContext = createContext<{ toast: typeof toast }>({ toast });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback(({ message, type, duration }: Omit<ToastItem, "id">) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev.slice(-3), { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        globalListener = addToast;
        return () => {
            globalListener = null;
        };
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast Viewport */}
            <div
                aria-live="polite"
                className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2.5 w-[calc(100%-1.5rem)] max-w-md pointer-events-none"
            >
                {toasts.map((item) => (
                    <ToastCard key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onDismiss, 200);
        }, item.duration);

        return () => clearTimeout(timer);
    }, [item.duration, onDismiss]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 200);
    };

    const config = {
        error: {
            border: "border-red-500/60",
            bg: "bg-neutral-950/95 shadow-[0_10px_35px_rgba(239,68,68,0.2)]",
            text: "text-red-200",
            icon: <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
            bar: "bg-red-500",
        },
        success: {
            border: "border-emerald-500/60",
            bg: "bg-neutral-950/95 shadow-[0_10px_35px_rgba(16,185,129,0.2)]",
            text: "text-emerald-200",
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
            bar: "bg-emerald-500",
        },
        warning: {
            border: "border-amber-500/60",
            bg: "bg-neutral-950/95 shadow-[0_10px_35px_rgba(245,158,11,0.2)]",
            text: "text-amber-200",
            icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
            bar: "bg-amber-500",
        },
        info: {
            border: "border-cyan-500/60",
            bg: "bg-neutral-950/95 shadow-[0_10px_35px_rgba(6,182,212,0.2)]",
            text: "text-neutral-200",
            icon: <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />,
            bar: "bg-cyan-500",
        },
    }[item.type];

    return (
        <div
            role="alert"
            className={`pointer-events-auto relative w-full flex flex-col overflow-hidden rounded-xl border backdrop-blur-xl ${config.border} ${config.bg} transition-all duration-200 font-mono shadow-2xl ${isExiting
                    ? "opacity-0 -translate-y-2 scale-95"
                    : "opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-3"
                }`}
        >
            <div className="flex items-start gap-3 p-3.5 pr-2.5">
                {config.icon}
                <div className={`flex-1 text-xs leading-relaxed ${config.text}`}>
                    {item.message}
                </div>
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800/80 transition cursor-pointer shrink-0"
                    title="Dismiss notification"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Progress countdown bar */}
            <div className="h-0.5 w-full bg-neutral-900/60 overflow-hidden">
                <div
                    className={`h-full ${config.bar} transition-all ease-linear`}
                    style={{
                        animation: `shrinkWidth ${item.duration}ms linear forwards`,
                    }}
                />
            </div>
        </div>
    );
}
