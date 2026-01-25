"use client"

import React from "react"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Plus,
  Printer,
  MessageSquare,
  Phone,
  Check,
  Clock,
  AlertCircle,
  ChevronRight,
  User,
} from "lucide-react"
import type { ServiceData, LineItem } from "./ro-creation-wizard"
import { EditableServiceCard, createLineItem } from "./editable-service-card"

// Sample data with new structure
const createInitialServices = (): ServiceData[] => [
  {
    id: "svc-1",
    name: "Battery Diagnostic",
    description: "Complete battery system diagnostic and testing",
    estimatedCost: 450,
    estimatedTime: "1 hr",
    category: "Diagnostic",
    status: "completed",
    parts: [
      { id: "p1", description: "Battery terminal connectors", quantity: 2, unitPrice: 15, total: 30 },
    ],
    labor: [
      { id: "l1", description: "Diagnostic labor", quantity: 1, unitPrice: 150, total: 150 },
      { id: "l2", description: "Battery testing", quantity: 0.5, unitPrice: 150, total: 75 },
    ],
    sublets: [],
    hazmat: [{ id: "h1", description: "Battery disposal fee", quantity: 1, unitPrice: 25, total: 25 }],
    fees: [{ id: "f1", description: "Shop supplies", quantity: 1, unitPrice: 20, total: 20 }],
  },
  {
    id: "svc-2",
    name: "Software Update",
    description: "Vehicle computer software update and calibration",
    estimatedCost: 500,
    estimatedTime: "1.5 hrs",
    category: "Maintenance",
    status: "in_progress",
    parts: [],
    labor: [
      { id: "l3", description: "Software update labor", quantity: 1.5, unitPrice: 150, total: 225 },
      { id: "l4", description: "System calibration", quantity: 1, unitPrice: 175, total: 175 },
    ],
    sublets: [{ id: "s1", description: "OEM software license", quantity: 1, unitPrice: 75, total: 75 }],
    hazmat: [],
    fees: [{ id: "f2", description: "Data transfer fee", quantity: 1, unitPrice: 25, total: 25 }],
  },
  {
    id: "svc-3",
    name: "Calibration Service",
    description: "Sensor calibration and alignment",
    estimatedCost: 300,
    estimatedTime: "45 min",
    category: "Maintenance",
    status: "pending",
    parts: [
      { id: "p2", description: "Calibration targets", quantity: 1, unitPrice: 50, total: 50 },
    ],
    labor: [{ id: "l5", description: "Calibration labor", quantity: 1, unitPrice: 150, total: 150 }],
    sublets: [],
    hazmat: [],
    fees: [{ id: "f3", description: "Equipment usage", quantity: 1, unitPrice: 50, total: 50 }],
  },
]

