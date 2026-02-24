"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import SignOutButton from "@/components/SignOutButton"
import Link from "next/link"
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Building2,
    Settings,
    Menu,
    Bell,
    X,
    Activity
} from "lucide-react"

type SessionUser = {
    name?: string
    role?: string
    organizationName?: string
}

function NavLink({ href, icon: Icon, label, pathname, onNavigate }: { href: string; icon: React.ElementType; label: string; pathname: string; onNavigate?: () => void }) {
    const isActive = href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(href)

    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group
                ${isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80"
                }`}
        >
            <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"}`} />
            {label}
        </Link>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [session, setSession] = useState<{ user?: SessionUser } | null>(null)

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch("/api/auth/session")
                if (res.ok) {
                    const data = await res.json()
                    if (!data?.user) {
                        router.push("/login")
                        return
                    }
                    setSession(data)
                } else {
                    router.push("/login")
                }
            } catch {
                router.push("/login")
            }
        }
        fetchSession()
    }, [router])

    const closeSidebar = useCallback(() => setSidebarOpen(false), [])

    const user = session?.user

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        )
    }

    const sidebarContent = (
        <>
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-100">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        d
                    </div>
                    dasADS
                </div>
            </div>

            {/* Organization Label */}
            <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Организация</p>
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold truncate text-slate-700">
                        {user.organizationName}
                    </span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
                <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Меню</p>

                <NavLink href="/dashboard" icon={LayoutDashboard} label="Главная" pathname={pathname} onNavigate={closeSidebar} />
                <NavLink href="/dashboard/vacancies" icon={Briefcase} label="Вакансии" pathname={pathname} onNavigate={closeSidebar} />
                <NavLink href="/dashboard/candidates" icon={Users} label="Кандидаты" pathname={pathname} onNavigate={closeSidebar} />
                <NavLink href="/dashboard/customers" icon={Building2} label="Заказчики" pathname={pathname} onNavigate={closeSidebar} />
                <NavLink href="/dashboard/activity" icon={Activity} label="Активность" pathname={pathname} onNavigate={closeSidebar} />

                {user.role !== 'RECRUITER' && (
                    <>
                        <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">Управление</p>

                        <NavLink href="/dashboard/users" icon={Users} label="Сотрудники" pathname={pathname} onNavigate={closeSidebar} />

                        {user.role === 'MASTER' && (
                            <NavLink href="/dashboard/settings" icon={Settings} label="Настройки" pathname={pathname} onNavigate={closeSidebar} />
                        )}
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-2 py-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {user.role}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 text-slate-900 font-sans">

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl z-50 animate-slide-in">
                        <div className="absolute right-2 top-2">
                            <button
                                type="button"
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {sidebarContent}
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r border-gray-200/60 bg-white/70 backdrop-blur-xl z-20 shadow-sm relative">
                {sidebarContent}
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden relative">

                {/* Header Navbar */}
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200/60 bg-white/70 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 backdrop-blur-md">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>

                    {/* Separator for mobile */}
                    <div className="h-6 w-px bg-gray-200 md:hidden" aria-hidden="true" />

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center justify-between">
                        <div className="relative flex flex-1" />
                        <div className="flex items-center gap-x-4 lg:gap-x-6 relative">
                            <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative transition-colors">
                                <span className="sr-only">View notifications</span>
                                <Bell className="h-6 w-6" aria-hidden="true" />
                            </button>

                            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                            <div className="flex items-center gap-x-4">
                                <SignOutButton />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8 custom-scrollbar">
                    <div className="mx-auto max-w-7xl relative">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
