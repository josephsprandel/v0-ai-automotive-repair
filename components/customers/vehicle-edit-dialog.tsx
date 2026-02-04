"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Vehicle {
  id: string
  customer_id: string
  vin: string
  year: number
  make: string
  model: string
  submodel: string | null
  engine: string | null
  transmission: string | null
  color: string | null
  license_plate: string | null
  license_plate_state: string | null
  mileage: number | null
  manufacture_date: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface VehicleEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle | null
  onSuccess: (updatedVehicle: Vehicle) => void
}

export function VehicleEditDialog({ open, onOpenChange, vehicle, onSuccess }: VehicleEditDialogProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    vin: "",
    year: "",
    make: "",
    model: "",
    submodel: "",
    engine: "",
    transmission: "",
    color: "",
    license_plate: "",
    license_plate_state: "",
    mileage: "",
    manufacture_date: "",
    notes: "",
  })

  // Reset form when vehicle changes
  useEffect(() => {
    if (vehicle) {
      setFormData({
        vin: vehicle.vin || "",
        year: vehicle.year?.toString() || "",
        make: vehicle.make || "",
        model: vehicle.model || "",
        submodel: vehicle.submodel || "",
        engine: vehicle.engine || "",
        transmission: vehicle.transmission || "",
        color: vehicle.color || "",
        license_plate: vehicle.license_plate || "",
        license_plate_state: vehicle.license_plate_state || "",
        mileage: vehicle.mileage?.toString() || "",
        manufacture_date: vehicle.manufacture_date || "",
        notes: vehicle.notes || "",
      })
      setError(null)
    }
  }, [vehicle])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSave = async () => {
    if (!vehicle) return
    
    // Validate required fields
    if (!formData.vin.trim() || !formData.year.trim() || !formData.make.trim() || !formData.model.trim()) {
      setError("VIN, Year, Make, and Model are required")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: formData.vin.trim(),
          year: parseInt(formData.year),
          make: formData.make.trim(),
          model: formData.model.trim(),
          submodel: formData.submodel.trim() || null,
          engine: formData.engine.trim() || null,
          transmission: formData.transmission.trim() || null,
          color: formData.color.trim() || null,
          license_plate: formData.license_plate.trim() || null,
          license_plate_state: formData.license_plate_state.trim() || null,
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          manufacture_date: formData.manufacture_date.trim() || null,
          notes: formData.notes.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update vehicle")
      }

      const data = await response.json()
      onSuccess(data.vehicle)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>VIN *</Label>
            <Input
              value={formData.vin}
              onChange={(e) => handleChange("vin", e.target.value)}
              placeholder="17-character VIN"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Year *</Label>
            <Input
              type="number"
              value={formData.year}
              onChange={(e) => handleChange("year", e.target.value)}
              placeholder="2024"
              min={1900}
              max={2100}
            />
          </div>

          <div className="space-y-2">
            <Label>Make *</Label>
            <Input
              value={formData.make}
              onChange={(e) => handleChange("make", e.target.value)}
              placeholder="Honda"
            />
          </div>

          <div className="space-y-2">
            <Label>Model *</Label>
            <Input
              value={formData.model}
              onChange={(e) => handleChange("model", e.target.value)}
              placeholder="Accord"
            />
          </div>

          <div className="space-y-2">
            <Label>Trim/Submodel</Label>
            <Input
              value={formData.submodel}
              onChange={(e) => handleChange("submodel", e.target.value)}
              placeholder="Sport, LX, etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Engine</Label>
            <Input
              value={formData.engine}
              onChange={(e) => handleChange("engine", e.target.value)}
              placeholder="2.0L Turbo I4"
            />
          </div>

          <div className="space-y-2">
            <Label>Transmission</Label>
            <Input
              value={formData.transmission}
              onChange={(e) => handleChange("transmission", e.target.value)}
              placeholder="Automatic, Manual, CVT"
            />
          </div>

          <div className="space-y-2">
            <Label>Mileage</Label>
            <Input
              type="number"
              value={formData.mileage}
              onChange={(e) => handleChange("mileage", e.target.value)}
              placeholder="45000"
            />
          </div>

          <div className="space-y-2">
            <Label>License Plate</Label>
            <Input
              value={formData.license_plate}
              onChange={(e) => handleChange("license_plate", e.target.value)}
              placeholder="ABC-1234"
            />
          </div>

          <div className="space-y-2">
            <Label>State</Label>
            <Input
              value={formData.license_plate_state}
              onChange={(e) => handleChange("license_plate_state", e.target.value)}
              placeholder="TX"
              maxLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              value={formData.color}
              onChange={(e) => handleChange("color", e.target.value)}
              placeholder="Silver"
            />
          </div>

          <div className="space-y-2">
            <Label>Production Date</Label>
            <Input
              type="month"
              value={formData.manufacture_date}
              onChange={(e) => handleChange("manufacture_date", e.target.value)}
              placeholder="YYYY-MM"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Any additional notes about this vehicle..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
