"use client"

import { Button } from "@/components/ui/button"

export function VendorManagementTab() {
  const vendors = [
    { id: 1, name: "NAPA Auto Parts", phone: "(555) 123-4567", email: "sales@napa.com", totalSpend: "$25,450", lastOrder: "Jan 20" },
    { id: 2, name: "O'Reilly Auto Parts", phone: "(555) 234-5678", email: "info@orielly.com", totalSpend: "$18,200", lastOrder: "Jan 19" },
    { id: 3, name: "SSF Imported Auto", phone: "(555) 345-6789", email: "orders@ssf.com", totalSpend: "$12,890", lastOrder: "Jan 15" },
  ]

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vendor</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Spend</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Order</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="border-b border-border hover:bg-card/50">
                <td className="px-4 py-3 font-medium text-foreground">{vendor.name}</td>
                <td className="px-4 py-3 text-foreground">{vendor.phone}</td>
                <td className="px-4 py-3 text-foreground">{vendor.email}</td>
                <td className="px-4 py-3 text-right text-foreground font-medium">{vendor.totalSpend}</td>
                <td className="px-4 py-3 text-muted-foreground">{vendor.lastOrder}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" className="h-7 bg-transparent">
                    View
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
