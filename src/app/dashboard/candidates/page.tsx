"use client"

import { useState, useEffect } from "react"
import { Search, UserCircle2, Mail, Phone, CalendarDays } from "lucide-react"
import { useRouter } from "next/navigation"
import { TableSkeleton } from "@/components/Skeleton"
import { Pagination } from "@/components/Pagination"

export default function CandidatesPage() {

    type AppData = { id: string, status: string, vacancy?: { title: string } }
    type CandidateData = { id: string, firstName: string, lastName: string, email?: string, phone?: string, createdAt: string, applications: AppData[] }
    const [candidates, setCandidates] = useState<CandidateData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const router = useRouter()

    useEffect(() => {
        fetchCandidates(currentPage)
    }, [currentPage])

    const fetchCandidates = async (page: number) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/candidates?page=${page}&limit=10`)
            if (res.ok) {
                const json = await res.json()
                setCandidates(json.data)
                setTotalPages(json.meta.totalPages)
            } else {
                setError("Failed to load candidates")
            }
        } catch {
            setError("Request failed")
        } finally {
            setLoading(false)
        }
    }

    // Client-side search filter
    const filteredCandidates = candidates.filter(candidate => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            candidate.firstName?.toLowerCase().includes(query) ||
            candidate.lastName?.toLowerCase().includes(query) ||
            candidate.email?.toLowerCase().includes(query) ||
            candidate.phone?.includes(query)
        )
    })

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Кандидаты</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Список всех соискателей в вашей организации и история откликов.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            name="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-lg border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all"
                            placeholder="Поиск по имени, email, телефону..."
                        />
                    </div>
                </div>
            </div>

            {error && <div className="mt-4 text-red-600 bg-red-50 p-4 rounded-lg text-sm">{error}</div>}

            <div className="premium-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 border-b border-slate-200 uppercase text-xs font-semibold text-slate-500 tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left">
                                    Кандидат
                                </th>
                                <th scope="col" className="px-6 py-4 text-left">
                                    Контакты
                                </th>
                                <th scope="col" className="px-6 py-4 text-left">
                                    История откликов
                                </th>
                                <th scope="col" className="px-6 py-4 text-left">
                                    Добавлен
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <TableSkeleton columns={4} rows={4} />
                            ) : filteredCandidates.map((candidate) => (
                                <tr
                                    key={candidate.id}
                                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/candidates/${candidate.id}`)}
                                >
                                    <td className="whitespace-nowrap px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                                <UserCircle2 className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">
                                                    {candidate.firstName} {candidate.lastName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                            {candidate.email || '—'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                            {candidate.phone || '—'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-slate-500 max-w-xs">
                                        {candidate.applications?.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {candidate.applications.map((app: AppData) => (
                                                    <span key={app.id} className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium text-slate-900 ring-1 ring-inset ring-slate-200 bg-white shadow-sm">
                                                        <span className={`h-1.5 w-1.5 rounded-full ${app.status === 'HIRED' ? 'bg-emerald-500' : app.status === 'REJECTED' ? 'bg-red-500' : 'bg-indigo-500'}`}></span>
                                                        {app.vacancy?.title}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">Резерв (нет активных откликов)</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-slate-400" />
                                            {new Date(candidate.createdAt).toLocaleDateString('ru-RU')}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCandidates.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                                        <UserCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        <p>{searchQuery ? "Ничего не найдено по вашему запросу." : "База кандидатов пуста."}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && filteredCandidates.length > 0 && (
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
