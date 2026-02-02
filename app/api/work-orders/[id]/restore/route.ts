/**
 * Restore Deleted Work Order API
 * 
 * POST /api/work-orders/[id]/restore
 * Requires 'restore_ro' permission
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
    const canRestore = await hasPermission(user.id, 'restore_ro')
    if (!canRestore) {
      return NextResponse.json(
        { error: 'Insufficient permissions to restore repair orders' },
        { status: 403 }
      )
    }
    
    // Restore the work order
    const result = await query(`
      UPDATE work_orders 
      SET deleted_at = NULL, deleted_by = NULL
      WHERE id = $1 AND deleted_at IS NOT NULL
      RETURNING id, ro_number
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found in recycle bin' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Work order restored successfully',
      ro_number: result.rows[0].ro_number
    })
    
  } catch (error: any) {
    console.error('Restore work order error:', error)
    return NextResponse.json(
      { error: 'Failed to restore work order', details: error.message },
      { status: 500 }
    )
  }
}
