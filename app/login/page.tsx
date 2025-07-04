import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import LoginForm from "@/components/login-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Вход в систему | ADB SOLUTION",
  description: "Вход в административную панель ADB SOLUTION",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12">
        <div className="container max-w-md px-4">
          <LoginForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
