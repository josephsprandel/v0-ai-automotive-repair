"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Plus } from "lucide-react"

export function PartsInventoryTab() {
  const [searchTerm, setSearchTerm] = useState("")

  const parts = [
    {
      id: 1,
      partNumber: "21040",
      name: "NAPA/PROSELECT FILTERS-SFI Engine Oil Filter",
      qty: 47,
      minQty: 10,
      maxQty: 100,
      location: "Oil_Filters",
      cost: "$4.73",
      retail: "$8.60",
      status: "green",
    },
    {
      id: 2,
      partNumber: "3718",
      name: "MicroCard Cabin Air Filter",
      qty: 8,
      minQty: 5,
      maxQty: 25,
      location: "Filters",
      cost: "$7.39",
      retail: "$24.47",
      status: "yellow",
    },
    {
      id: 3,
      partNumber: "23604",
      name: "Gates Radiator Coolant Hose",
      qty: 2,
      minQty: 5,
      maxQty: 20,
      location: "Hoses",
      cost: "$43.68",
      retail: "$120.95",
      status: "red",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by part number, description, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          Filter
        </Button>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download size={16} />
          Export
        </Button>
      </div>

      {/* Parts Table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Part Number</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Qty on Hand</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Min / Max</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost / Retail</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => (
              <tr key={part.id} className="border-b border-border hover:bg-card/50">
                <td className="px-4 py-3 font-mono text-foreground">{part.partNumber}</td>
                <td className="px-4 py-3 text-foreground">{part.name}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-3 py-1 rounded-full font-medium text-sm ${
                      part.status === "green"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : part.status === "yellow"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {part.qty}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {part.minQty} / {part.maxQty}
                </td>
                <td className="px-4 py-3 text-foreground">{part.location}</td>
                <td className="px-4 py-3 text-right text-foreground">
                  {part.cost} / {part.retail}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="h-7 bg-transparent">
                      Add to RO
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 bg-transparent">
                      Reorder
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
