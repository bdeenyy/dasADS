"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import KanbanBoard from "@/components/KanbanBoard"

export default function VacancyForm({ params }: { params: Promise<{ vacancyId: string }> }) {
    const router = useRouter()
    const { vacancyId } = use(params)
    const isNew = vacancyId === "new"

    // Tab state
    const [activeTab, setActiveTab] = useState<"DETAILS" | "CANDIDATES">("DETAILS")

    const [customers, setCustomers] = useState<any[]>([])

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        salaryMin: "",
        salaryMax: "",
        experience: "",
        workFormat: "",
        employmentType: "",
        city: "",
        skills: "",  // Stored as comma separated in form, array in DB
        status: "DRAFT",
        customerId: "",
        avitoConfig: "", // JSON string for config
        publishToAvito: false,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Customers for select dropdown
                const custRes = await fetch('/api/customers')
                if (custRes.ok) {
                    const custData = await custRes.json()
                    setCustomers(custData)
                    if (isNew && custData.length > 0) {
                        setFormData(prev => ({ ...prev, customerId: custData[0].id }))
                    }
                }

                if (!isNew) {
                    const res = await fetch(`/api/vacancies`)
                    if (res.ok) {
                        const data = await res.json()
                        const current = data.find((v: any) => v.id === vacancyId)
                        if (current) {
                            setFormData({
                                title: current.title || "",
                                description: current.description || "",
                                salaryMin: current.salaryMin?.toString() || "",
                                salaryMax: current.salaryMax?.toString() || "",
                                experience: current.experience || "",
                                workFormat: current.workFormat || "",
                                employmentType: current.employmentType || "",
                                city: current.city || "",
                                skills: current.skills?.join(", ") || "",
                                status: current.status || "DRAFT",
                                customerId: current.customerId || "",
                                avitoConfig: current.avitoConfig ? JSON.stringify(current.avitoConfig, null, 2) : "",
                                publishToAvito: false, // Don't auto-publish existing if un-clicking
                            })
                        } else {
                            setError("Vacancy not found")
                        }
                    }
                }
            } catch (err) {
                setError("Failed to load data")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [isNew, vacancyId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError("")

        try {
            if (!formData.customerId) {
                throw new Error("Please select a Customer for this vacancy")
            }

            const url = isNew ? "/api/vacancies" : `/api/vacancies/${vacancyId}`
            const method = isNew ? "POST" : "PUT"

            // Process skills into array
            const skillsArray = formData.skills
                ? formData.skills.split(",").map(s => s.trim()).filter(s => s.length > 0)
                : []

            // Process Avito Config
            let parsedAvitoConfig = null
            if (formData.avitoConfig) {
                try {
                    parsedAvitoConfig = JSON.parse(formData.avitoConfig)
                } catch (e) {
                    throw new Error("Неверный формат JSON в конфигурации Avito")
                }
            }

            const payload = {
                ...formData,
                skills: skillsArray,
                avitoConfig: parsedAvitoConfig
            }

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                throw new Error("Failed to save vacancy")
            }

            router.push("/dashboard/vacancies")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Вы уверены, что хотите удалить эту вакансию?")) return

        setSaving(true)
        try {
            const res = await fetch(`/api/vacancies/${vacancyId}`, {
                method: "DELETE",
            })

            if (!res.ok) throw new Error("Failed to delete")

            router.push("/dashboard/vacancies")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setSaving(false)
        }
    }

    if (loading) return <div>Загрузка...</div>

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        {isNew ? "Новая Вакансия" : `Вакансия: ${formData.title || 'Редактирование'}`}
                    </h2>
                </div>
            </div>

            {!isNew && (
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab("DETAILS")}
                            className={`${activeTab === "DETAILS"
                                ? "border-indigo-500 text-indigo-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                        >
                            Детали вакансии
                        </button>
                        <button
                            onClick={() => setActiveTab("CANDIDATES")}
                            className={`${activeTab === "CANDIDATES"
                                ? "border-indigo-500 text-indigo-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                        >
                            Кандидаты (Воронка)
                        </button>
                    </nav>
                </div>
            )}

            {activeTab === "DETAILS" ? (
                <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                    <div className="px-4 py-6 sm:p-8">
                        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

                            <div className="sm:col-span-6">
                                <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
                                    Название должности (Title) *
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="title"
                                        id="title"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="customerId" className="block text-sm font-medium leading-6 text-gray-900">
                                    Заказчик (Client) *
                                </label>
                                <div className="mt-2">
                                    <select
                                        id="customerId"
                                        name="customerId"
                                        required
                                        value={formData.customerId}
                                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6 px-3"
                                    >
                                        <option value="" disabled>-- Выберите заказчика --</option>
                                        {customers.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="salaryMin" className="block text-sm font-medium leading-6 text-gray-900">
                                    Зарплата От (число)
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="number"
                                        name="salaryMin"
                                        id="salaryMin"
                                        value={formData.salaryMin}
                                        onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="salaryMax" className="block text-sm font-medium leading-6 text-gray-900">
                                    Зарплата До (число)
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="number"
                                        name="salaryMax"
                                        id="salaryMax"
                                        value={formData.salaryMax}
                                        onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="experience" className="block text-sm font-medium leading-6 text-gray-900">Опыт работы</label>
                                <select
                                    id="experience"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                >
                                    <option value="">Не указано</option>
                                    <option value="Без опыта">Без опыта</option>
                                    <option value="1-3 года">1-3 года</option>
                                    <option value="3-6 лет">3-6 лет</option>
                                    <option value="Более 6 лет">Более 6 лет</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="workFormat" className="block text-sm font-medium leading-6 text-gray-900">Формат работы</label>
                                <select
                                    id="workFormat"
                                    value={formData.workFormat}
                                    onChange={(e) => setFormData({ ...formData, workFormat: e.target.value })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                >
                                    <option value="">Не указано</option>
                                    <option value="Офис">Офис</option>
                                    <option value="Удаленная работа">Удаленная работа</option>
                                    <option value="Гибрид">Гибрид</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="employmentType" className="block text-sm font-medium leading-6 text-gray-900">Тип занятости</label>
                                <select
                                    id="employmentType"
                                    value={formData.employmentType}
                                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                >
                                    <option value="">Не указано</option>
                                    <option value="Полная занятость">Полная занятость</option>
                                    <option value="Частичная занятость">Частичная занятость</option>
                                    <option value="Проектная работа">Проектная работа</option>
                                    <option value="Стажировка">Стажировка</option>
                                </select>
                            </div>

                            <div className="sm:col-span-4">
                                <label htmlFor="city" className="block text-sm font-medium leading-6 text-gray-900">
                                    Город / Локация
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="city"
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">Статус вакансии</label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                >
                                    <option value="DRAFT">Черновик (DRAFT)</option>
                                    <option value="ACTIVE">Активна (ACTIVE)</option>
                                    <option value="CLOSED">Закрыта (CLOSED)</option>
                                    <option value="ARCHIVED">В архиве (ARCHIVED)</option>
                                </select>
                            </div>

                            {/* Avito Integration Section */}
                            <div className="sm:col-span-6 border-t border-gray-200 pt-6 mt-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Интеграция с Авито</h3>

                                <div className="relative flex items-start mb-4">
                                    <div className="flex h-6 items-center">
                                        <input
                                            id="publishToAvito"
                                            name="publishToAvito"
                                            type="checkbox"
                                            checked={formData.publishToAvito}
                                            onChange={(e) => setFormData({ ...formData, publishToAvito: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm leading-6">
                                        <label htmlFor="publishToAvito" className="font-medium text-gray-900">
                                            Опубликовать на Avito при сохранении
                                        </label>
                                        <p className="text-gray-500">Автоматически создать или обновить карточку вакансии на платформе Авито.</p>
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="avitoConfig" className="block text-sm font-medium leading-6 text-gray-900 hover:cursor-pointer flex items-center justify-between">
                                        Дополнительные параметры Авито (JSON формат)
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">Сюда можно вставить специфичные настройки по схеме Avito (например, address_details, citizenship_criteria, work_format и т.д.)</p>
                                    <div className="mt-2">
                                        <textarea
                                            id="avitoConfig"
                                            name="avitoConfig"
                                            rows={6}
                                            placeholder='{ "address_details": { "address": "Москва, ул. Пушкина" }, "salary_range": { "salary_min": 50000, "salary_type": "per_month" } }'
                                            value={formData.avitoConfig}
                                            onChange={(e) => setFormData({ ...formData, avitoConfig: e.target.value })}
                                            className="font-mono text-xs block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6 px-3 bg-gray-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="skills" className="block text-sm font-medium leading-6 text-gray-900">
                                    Ключевые навыки (через запятую)
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="skills"
                                        id="skills"
                                        placeholder="Vue.js, Python, PostgreSQL..."
                                        value={formData.skills}
                                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                                    Описание вакансии
                                </label>
                                <div className="mt-2">
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                                    Удалить Вакансию
                                </button>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-x-6">
                            <button
                                type="button"
                                onClick={() => router.push("/dashboard/vacancies")}
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
            ) : (
                <div className="mt-6">
                    <KanbanBoard vacancyId={vacancyId} />
                </div>
            )}
        </div>
    )
}
