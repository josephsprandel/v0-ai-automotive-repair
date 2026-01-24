"use client"

import React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Key,
  RefreshCw,
  AlertTriangle,
  Car,
  Wrench,
  Database,
  Radio,
  FileText,
  Shield,
} from "lucide-react"

interface DataSource {
  id: string
  name: string
  description: string
  icon: React.ElementType
  status: "connected" | "disconnected" | "error"
  category: "vehicle" | "diagnostic" | "parts" | "industry"
  pricing: string
  features: string[]
  apiKeyRequired: boolean
  docsUrl: string
}

const dataSources: DataSource[] = [
  {
    id: "nhtsa",
    name: "NHTSA API",
    description: "VIN decoding, safety recalls, complaints, and service bulletins from the National Highway Traffic Safety Administration",
    icon: Shield,
    status: "connected",
    category: "vehicle",
    pricing: "Free",
    features: ["VIN Decoding", "Safety Recalls", "Complaints Database", "Service Bulletins"],
    apiKeyRequired: false,
    docsUrl: "https://vpic.nhtsa.dot.gov/api/",
  },
  {
    id: "edmunds",
    name: "Edmunds API",
    description: "Comprehensive vehicle data including maintenance schedules, pricing, and specifications",
    icon: Car,
    status: "disconnected",
    category: "vehicle",
    pricing: "From $299/mo",
    features: ["Maintenance Schedules", "Market Pricing", "Vehicle Specs", "TCO Data"],
    apiKeyRequired: true,
    docsUrl: "https://developer.edmunds.com/",
  },
  {
    id: "carmd",
    name: "CarMD API",
    description: "Diagnostic trouble code (DTC) database with repair recommendations and cost estimates",
    icon: Wrench,
    status: "disconnected",
    category: "diagnostic",
    pricing: "From $199/mo",
    features: ["DTC Lookup", "Repair Estimates", "Part Numbers", "Labor Times"],
    apiKeyRequired: true,
    docsUrl: "https://api.carmd.com/",
  },
  {
    id: "drivesync",
    name: "DriveSync Telematics",
    description: "Real-time vehicle health monitoring via OBD-II connected devices",
    icon: Radio,
    status: "disconnected",
    category: "diagnostic",
    pricing: "$15/vehicle/mo",
    features: ["Live Diagnostics", "Trip History", "Fuel Efficiency", "Battery Health"],
    apiKeyRequired: true,
    docsUrl: "https://drivesync.io/developers",
  },
  {
    id: "partstech",
    name: "PartsTech",
    description: "Multi-supplier parts catalog with real-time pricing and availability",
    icon: Database,
    status: "connected",
    category: "parts",
    pricing: "Free (supplier fees)",
    features: ["Parts Catalog", "Live Pricing", "Availability", "Supplier Network"],
    apiKeyRequired: true,
    docsUrl: "https://partstech.com/integrations",
  },
  {
    id: "alldata",
    name: "ALLDATA",
    description: "OEM repair procedures, wiring diagrams, and technical service bulletins",
    icon: FileText,
    status: "disconnected",
    category: "industry",
    pricing: "From $189/mo",
    features: ["Repair Procedures", "Wiring Diagrams", "TSBs", "Labor Guides"],
    apiKeyRequired: true,
    docsUrl: "https://alldata.com/",
  },
]

