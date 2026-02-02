/**
 * Recycle Bin API
 * 
 * GET /api/recycle-bin - List all deleted items (based on user permissions)
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth/session'
import { hasPermission } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    // Get current user from JWT
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check what permissions user has
    const [canViewRO, canViewCustomer, canViewVehicle] = await Promise.all([
      hasPermission(user.id, 'restore_ro'),
      hasPermission(user.id, 'restore_customer'),
      hasPermission(user.id, 'restore_vehicle')
    ])
    
    // If no restore permissions, deny access
    if (!canViewRO && !canViewCustomer && !canViewVehicle) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view recycle bin' },
        { status: 403 }
      )
    }
    
    const items: {
      workOrders: any[]
      customers: any[]
      vehicles: any[]
    } = {
      workOrders: [],
      customers: [],
      vehicles: []
    }
    
    // Get deleted work orders (if user has permission)
    if (canViewRO) {
      const ros = await query(`
        SELECT 
          wo.id,
          wo.ro_number,
          c.customer_name,
          v.year as vehicle_year,
          v.make as vehicle_make,
          v.model as vehicle_model,
          wo.state,
          wo.total,
          wo.deleted_at,
          wo.deleted_by,
          u.full_name as deleted_by_name,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - wo.deleted_at)) / 86400) as days_deleted
        FROM work_orders wo
        LEFT JOIN customers c ON wo.customer_id = c.id
        LEFT JOIN vehicles v ON wo.vehicle_id = v.id
        LEFT JOIN users u ON wo.deleted_by = u.id
        WHERE wo.deleted_at IS NOT NULL
        ORDER BY wo.deleted_at DESC
      `)
      items.workOrders = ros.rows
    }
    
    // Get deleted customers (if user has permission)
    if (canViewCustomer) {
      const customers = await query(`
        SELECT 
          c.id,
          c.customer_name,
          c.phone_primary,
          c.email,
          c.deleted_at,
          c.deleted_by,
          u.full_name as deleted_by_name,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - c.deleted_at)) / 86400) as days_deleted,
          (SELECT COUNT(*) FROM vehicles v WHERE v.customer_id = c.id AND v.deleted_at IS NULL) as vehicle_count
        FROM customers c
        LEFT JOIN users u ON c.deleted_by = u.id
        WHERE c.deleted_at IS NOT NULL
        ORDER BY c.deleted_at DESC
      `)
      items.customers = customers.rows
    }
    
    // Get deleted vehicles (if user has permission)
    if (canViewVehicle) {
      const vehicles = await query(`
        SELECT 
          v.id,
          v.year,
          v.make,
          v.model,
          v.vin,
          v.license_plate,
          c.customer_name,
          v.deleted_at,
          v.deleted_by,
          u.full_name as deleted_by_name,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - v.deleted_at)) / 86400) as days_deleted
        FROM vehicles v
        LEFT JOIN customers c ON v.customer_id = c.id
        LEFT JOIN users u ON v.deleted_by = u.id
        WHERE v.deleted_at IS NOT NULL
        ORDER BY v.deleted_at DESC
      `)
      items.vehicles = vehicles.rows
    }
    
    return NextResponse.json({
      ...items,
      permissions: {
        canRestoreRO: canViewRO,
        canRestoreCustomer: canViewCustomer,
        canRestoreVehicle: canViewVehicle
      }
    })
    
  } catch (error: any) {
    console.error('Recycle bin fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recycle bin', details: error.message },
      { status: 500 }
    )
  }
}
