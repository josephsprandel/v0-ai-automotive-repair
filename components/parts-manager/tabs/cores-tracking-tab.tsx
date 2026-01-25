"use client"

import { Button } from "@/components/ui/button"

export function CoresTrackingTab() {
  const cores = [
    { id: 1, part: "Alternator", coreCharge: "$35.00", pending: 3, totalValue: "$105.00" },
    { id: 2, part: "Water Pump", coreCharge: "$25.00", pending: 1, totalValue: "$25.00" },
    { id: 3, part: "Starter Motor", coreCharge: "$50.00", pending: 2, totalValue: "$100.00" },
  ]

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Part</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Core Charge</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Qty Pending Return</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Value</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cores.map((core) => (
              <tr key={core.id} className="border-b border-border hover:bg-card/50">
                <td className="px-4 py-3 font-medium text-foreground">{core.part}</td>
                <td className="px-4 py-3 text-right text-foreground">{core.coreCharge}</td>
                <td className="px-4 py-3 text-center text-foreground font-medium">{core.pending}</td>
                <td className="px-4 py-3 text-right text-foreground font-bold text-green-600 dark:text-green-400">
                  {core.totalValue}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" className="h-7 bg-transparent">
                    Return Label
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
