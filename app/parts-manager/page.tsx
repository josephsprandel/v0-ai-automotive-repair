"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { PartsManagerDashboard } from "@/components/parts-manager/parts-manager-dashboard"

export default function PartsManagerPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <PartsManagerDashboard />
        </main>
      </div>
    </div>
  )
}
