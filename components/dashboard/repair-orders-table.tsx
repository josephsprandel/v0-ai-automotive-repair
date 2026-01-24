"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, MessageSquare, CheckCircle2, Clock, AlertCircle } from "lucide-react"

export function RepairOrdersTable() {
  const repairOrders = [
    {
      id: "RO-4521",
      customer: "John Mitchell",
      vehicle: "2022 Tesla Model 3",
      service: "Battery Diagnostic",
      status: "awaiting_approval",
      statusLabel: "Awaiting Approval",
      estimated: "$1,250",
      timeLeft: "45 min",
    },
    {
      id: "RO-4520",
      customer: "Sarah Johnson",
      vehicle: "2020 BMW X5",
      service: "Brake Pad Replacement",
      status: "in_progress",
      statusLabel: "In Progress",
      estimated: "$450",
      timeLeft: "1h 15m",
    },
    {
      id: "RO-4519",
      customer: "Mike Chen",
      vehicle: "2019 Honda Civic",
      service: "Oil Change + Filter",
      status: "ready",
      statusLabel: "Ready for Pickup",
      estimated: "$89",
      timeLeft: "Ready",
    },
    {
      id: "RO-4518",
      customer: "Emma Rodriguez",
      vehicle: "2021 Ford F-150",
      service: "Transmission Flush",
      status: "completed",
      statusLabel: "Completed",
      estimated: "$350",
      timeLeft: "Completed",
    },
    {
      id: "RO-4517",
      customer: "David Park",
      vehicle: "2023 Hyundai Sonata",
      service: "Air Conditioning Service",
      status: "in_progress",
      statusLabel: "In Progress",
      estimated: "$280",
      timeLeft: "2h 30m",
    },
  ]

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "awaiting_approval":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      case "ready":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
      case "completed":
        return "bg-muted text-muted-foreground"
      default:
        return ""
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "awaiting_approval":
        return <AlertCircle size={14} />
      case "in_progress":
        return <Clock size={14} />
      case "ready":
        return <CheckCircle2 size={14} />
      default:
        return null
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 font-semibold text-muted-foreground">RO ID</th>
              <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Customer</th>
              <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Vehicle</th>
              <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Service</th>
              <th className="text-left px-6 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-right px-6 py-3 font-semibold text-muted-foreground">Est. Cost</th>
              <th className="text-right px-6 py-3 font-semibold text-muted-foreground">Time Left</th>
              <th className="text-center px-6 py-3 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {repairOrders.map((ro) => (
              <tr key={ro.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-semibold text-foreground">{ro.id}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-foreground">{ro.customer}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{ro.vehicle}</td>
                <td className="px-6 py-4 text-muted-foreground">{ro.service}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={`${getStatusStyles(ro.status)} gap-1 border`}>
                    {getStatusIcon(ro.status)}
                    {ro.statusLabel}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right font-medium text-foreground">{ro.estimated}</td>
                <td className="px-6 py-4 text-right text-muted-foreground text-xs">{ro.timeLeft}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent">
                      <MessageSquare size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
