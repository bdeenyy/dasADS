"use client"

import { useState, useEffect } from "react"
import { Activity as ActivityIcon, User, Briefcase, Building2, CalendarDays } from "lucide-react"

type ActivityData = {
    id: string
    type: string
    details: string | null
    createdAt: string
    user: { name: string | null; email: string }
    candidate?: { firstName: string; lastName: string | null } | null
    vacancy?: { title: string } | null
}

export default function ActivityPage() {
    const [activities, setActivities] = useState<ActivityData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await fetch("/api/activities")
                if (res.ok) {
                    const data = await res.json()
                    setActivities(data)
                }
            } catch (error) {
                console.error("Failed to load activities", error)
            } finally {
                setLoading(false)
            }
        }
        fetchActivities()
    }, [])

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "CANDIDATE_CREATED":
                return <User className="w-4 h-4 text-emerald-600" />
            case "STATUS_CHANGE":
                return <Briefcase className="w-4 h-4 text-indigo-600" />
            default:
                return <ActivityIcon className="w-4 h-4 text-slate-500" />
        }
    }

    const getActivityBg = (type: string) => {
        switch (type) {
            case "CANDIDATE_CREATED":
                return "bg-emerald-50"
            case "STATUS_CHANGE":
                return "bg-indigo-50"
            default:
                return "bg-slate-50"
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <ActivityIcon className="w-6 h-6 text-indigo-600" />
                    Лента активности
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Последние действия в вашей организации.
                </p>
            </div>

            <div className="premium-card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-sm text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
                        Загрузка активности...
                    </div>
                ) : activities.length === 0 ? (
                    <div className="p-12 text-center text-sm text-slate-500">
                        <ActivityIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <p>Пока нет записей активности.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                <div className={`mt-0.5 p-2 rounded-lg ${getActivityBg(activity.type)}`}>
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-900">
                                        {activity.details || activity.type}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {activity.user.name || activity.user.email}
                                        </span>
                                        {activity.vacancy && (
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-3 h-3" />
                                                {activity.vacancy.title}
                                            </span>
                                        )}
                                        {activity.candidate && (
                                            <span className="flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {activity.candidate.firstName} {activity.candidate.lastName}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="w-3 h-3" />
                                            {new Date(activity.createdAt).toLocaleString('ru-RU')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
