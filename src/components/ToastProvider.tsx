"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { CheckCircle, AlertCircle, X } from "lucide-react"

export type ToastType = "success" | "error"

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, message, type }])

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3000)
    }, [])

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-0 right-0 p-6 z-50 flex flex-col gap-3 pointer-events-none w-full sm:w-auto">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center justify-between gap-4 w-full sm:w-80 p-4 rounded-xl shadow-lg border transition-all duration-300 animate-in slide-in-from-right-8 fade-in ${toast.type === "success"
                                ? "bg-emerald-50 text-emerald-900 border-emerald-100"
                                : "bg-red-50 text-red-900 border-red-100"
                            }`}
                        role="alert"
                    >
                        <div className="flex items-center gap-3">
                            {toast.type === "success" ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            )}
                            <p className="text-sm font-medium">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className={`p-1 rounded-md transition-colors ${toast.type === "success"
                                    ? "hover:bg-emerald-100 text-emerald-600"
                                    : "hover:bg-red-100 text-red-600"
                                }`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}
