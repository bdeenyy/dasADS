"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"

export default function CustomerForm({ params }: { params: Promise<{ customerId: string }> }) {
    const router = useRouter()
    const { customerId } = use(params)
    const isNew = customerId === "new"

    const [formData, setFormData] = useState({
        name: "",
        inn: "",
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
    })
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!isNew) {
            const fetchCustomer = async () => {
                try {
                    const res = await fetch(`/api/customers`)
                    if (res.ok) {
                        const data = await res.json()
                        const current = data.find((c: any) => c.id === customerId)
                        if (current) {
                            setFormData({
                                name: current.name || "",
                                inn: current.inn || "",
                                contactPerson: current.contactPerson || "",
                                contactEmail: current.contactEmail || "",
                                contactPhone: current.contactPhone || "",
                            })
                        } else {
                            setError("Customer not found")
                        }
                    }
                } catch (err) {
                    setError("Failed to load customer data")
                } finally {
                    setLoading(false)
                }
            }
            fetchCustomer()
        }
    }, [isNew, customerId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError("")

        try {
            const url = isNew ? "/api/customers" : `/api/customers/${customerId}`
            const method = isNew ? "POST" : "PUT"

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                throw new Error("Failed to save customer")
            }

            router.push("/dashboard/customers")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Вы уверены, что хотите удалить этого заказчика?")) return

        setSaving(true)
        try {
            const res = await fetch(`/api/customers/${customerId}`, {
                method: "DELETE",
            })

            if (!res.ok) throw new Error("Failed to delete")

            router.push("/dashboard/customers")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setSaving(false)
        }
    }

    if (loading) return <div>Загрузка...</div>

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        {isNew ? "Новый Заказчик" : "Редактирование Заказчика"}
                    </h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                <div className="px-4 py-6 sm:p-8">
                    <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

                        <div className="sm:col-span-4">
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                Название компании *
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="inn" className="block text-sm font-medium leading-6 text-gray-900">
                                ИНН
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="inn"
                                    id="inn"
                                    value={formData.inn}
                                    onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <label htmlFor="contactPerson" className="block text-sm font-medium leading-6 text-gray-900">
                                Контактное лицо
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="contactPerson"
                                    id="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="contactEmail" className="block text-sm font-medium leading-6 text-gray-900">
                                Email контакта
                            </label>
                            <div className="mt-2">
                                <input
                                    type="email"
                                    name="contactEmail"
                                    id="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="contactPhone" className="block text-sm font-medium leading-6 text-gray-900">
                                Телефон контакта
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="contactPhone"
                                    id="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {error && <div className="px-4 py-2 text-sm text-red-600 bg-red-50">{error}</div>}

                <div className="flex items-center justify-between border-t border-gray-900/10 px-4 py-4 sm:px-8">
                    <div>
                        {!isNew && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={saving}
                                className="text-sm font-semibold leading-6 text-red-600 hover:text-red-500 disabled:opacity-50"
                            >
                                Удалить Заказчика
                            </button>
                        )}
                    </div>
                    <div className="flex items-center justify-end gap-x-6">
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard/customers")}
                            className="text-sm font-semibold leading-6 text-gray-900"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
