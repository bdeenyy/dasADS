"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ToastProvider"

export default function NewUserForm() {
    const router = useRouter()
    const { showToast } = useToast()

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "RECRUITER",
    })

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError("")

        if (formData.password.length < 6) {
            setError("Пароль должен содержать минимум 6 символов.")
            setSaving(false)
            return
        }

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const errorText = await res.text()
                throw new Error(errorText || "Ошибка при создании пользователя")
            }

            showToast("Сотрудник успешно добавлен", "success")
            router.push("/dashboard/users")
            router.refresh()
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
                showToast(err.message, "error")
            } else {
                setError(String(err))
                showToast(String(err), "error")
            }
            setSaving(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Новый Сотрудник
                    </h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                <div className="px-4 py-6 sm:p-8">
                    <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

                        <div className="sm:col-span-4">
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                Имя
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

                        <div className="sm:col-span-4">
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email / Логин
                            </label>
                            <div className="mt-2">
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                Пароль (временный)
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="password"
                                    id="password"
                                    required
                                    placeholder="Минимум 6 символов"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="role" className="block text-sm font-medium leading-6 text-gray-900">Роль в системе</label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                            >
                                <option value="RECRUITER">Рекрутер (Только свои данные)</option>
                                <option value="MANAGER">Менеджер (Все данные организации)</option>
                                <option value="MASTER">Мастер (Доступ к управлению)</option>
                            </select>
                        </div>

                    </div>
                </div>

                {error && <div className="px-4 py-2 text-sm text-red-600 bg-red-50">{error}</div>}

                <div className="flex items-center justify-end border-t border-gray-900/10 px-4 py-4 sm:px-8 gap-x-6">
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/users")}
                        className="text-sm font-semibold leading-6 text-gray-900"
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        Создать сотрудника
                    </button>
                </div>
            </form>
        </div>
    )
}
