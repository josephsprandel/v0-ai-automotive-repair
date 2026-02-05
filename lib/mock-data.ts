/**
 * Mock Data for V0 Preview Mode
 * 
 * This file provides sample data when NEXT_PUBLIC_MOCK_DATA=true
 * Used ONLY for v0.dev design previews - NEVER in production
 */

// Check if mock data is enabled
export const isMockDataEnabled = () => {
  return process.env.NEXT_PUBLIC_MOCK_DATA === 'true'
}

// Mock Customers
export const mockCustomers = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    notes: 'Preferred customer',
    createdAt: '2024-01-15T10:00:00Z',
    lastVisit: '2024-02-01T14:30:00Z'
  },
  {
    id: 2,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 987-6543',
    address: '456 Oak Ave',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62702',
    notes: null,
    createdAt: '2024-01-20T09:00:00Z',
    lastVisit: '2024-02-03T11:15:00Z'
  },
  {
    id: 3,
    firstName: 'Michael',
    lastName: 'Davis',
    email: 'm.davis@email.com',
    phone: '(555) 456-7890',
    address: '789 Elm St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62703',
    notes: 'Fleet customer - 3 vehicles',
    createdAt: '2023-11-10T08:00:00Z',
    lastVisit: '2024-01-28T16:45:00Z'
  }
]

// Mock Vehicles
export const mockVehicles = [
  {
    id: 1,
    customerId: 1,
    year: 2020,
    make: 'Honda',
    model: 'Accord',
    vin: '1HGCV1F30LA000001',
    licensePlate: 'ABC123',
    color: 'Silver',
    mileage: 45000,
    notes: 'Regular maintenance customer',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    customerId: 1,
    year: 2018,
    make: 'Toyota',
    model: 'Camry',
    vin: '4T1BF1FK5JU000001',
    licensePlate: 'XYZ789',
    color: 'Blue',
    mileage: 62000,
    notes: null,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 3,
    customerId: 2,
    year: 2021,
    make: 'Ford',
    model: 'F-150',
    vin: '1FTFW1E50MFA00001',
    licensePlate: 'TRK456',
    color: 'Black',
    mileage: 28000,
    notes: 'Extended warranty',
    createdAt: '2024-01-20T09:00:00Z'
  }
]

// Mock Work Orders / Repair Orders
export const mockWorkOrders = [
  {
    id: 1,
    roNumber: 'RO-2024-001',
    customerId: 1,
    vehicleId: 1,
    status: 'in_progress',
    priority: 'normal',
    title: 'Oil Change & Inspection',
    description: 'Regular maintenance - oil change and multi-point inspection',
    estimatedCost: 89.99,
    actualCost: 89.99,
    laborHours: 0.5,
    scheduledDate: '2024-02-05T09:00:00Z',
    completedDate: null,
    technicianId: 1,
    createdAt: '2024-02-04T14:00:00Z',
    updatedAt: '2024-02-05T09:30:00Z'
  },
  {
    id: 2,
    roNumber: 'RO-2024-002',
    customerId: 2,
    vehicleId: 3,
    status: 'completed',
    priority: 'high',
    title: 'Brake Repair',
    description: 'Replace front brake pads and rotors',
    estimatedCost: 450.00,
    actualCost: 465.00,
    laborHours: 2.0,
    scheduledDate: '2024-02-03T10:00:00Z',
    completedDate: '2024-02-03T14:30:00Z',
    technicianId: 2,
    createdAt: '2024-02-02T11:00:00Z',
    updatedAt: '2024-02-03T14:30:00Z'
  },
  {
    id: 3,
    roNumber: 'RO-2024-003',
    customerId: 3,
    vehicleId: null,
    status: 'pending',
    priority: 'low',
    title: 'Diagnostic Check Engine Light',
    description: 'Check engine light on - diagnostic needed',
    estimatedCost: 125.00,
    actualCost: null,
    laborHours: 1.0,
    scheduledDate: '2024-02-06T13:00:00Z',
    completedDate: null,
    technicianId: null,
    createdAt: '2024-02-04T16:00:00Z',
    updatedAt: '2024-02-04T16:00:00Z'
  }
]

// Mock Parts Inventory
export const mockParts = [
  {
    id: 1,
    part_number: 'OIL-5W30-QT',
    description: 'Synthetic Motor Oil 5W-30 (1 Qt)',
    vendor: 'Mobil 1',
    category: 'Fluids',
    cost: 8.99,
    price: 14.99,
    quantity_on_hand: 48,
    quantity_available: 48,
    quantity_allocated: 0,
    reorder_point: 12,
    location: 'Aisle 1',
    bin_location: 'A1-3',
    notes: 'Popular item',
    approvals: 'API SN, ILSAC GF-5',
    last_updated: '2024-02-04T10:00:00Z'
  },
  {
    id: 2,
    part_number: 'BRAKE-PAD-FRONT',
    description: 'Front Brake Pads - Ceramic',
    vendor: 'Wagner',
    category: 'Brakes',
    cost: 45.00,
    price: 89.99,
    quantity_on_hand: 12,
    quantity_available: 10,
    quantity_allocated: 2,
    reorder_point: 4,
    location: 'Aisle 3',
    bin_location: 'C2-1',
    notes: 'Fits most vehicles',
    approvals: null,
    last_updated: '2024-02-03T15:00:00Z'
  },
  {
    id: 3,
    part_number: 'AIR-FILTER-001',
    description: 'Engine Air Filter',
    vendor: 'K&N',
    category: 'Filters',
    cost: 12.50,
    price: 24.99,
    quantity_on_hand: 6,
    quantity_available: 6,
    quantity_allocated: 0,
    reorder_point: 8,
    location: 'Aisle 2',
    bin_location: 'B1-5',
    notes: 'Low stock - reorder soon',
    approvals: null,
    last_updated: '2024-02-01T12:00:00Z'
  }
]

// Mock Shop Settings
export const mockShopProfile = {
  id: 1,
  shopName: 'AutoHouse Repair',
  address: '1000 Workshop Drive',
  city: 'Springfield',
  state: 'IL',
  zipCode: '62701',
  phone: '(555) 123-AUTO',
  email: 'info@autohouse.com',
  website: 'https://autohouse.com',
  logo: null,
  taxRate: 8.5,
  laborRate: 125.00,
  timezone: 'America/Chicago'
}

// Mock Dashboard Metrics
export const mockDashboardMetrics = {
  totalRevenue: 45678.90,
  pendingWorkOrders: 8,
  inProgressWorkOrders: 5,
  completedThisMonth: 47,
  activeCustomers: 156,
  inventoryValue: 82340.50,
  lowStockItems: 12,
  revenueChange: 12.5, // percent
  workOrdersChange: 8.3, // percent
  customersChange: 5.2 // percent
}

// Export helper to return mock data or allow real data through
export function withMockData<T>(mockData: T, realDataFn: () => Promise<T>): Promise<T> {
  if (isMockDataEnabled()) {
    return Promise.resolve(mockData)
  }
  return realDataFn()
}
