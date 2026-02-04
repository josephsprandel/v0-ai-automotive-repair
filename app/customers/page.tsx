"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { CustomerSearch } from "@/components/customers/customer-search"
import { CustomerProfile } from "@/components/customers/customer-profile"

export default function CustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 min-h-0">
          {selectedCustomerId ? (
            <CustomerProfile customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
          ) : (
            <CustomerSearch onSelectCustomer={setSelectedCustomerId} />
          )}
        </main>
      </div>
    </div>
  )
}
