"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/protected-route"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { UserRole } from "@/contexts/auth-context"
import { useAuth } from "@/contexts/auth-context"
import { authAPI } from "@/lib/api"

export default function UsersManagementPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<{
    id: string
    email: string
    name: string
    role: UserRole
    createdAt: string
    is_verified: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true)
      console.log("[v0] Загружаю список пользователей с сервера...")

      const userList = await authAPI.getUserList()
      console.log("[v0] Получен список пользователей:", userList)

      setUsers(userList)
    } catch (error) {
      console.error("[v0] Ошибка загрузки пользователей:", error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  useEffect(() => {
    console.log("[v0] Current user from /api/auth/me:", user)
    console.log("[v0] User role for admin access:", user?.role)

    if (user && user.role !== "admin") {
      console.log("[v0] Access denied: user is not admin")
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав для управления пользователями",
        variant: "destructive",
      })
    } else if (user && user.role === "admin") {
      loadUsers()
    }
  }, [user, toast])

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
    })
  }

  const [formData, setFormData] = useState({
    email: "",
    name: "",
  })

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("[v0] Creating user with admin role check:", user?.role)
      console.log("[v0] Creating user with login:", formData.email)

      if (user?.role !== "admin") {
        throw new Error("Недостаточно прав для создания пользователя")
      }

      const newUser = await authAPI.createUser(formData.email, formData.name)
      console.log("[v0] User created successfully:", newUser)

      // Обновляем список пользователей
      await loadUsers()

      setShowCreateDialog(false)
      resetForm()

      toast({
        title: "Пользователь создан",
        description: `Пользователь ${formData.name} успешно создан`,
      })
    } catch (error) {
      console.error("[v0] Error creating user:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать пользователя",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return

    try {
      console.log("[v0] Deleting user:", userId)
      setUsers((prev) => prev.filter((user) => user.id !== userId))

      toast({
        title: "Пользователь удален",
        description: "Пользователь успешно удален из системы",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "initiator":
        return "bg-blue-100 text-blue-800"
      case "bank":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Администратор"
      case "initiator":
        return "Инициатор"
      case "bank":
        return "Банк"
      default:
        return "Пользователь"
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Проверка прав доступа...</p>
        </div>
      </div>
    )
  }

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600">У вас нет прав для управления пользователями</p>
          <p className="text-sm text-gray-500 mt-2">Текущая роль: {user.role}</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/images/logo_KSE.png" alt="KSE Logo" width={50} height={50} />
            <h1 className="text-2xl font-bold">Управление пользователями</h1>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-600">
                <Plus className="h-4 w-4 mr-2" />
                Создать пользователя
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Создание нового пользователя</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Логин</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Введите логин пользователя"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Имя/Название</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false)
                      resetForm()
                    }}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Создание..." : "Создать"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">Список пользователей</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Загрузка пользователей...</span>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Логин</TableHead>
                    <TableHead>Имя/Название</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Верификация</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>{getRoleText(user.role)}</Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString("ru-RU")}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_verified ? "default" : "secondary"}>
                          {user.is_verified ? "Верифицирован" : "Не верифицирован"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="border-red-500 text-red-600 hover:bg-red-50"
                            disabled={user.role === "admin"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Нет пользователей в системе
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
