import { useState, useEffect } from "react"
// Removed unused router
import { ChevronRight, ChevronLeft, MoreHorizontal, UserCircle2 } from "lucide-react"

const COLUMNS = [
    { id: "NEW", title: "Новые" },
    { id: "SCREENING", title: "Скрининг" },
    { id: "INTERVIEW", title: "Интервью" },
    { id: "OFFER", title: "Оффер" },
    { id: "HIRED", title: "Нанят" },
    { id: "REJECTED", title: "Отказ" },
]

export type CandidateData = { firstName: string, lastName?: string, email?: string, phone?: string };
export type ApplicationData = { id: string, status: string, candidate: CandidateData };

export default function KanbanBoard({ vacancyId }: { vacancyId: string }) {
    // Removed router
    const [applications, setApplications] = useState<ApplicationData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        fetchApplications()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vacancyId])

    const fetchApplications = async () => {
        try {
            const res = await fetch(`/api/applications?vacancyId=${vacancyId}`)
            if (res.ok) {
                const data = await res.json()
                setApplications(data)
            } else {
                setError("Failed to load applications")
            }
        } catch {
            setError("Error fetching applications")
        } finally {
            setLoading(false)
        }
    }

    const moveApplication = async (applicationId: string, newStatus: string) => {
        try {
            // Optimistic update
            setApplications(prev => prev.map(app =>
                app.id === applicationId ? { ...app, status: newStatus } : app
            ))

            const res = await fetch(`/api/applications`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ applicationId, status: newStatus })
            })

            if (!res.ok) {
                // Revert on failure
                fetchApplications()
            }
        } catch {
            fetchApplications()
        }
    }

    if (loading) return <div>Загрузка кандидатов...</div>
    if (error) return <div className="text-red-500">{error}</div>

    return (
        <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar px-2 pt-2">
            {COLUMNS.map(column => {
                const columnApps = applications.filter(app => app.status === column.id)
                return (
                    <div key={column.id} className="bg-slate-100/50 flex-none w-[320px] rounded-2xl p-4 border border-slate-200/60 flex flex-col backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-semibold text-slate-800 text-sm">{column.title}</h3>
                            <span className="bg-white text-slate-500 text-xs py-1 px-2.5 rounded-full shadow-sm ring-1 ring-slate-200">
                                {columnApps.length}
                            </span>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto min-h-[100px] custom-scrollbar pr-1">
                            {columnApps.map(app => (
                                <div key={app.id} className="premium-card p-4 group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <UserCircle2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-slate-900 text-sm">
                                                    {app.candidate.firstName} {app.candidate.lastName}
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]">
                                                    {app.candidate.email || app.candidate.phone || "Нет контактов"}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                                        {column.id !== "NEW" ? (
                                            <button
                                                onClick={() => moveApplication(app.id, COLUMNS[COLUMNS.findIndex(c => c.id === column.id) - 1].id)}
                                                className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-medium transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Назад
                                            </button>
                                        ) : <div></div>}

                                        {column.id !== "REJECTED" && column.id !== "HIRED" && (
                                            <button
                                                onClick={() => moveApplication(app.id, COLUMNS[COLUMNS.findIndex(c => c.id === column.id) + 1].id)}
                                                className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-medium transition-colors ml-auto"
                                            >
                                                Дальше
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {columnApps.length === 0 && (
                                <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 italic">
                                    Нет кандидатов
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
