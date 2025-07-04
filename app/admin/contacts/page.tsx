import { getAllContacts } from "@/lib/contacts-service"
import ContactsClientPage from "./client-page"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ContactsPage() {
  const contacts = await getAllContacts()

  return <ContactsClientPage initialContacts={contacts} />
}
