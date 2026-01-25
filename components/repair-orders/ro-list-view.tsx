"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Download, ChevronRight, Search } from "lucide-react"
import Link from "next/link"

export function ROListView({ onSelectRO }: { onSelectRO?: (roId: string) => void }) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filters = [
    { id: "all", label: "All ROs", count: 24 },
    { id: "awaiting", label: "Awaiting Approval", count: 8 },
    { id: "in_progress", label: "In Progress", count: 12 },
    { id: "ready", label: "Ready for Pickup", count: 3 },
    { id: "completed", label: "Completed Today", count: 15 },
  ]

  const repairOrders = [
    {
      id: "RO-4521",
      customer: "John Mitchell",
      vehicle: "2022 Tesla Model 3",
      service: "Battery Diagnostic",
      status: "awaiting_approval",
      time: "45 min left",
      cost: "$1,250",
      priority: "high",
    },
    {
      id: "RO-4520",
      customer: "Sarah Johnson",
      vehicle: "2020 BMW X5",
      service: "Brake Pad Replacement",
      status: "in_progress",
      time: "1h 15m left",
      cost: "$450",
      priority: "normal",
    },
    {
      id: "RO-4519",
      customer: "Mike Chen",
      vehicle: "2019 Honda Civic",
      service: "Oil Change + Filter",
      status: "ready",
      time: "Ready",
      cost: "$89",
      priority: "low",
    },
    {
      id: "RO-4518",
      customer: "Emma Rodriguez",
      vehicle: "2021 Ford F-150",
      service: "Transmission Flush",
      status: "completed",
      time: "Completed",
      cost: "$350",
      priority: "normal",
    },
    {
      id: "RO-4517",
      customer: "David Park",
      vehicle: "2023 Hyundai Sonata",
      service: "Air Conditioning Service",
      status: "in_progress",
      time: "2h 30m left",
      cost: "$280",
      priority: "normal",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_approval":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "ready":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "completed":
        return "bg-muted text-muted-foreground"
      default:
        return ""
    }
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === "high") return "bg-destructive/20 text-destructive border-destructive/30"
    if (priority === "low") return "bg-muted text-muted-foreground"
    return "bg-muted/50 text-muted-foreground"
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-2">Repair Orders</h1>
          <p className="text-sm text-muted-foreground">Manage all active and completed service orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download size={16} />
            Export
          </Button>
          <Link href="/repair-orders/new">
            <Button size="sm" className="gap-2">
              <Plus size={16} />
              New RO
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by customer, vehicle, or RO ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition-colors ${
                selectedFilter === filter.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {filter.label}
              <span className="ml-2 opacity-70">({filter.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* RO Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {repairOrders.map((ro) => (
          <Card
            key={ro.id}
            className="p-5 border-border cursor-pointer hover:bg-muted/30 transition-colors group"
            onClick={() => onSelectRO?.(ro.id)}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-foreground">{ro.id}</h3>
                    <Badge variant="outline" className={`text-xs ${getPriorityBadge(ro.priority)}`}>
                      {ro.priority === "high" && "🔴 High"}
                      {ro.priority === "normal" && "○ Normal"}
                      {ro.priority === "low" && "○ Low"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{ro.customer}</p>
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-accent transition-colors" size={20} />
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{ro.vehicle}</span>
                  <span className="font-semibold text-foreground">{ro.cost}</span>
                </div>
                <p className="text-muted-foreground">{ro.service}</p>
              </div>

              {/* Status and time */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Badge variant="outline" className={getStatusColor(ro.status)}>
                  {ro.status === "awaiting_approval" && "⏳ Awaiting Approval"}
                  {ro.status === "in_progress" && "⚙ In Progress"}
                  {ro.status === "ready" && "✓ Ready"}
                  {ro.status === "completed" && "✓ Completed"}
                </Badge>
                <span className="text-xs text-muted-foreground">{ro.time}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
