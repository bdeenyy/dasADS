import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const COLUMNS = [
    { id: "NEW", title: "Новые" },
    { id: "SCREENING", title: "Скрининг" },
    { id: "INTERVIEW", title: "Интервью" },
    { id: "OFFER", title: "Оффер" },
    { id: "HIRED", title: "Нанят" },
    { id: "REJECTED", title: "Отказ" },
]

export default function KanbanBoard({ vacancyId }: { vacancyId: string }) {
    const router = useRouter()
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        fetchApplications()
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
        } catch (err) {
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
        } catch (err) {
            fetchApplications()
        }
    }

    if (loading) return <div>Загрузка кандидатов...</div>
    if (error) return <div className="text-red-500">{error}</div>

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {COLUMNS.map(column => {
                const columnApps = applications.filter(app => app.status === column.id)
                return (
                    <div key={column.id} className="bg-gray-50 flex-none w-72 rounded-lg p-3 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{column.title}</h3>
                            <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full">{columnApps.length}</span>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto min-h-[50px]">
                            {columnApps.map(app => (
                                <div key={app.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="font-medium text-gray-900 border-b pb-1 mb-2">
                                        {app.candidate.firstName} {app.candidate.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mb-2">
                                        {app.candidate.email || app.candidate.phone || "Нет контактов"}
                                    </div>
                                    <div className="flex justify-between mt-2 pt-2 border-t text-xs">
                                        {column.id !== "NEW" && (
                                            <button
                                                onClick={() => moveApplication(app.id, COLUMNS[COLUMNS.findIndex(c => c.id === column.id) - 1].id)}
                                                className="text-gray-400 hover:text-indigo-600"
                                            >
                                                &larr; Назад
                                            </button>
                                        )}
                                        {column.id !== "REJECTED" && column.id !== "HIRED" && (
                                            <button
                                                onClick={() => moveApplication(app.id, COLUMNS[COLUMNS.findIndex(c => c.id === column.id) + 1].id)}
                                                className="text-gray-400 hover:text-indigo-600 ml-auto"
                                            >
                                                Дальше &rarr;
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {columnApps.length === 0 && (
                                <div className="text-center text-sm text-gray-400 py-4 italic">
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
