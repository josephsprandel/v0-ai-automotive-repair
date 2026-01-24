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
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {selectedCustomerId ? (
              <CustomerProfile customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
            ) : (
              <CustomerSearch onSelectCustomer={setSelectedCustomerId} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
