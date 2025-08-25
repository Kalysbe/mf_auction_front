"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, FileText } from "lucide-react"

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logo_KSE.png" alt="KSE Logo" width={40} height={40} />
          <div>
            <span className="font-semibold text-xl text-primary">Система аукционов</span>
            <p className="text-xs text-gray-500">Кыргызская фондовая биржа</p>
          </div>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Аукционы
          </Link>

          {user?.role === "bank" && (
            <>
              <Link href="/my-applications" className="text-sm font-medium hover:text-primary transition-colors">
                Мои заявки
              </Link>
              <Link href="/documents" className="text-sm font-medium hover:text-primary transition-colors">
                Документы
              </Link>
            </>
          )}

          {user?.role === "admin" && (
            <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
              Панель администратора
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <User className="h-4 w-4" />
                  {user.role === "bank" ? user.bankData?.name || user.email : user.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "bank" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Профиль банка</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-applications">
                        <FileText className="h-4 w-4 mr-2" />
                        Мои заявки
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/documents">
                        <FileText className="h-4 w-4 mr-2" />
                        Мои документы
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/create-auction">Создать аукцион</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/auth/login">Войти</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
