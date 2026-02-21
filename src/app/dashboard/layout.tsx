import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SignOutButton from "@/components/SignOutButton"

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
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex flex-shrink-0 items-center font-bold text-indigo-600">
                                dasADS Dashboard
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700 hidden sm:inline-block">
                                {session.user.name} ({session.user.role})
                            </span>
                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
                                {session.user.organizationName}
                            </span>
                            <SignOutButton />
                        </div>
                    </div>

                    <div className="flex h-12 items-center space-x-8 text-sm font-medium border-t border-gray-200">
                        <a href="/dashboard" className="text-gray-900 hover:text-indigo-600">Главная</a>
                        <a href="/dashboard/customers" className="text-gray-900 hover:text-indigo-600">Заказчики</a>
                        <a href="/dashboard/vacancies" className="text-gray-900 hover:text-indigo-600">Вакансии</a>
                        {session.user.role === 'MASTER' && (
                            <>
                                <a href="/dashboard/users" className="text-gray-900 hover:text-indigo-600">Сотрудники</a>
                                <a href="/dashboard/settings" className="text-gray-900 hover:text-indigo-600">Настройки</a>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <div className="py-10">
                <main>
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
