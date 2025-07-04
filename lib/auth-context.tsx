"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface User {
  _id: string
  fullName: string
  login: string
  role: number
  token: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  login: (credentials: { login: string; password: string }) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Проверяем, есть ли сохраненный пользователь при загрузке
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Failed to parse stored user:", e)
        localStorage.removeItem("user")
      }
    }
  }, [])

  const login = async (credentials: { login: string; password: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("https://api.adb-solution.com/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Ошибка авторизации")
      }

      const userData = await response.json()
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при авторизации")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
