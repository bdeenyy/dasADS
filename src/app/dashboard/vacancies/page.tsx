"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, BriefcaseBusiness, Building2, Banknote } from "lucide-react"
import { TableSkeleton } from "@/components/Skeleton"
import { Pagination } from "@/components/Pagination"

type Vacancy = {
    id: string
    title: string
    status: string
    salaryMin: number | null
    salaryMax: number | null
    avitoStatus: string | null
    avitoId: number | null
    customer: {
        name: string
    }
}

export default function VacanciesPage() {
    const router = useRouter()
    const [vacancies, setVacancies] = useState<Vacancy[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchVacancies(currentPage)
    }, [currentPage])

    const fetchVacancies = async (page: number) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/vacancies?page=${page}&limit=10`)
            if (res.ok) {
                const json = await res.json()
                setVacancies(json.data)
                setTotalPages(json.meta.totalPages)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Вакансии</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Список всех открытых и закрытых вакансий вашей организации.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/vacancies/new")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <Plus className="w-4 h-4" />
                        Создать вакансию
                    </button>
                </div>
            </div>

            <div className="premium-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 border-b border-slate-200 uppercase text-xs font-semibold text-slate-500 tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left">
                                    Название
                                </th>
                                <th scope="col" className="px-6 py-4 text-left">
                                    Заказчик
                                </th>
                                <th scope="col" className="px-6 py-4 text-left">
                                    Условия (ЗП)
                                </th>
                                <th scope="col" className="px-6 py-4 text-left">
                                    Статус
                                </th>
                                <th scope="col" className="px-6 py-4 text-left">
                                    Авито
                                </th>
                                <th scope="col" className="relative px-6 py-4">
                                    <span className="sr-only">Действия</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <TableSkeleton columns={6} rows={4} />
                            ) : vacancies.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                                        <BriefcaseBusiness className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        <p>У вас пока нет ни одной вакансии.</p>
                                    </td>
                                </tr>
                            ) : (
                                vacancies.map((vacancy) => (
                                    <tr key={vacancy.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="whitespace-nowrap px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                                    <BriefcaseBusiness className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 text-sm">
                                                        {vacancy.title}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                        ID: {vacancy.id.split('-')[0]}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-5">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                {vacancy.customer?.name || "Внутренняя"}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-5">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                <Banknote className="w-4 h-4 text-green-500" />
                                                {vacancy.salaryMin && vacancy.salaryMax
                                                    ? `от ${vacancy.salaryMin} до ${vacancy.salaryMax} ₽`
                                                    : vacancy.salaryMin
                                                        ? `от ${vacancy.salaryMin} ₽`
                                                        : vacancy.salaryMax
                                                            ? `до ${vacancy.salaryMax} ₽`
                                                            : "По договоренности"}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border
                                                ${vacancy.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    vacancy.status === 'DRAFT' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                                        vacancy.status === 'CLOSED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${vacancy.status === 'ACTIVE' ? 'bg-green-500' : vacancy.status === 'DRAFT' ? 'bg-slate-400' : vacancy.status === 'CLOSED' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                                {vacancy.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-5">
                                            {vacancy.avitoStatus === 'PUBLISHED' ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    Авито #{vacancy.avitoId}
                                                </span>
                                            ) : vacancy.avitoStatus === 'ERROR' ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                                    Ошибка
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-medium">
                                            <button
                                                onClick={() => router.push(`/dashboard/vacancies/${vacancy.id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                Настроить
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && vacancies.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
        </div>
    )
}
