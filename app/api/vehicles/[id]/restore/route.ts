/**
 * Restore Deleted Vehicle API
 * 
 * POST /api/vehicles/[id]/restore
 * Requires 'restore_vehicle' permission
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth/session'
import { hasPermission } from '@/lib/auth/permissions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get current user from JWT
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check permission
    const canRestore = await hasPermission(user.id, 'restore_vehicle')
    if (!canRestore) {
      return NextResponse.json(
        { error: 'Insufficient permissions to restore vehicles' },
        { status: 403 }
      )
    }
    
    // Restore the vehicle
    const result = await query(`
      UPDATE vehicles 
      SET deleted_at = NULL, deleted_by = NULL
      WHERE id = $1 AND deleted_at IS NOT NULL
      RETURNING id, year, make, model, vin
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found in recycle bin' },
        { status: 404 }
      )
    }
    
    const vehicle = result.rows[0]
    return NextResponse.json({
      message: 'Vehicle restored successfully',
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    })
    
  } catch (error: any) {
    console.error('Restore vehicle error:', error)
    return NextResponse.json(
      { error: 'Failed to restore vehicle', details: error.message },
      { status: 500 }
    )
  }
}
