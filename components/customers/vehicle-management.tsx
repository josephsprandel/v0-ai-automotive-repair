"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, AlertTriangle, Clock } from "lucide-react"

export function VehicleManagement({ customerId = "cust-001" }: { customerId?: string }) {
  const vehicles = [
    {
      id: "veh-001",
      year: 2022,
      make: "Tesla",
      model: "Model 3",
      vin: "5YJ3E1EA2PF123456",
      licensePlate: "TESLA22",
      mileage: 24500,
      lastService: "2024-01-10",
      nextMaintenance: "2024-02-10",
      totalServices: 5,
      status: "active",
    },
    {
      id: "veh-002",
      year: 2021,
      make: "BMW",
      model: "X5",
      vin: "WBADT43452G915678",
      licensePlate: "BMW5X",
      mileage: 18200,
      lastService: "2024-01-05",
      nextMaintenance: "2024-04-05",
      totalServices: 3,
      status: "active",
    },
    {
      id: "veh-003",
      year: 2018,
      make: "Honda",
      model: "Civic",
      vin: "2HGCV1F32JH123456",
      licensePlate: "CIVIC18",
      mileage: 95400,
      lastService: "2023-11-20",
      nextMaintenance: "2024-05-20",
      totalServices: 12,
      status: "needs_maintenance",
    },
  ]

  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Vehicles</h2>
        <Button size="sm" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          Add Vehicle
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 border-border bg-muted/30">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Year, Make, Model"
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground"
            />
            <input
              type="text"
              placeholder="VIN"
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground"
            />
            <input
              type="text"
              placeholder="License Plate"
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                Add
              </Button>
              <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="p-4 border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      vehicle.status === "active"
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {vehicle.status === "active" ? "Active" : "Needs Maintenance"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                  <div>
                    <p className="font-medium">VIN</p>
                    <p className="font-mono">{vehicle.vin}</p>
                  </div>
                  <div>
                    <p className="font-medium">License Plate</p>
                    <p className="font-mono">{vehicle.licensePlate}</p>
                  </div>
                  <div>
                    <p className="font-medium">Current Mileage</p>
                    <p>{vehicle.mileage.toLocaleString()} mi</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Services</p>
                    <p>{vehicle.totalServices}</p>
                  </div>
                </div>

                <div className="flex gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock size={14} />
                    Last service: {vehicle.lastService}
                  </div>
                  {vehicle.status === "needs_maintenance" && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={14} />
                      Maintenance due: {vehicle.nextMaintenance}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Edit2 size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
