"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth, type UserRole } from "@/contexts/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      // Если пользователь не авторизован и это не страница входа/регистрации
      if (!user && !pathname.includes("/auth/")) {
        router.push("/auth/login")
        return
      }

      // Если указаны разрешенные роли и пользователь не имеет нужной роли
      if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        router.push("/")
        return
      }

      // Если пользователь авторизован и пытается зайти на страницу входа/регистрации
      if (user && pathname.includes("/auth/")) {
        router.push("/")
        return
      }
    }
  }, [user, loading, router, pathname, allowedRoles])

  // Показываем загрузку, пока проверяем авторизацию
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Если пользователь не авторизован и это не страница входа/регистрации, не показываем содержимое
  if (!user && !pathname.includes("/auth/")) {
    return null
  }

  // Если указаны разрешенные роли и пользователь не имеет нужной роли, не показываем содержимое
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
