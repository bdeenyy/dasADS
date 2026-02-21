"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CandidatesPage() {
    const router = useRouter()
    const [candidates, setCandidates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        fetchCandidates()
    }, [])

    const fetchCandidates = async () => {
        try {
            const res = await fetch("/api/candidates")
            if (res.ok) {
                const data = await res.json()
                setCandidates(data)
            } else {
                setError("Failed to load candidates")
            }
        } catch (err) {
            setError("Request failed")
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-gray-500">Загрузка кандидатов...</div>

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">Кандидаты</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Список всех соискателей вашей организации и их отклики.
                    </p>
                </div>
            </div>

            {error && <div className="mt-4 text-red-600 bg-red-50 p-4 rounded-md text-sm">{error}</div>}

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            Имя
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Контакты
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Отклики
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Дата добавления
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {candidates.map((candidate) => (
                                        <tr key={candidate.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                {candidate.firstName} {candidate.lastName}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div>{candidate.email}</div>
                                                <div>{candidate.phone}</div>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-gray-500">
                                                {candidate.applications?.length > 0 ? (
                                                    <ul className="list-disc pl-4">
                                                        {candidate.applications.map((app: any) => (
                                                            <li key={app.id}>
                                                                {app.vacancy?.title}
                                                                <span className="ml-2 text-xs text-gray-400">({app.status})</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-gray-400">Нет откликов</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {new Date(candidate.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {candidates.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                                                Пока нет ни одного кандидата
                                            </td>
                                        </tr>
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
