"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X } from "lucide-react"
import type { LineItem } from "./ro-creation-wizard"

interface Part {
  id: string
  name: string
  partNumber: string
  description: string
  price: number
  quantity: number
  category: string
  manufacturer: string
}

interface PartsCatalogModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPart: (part: Part) => void
}

// Mock API data - replace with actual API call
const mockCatalogParts: Part[] = [
  {
    id: "1",
    name: "Oil Filter",
    partNumber: "OIL-001",
    description: "Engine oil filter",
    price: 12.99,
    quantity: 10,
    category: "Filters",
    manufacturer: "Mobil",
  },
  {
    id: "2",
    name: "Air Filter",
    partNumber: "AIR-001",
    description: "Engine air filter",
    price: 8.99,
    quantity: 15,
    category: "Filters",
    manufacturer: "K&N",
  },
  {
    id: "3",
    name: "Brake Pads Set",
    partNumber: "BRAKE-001",
    description: "Semi-metallic brake pads",
    price: 45.99,
    quantity: 8,
    category: "Brakes",
    manufacturer: "Brembo",
  },
  {
    id: "4",
    name: "Spark Plugs (4 pack)",
    partNumber: "SPARK-001",
    description: "Premium spark plugs",
    price: 24.99,
    quantity: 12,
    category: "Ignition",
    manufacturer: "Bosch",
  },
  {
    id: "5",
    name: "Windshield Wipers",
    partNumber: "WIPER-001",
    description: "Premium wiper blades pair",
    price: 18.99,
    quantity: 20,
    category: "Wipers",
    manufacturer: "Rain-X",
  },
  {
    id: "6",
    name: "Battery",
    partNumber: "BATT-001",
    description: "12V automotive battery",
    price: 89.99,
    quantity: 5,
    category: "Electrical",
    manufacturer: "Optima",
  },
  {
    id: "7",
    name: "Transmission Fluid",
    partNumber: "FLUID-001",
    description: "Synthetic transmission fluid",
    price: 15.99,
    quantity: 25,
    category: "Fluids",
    manufacturer: "Valvoline",
  },
  {
    id: "8",
    name: "Coolant",
    partNumber: "COOL-001",
    description: "Antifreeze coolant",
    price: 12.49,
    quantity: 30,
    category: "Fluids",
    manufacturer: "Prestone",
  },
]

export function PartsCatalogModal({ isOpen, onClose, onSelectPart }: PartsCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(mockCatalogParts.map((p) => p.category)))

  const filteredParts = mockCatalogParts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || part.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleSelectPart = (part: Part) => {
    onSelectPart(part)
    setSearchQuery("")
    setSelectedCategory(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Parts Catalog</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, part number, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Parts List */}
          <ScrollArea className="flex-1 border border-border rounded-lg">
            <div className="space-y-2 p-4">
              {filteredParts.length > 0 ? (
                filteredParts.map((part) => (
                  <Card
                    key={part.id}
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-border"
                    onClick={() => handleSelectPart(part)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-foreground">{part.name}</h4>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {part.partNumber}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{part.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{part.manufacturer}</span>
                          <span>In Stock: {part.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-sm text-foreground">${part.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No parts found. Try adjusting your search.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
