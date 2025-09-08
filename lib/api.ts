// API configuration and utilities
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://mfauction.adb-solution.com"

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
  async getCurrentUser(): Promise<User> {
    try {
      console.log("[v0] === ДИАГНОСТИКА getCurrentUser ===")
      console.log("[v0] API_BASE_URL:", API_BASE_URL)

      const token = tokenManager.getToken()
      console.log("[v0] Токен найден:", !!token)

      if (!token) {
        throw new APIError(401, "Токен авторизации отсутствует")
      }

      const fullUrl = `${API_BASE_URL}/auth/me`
      console.log("[v0] Полный URL запроса:", fullUrl)

      const response = await fetchWithRetry(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(15000), // Увеличиваем таймаут
      })

      console.log("[v0] Ответ /auth/me - статус:", response.status)
      console.log("[v0] Ответ /auth/me - headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Ошибка /auth/me:", errorText)

        if (response.status === 404) {
          throw new APIError(404, "Эндпоинт /auth/me не найден на сервере. Возможно, он еще не реализован.")
        }

        throw new APIError(response.status, errorText)
      }

      const userData = await response.json()
      console.log("[v0] Данные пользователя из /auth/me:", userData)

      if (!userData || typeof userData !== "object") {
        throw new APIError(500, "Некорректный формат ответа от сервера")
      }

      return userData
    } catch (error) {
      console.error("[v0] Ошибка getCurrentUser:", error)

      if (error instanceof APIError) {
        throw error
      }

      if (error.name === "AbortError") {
        throw new APIError(0, "Таймаут запроса к серверу. Сервер не отвечает.")
      }

      if (error.message.includes("Failed to fetch")) {
        throw new APIError(
          0,
          `Не удается подключиться к серверу ${API_BASE_URL}/auth/me. Проверьте доступность сервера.`,
        )
      }

      throw new APIError(0, `Ошибка получения данных пользователя: ${error.message}`)
    }
  },

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      console.log("Registering user:", email)

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
      console.log("[v0] === РАСШИРЕННАЯ ДИАГНОСТИКА LOGIN ===")
      console.log(
        "[v0] Все переменные окружения с API:",
        Object.entries(process.env).filter(([key]) => key.includes("API")),
      )
      console.log("[v0] NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL)
      console.log("[v0] API_BASE_URL константа:", API_BASE_URL)
      console.log(
        "[v0] Текущий протокол страницы:",
        typeof window !== "undefined" ? window.location.protocol : "server-side",
      )
      console.log("[v0] Текущий хост страницы:", typeof window !== "undefined" ? window.location.host : "server-side")

      const fullUrl = `${API_BASE_URL}/auth/login`
      console.log("[v0] Итоговый URL запроса:", fullUrl)

      // Проверяем Mixed Content
      if (typeof window !== "undefined" && window.location.protocol === "https:" && API_BASE_URL.startsWith("http:")) {
        console.error("[v0] КРИТИЧЕСКАЯ ОШИБКА: Mixed Content Policy!")
        console.error("[v0] HTTPS страница не может обращаться к HTTP API")
        throw new APIError(
          0,
          `Mixed Content Error: Браузер блокирует HTTP запросы (${API_BASE_URL}) с HTTPS страницы. Необходимо настроить HTTPS на сервере или использовать HTTP версию сайта.`,
        )
      }

      console.log("[v0] Отправляю запрос на:", fullUrl)
      console.log("[v0] Данные для входа:", { email, password: "***" })

      const response = await fetchWithRetry(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(15000), // Увеличиваем таймаут до 15 секунд
      })

      console.log("[v0] Ответ сервера - статус:", response.status)
      console.log("[v0] Ответ сервера - headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Ошибка сервера:", errorText)
        throw new APIError(response.status, errorText)
      }

      const data = await response.json()
      console.log("[v0] Успешный вход:", { ...data, token: "***" })
      return data
    } catch (error) {
      console.error("[v0] ОШИБКА LOGIN:", error)
      console.error("[v0] Тип ошибки:", error.constructor.name)
      console.error("[v0] Сообщение ошибки:", error.message)

      if (error instanceof APIError) {
        throw error
      }

      if (error.name === "AbortError") {
        throw new APIError(0, `Таймаут подключения к серверу ${API_BASE_URL}. Сервер не отвечает в течение 15 секунд.`)
      }

      if (error.message.includes("Failed to fetch")) {
        console.error("[v0] Ошибка 'Failed to fetch' - проблема с сетью или CORS")
        throw new APIError(
          0,
          `Не удается подключиться к серверу ${API_BASE_URL}. Проверьте: 1) Доступность сервера, 2) Настройки CORS, 3) Mixed Content Policy`,
        )
      }

      throw new APIError(0, `Сетевая ошибка: ${error.message}`)
    }
  },

  async getUserList(): Promise<User[]> {
    try {
      console.log("[v0] === ПОЛУЧЕНИЕ СПИСКА ПОЛЬЗОВАТЕЛЕЙ ===")
      console.log("[v0] API_BASE_URL:", API_BASE_URL)

      const token = tokenManager.getToken()
      console.log("[v0] Токен найден:", !!token)

      if (!token) {
        throw new APIError(401, "Токен авторизации отсутствует")
      }

      const fullUrl = `${API_BASE_URL}/user/list`
      console.log("[v0] Полный URL запроса:", fullUrl)

      const response = await fetchWithRetry(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(15000),
      })

      console.log("[v0] Ответ /user/list - статус:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Ошибка /user/list:", errorText)
        throw new APIError(response.status, errorText)
      }

      const userList = await response.json()
      console.log("[v0] Список пользователей получен:", userList.length, "пользователей")

      return userList
    } catch (error) {
      console.error("[v0] Ошибка getUserList:", error)

      if (error instanceof APIError) {
        throw error
      }

      if (error.name === "AbortError") {
        throw new APIError(0, "Таймаут запроса к серверу. Сервер не отвечает.")
      }

      if (error.message.includes("Failed to fetch")) {
        throw new APIError(
          0,
          `Не удается подключиться к серверу ${API_BASE_URL}/user/list. Проверьте доступность сервера.`,
        )
      }

      throw new APIError(0, `Ошибка получения списка пользователей: ${error.message}`)
    }
  },

  async createUser(email: string, name: string): Promise<User> {
    try {
      console.log("[v0] === СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ ===")
      console.log("[v0] API_BASE_URL:", API_BASE_URL)

      const token = tokenManager.getToken()
      console.log("[v0] Токен найден:", !!token)

      if (!token) {
        throw new APIError(401, "Токен авторизации отсутствует")
      }

      const fullUrl = `${API_BASE_URL}/auth/register`
      console.log("[v0] Полный URL запроса:", fullUrl)
      console.log("[v0] Данные для создания:", { email, name })

      const response = await fetchWithRetry(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, name }),
        signal: AbortSignal.timeout(15000),
      })

      console.log("[v0] Ответ /auth/register - статус:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Ошибка /auth/register:", errorText)
        throw new APIError(response.status, errorText)
      }

      const userData = await response.json()
      console.log("[v0] Пользователь создан:", userData)

      return userData
    } catch (error) {
      console.error("[v0] Ошибка createUser:", error)

      if (error instanceof APIError) {
        throw error
      }

      if (error.name === "AbortError") {
        throw new APIError(0, "Таймаут запроса к серверу. Сервер не отвечает.")
      }

      if (error.message.includes("Failed to fetch")) {
        throw new APIError(
          0,
          `Не удается подключиться к серверу ${API_BASE_URL}/auth/register. Проверьте доступность сервера.`,
        )
      }

      throw new APIError(0, `Ошибка создания пользователя: ${error.message}`)
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

  decodeToken(token: string): any {
    try {
      console.log("[v0] Декодирование токена...")

      // Проверяем, что токен существует и является строкой
      if (!token || typeof token !== "string") {
        console.error("[v0] Токен отсутствует или не является строкой:", typeof token)
        return null
      }

      // Проверяем формат JWT токена (должен содержать 3 части, разделенные точками)
      const parts = token.split(".")
      if (parts.length !== 3) {
        console.error("[v0] Неверный формат JWT токена. Ожидается 3 части, получено:", parts.length)
        return null
      }

      const payload = parts[1]

      // Проверяем, что payload не пустой
      if (!payload) {
        console.error("[v0] Пустой payload в токене")
        return null
      }

      // Добавляем padding если необходимо для корректного base64 декодирования
      let paddedPayload = payload
      while (paddedPayload.length % 4) {
        paddedPayload += "="
      }

      console.log("[v0] Payload для декодирования:", paddedPayload.substring(0, 50) + "...")

      // Пытаемся декодировать base64
      const decoded = atob(paddedPayload)
      console.log("[v0] Base64 декодирование успешно")

      // Пытаемся парсить JSON
      const parsed = JSON.parse(decoded)
      console.log("[v0] JSON парсинг успешно, роль пользователя:", parsed.role)

      return parsed
    } catch (error) {
      console.error("[v0] Ошибка декодирования токена:", error.message)
      console.error("[v0] Тип ошибки:", error.constructor.name)

      if (error.message.includes("atob")) {
        console.error("[v0] Ошибка base64 декодирования. Токен может быть поврежден.")
      } else if (error.message.includes("JSON")) {
        console.error("[v0] Ошибка парсинга JSON. Payload не является валидным JSON.")
      }

      return null
    }
  },
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[v0] Попытка ${i + 1}/${retries} запроса к:`, url)
      const response = await fetch(url, options)
      console.log(`[v0] Ответ получен, статус:`, response.status)
      return response
    } catch (error) {
      console.error(`[v0] Ошибка попытки ${i + 1}:`, error.message)

      if (i === retries - 1) {
        throw error
      }

      // Ждем перед повторной попыткой
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error("Все попытки исчерпаны")
}
