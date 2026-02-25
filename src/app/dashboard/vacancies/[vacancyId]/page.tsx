"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ToastProvider"
import KanbanBoard from "@/components/KanbanBoard"
import { AVITO_PROFESSIONS } from "@/lib/avito-professions"

export default function VacancyForm({ params }: { params: Promise<{ vacancyId: string }> }) {
    const router = useRouter()
    const { showToast } = useToast()
    const { vacancyId } = use(params)
    const isNew = vacancyId === "new"

    // Tab state
    const [activeTab, setActiveTab] = useState<"DETAILS" | "CANDIDATES">("DETAILS")

    const [customers, setCustomers] = useState<{ id: string, name: string }[]>([])
    const [users, setUsers] = useState<{ id: string, name: string, role: string }[]>([])
    const [currentUserRole, setCurrentUserRole] = useState<string>("RECRUITER")

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
        ownerId: "",
        avitoAddress: "",
        avitoContactMethod: "В сообщениях",
        avitoImageUrl: "",
        avitoJobType: "Полный день",
        avitoManagerName: "",
        avitoContactPhone: "",
        avitoIndustry: "",
        avitoProfession: "",
        avitoExperience: "",
        avitoEmploymentType: "",
        publishToAvito: false,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Customers for select dropdown
                const custRes = await fetch('/api/customers?limit=100')
                if (custRes.ok) {
                    const custJson = await custRes.json()
                    const custData = Array.isArray(custJson) ? custJson : (custJson.data || [])
                    setCustomers(custData)
                    if (isNew && custData.length > 0) {
                        setFormData(prev => ({ ...prev, customerId: custData[0].id }))
                    }
                }

                // Try fetching users (will fail with 401 if role is RECRUITER, we just ignore that)
                try {
                    const usersRes = await fetch('/api/users?limit=100')
                    if (usersRes.ok) {
                        const usersJson = await usersRes.json()
                        const usersData = Array.isArray(usersJson) ? usersJson : (usersJson.data || [])
                        setUsers(usersData)
                        setCurrentUserRole("MASTER_OR_MANAGER")
                    } else {
                        setCurrentUserRole("RECRUITER")
                    }
                } catch {
                    setCurrentUserRole("RECRUITER")
                }

                if (!isNew) {
                    const res = await fetch(`/api/vacancies/${vacancyId}`)
                    if (res.ok) {
                        const current = await res.json()
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
                                ownerId: current.ownerId || "",
                                avitoAddress: current.avitoConfig?.address || "",
                                avitoContactMethod: current.avitoConfig?.contactMethod || "В сообщениях",
                                avitoImageUrl: current.avitoConfig?.imageUrl || "",
                                avitoJobType: current.avitoConfig?.jobType || "Полный день",
                                avitoManagerName: current.avitoConfig?.managerName || "",
                                avitoContactPhone: current.avitoConfig?.contactPhone || "",
                                avitoIndustry: current.avitoConfig?.industry || "",
                                avitoProfession: current.avitoConfig?.profession || "",
                                avitoExperience: current.avitoConfig?.experience || "",
                                avitoEmploymentType: current.avitoConfig?.employmentType || "",
                                publishToAvito: false, // Don't auto-publish existing if un-clicking
                            })
                        } else {
                            setError("Vacancy not found")
                        }
                    }
                }
            } catch {
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
            const parsedAvitoConfig = {
                address: formData.avitoAddress,
                contactMethod: formData.avitoContactMethod,
                imageUrl: formData.avitoImageUrl,
                jobType: formData.avitoJobType,
                managerName: formData.avitoManagerName,
                contactPhone: formData.avitoContactPhone,
                industry: formData.avitoIndustry,
                profession: formData.avitoProfession,
                experience: formData.avitoExperience,
                employmentType: formData.avitoEmploymentType,
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
                const text = await res.text()
                throw new Error(text || "Failed to save vacancy")
            }

            showToast(isNew ? "Вакансия успешно создана" : "Вакансия сохранена", "success")
            router.push("/dashboard/vacancies")
            router.refresh()
        } catch (err: unknown) {
            console.error(err)
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

    const handleDelete = async () => {
        if (!confirm("Вы уверены, что хотите удалить эту вакансию?")) return

        setSaving(true)
        try {
            const res = await fetch(`/api/vacancies/${vacancyId}`, {
                method: "DELETE",
            })

            if (!res.ok) throw new Error("Failed to delete")

            showToast("Вакансия удалена", "success")
            router.push("/dashboard/vacancies")
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

    const handleSyncAvito = async () => {
        setSyncing(true)
        try {
            const res = await fetch(`/api/avito/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vacancyId }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Failed to sync applies")

            showToast(`Синхронизация завершена. Новых откликов: ${data.newApplies || 0}`, "success")

            // Force reload board by toggling tab if needed or let user refresh manually.
            // Simplest way is a soft refresh
            router.refresh()
        } catch (err: unknown) {
            console.error(err)
            if (err instanceof Error) {
                showToast(err.message, "error")
            } else {
                showToast(String(err), "error")
            }
        } finally {
            setSyncing(false)
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

                            {currentUserRole !== "RECRUITER" && (
                                <div className="sm:col-span-6">
                                    <label htmlFor="ownerId" className="block text-sm font-medium leading-6 text-gray-900">
                                        Ответственный Рекрутер
                                    </label>
                                    <div className="mt-2 text-xs text-gray-500 mb-2">Кому назначена данная вакансия для работы с откликами</div>
                                    <div className="mt-2">
                                        <select
                                            id="ownerId"
                                            name="ownerId"
                                            value={formData.ownerId}
                                            onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6 px-3"
                                        >
                                            <option value="">Назначить позже (Останется за вами)</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

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

                            {/* Avito Integration Section (Redesigned Card) */}
                            <div className="sm:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-6 mt-2 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold leading-6 text-slate-900">Интеграция с Авито</h3>
                                        <p className="text-sm text-slate-500 mt-1">Обязательные поля для публикации или обновления вакансии.</p>
                                    </div>
                                    <div className="flex items-center bg-white border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm">
                                        <input
                                            id="publishToAvito"
                                            name="publishToAvito"
                                            type="checkbox"
                                            checked={formData.publishToAvito}
                                            onChange={(e) => setFormData({ ...formData, publishToAvito: e.target.checked })}
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                        />
                                        <label htmlFor="publishToAvito" className="ml-3 font-medium text-sm text-slate-900 cursor-pointer select-none">
                                            Опубликовать при сохранении
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-6 border-t border-slate-200 pt-6">
                                    {/* ADDRESS */}
                                    <div className="sm:col-span-6">
                                        <label htmlFor="avitoAddress" className="block text-sm font-medium leading-6 text-slate-900">
                                            Полный адрес (город, улица) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                id="avitoAddress"
                                                value={formData.avitoAddress}
                                                onChange={(e) => setFormData({ ...formData, avitoAddress: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                                placeholder="Например: Москва, улица Ленина, 50"
                                            />
                                        </div>
                                    </div>

                                    {/* INDUSTRY */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="avitoIndustry" className="block text-sm font-medium leading-6 text-slate-900">
                                            Сфера деятельности <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                id="avitoIndustry"
                                                value={formData.avitoIndustry}
                                                onChange={(e) => setFormData({ ...formData, avitoIndustry: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                                placeholder="Например: IT, интернет, телеком"
                                            />
                                        </div>
                                    </div>

                                    {/* PROFESSION */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="avitoProfession" className="block text-sm font-medium leading-6 text-slate-900">
                                            Профессия (Авито) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                id="avitoProfession"
                                                list="avito-professions-list"
                                                value={formData.avitoProfession}
                                                onChange={(e) => setFormData({ ...formData, avitoProfession: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                                placeholder="Начните вводить профессию..."
                                            />
                                            <datalist id="avito-professions-list">
                                                {AVITO_PROFESSIONS.map((prof) => (
                                                    <option key={prof.id} value={prof.name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* EXPERIENCE */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="avitoExperience" className="block text-sm font-medium leading-6 text-slate-900">
                                            Опыт работы (Авито) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-2">
                                            <select
                                                id="avitoExperience"
                                                value={formData.avitoExperience}
                                                onChange={(e) => setFormData({ ...formData, avitoExperience: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                            >
                                                <option value="">— Выберите —</option>
                                                <option value="Без опыта">Без опыта</option>
                                                <option value="Более 1 года">Более 1 года</option>
                                                <option value="Более 3 лет">Более 3 лет</option>
                                                <option value="Более 5 лет">Более 5 лет</option>
                                                <option value="Более 10 лет">Более 10 лет</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* EMPLOYMENT TYPE */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="avitoEmploymentType" className="block text-sm font-medium leading-6 text-slate-900">
                                            Тип занятости (Авито) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="mt-2">
                                            <select
                                                id="avitoEmploymentType"
                                                value={formData.avitoEmploymentType}
                                                onChange={(e) => setFormData({ ...formData, avitoEmploymentType: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                            >
                                                <option value="">— Выберите —</option>
                                                <option value="Полная">Полная</option>
                                                <option value="Частичная">Частичная</option>
                                                <option value="Временная">Временная</option>
                                                <option value="Стажировка">Стажировка</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* CONTACT METHOD */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="avitoContactMethod" className="block text-sm font-medium leading-6 text-slate-900">
                                            Способ связи
                                        </label>
                                        <div className="mt-2">
                                            <select
                                                id="avitoContactMethod"
                                                value={formData.avitoContactMethod}
                                                onChange={(e) => setFormData({ ...formData, avitoContactMethod: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                            >
                                                <option value="В сообщениях">Только сообщения</option>
                                                <option value="По телефону">Только звонки</option>
                                                <option value="По телефону и в сообщениях">Сообщения и звонки</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* MANAGER NAME */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="avitoManagerName" className="block text-sm font-medium leading-6 text-slate-900">
                                            Имя менеджера
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                id="avitoManagerName"
                                                value={formData.avitoManagerName}
                                                onChange={(e) => setFormData({ ...formData, avitoManagerName: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                                placeholder="Например: Анастасия"
                                            />
                                        </div>
                                    </div>

                                    {/* PHONE */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="avitoContactPhone" className="block text-sm font-medium leading-6 text-slate-900">
                                            Контактный телефон
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                id="avitoContactPhone"
                                                value={formData.avitoContactPhone}
                                                onChange={(e) => setFormData({ ...formData, avitoContactPhone: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                                placeholder="Например: 79001234567"
                                            />
                                        </div>
                                    </div>

                                    {/* JOB TYPE */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor="avitoJobType" className="block text-sm font-medium leading-6 text-slate-900">
                                            График работы (Авито)
                                        </label>
                                        <div className="mt-2">
                                            <select
                                                id="avitoJobType"
                                                value={formData.avitoJobType}
                                                onChange={(e) => setFormData({ ...formData, avitoJobType: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                            >
                                                <option value="Полный день">Полный день</option>
                                                <option value="Сменный график">Сменный график</option>
                                                <option value="Гибкий">Гибкий график</option>
                                                <option value="Удаленная работа">Удаленная работа</option>
                                                <option value="Вахтовый метод">Вахтовый метод</option>
                                                <option value="Свободный график">Свободный график</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* IMAGE URL */}
                                    <div className="sm:col-span-6">
                                        <label htmlFor="avitoImageUrl" className="block text-sm font-medium leading-6 text-slate-900">
                                            Ссылка на обложку вакансии (URL)
                                        </label>
                                        <div className="mt-2 flex shadow-sm rounded-md">
                                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 px-3 text-slate-500 sm:text-sm bg-slate-50">
                                                https://
                                            </span>
                                            <input
                                                type="url"
                                                id="avitoImageUrl"
                                                value={formData.avitoImageUrl}
                                                onChange={(e) => setFormData({ ...formData, avitoImageUrl: e.target.value })}
                                                className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                                placeholder="example.com/image.jpg"
                                            />
                                        </div>
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
                    <div className="mb-4 flex justify-end">
                        <button
                            type="button"
                            onClick={handleSyncAvito}
                            disabled={syncing}
                            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                        >
                            {syncing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                                    Синхронизация...
                                </>
                            ) : (
                                "Синхронизировать с Avito"
                            )}
                        </button>
                    </div>
                    <KanbanBoard vacancyId={vacancyId} />
                </div>
            )}
        </div>
    )
}
