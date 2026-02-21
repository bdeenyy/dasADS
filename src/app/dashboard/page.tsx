import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Welcome to {session.user.organizationName}
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>
                        You are logged in as a <strong>{session.user.role}</strong>. Select an option from the menu to manage your recruiting processes.
                    </p>
                </div>

                {session.user.role === 'MASTER' && (
                    <div className="mt-5">
                        <Link
                            href="/dashboard/settings"
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 cursor-pointer"
                        >
                            Управление настройками организации
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
