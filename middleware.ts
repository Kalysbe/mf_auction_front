import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Проверяем, является ли путь защищенным (админка)
  const isAdminPath = pathname.startsWith("/admin")
  const isLoginPath = pathname === "/login"

  // Получаем токен из cookies
  const token = request.cookies.get("admin_token")?.value

  // Если путь админки и нет токена, перенаправляем на страницу входа
  if (isAdminPath && !token) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Если пользователь уже авторизован и пытается зайти на страницу логина,
  // перенаправляем его в админку
  if (isLoginPath && token) {
    const adminUrl = new URL("/admin", request.url)
    return NextResponse.redirect(adminUrl)
  }

  return NextResponse.next()
}

// Указываем, для каких путей должен срабатывать middleware
export const config = {
  matcher: ["/admin/:path*", "/login"],
}
