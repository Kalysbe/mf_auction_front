"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, FileText, Home, Settings, Users, Menu, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    title: "Главная",
    href: "/admin",
    icon: Home,
  },
  {
    title: "Новости",
    href: "/admin/news",
    icon: FileText,
  },
  {
    title: "Статистика",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Пользователи",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Настройки",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Мобильная кнопка меню */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-md shadow-md"
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Затемнение фона при открытом мобильном меню */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />}

      {/* Сайдбар */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white shadow-md transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Заголовок сайдбара */}
          <div className="flex items-center justify-center h-16 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Админ-панель</h2>
          </div>

          {/* Информация о пользователе */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#cdb32f] flex items-center justify-center text-white font-semibold">
                {user?.fullName?.charAt(0) || "A"}
              </div>
              <div>
                <p className="font-medium text-gray-800">{user?.fullName || "Администратор"}</p>
                <p className="text-sm text-gray-500">{user?.email || "admin@example.com"}</p>
              </div>
            </div>
          </div>

          {/* Навигация */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive ? "bg-[#cdb32f]/10 text-[#cdb32f]" : "text-gray-700 hover:bg-gray-100",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-[#cdb32f]" : "text-gray-500")} />
                      {item.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Футер сайдбара */}
          <div className="p-4 border-t">
            <Link href="/" className="flex items-center text-sm text-gray-700 hover:text-[#cdb32f]">
              <span>← Вернуться на сайт</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
