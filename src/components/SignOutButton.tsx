"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 border-l border-gray-200 pl-4 ml-2"
        >
            Выйти
        </button>
    )
}
