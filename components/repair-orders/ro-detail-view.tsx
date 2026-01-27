"use client"

import React from "react"

import { useState, useMemo, useEffect, useCallback } from "react"
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
  Loader2,
  Sparkles,
  CheckCircle,
  FileText,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import type { ServiceData, LineItem } from "./ro-creation-wizard"
import { EditableServiceCard, createLineItem } from "./editable-service-card"

// Workflow stages - MOVED OUTSIDE to prevent re-creation on every render
const WORKFLOW_STAGES = [
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

/**
 * Convert database work_order_items to ServiceData format
 * Maps flat item rows to grouped service structure
 */
function convertItemsToServices(items: any[]): ServiceData[] {
  // Group items by a synthetic service grouping (for now all in one service)
  // TODO: Add service_group_id to work_order_items for proper grouping
  
  if (items.length === 0) return []
  
  const services: ServiceData[] = []
  const serviceMap = new Map<string, ServiceData>()
  
  items.forEach(item => {
    // For now, group by item_type to create separate "services"
    const serviceKey = item.description || 'Unnamed Service'
    
    if (!serviceMap.has(serviceKey)) {
      serviceMap.set(serviceKey, {
        id: `svc-${item.id}`,
        name: item.description,
        description: item.notes || '',
        estimatedCost: parseFloat(item.line_total || 0),
        estimatedTime: item.labor_hours ? `${item.labor_hours} hrs` : 'TBD',
        category: item.item_type === 'labor' ? 'Labor' : item.item_type === 'part' ? 'Parts' : 'Other',
        status: 'pending',
        parts: [],
        labor: [],
        sublets: [],
        hazmat: [],
        fees: [],
      })
    }
    
    const service = serviceMap.get(serviceKey)!
    
    // Add to appropriate category
    if (item.item_type === 'labor') {
      service.labor.push({
        id: `l${item.id}`,
        description: item.description,
        quantity: parseFloat(item.labor_hours || 0),
        unitPrice: parseFloat(item.labor_rate || 160),
        total: parseFloat(item.line_total || 0),
      })
    } else if (item.item_type === 'part') {
      service.parts.push({
        id: `p${item.id}`,
        description: item.description,
        quantity: parseFloat(item.quantity || 1),
        unitPrice: parseFloat(item.unit_price || 0),
        total: parseFloat(item.line_total || 0),
      })
    } else if (item.item_type === 'sublet') {
      service.sublets.push({
        id: `s${item.id}`,
        description: item.description,
        quantity: parseFloat(item.quantity || 1),
        unitPrice: parseFloat(item.unit_price || 0),
        total: parseFloat(item.line_total || 0),
      })
    }
  })
  
  return Array.from(serviceMap.values())
}

interface WorkOrder {
  id: number
  ro_number: string
  customer_id: number
  vehicle_id: number
  customer_name: string
  phone_primary: string
  email: string | null
  year: number
  make: string
  model: string
  vin: string
  license_plate: string | null
  state: string
  date_opened: string
  date_promised: string | null
  date_closed: string | null
  customer_concern: string | null
  label: string | null
  needs_attention: boolean
  labor_total: string
  parts_total: string
  sublets_total: string
  tax_amount: string
  total: string
  payment_status: string
  amount_paid: string
  created_at: string
  updated_at: string
}

export function RODetailView({ roId, onClose }: { roId: string; onClose?: () => void }) {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY EARLY RETURNS!
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [services, setServices] = useState<ServiceData[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())
  
  // AI Recommendation states
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiServices, setAiServices] = useState<any[]>([])
  const [selectedAiServices, setSelectedAiServices] = useState<any[]>([])
  const [aiSource, setAiSource] = useState<string | null>(null)

  // ALL useMemo and useCallback MUST ALSO BE AT THE TOP
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

  const handleSave = useCallback(() => {
    setIsEditing(false)
  }, [])

  const updateService = useCallback((updated: ServiceData) => {
    // Update local state immediately for responsive UI
    setServices(prev => prev.map((s) => (s.id === updated.id ? updated : s)))
    // TODO: Call API to update in database
  }, [])

  const removeService = useCallback(async (id: string) => {
    if (!workOrder?.id) return
    
    console.log('=== DELETING SERVICE ===')
    console.log('Service ID:', id)
    
    // Extract database item ID from the service id
    const dbItemId = id.replace('svc-', '')
    
    try {
      const response = await fetch(`/api/work-orders/${workOrder.id}/items?item_id=${dbItemId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('✓ Deleted from database')
        // Remove from local state
        setServices(prev => prev.filter((s) => s.id !== id))
      } else {
        console.error('✗ Failed to delete from database')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }, [workOrder])

  const addService = useCallback(async () => {
    if (!workOrder?.id) return
    
    console.log('=== ADDING NEW SERVICE ===')
    
    try {
      const response = await fetch(`/api/work-orders/${workOrder.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'labor',
          description: 'New Service',
          notes: '',
          quantity: 1,
          unit_price: 0,
          labor_hours: 0,
          labor_rate: 160,
          is_taxable: false,
          display_order: services.length
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✓ Saved to database - ID:', data.item?.id)
        
        // Reload all items from database
        const itemsResponse = await fetch(`/api/work-orders/${workOrder.id}/items`)
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          const loadedServices = convertItemsToServices(itemsData.items || [])
          setServices(loadedServices)
        }
      } else {
        console.error('✗ Failed to save to database')
      }
    } catch (error) {
      console.error('Error adding service:', error)
    }
  }, [workOrder, services.length])

  const handleAIRecommend = useCallback(async () => {
    console.log('[DEBUG] AI Recommend clicked')
    
    if (!workOrder) {
      console.log('[DEBUG] No workOrder available')
      return
    }
    
    setAiDialogOpen(true)
    setAiLoading(true)
    setAiServices([])
    setAiSource(null)

    try {
      // Get current mileage from user
      const mileage = prompt("Enter current mileage:")
      console.log('[DEBUG] Mileage entered:', mileage)
      
      if (!mileage) {
        console.log('[DEBUG] No mileage provided, aborting')
        setAiLoading(false)
        return
      }

      const requestBody = {
        year: workOrder.year,
        make: workOrder.make,
        model: workOrder.model,
        mileage: parseInt(mileage),
        vin: workOrder.vin
      }
      console.log('[DEBUG] Request body:', requestBody)

      const url = "/api/maintenance-recommendations"
      console.log('[DEBUG] Calling API:', url)

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log('[DEBUG] Response status:', response.status)
      console.log('[DEBUG] Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[DEBUG] Error response text:', errorText)
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('[DEBUG] Response data:', data)
      
      /**
       * MULTIPLE VARIANTS HANDLING
       * 
       * Some vehicles (like 2020 Honda Accord) have multiple engine options:
       * - 1.5L Turbo I4 with CVT
       * - 2.0L Turbo I4 with 10-speed Automatic
       * 
       * Strategy: Show variant selector BEFORE saving to database
       * Why: Don't save irrelevant data (2.0L recommendations for 1.5L car)
       * 
       * TODO: Implement variant selector UI component
       * - Show dialog: "This vehicle has multiple engines. Select yours:"
       * - List each variant with engine_displacement and transmission_type
       * - User selects correct variant
       * - THEN save only those recommendations
       * 
       * For now: Auto-select first variant (temporary)
       */
      if (data.multiple_variants) {
        console.log('[DEBUG] Multiple variants detected:', data.variants?.length)
        // TODO: Show variant selector dialog
        // Temporary: Use first variant
        setAiServices(data.variants[0]?.services || [])
        setSelectedAiServices(data.variants[0]?.services || [])
        setAiSource(data.source)
        
        // Save first variant's recommendations
        await saveRecommendationsToDatabase(data.variants[0]?.services || [])
      } else {
        // Single variant - auto-save immediately
        setAiServices(data.services || [])
        setSelectedAiServices(data.services || []) // Auto-select all
        setAiSource(data.source)
        
        // Auto-save recommendations to database
        await saveRecommendationsToDatabase(data.services || [])
      }
      
      console.log('[DEBUG] Services set:', data.services?.length || 0, 'services')
      console.log('[DEBUG] Source:', data.source)
    } catch (error) {
      console.error('[DEBUG] AI recommendation error:', error)
    } finally {
      console.log('[DEBUG] Setting loading to false')
      setAiLoading(false)
    }
  }, [workOrder])

  /**
   * Save AI recommendations to vehicle_recommendations table
   * 
   * This creates records with status='awaiting_approval' so service advisors
   * can review and approve them. When approved, they're added to work_order_items.
   * 
   * Why auto-save:
   * - Creates audit trail (even if user closes dialog)
   * - Tracks presentation history (declined_count, last_presented)
   * - Allows showing recommendations on future ROs for same vehicle
   * 
   * @param services - Array of AI-generated maintenance services
   */
  const saveRecommendationsToDatabase = async (services: any[]) => {
    if (!workOrder?.vehicle_id || !services || services.length === 0) {
      console.log('[DEBUG] Skip save: no vehicle_id or no services')
      return
    }

    try {
      console.log('[DEBUG] Saving recommendations to database...')
      console.log('[DEBUG] Vehicle ID:', workOrder.vehicle_id)
      console.log('[DEBUG] Services count:', services.length)

      const saveResponse = await fetch('/api/save-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: workOrder.vehicle_id,
          services: services
        })
      })

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text()
        console.error('[DEBUG] Save error:', errorText)
        throw new Error(`Failed to save: ${saveResponse.status}`)
      }

      const saveData = await saveResponse.json()
      console.log('[DEBUG] Save successful:', saveData)
      console.log('[DEBUG] Saved recommendation IDs:', saveData.recommendation_ids)

      /**
       * TODO: Refresh recommendations list on the page
       * 
       * After saving, we should refresh the vehicle_recommendations query
       * to show the newly added recommendations in the UI.
       * 
       * Implementation ideas:
       * 1. Add a recommendations section to this page
       * 2. Query: SELECT * FROM vehicle_recommendations WHERE vehicle_id = ?
       * 3. Show with approve/decline buttons
       * 4. On approve: INSERT INTO work_order_items
       * 
       * For now: Recommendations are saved but not displayed on this page.
       * Service advisors can view them in the vehicle history or recommendations tab.
       */

    } catch (error) {
      console.error('[DEBUG] Failed to save recommendations:', error)
      // Don't throw - still show recommendations in dialog even if save fails
    }
  }

  const toggleAiService = useCallback((service: any) => {
    setSelectedAiServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }, [])

  const addSelectedAiServices = useCallback(async () => {
    if (!workOrder?.id || selectedAiServices.length === 0) return
    
    console.log('=== SAVING AI SERVICES TO WORK ORDER ===')
    console.log('Selected services:', selectedAiServices.length)
    
    setAiDialogOpen(false)
    
    // Save each selected service to work_order_items
    for (const aiService of selectedAiServices) {
      try {
        console.log('Saving service:', aiService.service_name)
        
        // Create labor item for the service
        const laborResponse = await fetch(`/api/work-orders/${workOrder.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_type: 'labor',
            description: aiService.service_name,
            notes: aiService.service_description,
            quantity: 1,
            unit_price: 0,
            labor_hours: aiService.estimated_labor_hours || 0,
            labor_rate: 160,
            is_taxable: false,
            display_order: services.length
          })
        })
        
        if (laborResponse.ok) {
          const data = await laborResponse.json()
          console.log('✓ Saved:', aiService.service_name, '- DB ID:', data.item?.id)
        } else {
          const errorText = await laborResponse.text()
          console.error('✗ Failed to save:', aiService.service_name)
          console.error('  Status:', laborResponse.status)
          console.error('  Error:', errorText)
        }
        
      } catch (error) {
        console.error('Error saving service:', error)
      }
    }
    
    // Reload work order items from database
    console.log('Reloading work order items...')
    try {
      const itemsResponse = await fetch(`/api/work-orders/${workOrder.id}/items`)
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        console.log('✓ Reloaded', itemsData.items?.length || 0, 'items')
        const loadedServices = convertItemsToServices(itemsData.items || [])
        setServices(loadedServices)
      }
    } catch (error) {
      console.error('Error reloading items:', error)
    }
    
    console.log('=== SAVE COMPLETE ===')
  }, [selectedAiServices, workOrder, services.length])

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      setServices(prev => {
        const newServices = [...prev]
        const [removed] = newServices.splice(dragIndex, 1)
        newServices.splice(dragOverIndex, 0, removed)
        return newServices
      })
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }, [dragIndex, dragOverIndex])

  const dragHandleProps = useMemo(() => ({
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
  }), [])

  const toggleServiceExpanded = useCallback((serviceId: string) => {
    setExpandedServices(prev => {
      const next = new Set(prev)
      if (next.has(serviceId)) {
        next.delete(serviceId)
      } else {
        next.add(serviceId)
      }
      return next
    })
  }, [])

  // Load work order and items from database
  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        console.log('=== FETCHING WORK ORDER ===')
        console.log('roId:', roId)
        
        setLoading(true)
        setError(null)
        
        // Fetch work order
        const woResponse = await fetch(`/api/work-orders/${roId}`)
        if (!woResponse.ok) {
          throw new Error(`Failed to fetch work order: ${woResponse.status}`)
        }
        
        const woData = await woResponse.json()
        if (!woData.work_order) {
          throw new Error('No work order data returned')
        }
        
        setWorkOrder(woData.work_order)
        console.log('✓ Work order loaded')
        
        // Fetch work order items
        const itemsResponse = await fetch(`/api/work-orders/${roId}/items`)
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          console.log('✓ Loaded', itemsData.items?.length || 0, 'items from database')
          
          // Convert database items to services format
          const loadedServices = convertItemsToServices(itemsData.items || [])
          setServices(loadedServices)
        } else {
          console.log('No items found for this work order')
        }
        
      } catch (err: any) {
        console.error('=== WORK ORDER FETCH ERROR ===')
        console.error('Error:', err.message)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (roId) {
      fetchWorkOrder()
    }
  }, [roId])

  // NOW we can do early returns - ALL HOOKS are called above
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    )
  }

  if (error || !workOrder) {
    return (
      <Card className="p-12 text-center">
        <p className="text-destructive mb-2">Error loading work order</p>
        <p className="text-sm text-muted-foreground mb-4">{error || "Work order not found"}</p>
        {onClose && <Button onClick={onClose} variant="outline">Go Back</Button>}
      </Card>
    )
  }

  // Non-hook functions can stay here
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
            <h1 className="text-3xl font-bold text-foreground">{workOrder.ro_number}</h1>
            <p className="text-sm text-muted-foreground">
              {workOrder.customer_name} • {workOrder.year} {workOrder.make} {workOrder.model} • {workOrder.vin}
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
          {WORKFLOW_STAGES.map((stage, idx) => {
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
                {idx < WORKFLOW_STAGES.length - 1 && <ChevronRight size={16} className="text-border" />}
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
              <select 
                id="ro_status"
                name="ro_status"
                className="w-full px-2 py-1 text-sm rounded-md bg-card border border-border text-foreground"
              >
                <option value="awaiting_approval">Awaiting Approval</option>
                <option value="in_progress">In Progress</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
              </select>
            ) : (
              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20">
                Awaiting Approval
              </Badge>
            )}
          </Card>

          <Card className="p-3 border-border">
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <p className="text-sm font-medium text-foreground">{new Date(workOrder.date_opened).toLocaleDateString()}</p>
          </Card>

          <Card className="p-3 border-border">
            <p className="text-xs text-muted-foreground mb-1">Due Date</p>
            <p className="text-sm font-medium text-foreground">
              {workOrder.date_promised ? new Date(workOrder.date_promised).toLocaleDateString() : "TBD"}
            </p>
          </Card>

          <Card className="p-3 border-border">
            <p className="text-xs text-muted-foreground mb-1">Customer Concern</p>
            <p className="text-sm font-medium text-foreground italic line-clamp-2">
              {workOrder.customer_concern || "None specified"}
            </p>
          </Card>

          <Card className="p-3 border-border">
            <p className="text-xs text-muted-foreground mb-1">License Plate</p>
            <p className="text-sm font-medium text-foreground">
              {workOrder.license_plate || "N/A"}
            </p>
          </Card>
        </div>

        {/* Services Section - Takes Full Width */}
        <Card className="p-6 border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Services ({services.length})</h2>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="default" 
                className="gap-2"
                onClick={handleAIRecommend}
              >
                <Sparkles size={16} />
                AI Recommend Services
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 bg-transparent" 
                onClick={addService}
              >
                <Plus size={16} />
                Add Service
              </Button>
            </div>
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
                  roTechnician="Unassigned"
                  dragHandleProps={dragHandleProps}
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
              {workOrder.customer_name} • {workOrder.email || "No email"} • {workOrder.phone_primary}
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

      {/* AI Recommendations Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Maintenance Recommendations</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {workOrder.year} {workOrder.make} {workOrder.model}
            </p>
          </DialogHeader>

          {aiLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">Analyzing maintenance schedule...</span>
            </div>
          )}

          {!aiLoading && aiSource && (
            <div className="mb-4">
              {aiSource === "database" && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Found in database (instant)</span>
                </div>
              )}
              {aiSource === "vehicle_databases_api" && (
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>Extracted from owner's manual - Saved to database</span>
                </div>
              )}
            </div>
          )}

          {!aiLoading && aiServices.length > 0 && (
            <>
              <div className="space-y-2">
                {aiServices.map((service, i) => (
                  <div
                    key={i}
                    className="border rounded p-3 flex items-start gap-3 hover:bg-accent cursor-pointer"
                    onClick={() => toggleAiService(service)}
                  >
                    <Checkbox
                      checked={selectedAiServices.includes(service)}
                      onCheckedChange={() => toggleAiService(service)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{service.service_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {service.service_description}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Due: {service.mileage_interval?.toLocaleString()} mi
                        </Badge>
                        {service.driving_condition && (
                          <Badge variant="secondary" className="text-xs">
                            {service.driving_condition}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={addSelectedAiServices} className="flex-1">
                  Add {selectedAiServices.length} Service{selectedAiServices.length !== 1 ? 's' : ''} to RO
                </Button>
                <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {!aiLoading && aiServices.length === 0 && aiSource === 'not_found' && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No maintenance data available for this vehicle.
              </p>
              <p className="text-sm text-muted-foreground">
                Try uploading the owner's manual or check back later.
              </p>
            </div>
          )}
          
          {!aiLoading && aiServices.length === 0 && aiSource && aiSource !== 'not_found' && (
            <div className="text-center text-muted-foreground py-8">
              No maintenance items found for this vehicle at this mileage.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
