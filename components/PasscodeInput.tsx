"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasscodeInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    hasError?: boolean;
    autoFocus?: boolean;
    shake?: boolean;
}

export function PasscodeInput({ value, onChange, disabled, hasError, autoFocus, shake }: PasscodeInputProps) {

    const [showPasscode, setShowPasscode] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus])

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const rawVal = e.target.value.replace(/\D/g, "");
        if (!rawVal) {
            const newDigit = [...digits];
            newDigit[index] = "";
            onChange(newDigit.join(""));
            return;
        }

        const chars = rawVal.split("");
        const newDigit = [...digits];
        for (let i = 0; i < chars.length && index + i < 6; i++) {
            newDigit[index + i] = chars[i];
        }
        const result = newDigit.join("").slice(0, 6);
        onChange(result);

        const nextIndex = Math.min(index + chars.length, 5);
        inputRefs.current[nextIndex]?.focus();
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (!digits[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        onChange(pasted);
        const targetIdx = Math.min(pasted.length, 5);
        inputRefs.current[targetIdx]?.focus();
    };

    return (
        <div className={`flex flex-col items-center gap-3 ${shake ? "animate-shake" : ""}`}>
            <div className="flex items-center gap-2 sm:gap-2.5">
                {Array.from({ length: 6 }).map((_, index) => {
                    const isFilled = Boolean(digits[index]);
                    return (
                        <input
                            key={index}
                            ref={(el) => {
                                inputRefs.current[index] = el;
                            }}
                            type={showPasscode ? "text" : "password"}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            disabled={disabled}
                            value={digits[index]}
                            onChange={(e) => handleChange(index, e)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold rounded-xl bg-neutral-950 transition-all focus:outline-none select-none ${hasError
                                ? "border border-red-500/80 text-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
                                : isFilled
                                    ? "border border-emerald-500/80 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                                    : "border border-neutral-800 text-neutral-100 hover:border-neutral-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                }`}
                        />
                    );
                })}
                {/* Show/Hide Toggle Button */}
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="p-2 sm:p-2.5 text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl transition cursor-pointer shrink-0"
                    title={showPasscode ? "Hide PIN" : "Show PIN"}
                >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