export function DataSourcesSettings() {
  const [sources, setSources] = useState(dataSources)
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [testing, setTesting] = useState(false)

  const handleConnect = (sourceId: string) => {
    setTesting(true)
    // Simulate API test
    setTimeout(() => {
      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, status: "connected" as const } : s))
      )
      setTesting(false)
      setConfiguring(null)
      setApiKey("")
    }, 1500)
  }

  const handleDisconnect = (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, status: "disconnected" as const } : s))
    )
  }

  const categories = [
    { id: "vehicle", label: "Vehicle Data" },
    { id: "diagnostic", label: "Diagnostics" },
    { id: "parts", label: "Parts & Inventory" },
    { id: "industry", label: "Industry Data" },
  ]

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <Card className="p-6 border-border bg-gradient-to-br from-accent/5 to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Data Source Integrations</h2>
            <p className="text-muted-foreground max-w-2xl">
              Connect external APIs to power AI-driven maintenance recommendations, accurate estimates, and real-time
              vehicle diagnostics. Your shop's historical data is automatically used as the primary source.
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">
              {sources.filter((s) => s.status === "connected").length}/{sources.length}
            </p>
            <p className="text-sm text-muted-foreground">Sources Connected</p>
          </div>
        </div>
      </Card>

      {/* Data Sources by Category */}
      {categories.map((category) => {
        const categorySources = sources.filter((s) => s.category === category.id)
        if (categorySources.length === 0) return null

        return (
          <div key={category.id} className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{category.label}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {categorySources.map((source) => {
                const Icon = source.icon
                return (
                  <Card key={source.id} className="p-5 border-border hover:border-accent/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          source.status === "connected"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{source.name}</h4>
                          {source.status === "connected" ? (
                            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 text-xs">
                              <CheckCircle2 size={12} className="mr-1" />
                              Connected
                            </Badge>
                          ) : source.status === "error" ? (
                            <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 text-xs">
                              <AlertTriangle size={12} className="mr-1" />
                              Error
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{source.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {source.features.slice(0, 3).map((feature) => (
                            <span
                              key={feature}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {feature}
                            </span>
                          ))}
                          {source.features.length > 3 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              +{source.features.length - 3} more
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{source.pricing}</span>
                          <div className="flex items-center gap-2">
                            <a
                              href={source.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent hover:underline flex items-center gap-1"
                            >
                              Docs <ExternalLink size={10} />
                            </a>
                            {source.status === "connected" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => handleDisconnect(source.id)}
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Dialog
                                open={configuring === source.id}
                                onOpenChange={(open) => {
                                  setConfiguring(open ? source.id : null)
                                  if (!open) setApiKey("")
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Key size={14} className="mr-1" />
                                    Configure
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Connect {source.name}</DialogTitle>
                                    <DialogDescription>
                                      {source.apiKeyRequired
                                        ? "Enter your API credentials to connect this data source."
                                        : "This API is free and doesn't require authentication."}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    {source.apiKeyRequired && (
                                      <div className="space-y-2">
                                        <Label htmlFor="api-key">API Key</Label>
                                        <Input
                                          id="api-key"
                                          type="password"
                                          placeholder="Enter your API key"
                                          value={apiKey}
                                          onChange={(e) => setApiKey(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                          Get your API key from{" "}
                                          <a
                                            href={source.docsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-accent hover:underline"
                                          >
                                            {source.name} Developer Portal
                                          </a>
                                        </p>
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      <Label>Features to enable</Label>
                                      <div className="space-y-2">
                                        {source.features.map((feature) => (
                                          <div key={feature} className="flex items-center justify-between">
                                            <span className="text-sm text-foreground">{feature}</span>
                                            <Switch defaultChecked />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <Button
                                      className="w-full"
                                      onClick={() => handleConnect(source.id)}
                                      disabled={source.apiKeyRequired && !apiKey}
                                    >
                                      {testing ? (
                                        <>
                                          <RefreshCw size={14} className="mr-2 animate-spin" />
                                          Testing Connection...
                                        </>
                                      ) : (
                                        "Connect & Test"
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Shop Data Card */}
      <Card className="p-6 border-border border-dashed">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-accent/10 text-accent">
            <Database size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">Your Shop's Historical Data</h4>
            <p className="text-sm text-muted-foreground">
              RO Engine automatically learns from your repair history, customer patterns, and service records. This data
              is always the primary source for AI recommendations.
            </p>
          </div>
          <Badge className="bg-accent/20 text-accent">Always Active</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-foreground">12,847</p>
            <p className="text-xs text-muted-foreground">Repair Orders</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-foreground">4,231</p>
            <p className="text-xs text-muted-foreground">Customers</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-foreground">6,892</p>
            <p className="text-xs text-muted-foreground">Vehicles</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-foreground">3.2 yrs</p>
            <p className="text-xs text-muted-foreground">Data History</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
