// API configuration and utilities
export const API_BASE_URL = "https://mfauction.adb-solution.com"

// Types for API responses
export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "initiator" | "user"
}

export interface AuthResponse {
  token: string
  user: User
}

// Обновленный интерфейс Auction под реальную структуру данных
export interface Auction {
  id: string
  user_id: string // Изменено с created_by на user_id
  status: "open" | "closed" | "pending" | "active" // Добавлен "open"
  closing_type: "auto" | "manual"
  end_time: string
  createdAt: string // Изменено с created_at на createdAt
  updatedAt: string
  type: "sell" | "buy"
  asset: string
  currency: string
  // Добавим volume как опциональное поле для обратной совместимости
  volume?: number
  // Legacy fields for backward compatibility
  title?: string
  description?: string
  start_price?: number
  duration?: number
  term?: string // ДОБАВЛЕНО: Срок размещения для ведомости
}

// Обновленный интерфейс для Лота под реальную структуру данных
export interface Lot {
  id: string
  auction_id: string
  asset: string
  volume: number
  percent: number
  status: "open" | "closed" | "pending" // Изменено под реальные статусы
  winner_user_id: string | null
  winner_offer_id: string | null
  createdAt: string // Изменено с created_at на createdAt
  updatedAt: string
  offers?: Offer[] // ДОБАВЛЕНО: Поле offers теперь внутри Lot
}

// В интерфейсе Offer теперь привязка к лоту
export interface Offer {
  id: string
  lot_id: string // Изменено с auction_id на lot_id
  user_id: string
  price?: number // Оставим для обратной совместимости
  percent: number // Процентная ставка
  volume: number // Объем предложения
  created_at: string
  status: "pending" | "accepted" | "rejected" // ДОБАВЛЕНО: Статус предложения
  user?: User
  lot?: Lot // Добавим информацию о лоте
}

// API Error class
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

// Helper function to normalize auction status
export function normalizeAuctionStatus(status: string | undefined | null): "active" | "closed" | "pending" {
  if (!status || typeof status !== "string") {
    console.warn("Invalid auction status:", status)
    return "pending"
  }

  switch (status.toLowerCase()) {
    case "open":
    case "active":
      return "active"
    case "closed":
    case "finished":
    case "ended":
      return "closed"
    case "pending":
    case "waiting":
    case "scheduled":
      return "pending"
    default:
      return "pending"
  }
}

// Helper function to normalize lot status
export function normalizeLotStatus(status: string | undefined | null): "active" | "closed" | "pending" {
  if (!status || typeof status !== "string") {
    console.warn("Invalid lot status:", status)
    return "pending"
  }

  switch (status.toLowerCase()) {
    case "open":
    case "active":
      return "active"
    case "closed":
    case "finished":
    case "ended":
      return "closed"
    case "pending":
    case "waiting":
    case "scheduled":
      return "pending"
    default:
      return "pending"
  }
}

// Helper function to get status display text
export function getStatusDisplayText(status: string | undefined | null): string {
  const normalizedStatus = normalizeAuctionStatus(status)
  switch (normalizedStatus) {
    case "active":
      return "Активен"
    case "closed":
      return "Завершен"
    case "pending":
      return "Ожидание"
    default:
      return "Неизвестно"
  }
}

// Helper function to get lot status display text
export function getLotStatusDisplayText(status: string | undefined | null): string {
  const normalizedStatus = normalizeLotStatus(status)
  switch (normalizedStatus) {
    case "active":
      return "Открыт"
    case "closed":
      return "Закрыт"
    case "pending":
      return "Ожидание"
    default:
      return "Неизвестно"
  }
}

// Helper function to get status badge variant
export function getStatusBadgeVariant(status: string | undefined | null): "default" | "secondary" | "destructive" {
  const normalizedStatus = normalizeAuctionStatus(status)
  switch (normalizedStatus) {
    case "active":
      return "default"
    case "closed":
      return "secondary"
    case "pending":
      return "secondary"
    default:
      return "secondary"
  }
}

// Helper function for safe date formatting for offers
export function formatOfferDate(dateString: string | undefined | null): string {
  if (!dateString) {
    return "Неизвестное время"
  }
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return "Неизвестное время" // Fallback for invalid date strings
  }
  return date.toLocaleString("ru-RU")
}

// Helper function to get offer status display text
export function getOfferStatusDisplayText(status: string | undefined | null): string {
  if (!status || typeof status !== "string") {
    return "Неизвестно"
  }
  switch (status.toLowerCase()) {
    case "pending":
      return "На рассмотрении"
    case "accepted":
      return "Принято"
    case "rejected":
      return "Отклонено"
    default:
      return "Неизвестно"
  }
}

// Helper function to get offer status badge variant
export function getOfferStatusBadgeVariant(
  status: string | undefined | null,
): "default" | "secondary" | "destructive" | "success" {
  if (!status || typeof status !== "string") {
    return "secondary"
  }
  switch (status.toLowerCase()) {
    case "pending":
      return "default"
    case "accepted":
      return "success"
    case "rejected":
      return "destructive"
    default:
      return "secondary"
  }
}

// Authentication API - простые POST запросы
export const authAPI = {
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      console.log("Registering user:", email)

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      })

      console.log("Register response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Register error:", errorText)
        throw new APIError(response.status, errorText)
      }

      const data = await response.json()
      console.log("Register success:", data)
      return data
    } catch (error) {
      console.error("Register fetch error:", error)
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError(0, `Network error: ${error.message}`)
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log("Logging in user:", email)

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Login response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Login error:", errorText)
        throw new APIError(response.status, errorText)
      }

      const data = await response.json()
      console.log("Login success:", data)
      return data
    } catch (error) {
      console.error("Login fetch error:", error)
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError(0, `Network error: ${error.message}`)
    }
  },
}

// Token management
export const tokenManager = {
  setToken(token: string) {
    localStorage.setItem("auth_token", token)
  },

  getToken(): string | null {
    return localStorage.getItem("auth_token")
  },

  removeToken() {
    localStorage.removeItem("auth_token")
  },

  // Decode JWT token to get user info
  decodeToken(token: string): any {
    try {
      const payload = token.split(".")[1]
      return JSON.parse(atob(payload))
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  },
}
