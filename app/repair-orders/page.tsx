import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ROListView } from "@/components/repair-orders/ro-list-view"

export default function RepairOrdersPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 min-h-0">
          <ROListView />
        </main>
      </div>
    </div>
  )
}
