"use client"

import { useParams } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { CustomerProfile } from "@/components/customers/customer-profile"

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params?.id as string

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <CustomerProfile customerId={customerId} />
          </div>
        </main>
      </div>
    </div>
  )
}
