/**
 * Customer Import API
 * 
 * Handles CSV uploads from ShopWare customer exports
 * Uses UPSERT strategy to safely update existing customers
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
    
    console.log(`[Customer Import] Processing file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
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
      console.error('[Customer Import] Parse error:', parseError);
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
    
    console.log(`[Customer Import] Parsed ${records.length} records`);
    
    // DEBUG: Log first record's column names
    if (records.length > 0) {
      const columnNames = Object.keys(records[0] as Record<string, any>);
      console.log('[Customer Import] CSV Column Names:', columnNames);
      console.log('[Customer Import] First Record Sample:', records[0]);
      
      // Return column names in response if no customers are imported (helps with debugging)
      if (columnNames.length > 0) {
        console.log('[Customer Import] Detected columns:', columnNames.join(', '));
      }
    }
    
    // Begin transaction
    await client.query('BEGIN');
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors: Array<{ customer: string; error: string }> = [];
    
    for (const record of records) {
      try {
        // ShopWare format: First Name + Last Name
        const firstName = (record as any)['First Name'] || '';
        const lastName = (record as any)['Last Name'] || '';
        
        // Build customer name from First Name + Last Name
        let customerName = '';
        if (firstName && lastName) {
          customerName = `${firstName.trim()} ${lastName.trim()}`;
        } else if (firstName) {
          customerName = firstName.trim();
        } else if (lastName) {
          customerName = lastName.trim();
        } else {
          // Fallback to other name formats
          customerName = (record as any)['Customer Name'] || 
                        (record as any).Name || 
                        (record as any).customer_name || 
                        '';
        }
        
        if (!customerName || customerName.trim().length === 0) {
          skipped++;
          continue; // Skip records without customer name
        }
        
        // Extract phone numbers - ShopWare format
        const phonePrimary = (record as any).Phone || 
                            (record as any)['Primary Phone'] || 
                            (record as any).phone_primary || 
                            '';
        
        // Parse "Other phones" field (may contain multiple phones separated by commas)
        const otherPhones = (record as any)['Other phones'] || '';
        const phoneNumbers = otherPhones.split(',').map((p: string) => p.trim()).filter((p: string) => p);
        const phoneSecondary = phoneNumbers[0] || 
                              (record as any)['Secondary Phone'] || 
                              (record as any)['Alt Phone'] || 
                              '';
        const phoneMobile = phoneNumbers[1] || 
                           (record as any)['Mobile Phone'] || 
                           (record as any).Mobile || 
                           '';
        
        // Extract email - ShopWare format
        const email = (record as any).Email || 
                     (record as any)['Email Address'] || 
                     (record as any).email || 
                     null;
        
        // Extract address fields - ShopWare format
        const address = (record as any).Address || 
                       (record as any)['Street Address'] || 
                       (record as any).address || 
                       '';
        
        const city = (record as any).City || (record as any).city || '';
        const state = (record as any).State || (record as any).state || '';
        const zipCode = (record as any).Zip || 
                       (record as any)['Zip Code'] || 
                       (record as any).ZIP || 
                       '';
        
        // Customer type - default to individual
        const customerType = (record as any)['Customer Type'] || 
                            (record as any).Type || 
                            'individual';
        
        // Company name (for business customers)
        const companyName = (record as any)['Company Name'] || 
                           (record as any).Company || 
                           (record as any).company_name || 
                           null;
        
        // Tax ID
        const taxId = (record as any)['Tax ID'] || 
                     (record as any).TaxID || 
                     (record as any).tax_id || 
                     null;
        
        // Notes - ShopWare format
        const notes = (record as any)['Customer Notes'] || 
                     (record as any).Notes || 
                     (record as any).Comments || 
                     '';
        
        // ShopWare customer ID
        const shopwareId = (record as any)['Customer ID'] || 
                          (record as any).ID || 
                          '';
        
        // Truncate values to fit database column limits
        const truncate = (str: string, maxLen: number) => str ? str.substring(0, maxLen) : str;
        
        // Check if customer already exists (by name and phone)
        const checkResult = await client.query(`
          SELECT id FROM customers 
          WHERE customer_name = $1 AND phone_primary = $2
          LIMIT 1
        `, [
          truncate(customerName.trim(), 255), 
          truncate(phonePrimary.trim() || '', 20) || null
        ]);
        
        if (checkResult.rows.length > 0) {
          // Customer exists - UPDATE
          await client.query(`
            UPDATE customers SET
              phone_secondary = $1,
              phone_mobile = $2,
              email = $3,
              address_line1 = $4,
              city = $5,
              state = $6,
              zip = $7,
              customer_type = $8,
              notes = $9,
              updated_at = NOW()
            WHERE id = $10
          `, [
            truncate(phoneSecondary.trim() || '', 20) || null,
            truncate(phoneMobile.trim() || '', 20) || null,
            truncate(email ? email.trim() : '', 255) || null,
            truncate(address.trim() || '', 255) || null,
            truncate(city.trim() || '', 100) || null,
            truncate(state.trim() || '', 50) || null,
            truncate(zipCode.trim() || '', 10) || null,
            truncate(customerType.toLowerCase(), 50),
            truncate(notes.trim() || '', 1000) || null,
            checkResult.rows[0].id
          ]);
          updated++;
        } else {
          // Customer doesn't exist - INSERT
          await client.query(`
            INSERT INTO customers (
              customer_name,
              phone_primary,
              phone_secondary,
              phone_mobile,
              email,
              address_line1,
              city,
              state,
              zip,
              customer_type,
              notes,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          `, [
            truncate(customerName.trim(), 255),
            truncate(phonePrimary.trim() || '', 20) || null,
            truncate(phoneSecondary.trim() || '', 20) || null,
            truncate(phoneMobile.trim() || '', 20) || null,
            truncate(email ? email.trim() : '', 255) || null,
            truncate(address.trim() || '', 255) || null,
            truncate(city.trim() || '', 100) || null,
            truncate(state.trim() || '', 50) || null,
            truncate(zipCode.trim() || '', 10) || null,
            truncate(customerType.toLowerCase(), 50),
            truncate(notes.trim() || '', 1000) || null
          ]);
          imported++;
        }
        
      } catch (err: any) {
        errors.push({
          customer: (record as any)['Customer Name'] || (record as any).Name || 'unknown',
          error: err.message
        });
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`[Customer Import] Success: ${imported} new, ${updated} updated, ${skipped} skipped, ${errors.length} errors`);
    
    // If all records were skipped, include column names to help debug
    const detectedColumns = records.length > 0 ? Object.keys(records[0] as Record<string, any>) : [];
    
    return NextResponse.json({ 
      success: true, 
      imported,
      updated,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      total: records.length,
      message: `Successfully processed ${records.length} customers: ${imported} new, ${updated} updated${skipped > 0 ? `, ${skipped} skipped` : ''}${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
      detectedColumns: skipped === records.length ? detectedColumns : undefined // Only include if all skipped
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Customer Import] Error:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}

/**
 * GET endpoint to check customer stats
 */
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(*) FILTER (WHERE customer_type = 'individual') as individual_customers,
        COUNT(*) FILTER (WHERE customer_type = 'business') as business_customers,
        MAX(updated_at) as last_sync
      FROM customers
    `);

    const stats = result.rows[0];

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers: parseInt(stats.total_customers || 0),
        individualCustomers: parseInt(stats.individual_customers || 0),
        businessCustomers: parseInt(stats.business_customers || 0),
        lastSync: stats.last_sync
      }
    });
  } catch (error: any) {
    console.error('[Customer Stats] Error:', error);
    return NextResponse.json({
      error: 'Failed to get stats',
      details: error.message
    }, { status: 500 });
  }
}
