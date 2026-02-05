/**
 * RO Engine Parts Inventory Import API
 * 
 * Handles CSV uploads in RO Engine format (from our export)
 * Supports mass editing - updates all fields including approvals
 */

import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ 
        error: 'Invalid file type',
        details: 'File must be CSV format (.csv)' 
      }, { status: 400 });
    }
    
    console.log(`[RO Engine Import] Processing file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // Read CSV content
    const fileContent = await file.text();
    
    // Parse CSV with error handling
    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true
      });
    } catch (parseError: any) {
      console.error('[RO Engine Import] Parse error:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse CSV', 
        details: parseError.message 
      }, { status: 400 });
    }
    
    if (records.length === 0) {
      return NextResponse.json({ 
        error: 'Empty CSV file',
        details: 'CSV file contains no data rows' 
      }, { status: 400 });
    }
    
    console.log(`[RO Engine Import] Parsed ${records.length} records`);
    
    // Verify this is RO Engine format by checking for required columns
    const firstRecord = records[0] as any;
    const hasIdColumn = 'id' in firstRecord;
    const hasPartNumber = 'part_number' in firstRecord;
    
    if (!hasIdColumn || !hasPartNumber) {
      return NextResponse.json({
        error: 'Invalid RO Engine CSV format',
        details: 'CSV must include "id" and "part_number" columns. This appears to be a different format. Use the ShopWare import for ShopWare exports.'
      }, { status: 400 });
    }
    
    // Begin transaction
    await client.query('BEGIN');
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors: Array<{ part_number: string; error: string }> = [];
    
    for (const record of records) {
      try {
        const rec = record as any;
        const id = parseInt(rec.id);
        const partNumber = rec.part_number?.trim();
        
        if (!partNumber || partNumber.length === 0) {
          skipped++;
          continue;
        }
        
        // Parse numeric fields
        const cost = parseFloat(rec.cost || '0');
        const price = parseFloat(rec.price || '0');
        const qtyOnHand = parseInt(rec.quantity_on_hand || '0');
        const qtyAvailable = parseInt(rec.quantity_available || '0');
        const qtyAllocated = parseInt(rec.quantity_allocated || '0');
        const reorderPoint = parseInt(rec.reorder_point || '0');
        
        // If ID exists, try to update that specific record
        if (!isNaN(id) && id > 0) {
          const result = await client.query(`
            UPDATE parts_inventory 
            SET 
              part_number = $1,
              description = $2,
              vendor = $3,
              cost = $4,
              price = $5,
              quantity_on_hand = $6,
              quantity_available = $7,
              quantity_allocated = $8,
              reorder_point = $9,
              location = $10,
              bin_location = $11,
              category = $12,
              approvals = $13,
              notes = $14,
              last_updated = NOW()
            WHERE id = $15
            RETURNING id
          `, [
            partNumber,
            rec.description || '',
            rec.vendor || '',
            cost,
            price,
            qtyOnHand,
            qtyAvailable,
            qtyAllocated,
            reorderPoint,
            rec.location || '',
            rec.bin_location || null,
            rec.category || '',
            rec.approvals || null,
            rec.notes || null,
            id
          ]);
          
          if (result.rows.length > 0) {
            updated++;
          } else {
            // ID not found, insert as new
            await client.query(`
              INSERT INTO parts_inventory (
                part_number, description, vendor, cost, price,
                quantity_on_hand, quantity_available, quantity_allocated,
                reorder_point, location, bin_location, category,
                approvals, notes, shopware_id
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            `, [
              partNumber,
              rec.description || '',
              rec.vendor || '',
              cost,
              price,
              qtyOnHand,
              qtyAvailable,
              qtyAllocated,
              reorderPoint,
              rec.location || '',
              rec.bin_location || null,
              rec.category || '',
              rec.approvals || null,
              rec.notes || null,
              rec.shopware_id || null
            ]);
            imported++;
          }
        } else {
          // No ID or invalid ID - use UPSERT by part_number
          const result = await client.query(`
            INSERT INTO parts_inventory (
              part_number, description, vendor, cost, price,
              quantity_on_hand, quantity_available, quantity_allocated,
              reorder_point, location, bin_location, category,
              approvals, notes, shopware_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (part_number) 
            DO UPDATE SET
              description = EXCLUDED.description,
              vendor = EXCLUDED.vendor,
              cost = EXCLUDED.cost,
              price = EXCLUDED.price,
              quantity_on_hand = EXCLUDED.quantity_on_hand,
              quantity_available = EXCLUDED.quantity_available,
              quantity_allocated = EXCLUDED.quantity_allocated,
              reorder_point = EXCLUDED.reorder_point,
              location = EXCLUDED.location,
              bin_location = EXCLUDED.bin_location,
              category = EXCLUDED.category,
              approvals = EXCLUDED.approvals,
              notes = EXCLUDED.notes,
              last_updated = NOW()
            RETURNING (xmax = 0) AS inserted
          `, [
            partNumber,
            rec.description || '',
            rec.vendor || '',
            cost,
            price,
            qtyOnHand,
            qtyAvailable,
            qtyAllocated,
            reorderPoint,
            rec.location || '',
            rec.bin_location || null,
            rec.category || '',
            rec.approvals || null,
            rec.notes || null,
            rec.shopware_id || null
          ]);
          
          if (result.rows[0].inserted) {
            imported++;
          } else {
            updated++;
          }
        }
        
      } catch (err: any) {
        const rec = record as any;
        errors.push({
          part_number: rec.part_number || 'unknown',
          error: err.message
        });
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`[RO Engine Import] Success: ${imported} new, ${updated} updated, ${skipped} skipped, ${errors.length} errors`);
    
    return NextResponse.json({ 
      success: true, 
      imported,
      updated,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      total: records.length,
      message: `Successfully processed ${records.length} parts: ${imported} new, ${updated} updated${skipped > 0 ? `, ${skipped} skipped` : ''}${errors.length > 0 ? `, ${errors.length} errors` : ''}` 
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[RO Engine Import] Error:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}