export function RODetailView({ roId = "RO-4521", onClose }: { roId?: string; onClose?: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [services, setServices] = useState<ServiceData[]>(createInitialServices)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [roData, setRoData] = useState({
    id: roId,
    customer: "John Mitchell",
    email: "john.mitchell@email.com",
    phone: "(555) 234-5678",
    vehicle: "2022 Tesla Model 3",
    vin: "5YJ3E1EA2PF123456",
    mileage: "24,500",
    status: "awaiting_approval",
    createdDate: "2024-01-12",
    dueDate: "2024-01-15",
    advisor: "Sarah Chen",
    technician: "Mike Rodriguez",
  })

  const totals = useMemo(() => {
    const initial = { parts: 0, labor: 0, sublets: 0, hazmat: 0, fees: 0, total: 0 }
    return services.reduce((acc, svc) => {
      const partsSum = svc.parts.reduce((sum, item) => sum + item.total, 0)
      const laborSum = svc.labor.reduce((sum, item) => sum + item.total, 0)
      const subletsSum = svc.sublets.reduce((sum, item) => sum + item.total, 0)
      const hazmatSum = svc.hazmat.reduce((sum, item) => sum + item.total, 0)
      const feesSum = svc.fees.reduce((sum, item) => sum + item.total, 0)
      return {
        parts: acc.parts + partsSum,
        labor: acc.labor + laborSum,
        sublets: acc.sublets + subletsSum,
        hazmat: acc.hazmat + hazmatSum,
        fees: acc.fees + feesSum,
        total: acc.total + partsSum + laborSum + subletsSum + hazmatSum + feesSum,
      }
    }, initial)
  }, [services])

  const handleSave = () => {
    setIsEditing(false)
  }

  const updateService = (updated: ServiceData) => {
    setServices(services.map((s) => (s.id === updated.id ? updated : s)))
  }

  const removeService = (id: string) => {
    setServices(services.filter((s) => s.id !== id))
  }

  const addService = () => {
    const newService: ServiceData = {
      id: `svc-${Date.now()}`,
      name: "New Service",
      description: "",
      estimatedCost: 0,
      estimatedTime: "TBD",
      category: "Custom",
      status: "pending",
      parts: [],
      labor: [],
      sublets: [],
      hazmat: [],
      fees: [],
    }
    setServices([...services, newService])
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newServices = [...services]
      const [removed] = newServices.splice(dragIndex, 1)
      newServices.splice(dragOverIndex, 0, removed)
      setServices(newServices)
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  // Workflow stages for horizontal bar
  const stages = [
    {
      id: "intake",
      label: "Intake",
      icon: AlertCircle,
      active: false,
      completed: true,
    },
    {
      id: "diagnostic",
      label: "Diagnostic",
      icon: Clock,
      active: true,
      completed: false,
    },
    {
      id: "approval",
      label: "Approval",
      icon: AlertCircle,
      active: false,
      completed: false,
    },
    {
      id: "service",
      label: "Service",
      icon: Clock,
      active: false,
      completed: false,
    },
    {
      id: "completion",
      label: "Complete",
      icon: Check,
      active: false,
      completed: false,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
              <ArrowLeft size={20} />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{roData.id}</h1>
            <p className="text-sm text-muted-foreground">
              {roData.customer} • {roData.vehicle} • {roData.vin}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Printer size={16} />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          {isEditing && (
            <Button size="sm" onClick={handleSave} className="gap-2">
              <Save size={16} />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Horizontal Status Workflow Bar */}
      <Card className="p-4 border-border">
        <div className="flex items-center justify-between overflow-x-auto">
          {stages.map((stage, idx) => {
            const Icon = stage.icon
            return (
              <div key={stage.id} className="flex items-center gap-3 flex-shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    stage.completed
                      ? "bg-green-500/20 text-green-600 dark:text-green-400"
                      : stage.active
                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium whitespace-nowrap">{stage.label}</span>
                </div>
                {idx < stages.length - 1 && <ChevronRight size={16} className="text-border" />}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Main Content - Full Width */}
      <div className="space-y-4">
        {/* Top Info Row - Condensed */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="p-3 border-border">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            {isEditing ? (
              <select className="w-full px-2 py-1 text-sm rounded-md bg-card border border-border text-foreground">
                <option>Awaiting Approval</option>
                <option>In Progress</option>
                <option>Ready</option>
                <option>Completed</option>
              </select>
            ) : (
              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20">
                Awaiting Approval
              </Badge>
            )}
          </Card>

          <Card className="p-3 border-border">
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <p className="text-sm font-medium text-foreground">{roData.createdDate}</p>
          </Card>

          <Card className="p-3 border-border">
            <p className="text-xs text-muted-foreground mb-1">Due Date</p>
            <p className="text-sm font-medium text-foreground">{roData.dueDate}</p>
          </Card>

          <Card className="p-3 border-border">
            <p className="text-xs text-muted-foreground mb-1">Advisor</p>
            <p className="text-sm font-medium text-foreground">{roData.advisor}</p>
          </Card>

          <Card className="p-3 border-border">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <User size={12} />
              Technician
            </p>
            {isEditing ? (
              <select
                value={roData.technician}
                onChange={(e) => setRoData({ ...roData, technician: e.target.value })}
                className="w-full px-2 py-1 text-sm rounded-md bg-card border border-border text-foreground"
              >
                <option value="">Unassigned</option>
                <option value="Mike Rodriguez">Mike Rodriguez</option>
                <option value="Sarah Chen">Sarah Chen</option>
                <option value="James Wilson">James Wilson</option>
                <option value="Lisa Park">Lisa Park</option>
              </select>
            ) : (
              <p className="text-sm font-medium text-foreground">{roData.technician || "Unassigned"}</p>
            )}
          </Card>
        </div>

        {/* Services Section - Takes Full Width */}
        <Card className="p-6 border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Services ({services.length})</h2>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={addService}>
              <Plus size={16} />
              Add Service
            </Button>
          </div>

          <div className="space-y-3">
            {services.map((service, index) => (
              <div
                key={service.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-all ${dragOverIndex === index ? "border-t-2 border-primary" : ""}`}
              >
                <EditableServiceCard
                  service={service}
                  onUpdate={updateService}
                  onRemove={() => removeService(service.id)}
                  isDragging={dragIndex === index}
                  roTechnician={roData.technician}
                  dragHandleProps={{
                    onMouseDown: (e) => e.stopPropagation(),
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Pricing Summary - Sticky Bottom */}
        <Card className="p-4 border-border bg-muted/30">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-6 flex-1 overflow-x-auto pb-2">
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground">Parts</p>
                <p className="font-semibold text-foreground">${totals.parts.toFixed(2)}</p>
              </div>
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground">Labor</p>
                <p className="font-semibold text-foreground">${totals.labor.toFixed(2)}</p>
              </div>
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground">Sublets</p>
                <p className="font-semibold text-foreground">${totals.sublets.toFixed(2)}</p>
              </div>
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground">Hazmat</p>
                <p className="font-semibold text-foreground">${totals.hazmat.toFixed(2)}</p>
              </div>
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground">Fees</p>
                <p className="font-semibold text-foreground">${totals.fees.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-l border-border pl-6 flex-shrink-0">
              <div>
                <p className="text-xs text-muted-foreground text-right">Total Estimate</p>
                <p className="text-2xl font-bold text-foreground">${totals.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button className="gap-2">Approve & Complete</Button>
          <Button variant="outline" className="bg-transparent gap-2">
            Request More Info
          </Button>
          <Button
            variant="outline"
            className="bg-transparent text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
          >
            Cancel RO
          </Button>
        </div>

        {/* Contact Info - Compact Footer */}
        {!isEditing && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {roData.customer} • {roData.email} • {roData.phone}
            </span>
            <Button size="sm" variant="ghost" className="gap-1 ml-auto">
              <MessageSquare size={14} />
              SMS
            </Button>
            <Button size="sm" variant="ghost" className="gap-1">
              <Phone size={14} />
              Call
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
