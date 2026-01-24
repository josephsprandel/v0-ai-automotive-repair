"use client"

import { Bell, Search, Clock, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Search ROs, customers, vehicles..."
              className="pl-10 bg-card border-border placeholder:text-muted-foreground focus:ring-accent"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4 ml-4">
          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-muted-foreground">
            <Clock size={16} />
            <span>Shop: Open</span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
          </Button>

          {/* Alert badge */}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-2 bg-transparent"
          >
            <AlertCircle size={16} />
            <span>3 Alerts</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
