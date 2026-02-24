import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Briefcase, Users, Building2, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        Добро пожаловать в {session.user.organizationName}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Вот что происходит с вашими вакансиями и кандидатами сегодня.
                    </p>
                </div>
                {session.user.role === 'MASTER' && (
                    <Link
                        href="/dashboard/settings"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Настройки системы
                    </Link>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="premium-card p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Активные Вакансии</p>
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-900">12</p>
                        <span className="text-xs font-medium text-green-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +2</span>
                    </div>
                </div>

                <div className="premium-card p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Новые Кандидаты</p>
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-900">48</p>
                        <span className="text-xs font-medium text-green-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12%</span>
                    </div>
                </div>

                <div className="premium-card p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Собеседования</p>
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <Users className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-900">8</p>
                        <span className="text-xs font-medium text-slate-500">на этой неделе</span>
                    </div>
                </div>

                <div className="premium-card p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Заказчики</p>
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-900">5</p>
                    </div>
                </div>
            </div>

        </div>
    )
}
