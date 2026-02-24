"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: "",
        avitoClientId: "",
        avitoClientSecret: "",
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: "", text: "" })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/settings/organization")
                if (res.ok) {
                    const data = await res.json()
                    setFormData({
                        name: data.name || "",
                        avitoClientId: data.avitoClientId || "",
                        avitoClientSecret: data.avitoClientSecret || "",
                    })
                } else {
                    if (res.status === 401) {
                        router.push('/dashboard')
                    } else {
                        setMessage({ type: "error", text: "Failed to load settings" })
                    }
                }
            } catch {
                setMessage({ type: "error", text: "Error loading data" })
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage({ type: "", text: "" })

        try {
            const res = await fetch("/api/settings/organization", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                throw new Error("Failed to save settings")
            }

            setMessage({ type: "success", text: "Настройки успешно сохранены!" })
            router.refresh()
        } catch (err: unknown) {
            if (err instanceof Error) {
                setMessage({ type: "error", text: err.message })
            } else {
                setMessage({ type: "error", text: String(err) })
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8">Загрузка настроек...</div>

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Настройки Организации
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Управление базовыми данными и интеграциями вашей компании. Доступно только для роли MASTER.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                <div className="px-4 py-6 sm:p-8">
                    <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

                        <div className="sm:col-span-6">
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                Название компании (Организации) *
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-6 border-t border-gray-200 pt-6 mt-2">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Интеграция с Авито (API Credentials)</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Для автоматической публикации вакансий укажите Client ID и Client Secret из кабинета разработчика Авито. Эти ключи будут использоваться в изолированном контексте вашей организации.
                            </p>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                                <div className="sm:col-span-6">
                                    <label htmlFor="avitoClientId" className="block text-sm font-medium leading-6 text-gray-900">
                                        Avito Client ID
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="avitoClientId"
                                            id="avitoClientId"
                                            value={formData.avitoClientId}
                                            onChange={(e) => setFormData({ ...formData, avitoClientId: e.target.value })}
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="avitoClientSecret" className="block text-sm font-medium leading-6 text-gray-900">
                                        Avito Client Secret
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            type="password"
                                            name="avitoClientSecret"
                                            id="avitoClientSecret"
                                            value={formData.avitoClientSecret}
                                            onChange={(e) => setFormData({ ...formData, avitoClientSecret: e.target.value })}
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {message.text && (
                    <div className={`px-4 py-3 text-sm border-t ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex items-center justify-end border-t border-gray-900/10 px-4 py-4 sm:px-8">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {saving ? "Сохранение..." : "Сохранить"}
                    </button>
                </div>
            </form>

            {/* Password Change Section */}
            <PasswordChangeForm />
        </div>
    )
}

function PasswordChangeForm() {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string }>({ type: 'error', text: '' })

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage({ type: 'error', text: '' })

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Пароли не совпадают' })
            return
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Новый пароль должен быть не менее 6 символов' })
            return
        }

        setSaving(true)
        try {
            const res = await fetch("/api/users/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            })

            if (!res.ok) {
                const text = await res.text()
                throw new Error(text)
            }

            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setMessage({ type: 'success', text: 'Пароль успешно изменён' })
        } catch (err: unknown) {
            if (err instanceof Error) setMessage({ type: 'error', text: err.message })
            else setMessage({ type: 'error', text: String(err) })
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleChangePassword} className="mt-8 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
            <div className="px-4 py-6 sm:p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Смена пароля</h3>
                <div className="grid max-w-md grid-cols-1 gap-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Текущий пароль</label>
                        <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Новый пароль</label>
                        <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Минимум 6 символов"
                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Подтверждение пароля</label>
                        <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" />
                    </div>
                </div>
            </div>

            {message.text && (
                <div className={`px-4 py-3 text-sm border-t ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex items-center justify-end border-t border-gray-900/10 px-4 py-4 sm:px-8">
                <button type="submit" disabled={saving}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
                    {saving ? "Сохранение..." : "Сменить пароль"}
                </button>
            </div>
        </form>
    )
}
