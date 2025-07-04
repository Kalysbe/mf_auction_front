"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { type Contact, deleteContact, updateContact } from "@/lib/contacts-service"
import { MoreHorizontal, Eye, Edit, Trash2, Search } from "lucide-react"

interface ContactsTableProps {
  contacts: Contact[]
  onContactDeleted: () => void
  onContactUpdated: () => void
}

export default function ContactsTable({ contacts, onContactDeleted, onContactUpdated }: ContactsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewContact, setViewContact] = useState<Contact | null>(null)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Форма редактирования
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  })

  // Обработка изменения полей формы
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Открыть диалог просмотра контакта
  const handleViewContact = (contact: Contact) => {
    setViewContact(contact)
  }

  // Открыть диалог редактирования контакта
  const handleEditContact = (contact: Contact) => {
    setEditContact(contact)
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      message: contact.message,
    })
  }

  // Открыть диалог удаления контакта
  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact)
    setDeleteDialogOpen(true)
  }

  // Подтвердить удаление контакта
  const confirmDelete = async () => {
    if (!contactToDelete) return

    setIsSubmitting(true)
    try {
      const success = await deleteContact(contactToDelete.id)
      if (success) {
        toast({
          title: "Контакт удален",
          description: "Контакт был успешно удален из системы",
        })
        setDeleteDialogOpen(false)
        onContactDeleted()
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить контакт",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении контакта",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Сохранить изменения контакта
  const handleSaveContact = async () => {
    if (!editContact) return

    setIsSubmitting(true)
    try {
      const updated = await updateContact(editContact.id, formData)
      if (updated) {
        toast({
          title: "Контакт обновлен",
          description: "Контакт был успешно обновлен",
        })
        setEditContact(null)
        onContactUpdated()
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить контакт",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при обновлении контакта",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Фильтрация контактов по поисковому запросу
  const filteredContacts = contacts.filter((contact) => {
    const searchString = searchTerm.toLowerCase()
    return (
      contact.firstName.toLowerCase().includes(searchString) ||
      contact.lastName.toLowerCase().includes(searchString) ||
      contact.email.toLowerCase().includes(searchString) ||
      contact.phone.toLowerCase().includes(searchString) ||
      contact.message.toLowerCase().includes(searchString)
    )
  })

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Поиск контактов..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Таблица контактов */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>{formatDate(contact.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Открыть меню</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewContact(contact)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Просмотр</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Редактировать</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(contact)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Удалить</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {contacts.length === 0 ? "Нет доступных контактов" : "Контакты не найдены"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Диалог просмотра контакта */}
      <Dialog open={viewContact !== null} onOpenChange={(open) => !open && setViewContact(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Просмотр контакта</DialogTitle>
          </DialogHeader>
          {viewContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Имя</Label>
                  <p>{viewContact.firstName}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Фамилия</Label>
                  <p>{viewContact.lastName}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Email</Label>
                <p>{viewContact.email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Телефон</Label>
                <p>{viewContact.phone}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Сообщение</Label>
                <p className="whitespace-pre-wrap">{viewContact.message}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Дата создания</Label>
                <p>{formatDate(viewContact.createdAt)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewContact(null)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования контакта */}
      <Dialog open={editContact !== null} onOpenChange={(open) => !open && setEditContact(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование контакта</DialogTitle>
          </DialogHeader>
          {editContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Сообщение</Label>
                <Textarea id="message" name="message" rows={4} value={formData.message} onChange={handleInputChange} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContact(null)}>
              Отмена
            </Button>
            <Button onClick={handleSaveContact} disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этот контакт? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
