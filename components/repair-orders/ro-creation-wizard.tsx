"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, ChevronRight, User, Car, Wrench, FileText } from "lucide-react"
import { CustomerSelectionStep } from "./steps/customer-selection-step"
import { VehicleSelectionStep } from "./steps/vehicle-selection-step"
import { ServicesStep } from "./steps/services-step"
import { ReviewStep } from "./steps/review-step"

const steps = [
  { id: 1, name: "Customer", icon: User },
  { id: 2, name: "Vehicle", icon: Car },
  { id: 3, name: "Services", icon: Wrench },
  { id: 4, name: "Review", icon: FileText },
]

export interface CustomerData {
  id?: string
  name: string
  phone: string
  email: string
  isNew?: boolean
}

export interface VehicleData {
  id?: string
  year: string
  make: string
  model: string
  trim?: string
  vin: string
  licensePlate: string
  color: string
  mileage: string
  isNew?: boolean
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface ServiceData {
  id: string
  name: string
  description: string
  estimatedCost: number
  estimatedTime: string
  category: string
  status?: "pending" | "in_progress" | "completed"
  technician?: string
  parts: LineItem[]
  labor: LineItem[]
  sublets: LineItem[]
  hazmat: LineItem[]
  fees: LineItem[]
}

export function ROCreationWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [selectedServices, setSelectedServices] = useState<ServiceData[]>([])
  const [notes, setNotes] = useState("")

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return customerData !== null
      case 2:
        return vehicleData !== null
      case 3:
        return selectedServices.length > 0
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreateRO = () => {
    // Create the RO
    console.log("Creating RO:", { customerData, vehicleData, selectedServices, notes })
    // Navigate to the new RO or show success
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create Repair Order</h1>
        <p className="text-muted-foreground mt-1">Fill in the details to create a new repair order</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-sm font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.name}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className={`h-0.5 ${isCompleted ? "bg-green-500" : "bg-border"}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card className="p-6 border-border min-h-[500px]">
        {currentStep === 1 && (
          <CustomerSelectionStep
            selectedCustomer={customerData}
            onSelectCustomer={setCustomerData}
          />
        )}
        {currentStep === 2 && (
          <VehicleSelectionStep
            customerId={customerData?.id}
            selectedVehicle={vehicleData}
            onSelectVehicle={setVehicleData}
          />
        )}
        {currentStep === 3 && (
          <ServicesStep
            selectedServices={selectedServices}
            onUpdateServices={setSelectedServices}
            vehicleData={vehicleData}
          />
        )}
        {currentStep === 4 && (
          <ReviewStep
            customerData={customerData}
            vehicleData={vehicleData}
            selectedServices={selectedServices}
            notes={notes}
            onNotesChange={setNotes}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="bg-transparent"
        >
          Back
        </Button>
        
        <div className="flex items-center gap-3">
          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
              Continue
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleCreateRO} className="gap-2">
              Create Repair Order
              <Check size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
