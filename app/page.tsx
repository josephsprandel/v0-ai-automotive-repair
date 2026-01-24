"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Dashboard } from "@/components/dashboard/dashboard"

export default function Home() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Dashboard />
        </main>
      </div>
    </div>
  )
}
