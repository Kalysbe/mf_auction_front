import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Image from "next/image"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "Система аукционов по размещению средств из счета смягчения в депозиты коммерческих банков",
  description:
    "Система аукционов по размещению средств из счета смягчения в депозиты коммерческих банков на торговой площадке ЗАО «Кыргызская фондовая биржа»",
  icons: {
    icon: "/images/logo_KSE.png",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
              <footer className="border-t py-6 bg-primary/5">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Image src="/images/logo_KSE.png" alt="KSE Logo" width={30} height={30} />
                    <span className="text-sm text-gray-600">
                      © {new Date().getFullYear()} Кыргызская фондовая биржа
                    </span>
                  </div>
                  <div className="flex gap-6">
                    <a href="#" className="text-sm text-gray-600 hover:text-primary">
                      Контакты
                    </a>
                    <a href="#" className="text-sm text-gray-600 hover:text-primary">
                      Правила
                    </a>
                    <a href="#" className="text-sm text-gray-600 hover:text-primary">
                      Помощь
                    </a>
                  </div>
                </div>
              </footer>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
