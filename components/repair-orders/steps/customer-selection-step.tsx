"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Check, Phone, Mail, Star, User } from "lucide-react"
import type { CustomerData } from "../ro-creation-wizard"

interface CustomerSelectionStepProps {
  selectedCustomer: CustomerData | null
  onSelectCustomer: (customer: CustomerData | null) => void
}

const existingCustomers = [
  {
    id: "cust-001",
    name: "John Mitchell",
    phone: "(555) 234-5678",
    email: "john.mitchell@email.com",
    status: "active",
    totalServices: 12,
    rating: 5,
  },
  {
    id: "cust-002",
    name: "Sarah Johnson",
    phone: "(555) 345-6789",
    email: "sarah.j@email.com",
    status: "active",
    totalServices: 8,
    rating: 4,
  },
  {
    id: "cust-003",
    name: "Mike Chen",
    phone: "(555) 456-7890",
    email: "mchen@email.com",
    status: "vip",
    totalServices: 15,
    rating: 5,
  },
  {
    id: "cust-004",
    name: "Emma Rodriguez",
    phone: "(555) 567-8901",
    email: "emma.r@email.com",
    status: "active",
    totalServices: 3,
    rating: 3,
  },
]

export function CustomerSelectionStep({ selectedCustomer, onSelectCustomer }: CustomerSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newCustomer, setNewCustomer] = useState<CustomerData>({
    name: "",
    phone: "",
    email: "",
    isNew: true,
  })

  const filteredCustomers = useMemo(() => {
    return existingCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const handleSelectExisting = (customer: typeof existingCustomers[0]) => {
    setIsCreatingNew(false)
    onSelectCustomer({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      isNew: false,
    })
  }

  const handleCreateNew = () => {
    setIsCreatingNew(true)
    onSelectCustomer(null)
  }

  const handleNewCustomerChange = (field: keyof CustomerData, value: string) => {
    const updated = { ...newCustomer, [field]: value }
    setNewCustomer(updated)
    if (updated.name && updated.phone) {
      onSelectCustomer(updated)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">Select Customer</h2>
        <p className="text-sm text-muted-foreground">
          Search for an existing customer or create a new one
        </p>
      </div>

      {/* Search and Create New */}
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
        <Button
          variant={isCreatingNew ? "default" : "outline"}
          onClick={handleCreateNew}
          className={isCreatingNew ? "" : "bg-transparent"}
        >
          <Plus size={18} className="mr-2" />
          New Customer
        </Button>
      </div>

      {/* New Customer Form */}
      {isCreatingNew && (
        <Card className="p-5 border-border bg-muted/30">
          <h3 className="font-medium text-foreground mb-4">New Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Name *</label>
              <Input
                placeholder="Full name"
                value={newCustomer.name}
                onChange={(e) => handleNewCustomerChange("name", e.target.value)}
                className="bg-card border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone *</label>
              <Input
                placeholder="(555) 123-4567"
                value={newCustomer.phone}
                onChange={(e) => handleNewCustomerChange("phone", e.target.value)}
                className="bg-card border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
              <Input
                placeholder="email@example.com"
                value={newCustomer.email}
                onChange={(e) => handleNewCustomerChange("email", e.target.value)}
                className="bg-card border-border"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Existing Customers List */}
      {!isCreatingNew && (
        <div className="space-y-2">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => {
              const isSelected = selectedCustomer?.id === customer.id
              return (
                <Card
                  key={customer.id}
                  onClick={() => handleSelectExisting(customer)}
                  className={`p-4 border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{customer.name}</h3>
                          {customer.status === "vip" && (
                            <Star size={14} className="text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
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
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {customer.totalServices} services
                      </Badge>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check size={14} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <Card className="p-12 border-border text-center">
              <User className="mx-auto text-muted-foreground mb-3" size={32} />
              <p className="text-muted-foreground">No customers found</p>
              <Button variant="link" onClick={handleCreateNew} className="mt-2">
                Create new customer
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
