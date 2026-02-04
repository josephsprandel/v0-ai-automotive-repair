"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function ReceivingTab() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="Search or scan PO number..." className="bg-card border-border max-w-xs" />
        <Button>Look Up</Button>
      </div>
      <div className="border border-border rounded-lg p-6 text-center text-muted-foreground">
        <p>Enter a PO number to receive items and update inventory</p>
      </div>
    </div>
  )
}
