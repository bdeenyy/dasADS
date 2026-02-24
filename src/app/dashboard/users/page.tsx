"use client"

import { useState, useEffect } from "react"
import { Users, Shield, ShieldCheck, User, Trash2, Pencil } from "lucide-react"
import { TableSkeleton } from "@/components/Skeleton"
import { Pagination } from "@/components/Pagination"


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
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [currentRole, setCurrentRole] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [editRole, setEditRole] = useState<string>("")
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "RECRUITER" as "MASTER" | "MANAGER" | "RECRUITER",
    })

    const fetchUsers = async (page: number) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/users?page=${page}&limit=10`)
            if (!res.ok) throw new Error("Failed to load users")
            const json = await res.json()
            setUsers(json.data)
            setTotalPages(json.meta.totalPages)
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
            else setError(String(err))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const init = async () => {
            const sessionRes = await fetch("/api/auth/session")
            if (sessionRes.ok) {
                const sess = await sessionRes.json()
                setCurrentRole(sess?.user?.role || null)
                setCurrentUserId(sess?.user?.id || null)
            }
        }
        init()
    }, [])

    useEffect(() => {
        fetchUsers(currentPage)
    }, [currentPage])

    const isMaster = currentRole === 'MASTER'

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
            fetchUsers(currentPage)
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
            else setError(String(err))
        }
    }

    const handleChangeRole = async (userId: string) => {
        setError("")
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: editRole })
            })
            if (!res.ok) {
                const text = await res.text()
                throw new Error(text)
            }
            setEditingUserId(null)
            fetchUsers(currentPage)
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
            else setError(String(err))
        }
    }

    const handleDeleteUser = async (userId: string, userName: string | null) => {
        if (!confirm(`Удалить пользователя ${userName || 'без имени'}?`)) return
        setError("")
        try {
            const res = await fetch(`/api/users/${userId}`, { method: "DELETE" })
            if (!res.ok) {
                const text = await res.text()
                throw new Error(text)
            }
            fetchUsers(currentPage)
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

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-indigo-600" />
                        Команда
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Управление сотрудниками организации и их правами доступа.
                    </p>
                </div>
                {isMaster && (
                    <div className="mt-4 sm:mt-0">
                        <button
                            type="button"
                            onClick={() => setIsAddOpen(!isAddOpen)}
                            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                            {isAddOpen ? 'Отмена' : 'Добавить сотрудника'}
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>}

            {isAddOpen && isMaster && (
                <div className="premium-card p-6">
                    <h3 className="text-base font-semibold text-slate-900 mb-4">Новый сотрудник</h3>
                    <form className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6" onSubmit={handleInvite}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Имя</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" placeholder="Иван Иванов" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email (Логин)</label>
                            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" placeholder="ivan@company.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Временный пароль</label>
                            <input type="text" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3" placeholder="qwerty1234" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Роль</label>
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as "MASTER" | "MANAGER" | "RECRUITER" })}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm px-3">
                                <option value="RECRUITER">Рекрутер</option>
                                <option value="MANAGER">Менеджер</option>
                                <option value="MASTER">Владелец</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                                Создать аккаунт
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="premium-card overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200 uppercase text-xs font-semibold text-slate-500 tracking-wider">
                        <tr>
                            <th className="py-4 pl-6 pr-3 text-left">Сотрудник</th>
                            <th className="px-3 py-4 text-left">Роль</th>
                            <th className="px-3 py-4 text-left">Дата</th>
                            {isMaster && <th className="px-3 py-4 text-right pr-6">Действия</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? (
                            <TableSkeleton columns={isMaster ? 4 : 3} rows={5} />
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={isMaster ? 4 : 3} className="py-12 text-center text-sm text-slate-500">
                                    Команда пока пуста
                                </td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 pl-6 pr-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            {user.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900 text-sm">{user.name}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-4">
                                    {editingUserId === user.id ? (
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={editRole}
                                                onChange={e => setEditRole(e.target.value)}
                                                className="rounded-md border-0 py-1 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 px-2"
                                            >
                                                <option value="RECRUITER">Рекрутер</option>
                                                <option value="MANAGER">Менеджер</option>
                                                <option value="MASTER">Владелец</option>
                                            </select>
                                            <button onClick={() => handleChangeRole(user.id)} className="text-xs text-indigo-600 font-semibold hover:text-indigo-800">ОК</button>
                                            <button onClick={() => setEditingUserId(null)} className="text-xs text-slate-500 hover:text-slate-700">✕</button>
                                        </div>
                                    ) : (
                                        <RoleBadge role={user.role} />
                                    )}
                                </td>
                                <td className="px-3 py-4 text-sm text-slate-500 whitespace-nowrap">
                                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                </td>
                                {isMaster && (
                                    <td className="px-3 py-4 text-right pr-6">
                                        {user.id !== currentUserId && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingUserId(user.id); setEditRole(user.role) }}
                                                    className="p-1.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                    title="Изменить роль"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Удалить"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!loading && users.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    )
}
