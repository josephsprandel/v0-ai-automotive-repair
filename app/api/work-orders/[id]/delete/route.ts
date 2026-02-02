/**
 * Soft Delete Work Order API
 * 
 * DELETE /api/work-orders/[id]/delete
 * Requires 'delete_ro' permission
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth/session'
import { hasPermission } from '@/lib/auth/permissions'

export async function DELETE(
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
    const canDelete = await hasPermission(user.id, 'delete_ro')
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete repair orders' },
        { status: 403 }
      )
    }
    
    // Soft delete the work order
    const result = await query(`
      UPDATE work_orders 
      SET deleted_at = NOW(), deleted_by = $1
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, ro_number
    `, [user.id, id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found or already deleted' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Work order deleted successfully',
      ro_number: result.rows[0].ro_number,
      can_restore: true
    })
    
  } catch (error: any) {
    console.error('Delete work order error:', error)
    return NextResponse.json(
      { error: 'Failed to delete work order', details: error.message },
      { status: 500 }
    )
  }
}
