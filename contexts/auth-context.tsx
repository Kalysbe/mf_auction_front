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
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  updateBankData: (data: BankData) => void
  addDocument: (doc: Omit<BankDocument, "id" | "uploadDate">) => void
  removeDocument: (id: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(User & { bankData?: BankData }) | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const token = tokenManager.getToken()
    if (token) {
      try {
        const payload = tokenManager.decodeToken(token)
        if (payload && payload.exp > Date.now() / 1000) {
          // Token is valid and not expired
          setUser({
            id: payload.id || payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role,
          })
          console.log("Restored user from token:", payload.email)
        } else {
          // Token is expired
          console.log("Token expired, removing...")
          tokenManager.removeToken()
        }
      } catch (error) {
        console.error("Invalid token:", error)
        tokenManager.removeToken()
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await authAPI.login(email, password)

      // Validate token before storing
      const payload = tokenManager.decodeToken(response.token)
      if (!payload || payload.exp <= Date.now() / 1000) {
        console.error("Received invalid or expired token")
        return false
      }

      tokenManager.setToken(response.token)
      setUser(response.user)

      console.log("Login successful, token expires:", new Date(payload.exp * 1000))

      // Trigger WebSocket reconnection after successful login
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("auth-changed"))
      }, 100)

      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await authAPI.register(email, password, name)

      // Validate token before storing
      const payload = tokenManager.decodeToken(response.token)
      if (!payload || payload.exp <= Date.now() / 1000) {
        console.error("Received invalid or expired token")
        return false
      }

      tokenManager.setToken(response.token)
      setUser(response.user)

      console.log("Registration successful, token expires:", new Date(payload.exp * 1000))

      // Trigger WebSocket reconnection after successful registration
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("auth-changed"))
      }, 100)

      return true
    } catch (error) {
      console.error("Registration error:", error)
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
        register,
        logout,
        updateBankData,
        addDocument,
        removeDocument,
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
