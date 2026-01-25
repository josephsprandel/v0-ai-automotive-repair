"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit2, Mail, Phone, MessageSquare, MapPin, Calendar, DollarSign } from "lucide-react"
import { VehicleManagement } from "./vehicle-management"

export function CustomerProfile({ customerId = "cust-001", onClose }: { customerId?: string; onClose?: () => void }) {
  const customer = {
    id: customerId,
    name: "John Mitchell",
    phone: "(555) 234-5678",
    email: "john.mitchell@email.com",
    address: "123 Main St, Denver, CO 80202",
    joinDate: "2022-03-15",
    totalServices: 12,
    totalSpent: "$4,250",
    status: "active",
    rating: 5,
    notes: "Preferred customer - always uses premium services. Responds well to email communication.",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
              <ArrowLeft size={20} />
            </Button>
          )}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center text-accent-foreground font-bold text-2xl">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Active Customer</Badge>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < customer.rating ? "text-amber-500" : "text-muted-foreground"}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Button size="icon" className="gap-2">
          <Edit2 size={18} />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="p-6 border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-accent flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-accent flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-accent flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">{customer.address}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button size="sm" variant="outline" className="gap-2 flex-1 bg-transparent">
                <MessageSquare size={16} />
                Send SMS
              </Button>
              <Button size="sm" variant="outline" className="gap-2 flex-1 bg-transparent">
                <Phone size={16} />
                Call
              </Button>
              <Button size="sm" variant="outline" className="gap-2 flex-1 bg-transparent">
                <Mail size={16} />
                Email
              </Button>
            </div>
          </Card>

          {/* Vehicles */}
          <VehicleManagement customerId={customerId} />

          {/* Notes */}
          <Card className="p-6 border-border">
            <h2 className="text-lg font-semibold text-foreground mb-3">Customer Notes</h2>
            <p className="text-foreground bg-muted/30 p-3 rounded-lg border border-border">{customer.notes}</p>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card className="p-6 border-border">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">STATISTICS</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={16} className="text-accent" />
                  <p className="text-sm text-muted-foreground">Customer Since</p>
                </div>
                <p className="font-semibold text-foreground">{customer.joinDate}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="text-accent" />
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <p className="font-semibold text-foreground text-xl">{customer.totalSpent}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Services</p>
                <p className="font-semibold text-foreground text-2xl">{customer.totalServices}</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button className="w-full">Create New RO</Button>
            <Button variant="outline" className="w-full bg-transparent">
              View History
            </Button>
            <Button variant="outline" className="w-full bg-transparent">
              Schedule Appointment
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
