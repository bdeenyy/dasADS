"use client"

import React from "react"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-md bg-slate-200/60 ${className}`}
            {...props}
        />
    )
}

export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number, rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                    {Array.from({ length: columns }).map((_, j) => (
                        <td key={j} className="whitespace-nowrap px-6 py-5">
                            <Skeleton className="h-4 w-3/4" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    )
}

export function CardSkeleton() {
    return (
        <div className="premium-card p-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
            </div>
        </div>
    )
}
