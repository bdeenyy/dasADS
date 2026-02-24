import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SignOutButton from "@/components/SignOutButton"
import Link from "next/link"
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Building2,
    Settings,
    Menu,
    Bell
} from "lucide-react"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 text-slate-900 font-sans">
            {/* Sidebar (Glassmorphism) */}
            <aside className="hidden md:flex flex-col w-64 border-r border-gray-200/60 bg-white/70 backdrop-blur-xl z-20 shadow-sm relative">
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
                            {session.user.organizationName}
                        </span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
                    <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Меню</p>

                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group">
                        <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        Главная
                    </Link>

                    <Link href="/dashboard/vacancies" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group">
                        <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        Вакансии
                    </Link>

                    <Link href="/dashboard/candidates" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group">
                        <Users className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        Кандидаты
                    </Link>

                    <Link href="/dashboard/customers" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group">
                        <Building2 className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        Заказчики
                    </Link>

                    {session.user.role !== 'RECRUITER' && (
                        <>
                            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">Управление</p>

                            <Link href="/dashboard/users" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group">
                                <Users className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                Сотрудники
                            </Link>

                            {session.user.role === 'MASTER' && (
                                <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group">
                                    <Settings className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                    Настройки
                                </Link>
                            )}
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-2 py-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                            {session.user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {session.user.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {session.user.role}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden relative">

                {/* Header Navbar */}
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200/60 bg-white/70 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 backdrop-blur-md">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-700 md:hidden">
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>

                    {/* Separator for mobile */}
                    <div className="h-6 w-px bg-gray-200 md:hidden" aria-hidden="true" />

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center justify-between">
                        <div className="relative flex flex-1">
                            {/* <label htmlFor="search-field" className="sr-only">Search</label>
                            <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400" aria-hidden="true" />
                            <input
                                id="search-field"
                                className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent"
                                placeholder="Search..."
                                type="search"
                                name="search"
                            /> */}
                        </div>
                        <div className="flex items-center gap-x-4 lg:gap-x-6 relative">
                            <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative transition-colors">
                                <span className="sr-only">View notifications</span>
                                <Bell className="h-6 w-6" aria-hidden="true" />
                                <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
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
