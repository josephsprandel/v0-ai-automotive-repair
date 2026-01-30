import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/vehicles/[id] - Get single vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await query(
      `SELECT 
        v.id, v.customer_id, v.vin, v.year, v.make, v.model, v.submodel,
        v.engine, v.transmission, v.color, v.license_plate, v.license_plate_state,
        v.mileage, v.manufacture_date, v.notes, v.is_active,
        v.created_at, v.updated_at,
        c.customer_name, c.phone_primary, c.email
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.id
      WHERE v.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json({ vehicle: result.rows[0] })
  } catch (error: any) {
    console.error('Error fetching vehicle:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/vehicles/[id] - Update vehicle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if vehicle exists
    const vehicleCheck = await query('SELECT id FROM vehicles WHERE id = $1', [id])
    if (vehicleCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Build dynamic update query
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    const allowedFields = [
      'vin', 'year', 'make', 'model', 'submodel', 'engine', 'transmission',
      'color', 'license_plate', 'license_plate_state', 'mileage',
      'manufacture_date', 'notes', 'is_active'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`)
        // Handle VIN uppercase conversion
        if (field === 'vin' && body[field]) {
          values.push(body[field].toUpperCase())
        } else {
          values.push(body[field])
        }
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(id)

    const sql = `
      UPDATE vehicles
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(sql, values)

    return NextResponse.json({
      vehicle: result.rows[0],
      message: 'Vehicle updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/vehicles/[id] - Soft delete vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Soft delete by setting is_active to false
    const result = await query(
      `UPDATE vehicles SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Vehicle deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
