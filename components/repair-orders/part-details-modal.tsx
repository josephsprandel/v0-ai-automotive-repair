"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { LineItem } from "./ro-creation-wizard"

interface PartDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  lineItem: LineItem | null
  onSave: (updatedItem: LineItem) => void
  roNumber?: string
}

export function PartDetailsModal({ isOpen, onClose, lineItem, onSave, roNumber }: PartDetailsModalProps) {
  const [partType, setPartType] = useState("Parts")
  const [vendor, setVendor] = useState("")
  const [description, setDescription] = useState("")
  const [partNumber, setPartNumber] = useState("")
  const [cost, setCost] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [markupMultiplier, setMarkupMultiplier] = useState(2.0)
  const [markupPercent, setMarkupPercent] = useState(100)
  const [sellPrice, setSellPrice] = useState(0)

  // Load values when lineItem changes
  useEffect(() => {
    if (lineItem) {
      setDescription(lineItem.description)
      setPartNumber(lineItem.part_number || "")
      setVendor(lineItem.vendor || "")
      setCost(lineItem.cost || 0)
      setQuantity(lineItem.quantity)
      setSellPrice(lineItem.unitPrice)
      
      // Calculate markup from cost and price
      if (lineItem.cost && lineItem.cost > 0) {
        const calculatedMarkupMultiplier = lineItem.unitPrice / lineItem.cost
        const calculatedMarkupPercent = ((lineItem.unitPrice - lineItem.cost) / lineItem.cost) * 100
        setMarkupMultiplier(parseFloat(calculatedMarkupMultiplier.toFixed(2)))
        setMarkupPercent(parseFloat(calculatedMarkupPercent.toFixed(1)))
      } else {
        setMarkupMultiplier(2.0)
        setMarkupPercent(100)
      }
    }
  }, [lineItem])

  // Recalculate sell price when cost or markup changes
  const handleCostChange = (newCost: number) => {
    setCost(newCost)
    const newSellPrice = newCost * markupMultiplier
    setSellPrice(parseFloat(newSellPrice.toFixed(2)))
  }

  const handleMarkupMultiplierChange = (newMultiplier: number) => {
    setMarkupMultiplier(newMultiplier)
    const newPercent = (newMultiplier - 1) * 100
    setMarkupPercent(parseFloat(newPercent.toFixed(1)))
    const newSellPrice = cost * newMultiplier
    setSellPrice(parseFloat(newSellPrice.toFixed(2)))
  }

  const handleMarkupPercentChange = (newPercent: number) => {
    setMarkupPercent(newPercent)
    const newMultiplier = 1 + (newPercent / 100)
    setMarkupMultiplier(parseFloat(newMultiplier.toFixed(2)))
    const newSellPrice = cost * newMultiplier
    setSellPrice(parseFloat(newSellPrice.toFixed(2)))
  }

  const handleSellPriceChange = (newSellPrice: number) => {
    setSellPrice(newSellPrice)
    if (cost > 0) {
      const newMultiplier = newSellPrice / cost
      const newPercent = ((newSellPrice - cost) / cost) * 100
      setMarkupMultiplier(parseFloat(newMultiplier.toFixed(2)))
      setMarkupPercent(parseFloat(newPercent.toFixed(1)))
    }
  }

  const handleSave = () => {
    if (!lineItem) return

    const updatedItem: LineItem = {
      ...lineItem,
      description,
      part_number: partNumber,
      vendor,
      cost,
      quantity,
      unitPrice: sellPrice,
      total: sellPrice * quantity
    }

    onSave(updatedItem)
    onClose()
  }

  if (!lineItem) return null

  const inventoryPartInfo = lineItem.part_id 
    ? `${lineItem.part_number || ''} (${lineItem.cost ? `$ ${lineItem.cost.toFixed(2)}` : ''})`
    : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Edit Part - RO #{roNumber || 'Draft'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {inventoryPartInfo && (
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">This part's associated Inventory part is:</p>
              <p className="font-medium text-foreground mt-1">{lineItem.description}</p>
              <p className="text-sm text-muted-foreground">{inventoryPartInfo}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Edit the part information for this repair order only:
          </div>

          {/* Part Type */}
          <div className="space-y-2">
            <Label>Part Type</Label>
            <Input
              value={partType}
              onChange={(e) => setPartType(e.target.value)}
              className="bg-card"
            />
          </div>

          {/* Brand/Vendor */}
          <div className="space-y-2">
            <Label>Brand</Label>
            <Input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g., Iwis, Bosch, etc."
              className="bg-card"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Part description"
              className="bg-card"
            />
          </div>

          {/* Part Number */}
          <div className="space-y-2">
            <Label>Part Number</Label>
            <Input
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="Enter part number"
              className="bg-card"
            />
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label>Cost</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={cost || ""}
              onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
              className="bg-card"
            />
          </div>

          {/* AI Parts Matrix Price */}
          <div className="space-y-2">
            <Label>AI Parts Matrix Price</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={cost.toFixed(2)}
                readOnly
                className="bg-muted flex-1"
              />
              <Input
                type="number"
                min="0"
                step="0.1"
                value={markupMultiplier}
                onChange={(e) => handleMarkupMultiplierChange(parseFloat(e.target.value) || 1)}
                className="bg-card w-20"
              />
              <span className="text-muted-foreground">x</span>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={markupPercent}
                onChange={(e) => handleMarkupPercentChange(parseFloat(e.target.value) || 0)}
                className="bg-card w-20"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>

          {/* Sell Price */}
          <div className="space-y-2">
            <Label>Sell Price</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={sellPrice || ""}
                onChange={(e) => handleSellPriceChange(parseFloat(e.target.value) || 0)}
                className="bg-card flex-1"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="bg-card w-20"
              />
              <span className="text-muted-foreground">x</span>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={markupPercent}
                onChange={(e) => handleMarkupPercentChange(parseFloat(e.target.value) || 0)}
                className="bg-card w-20"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
