/**
 * Restore Deleted Customer API
 * 
 * POST /api/customers/[id]/restore
 * Requires 'restore_customer' permission
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
    const canRestore = await hasPermission(user.id, 'restore_customer')
    if (!canRestore) {
      return NextResponse.json(
        { error: 'Insufficient permissions to restore customers' },
        { status: 403 }
      )
    }
    
    // Restore the customer
    const result = await query(`
      UPDATE customers 
      SET deleted_at = NULL, deleted_by = NULL
      WHERE id = $1 AND deleted_at IS NOT NULL
      RETURNING id, customer_name
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found in recycle bin' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Customer restored successfully',
      customer_name: result.rows[0].customer_name
    })
    
  } catch (error: any) {
    console.error('Restore customer error:', error)
    return NextResponse.json(
      { error: 'Failed to restore customer', details: error.message },
      { status: 500 }
    )
  }
}
