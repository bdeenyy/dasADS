"use client"

import { useState, useEffect } from "react"
import { Users, Shield, ShieldCheck, User } from "lucide-react"

type UserData = {
    id: string
    name: string | null
    email: string
    role: "MASTER" | "MANAGER" | "RECRUITER"
    createdAt: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [isAddOpen, setIsAddOpen] = useState(false)
    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        password: string;
        role: "MASTER" | "MANAGER" | "RECRUITER";
    }>({
        name: "",
        email: "",
        password: "",
        role: "RECRUITER"
    })

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users")
            if (!res.ok) throw new Error("Failed to load users")
            const data = await res.json()
            setUsers(data)
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
            else setError(String(err))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            if (!res.ok) {
                const text = await res.text()
                throw new Error(text)
            }
            setIsAddOpen(false)
            setFormData({ name: "", email: "", password: "", role: "RECRUITER" })
            fetchUsers()
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
            else setError(String(err))
        }
    }

    const RoleBadge = ({ role }: { role: string }) => {
        switch (role) {
            case 'MASTER':
                return (
                    <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium text-pink-700 bg-pink-50 ring-1 ring-inset ring-pink-600/20">
                        <Shield className="h-3.5 w-3.5" /> Владелец
                    </span>
                )
            case 'MANAGER':
                return (
                    <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 ring-1 ring-inset ring-purple-600/20">
                        <ShieldCheck className="h-3.5 w-3.5" /> Менеджер
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 ring-1 ring-inset ring-indigo-600/20">
                        <User className="h-3.5 w-3.5" /> Рекрутер
                    </span>
                )
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Загрузка команды...</div>

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-bold leading-6 text-gray-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-indigo-600" />
                        Команда
                    </h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Управление сотрудниками организации и их правами доступа к вакансиям.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => setIsAddOpen(!isAddOpen)}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        {isAddOpen ? 'Отмена' : 'Добавить сотрудника'}
                    </button>
                </div>
            </div>

            {error && <div className="mt-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>}

            {isAddOpen && (
                <div className="mt-6 bg-white shadow sm:rounded-lg mb-8 border border-gray-100">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Новый сотрудник</h3>
                        <form className="mt-5 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8" onSubmit={handleInvite}>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Имя пользователя</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    placeholder="Иван Иванов"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Email (Логин)</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    placeholder="ivan@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Временный пароль</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                    placeholder="qwerty1234"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Роль</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as "MASTER" | "MANAGER" | "RECRUITER" })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                >
                                    <option value="RECRUITER">Рекрутер (Видит только свои вакансии)</option>
                                    <option value="MANAGER">Менеджер (Управляет всеми вакансиями)</option>
                                    <option value="MASTER">Владелец (Полный доступ)</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2 flex justify-end">
                                <button
                                    type="submit"
                                    className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                >
                                    Создать аккаунт
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 lg:table-cell">
                                            Сотрудник
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">
                                            Роль
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">
                                            Дата добавления
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                                        {user.name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-gray-500 text-xs mt-0.5">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-gray-500 lg:table-cell">
                                                <RoleBadge role={user.role} />
                                            </td>
                                            <td className="px-3 py-4 text-sm text-gray-500 lg:table-cell whitespace-nowrap">
                                                {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-sm text-gray-500 font-medium">
                                                Команда пока пуста
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
