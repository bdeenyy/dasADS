"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Mail, Phone, Link2, Briefcase, CalendarDays, ArrowLeft } from "lucide-react"
import Link from "next/link"

type ApplicationData = {
    id: string
    status: string
    vacancy: { id: string; title: string; status: string }
    updatedAt: string
}

type ActivityData = {
    id: string
    type: string
    details: string | null
    createdAt: string
    user: { name: string | null; email: string }
    vacancy?: { title: string } | null
}

type CandidateDetail = {
    id: string
    firstName: string
    lastName: string | null
    email: string | null
    phone: string | null
    resumeLink: string | null
    createdAt: string
    applications: ApplicationData[]
    activities: ActivityData[]
}

export default function CandidateDetailPage({ params }: { params: Promise<{ candidateId: string }> }) {
    const router = useRouter()
    const { candidateId } = use(params)

    const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", phone: "", resumeLink: ""
    })

    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const res = await fetch(`/api/candidates/${candidateId}`)
                if (res.ok) {
                    const data = await res.json()
                    setCandidate(data)
                    setFormData({
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        email: data.email || "",
                        phone: data.phone || "",
                        resumeLink: data.resumeLink || "",
                    })
                } else {
                    setError("Кандидат не найден")
                }
            } catch {
                setError("Ошибка загрузки данных")
            } finally {
                setLoading(false)
            }
        }
        fetchCandidate()
    }, [candidateId])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError("")
        try {
            const res = await fetch(`/api/candidates/${candidateId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            if (!res.ok) throw new Error("Ошибка сохранения")
            const updated = await res.json()
            setCandidate(prev => prev ? { ...prev, ...updated } : prev)
            setEditing(false)
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
            else setError(String(err))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Удалить кандидата? Это действие нельзя отменить.")) return
        try {
            const res = await fetch(`/api/candidates/${candidateId}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Ошибка удаления")
            router.push("/dashboard/candidates")
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
            else setError(String(err))
        }
    }

    if (loading) return (
        <div className="p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
        </div>
    )

    if (error && !candidate) return (
        <div className="p-8 text-center text-red-600">{error}</div>
    )

    if (!candidate) return null

    const statusColors: Record<string, string> = {
        NEW: "bg-blue-50 text-blue-700 ring-blue-200",
        SCREENING: "bg-yellow-50 text-yellow-700 ring-yellow-200",
        INTERVIEW: "bg-purple-50 text-purple-700 ring-purple-200",
        OFFER: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        HIRED: "bg-green-50 text-green-700 ring-green-200",
        REJECTED: "bg-red-50 text-red-700 ring-red-200",
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/dashboard/candidates" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Назад к списку
            </Link>

            {/* Header */}
            <div className="premium-card p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                            {candidate.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {candidate.firstName} {candidate.lastName}
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Добавлен {new Date(candidate.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setEditing(!editing)}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                            {editing ? "Отмена" : "Редактировать"}
                        </button>
                        <button
                            onClick={handleDelete}
                            className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 ring-1 ring-red-200"
                        >
                            Удалить
                        </button>
                    </div>
                </div>

                {error && <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

                {editing ? (
                    <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Имя *</label>
                            <input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Фамилия</label>
                            <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Телефон</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Ссылка на резюме</label>
                            <input type="url" value={formData.resumeLink} onChange={e => setFormData({ ...formData, resumeLink: e.target.value })}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" />
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                            <button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                                {saving ? "Сохранение..." : "Сохранить"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {candidate.email || "—"}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {candidate.phone || "—"}
                        </div>
                        {candidate.resumeLink && (
                            <a href={candidate.resumeLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                                <Link2 className="w-4 h-4" /> Резюме
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Applications */}
            <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" /> Отклики на вакансии
                </h2>
                {candidate.applications.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Нет откликов</p>
                ) : (
                    <div className="space-y-3">
                        {candidate.applications.map(app => (
                            <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <Link href={`/dashboard/vacancies/${app.vacancy.id}`} className="text-sm font-medium text-slate-900 hover:text-indigo-600">
                                        {app.vacancy.title}
                                    </Link>
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[app.status] || "bg-gray-50 text-gray-700 ring-gray-200"}`}>
                                    {app.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Activity History */}
            <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-indigo-600" /> История действий
                </h2>
                {candidate.activities.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Нет записей</p>
                ) : (
                    <div className="space-y-3">
                        {candidate.activities.map(act => (
                            <div key={act.id} className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                <div>
                                    <p className="text-slate-700">{act.details || act.type}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {act.user.name || act.user.email} · {new Date(act.createdAt).toLocaleString('ru-RU')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
