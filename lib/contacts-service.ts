export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  createdAt: string
  updatedAt: string
}

// Получение всех контактов
export async function getAllContacts(): Promise<Contact[]> {
  try {
    const response = await fetch("https://api.adb-solution.com/contacts", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Error fetching contacts: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return []
  }
}

// Получение контакта по ID
export async function getContactById(id: string): Promise<Contact | null> {
  try {
    const response = await fetch(`https://api.adb-solution.com/contact/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Error fetching contact: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch contact with ID ${id}:`, error)
    return null
  }
}

// Создание нового контакта
export async function createContact(
  contactData: Omit<Contact, "id" | "createdAt" | "updatedAt">,
): Promise<Contact | null> {
  try {
    const response = await fetch("https://api.adb-solution.com/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    })

    if (!response.ok) {
      throw new Error(`Error creating contact: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to create contact:", error)
    return null
  }
}

// Обновление контакта
export async function updateContact(id: string, contactData: Partial<Contact>): Promise<Contact | null> {
  try {
    const response = await fetch(`https://api.adb-solution.com/contact/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    })

    if (!response.ok) {
      throw new Error(`Error updating contact: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to update contact with ID ${id}:`, error)
    return null
  }
}

// Удаление контакта
export async function deleteContact(id: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.adb-solution.com/contact/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Error deleting contact: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error(`Failed to delete contact with ID ${id}:`, error)
    return false
  }
}
