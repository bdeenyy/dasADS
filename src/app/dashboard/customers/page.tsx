"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TableSkeleton } from "@/components/Skeleton"
import { Pagination } from "@/components/Pagination"

type Customer = {
    id: string
    name: string
    inn: string | null
    contactPerson: string | null
    contactEmail: string | null
    contactPhone: string | null
}

export default function CustomersPage() {
    const router = useRouter()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchCustomers(currentPage)
    }, [currentPage])

    const fetchCustomers = async (page: number) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/customers?page=${page}&limit=10`)
            if (res.ok) {
                const json = await res.json()
                setCustomers(json.data)
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
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Заказчики</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Список всех компаний-клиентов (Заказчиков) вашей организации.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/customers/new")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Добавить заказчика
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
                                    ИНН
                                </th>
                                <th scope="col" className="px-6 py-4 text-left">
                                    Контактное лицо
                                </th>
                                <th scope="col" className="px-6 py-4 text-left">
                                    Email / Телефон
                                </th>
                                <th scope="col" className="relative px-6 py-4">
                                    <span className="sr-only">Действия</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <TableSkeleton columns={5} rows={3} />
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-sm text-slate-500">
                                        Заказчики не найдены
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-slate-900">
                                            {customer.name}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                                            {customer.inn || "-"}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                                            {customer.contactPerson || "-"}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                                            {customer.contactEmail && <div>{customer.contactEmail}</div>}
                                            {customer.contactPhone && <div className="text-slate-400">{customer.contactPhone}</div>}
                                            {!customer.contactEmail && !customer.contactPhone && "-"}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-medium">
                                            <button
                                                onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                Изменить
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && customers.length > 0 && (
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
