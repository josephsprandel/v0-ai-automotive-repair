"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ROListView } from "@/components/repair-orders/ro-list-view"
import { RODetailView } from "@/components/repair-orders/ro-detail-view"

export default function RepairOrdersPage() {
  const [selectedROId, setSelectedROId] = useState<string | null>(null)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {selectedROId ? (
            <div className="p-6">
              <RODetailView roId={selectedROId} onClose={() => setSelectedROId(null)} />
            </div>
          ) : (
            <div className="p-6">
              <ROListView onSelectRO={setSelectedROId} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
