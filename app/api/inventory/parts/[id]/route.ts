import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface UpdatePartData {
  part_number?: string
  description?: string
  category?: string
  subcategory?: string
  manufacturer?: string
  cost?: number
  list_price?: number
  core_charge?: number
  stock_quantity?: number
  min_stock?: number
  max_stock?: number
  location?: string
  notes?: string
  superseded_by?: string
  image_url?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const partId = parseInt(resolvedParams.id)

    if (isNaN(partId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid part ID' },
        { status: 400 }
      )
    }

    const body: UpdatePartData = await request.json()

    // Build dynamic SQL query based on provided fields
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    const fieldMapping: Record<string, string> = {
      part_number: 'part_number',
      description: 'description',
      category: 'category',
      subcategory: 'subcategory',
      manufacturer: 'manufacturer',
      cost: 'cost',
      list_price: 'list_price',
      core_charge: 'core_charge',
      stock_quantity: 'stock_quantity',
      min_stock: 'min_stock',
      max_stock: 'max_stock',
      location: 'location',
      notes: 'notes',
      superseded_by: 'superseded_by',
      image_url: 'image_url',
    }

    // Build SET clause dynamically
    Object.keys(body).forEach((key) => {
      if (fieldMapping[key] && body[key as keyof UpdatePartData] !== undefined) {
        updates.push(`${fieldMapping[key]} = $${paramIndex}`)
        values.push(body[key as keyof UpdatePartData])
        paramIndex++
      }
    })

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`)
    values.push(partId) // Last parameter is the part ID

    const sql = `
      UPDATE parts_inventory 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Part not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      part: result.rows[0],
    })
  } catch (error) {
    console.error('Error updating part:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update part' 
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const partId = parseInt(resolvedParams.id)

    if (isNaN(partId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid part ID' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT * FROM parts_inventory WHERE id = $1',
      [partId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Part not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      part: result.rows[0],
    })
  } catch (error) {
    console.error('Error fetching part:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch part' 
      },
      { status: 500 }
    )
  }
}
