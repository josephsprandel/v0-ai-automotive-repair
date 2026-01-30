"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Upload, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react"
import Link from "next/link"

interface Part {
  id: number
  part_number: string
  description: string
  vendor: string
  cost: number
  price: number
  quantity_on_hand: number
  quantity_available: number
  quantity_allocated: number
  reorder_point: number
  location: string
  bin_location: string | null
  category: string
  notes: string | null
  last_synced_at: string | null
  last_updated: string
}

type SortColumn = 'part_number' | 'description' | 'quantity_available' | 'cost' | 'price' | 'vendor' | 'location'
type SortOrder = 'asc' | 'desc'

export function PartsInventoryTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortColumn>('part_number')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [totalParts, setTotalParts] = useState(0)

  useEffect(() => {
    loadParts()
  }, [searchTerm, sortBy, sortOrder])

  async function loadParts() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        sortOrder,
        limit: '100'
      })

      const response = await fetch(`/api/inventory/parts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setParts(data.parts || [])
        setTotalParts(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to load parts:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSort(column: SortColumn) {
    if (sortBy === column) {
      // Toggle order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New column, default to ascending
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  function getSortIcon(column: SortColumn) {
    if (sortBy !== column) {
      return <ArrowUpDown size={14} className="opacity-50" />
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="text-primary" />
      : <ArrowDown size={14} className="text-primary" />
  }

  function getStockStatus(qty: number, reorderPoint: number) {
    if (qty === 0) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' }
    if (qty <= reorderPoint) return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' }
    return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' }
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by part number, description, or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Link href="/inventory/import">
          <Button variant="default" className="gap-2">
            <Upload size={16} />
            Import CSV
          </Button>
        </Link>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download size={16} />
          Export
        </Button>
      </div>

      {/* Stats Summary */}
      {!loading && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total Parts: <strong className="text-foreground">{totalParts}</strong></span>
          <span>In Stock: <strong className="text-green-600">{parts.filter(p => p.quantity_available > 0).length}</strong></span>
          <span>Low Stock: <strong className="text-yellow-600">{parts.filter(p => p.quantity_available > 0 && p.quantity_available <= p.reorder_point).length}</strong></span>
          <span>Out of Stock: <strong className="text-red-600">{parts.filter(p => p.quantity_available === 0).length}</strong></span>
        </div>
      )}

      {/* Parts Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 border border-border rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-border rounded-lg">
          <p className="text-muted-foreground mb-4">No parts in inventory</p>
          <Link href="/inventory/import">
            <Button className="gap-2">
              <Upload size={16} />
              Import Parts from ShopWare
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('part_number')}
                    className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                  >
                    Part Number
                    {getSortIcon('part_number')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('description')}
                    className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                  >
                    Description
                    {getSortIcon('description')}
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleSort('quantity_available')}
                    className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground mx-auto"
                  >
                    Qty Available
                    {getSortIcon('quantity_available')}
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Reorder</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('location')}
                    className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                  >
                    Location
                    {getSortIcon('location')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('vendor')}
                    className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                  >
                    Vendor
                    {getSortIcon('vendor')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('cost')}
                    className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground ml-auto"
                  >
                    Cost
                    {getSortIcon('cost')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground ml-auto"
                  >
                    Retail
                    {getSortIcon('price')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => {
                const status = getStockStatus(part.quantity_available, part.reorder_point)
                return (
                  <tr key={part.id} className="border-b border-border hover:bg-card/50">
                    <td className="px-4 py-3 font-mono text-foreground">{part.part_number}</td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate" title={part.description}>
                      {part.description}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full font-medium text-sm ${status.bg} ${status.text}`}>
                        {part.quantity_available}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {part.reorder_point}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {part.location}
                      {part.bin_location && (
                        <span className="text-xs text-muted-foreground ml-1">• {part.bin_location}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">{part.vendor}</td>
                    <td className="px-4 py-3 text-right text-foreground">
                      ${part.cost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      ${part.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-7 bg-transparent">
                          Add to RO
                        </Button>
                        {part.quantity_available <= part.reorder_point && (
                          <Button size="sm" variant="outline" className="h-7 bg-transparent text-amber-600">
                            Reorder
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
