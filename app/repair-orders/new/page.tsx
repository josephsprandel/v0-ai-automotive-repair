"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ROCreationWizard } from "@/components/repair-orders/ro-creation-wizard"
import { useSearchParams } from "next/navigation"

export default function NewROPage() {
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customerId") || undefined

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <ROCreationWizard initialCustomerId={customerId} />
        </main>
      </div>
    </div>
  )
}
