"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/lib/i18n/context"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { language, changeLanguage, t } = useLanguage()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/")
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const navItems = [
    { href: language === "ru" ? "/" : "/en", label: t("nav.home") },
    { href: language === "ru" ? "/about" : "/en/about", label: t("nav.about") },
    { href: language === "ru" ? "/services" : "/en/services", label: t("nav.services") },
    { href: language === "ru" ? "/news" : "/en/news", label: t("nav.news") },
    { href: language === "ru" ? "/contacts" : "/en/contacts", label: t("nav.contacts") },
  ]

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={language === "ru" ? "/" : "/en"} className="flex items-center">
            <Image src="/logo.png" alt="ADB Solution" width={150} height={40} className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <ul className="flex space-x-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`text-gray-700 hover:text-[#cdb32f] ${
                      isActive(item.href) ? "font-semibold text-[#cdb32f]" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center space-x-2 ml-6 border-l pl-6">
              <button
                onClick={() => changeLanguage("ru")}
                className={`px-2 py-1 text-sm ${
                  language === "ru" ? "font-bold text-[#cdb32f]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                RU
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => changeLanguage("en")}
                className={`px-2 py-1 text-sm ${
                  language === "en" ? "font-bold text-[#cdb32f]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                EN
              </button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-700" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4">
            <ul className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block text-gray-700 hover:text-[#cdb32f] ${
                      isActive(item.href) ? "font-semibold text-[#cdb32f]" : ""
                    }`}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  changeLanguage("ru")
                  closeMenu()
                }}
                className={`px-2 py-1 text-sm ${
                  language === "ru" ? "font-bold text-[#cdb32f]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                RU
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => {
                  changeLanguage("en")
                  closeMenu()
                }}
                className={`px-2 py-1 text-sm ${
                  language === "en" ? "font-bold text-[#cdb32f]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                EN
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
