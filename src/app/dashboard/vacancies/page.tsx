"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Vacancy = {
    id: string
    title: string
    status: string
    salaryMin: number | null
    salaryMax: number | null
    customer: {
        name: string
    }
}

export default function VacanciesPage() {
    const router = useRouter()
    const [vacancies, setVacancies] = useState<Vacancy[]>([])
    const [loading, setLoading] = useState(true)

    const fetchVacancies = async () => {
        try {
            const res = await fetch("/api/vacancies")
            if (res.ok) {
                const data = await res.json()
                setVacancies(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVacancies()
    }, [])

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Вакансии</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Список всех открытых и закрытых вакансий вашей организации.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/vacancies/new")}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Создать вакансию
                    </button>
                </div>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            Название
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Заказчик
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Зарплата
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Статус
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Действия</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="py-4 text-center text-sm text-gray-500">Загрузка...</td>
                                        </tr>
                                    ) : vacancies.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-4 text-center text-sm text-gray-500">Вакансии не найдены</td>
                                        </tr>
                                    ) : (
                                        vacancies.map((vacancy) => (
                                            <tr key={vacancy.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    {vacancy.title}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {vacancy.customer?.name || "-"}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {vacancy.salaryMin && vacancy.salaryMax
                                                        ? `от ${vacancy.salaryMin} до ${vacancy.salaryMax}`
                                                        : vacancy.salaryMin
                                                            ? `от ${vacancy.salaryMin}`
                                                            : vacancy.salaryMax
                                                                ? `до ${vacancy.salaryMax}`
                                                                : "Не указана"}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${vacancy.status === 'ACTIVE' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                            vacancy.status === 'DRAFT' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' :
                                                                vacancy.status === 'CLOSED' ? 'bg-red-50 text-red-700 ring-red-600/10' :
                                                                    'bg-blue-50 text-blue-700 ring-blue-700/10'
                                                        }`}>
                                                        {vacancy.status}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/vacancies/${vacancy.id}`)}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
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
                    </div>
                </div>
            </div>
        </div>
    )
}
