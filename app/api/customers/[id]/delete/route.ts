/**
 * Soft Delete Customer API
 * 
 * DELETE /api/customers/[id]/delete
 * Requires 'delete_customer' permission
 * Blocks deletion if customer has active repair orders
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
    const canDelete = await hasPermission(user.id, 'delete_customer')
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete customers' },
        { status: 403 }
      )
    }
    
    // Check for associated non-deleted work orders
    const hasROs = await query(`
      SELECT COUNT(*) as count 
      FROM work_orders 
      WHERE customer_id = $1 AND deleted_at IS NULL
    `, [id])
    
    const roCount = parseInt(hasROs.rows[0].count)
    if (roCount > 0) {
      return NextResponse.json({
        error: `Cannot delete: Customer has ${roCount} active repair order(s)`,
        active_ro_count: roCount
      }, { status: 400 })
    }
    
    // Soft delete the customer
    const result = await query(`
      UPDATE customers 
      SET deleted_at = NOW(), deleted_by = $1
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, customer_name
    `, [user.id, id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found or already deleted' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Customer deleted successfully',
      customer_name: result.rows[0].customer_name,
      can_restore: true
    })
    
  } catch (error: any) {
    console.error('Delete customer error:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer', details: error.message },
      { status: 500 }
    )
  }
}
