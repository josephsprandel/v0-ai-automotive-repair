"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Phone, Mail, MapPin, Star, Plus, Filter } from "lucide-react"

export function CustomerSearch({ onSelectCustomer }: { onSelectCustomer?: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const customers = [
    {
      id: "cust-001",
      name: "John Mitchell",
      phone: "(555) 234-5678",
      email: "john.mitchell@email.com",
      address: "123 Main St, Denver, CO",
      totalServices: 12,
      lastService: "2024-01-10",
      rating: 5,
      status: "active",
      vehicles: 2,
      totalSpent: "$4,250",
    },
    {
      id: "cust-002",
      name: "Sarah Johnson",
      phone: "(555) 345-6789",
      email: "sarah.j@email.com",
      address: "456 Oak Ave, Denver, CO",
      totalServices: 8,
      lastService: "2024-01-08",
      rating: 4,
      status: "active",
      vehicles: 1,
      totalSpent: "$2,100",
    },
    {
      id: "cust-003",
      name: "Mike Chen",
      phone: "(555) 456-7890",
      email: "mchen@email.com",
      address: "789 Pine Rd, Boulder, CO",
      totalServices: 15,
      lastService: "2024-01-12",
      rating: 5,
      status: "vip",
      vehicles: 3,
      totalSpent: "$8,500",
    },
    {
      id: "cust-004",
      name: "Emma Rodriguez",
      phone: "(555) 567-8901",
      email: "emma.r@email.com",
      address: "321 Elm St, Denver, CO",
      totalServices: 3,
      lastService: "2024-01-05",
      rating: 3,
      status: "active",
      vehicles: 1,
      totalSpent: "$850",
    },
    {
      id: "cust-005",
      name: "David Park",
      phone: "(555) 678-9012",
      email: "d.park@email.com",
      address: "654 Maple Dr, Denver, CO",
      totalServices: 6,
      lastService: "2023-12-28",
      rating: 4,
      status: "inactive",
      vehicles: 2,
      totalSpent: "$1,900",
    },
  ]

  const filters = ["Active", "VIP", "Inactive", "High Value", "Recently Visited"]

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())

      if (selectedFilters.length === 0) return matchesSearch

      return (
        matchesSearch &&
        selectedFilters.some((filter) => {
          if (filter === "Active") return customer.status === "active"
          if (filter === "VIP") return customer.status === "vip"
          if (filter === "Inactive") return customer.status === "inactive"
          if (filter === "High Value") return Number.parseInt(customer.totalSpent.replace(/\D/g, "")) > 3000
          if (filter === "Recently Visited") return new Date(customer.lastService) > new Date("2024-01-01")
          return false
        })
      )
    })
  }, [searchTerm, selectedFilters])

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Customers</h1>
        <p className="text-sm text-muted-foreground">Search and manage customer profiles</p>
      </div>

      {/* Search and actions */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="bg-transparent">
          <Filter size={18} />
        </Button>
        <Button size="icon" className="gap-2">
          <Plus size={18} />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 border-border">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilters.includes(filter)
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          {selectedFilters.length > 0 && (
            <button
              onClick={() => setSelectedFilters([])}
              className="mt-3 text-sm text-accent hover:underline flex items-center gap-1"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </Card>
      )}

      {/* Results */}
      <div className="space-y-3">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="p-5 border-border cursor-pointer hover:bg-muted/30 transition-colors group"
              onClick={() => onSelectCustomer?.(customer.id)}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center text-accent-foreground font-bold text-lg flex-shrink-0">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-foreground">{customer.name}</h3>
                        {customer.status === "vip" && <Star size={16} className="text-amber-500 fill-amber-500" />}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {customer.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail size={14} />
                          {customer.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary info */}
                  <div className="ml-16 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={14} />
                      {customer.address}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{customer.totalServices} services</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {customer.vehicles} vehicle{customer.vehicles !== 1 ? "s" : ""}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-semibold text-foreground">{customer.totalSpent}</span>
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge
                    className={`${
                      customer.status === "vip"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                        : customer.status === "active"
                          ? "bg-green-500/20 text-green-700 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {customer.status === "vip" ? "VIP" : customer.status === "active" ? "Active" : "Inactive"}
                  </Badge>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < customer.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground text-right">
                    Last service
                    <br />
                    {customer.lastService}
                  </p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 border-border text-center">
            <Search className="mx-auto text-muted-foreground mb-3" size={32} />
            <p className="text-muted-foreground">No customers found</p>
          </Card>
        )}
      </div>
    </div>
  )
}
