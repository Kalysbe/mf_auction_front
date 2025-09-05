"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authAPI, tokenManager, type User, type AuthResponse } from "@/lib/api"

export type UserRole = "admin" | "initiator" | "user" | "bank"

export interface BankDocument {
  id: string
  name: string
  type: string
  url: string
  uploadDate: string
}

export interface BankData {
  name: string
  inn: string
  license: string
  address: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  documents: BankDocument[]
}

interface AuthContextType {
  user: (User & { bankData?: BankData }) | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateBankData: (data: BankData) => void
  addDocument: (doc: Omit<BankDocument, "id" | "uploadDate">) => void
  removeDocument: (id: string) => void
  fetchCurrentUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(User & { bankData?: BankData }) | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCurrentUser = async () => {
    try {
      console.log("[v0] Попытка получить данные пользователя через /auth/me")
      const userData = await authAPI.getCurrentUser()
      console.log("[v0] Получены актуальные данные пользователя:", userData)
      setUser(userData)
      return userData
    } catch (error) {
      console.error("[v0] Ошибка получения данных пользователя:", error)

      if (error.status === 401 || error.status === 403) {
        console.log("[v0] Токен недействителен, удаляем его")
        tokenManager.removeToken()
        setUser(null)
        throw error
      }

      // Если эндпоинт недоступен (404, 500, сетевые ошибки), используем fallback
      if (error.status === 404) {
        console.warn("[v0] Эндпоинт /auth/me не найден, используем данные из токена")
      } else if (error.status === 0 || error.message.includes("Failed to fetch")) {
        console.warn("[v0] Сервер недоступен, используем данные из токена")
      }

      // Fallback к данным из токена
      const token = tokenManager.getToken()
      if (token) {
        try {
          const payload = tokenManager.decodeToken(token)
          if (payload && payload.exp > Date.now() / 1000) {
            const fallbackUser = {
              id: payload.id || payload.sub || "unknown",
              email: payload.email || "unknown@example.com",
              name: payload.name || "Пользователь",
              role: payload.role || "user",
            }
            console.log("[v0] Используем fallback данные из токена:", fallbackUser)
            setUser(fallbackUser)
            return fallbackUser
          }
        } catch (tokenError) {
          console.error("[v0] Ошибка декодирования токена:", tokenError)
        }
      }

      throw error
    }
  }

  // Check for existing token on mount
  useEffect(() => {
    const token = tokenManager.getToken()
    console.log("[v0] Проверка токена при загрузке:", !!token)

    if (token) {
      try {
        const payload = tokenManager.decodeToken(token)
        console.log("[v0] Token payload:", payload)

        if (payload && payload.exp > Date.now() / 1000) {
          console.log("[v0] Токен действителен, получаем данные пользователя")
          fetchCurrentUser()
            .catch((error) => {
              console.error("[v0] Не удалось получить данные пользователя при загрузке:", error)
              // Если fetchCurrentUser не смог получить данные, пользователь уже установлен через fallback
            })
            .finally(() => {
              setLoading(false)
            })
        } else {
          console.log("[v0] Токен истек, удаляем")
          tokenManager.removeToken()
          setLoading(false)
        }
      } catch (error) {
        console.error("[v0] Недействительный токен:", error)
        tokenManager.removeToken()
        setLoading(false)
      }
    } else {
      console.log("[v0] Токен отсутствует")
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("[v0] Попытка входа для:", email)
      const response: AuthResponse = await authAPI.login(email, password)

      // Validate token before storing
      const payload = tokenManager.decodeToken(response.token)
      console.log("[v0] Login token payload:", payload)
      if (!payload || payload.exp <= Date.now() / 1000) {
        console.error("[v0] Получен недействительный или истекший токен")
        return false
      }

      tokenManager.setToken(response.token)
      console.log("[v0] Токен сохранен, получаем актуальные данные пользователя")

      try {
        await fetchCurrentUser()
      } catch (error) {
        console.error("[v0] Не удалось получить актуальные данные после логина, используем данные из ответа:", error)
        setUser(response.user)
      }

      console.log("[v0] Вход выполнен успешно, токен истекает:", new Date(payload.exp * 1000))

      // Trigger WebSocket reconnection after successful login
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("auth-changed"))
      }, 100)

      return true
    } catch (error) {
      console.error("[v0] Ошибка входа:", error)
      return false
    }
  }

  const logout = () => {
    console.log("Logging out user")
    tokenManager.removeToken()
    setUser(null)
    window.dispatchEvent(new CustomEvent("auth-changed"))
  }

  const updateBankData = (data: BankData) => {
    if (user) {
      setUser({ ...user, bankData: data })
    }
  }

  const addDocument = (doc: Omit<BankDocument, "id" | "uploadDate">) => {
    if (user?.bankData) {
      const newDoc: BankDocument = {
        ...doc,
        id: Date.now().toString(),
        uploadDate: new Date().toLocaleDateString("ru-RU"),
      }
      const updatedBankData = {
        ...user.bankData,
        documents: [...user.bankData.documents, newDoc],
      }
      setUser({ ...user, bankData: updatedBankData })
    }
  }

  const removeDocument = (id: string) => {
    if (user?.bankData) {
      const updatedBankData = {
        ...user.bankData,
        documents: user.bankData.documents.filter((doc) => doc.id !== id),
      }
      setUser({ ...user, bankData: updatedBankData })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateBankData,
        addDocument,
        removeDocument,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
