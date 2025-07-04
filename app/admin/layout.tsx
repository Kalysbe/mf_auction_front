"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()

  // Проверяем авторизацию
  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  // Если пользователь не авторизован, не рендерим содержимое
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="lg:ml-64 min-h-screen">
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
