/**
 * AI Label Scanner API
 * 
 * Scans fluid product labels using Gemini 3.0 vision to extract technical specifications.
 * Returns normalized specs with confidence scores for inventory management.
 * 
 * POST /api/inventory/scan-label
 * Body: FormData with 'photos[]' - one or more images of product labels
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const photos = formData.getAll('photos') as File[]
    
    if (photos.length === 0) {
      return NextResponse.json(
        { error: 'No photos provided. Please upload at least one image.' },
        { status: 400 }
      )
    }

    console.log(`📸 Processing ${photos.length} label photo(s)...`)

    // Convert photos to base64 for Gemini vision
    const photosBase64 = await Promise.all(
      photos.map(async (photo) => {
        const bytes = await photo.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        return {
          inlineData: {
            data: base64,
            mimeType: photo.type
          }
        }
      })
    )

    // Initialize Gemini 3.0 Flash with structured output
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview', // Gemini 3.0
      
      systemInstruction: `You are an AI Fluid Specification Extraction Agent for automotive repair shops.

MISSION: Extract technical specifications from automotive fluid product labels with high accuracy.

EXTRACTION RULES:
1. Identify fluid type (engine oil, transmission fluid, coolant, brake fluid, etc.)
2. Extract ALL certifications and technical approvals visible on label
3. Distinguish between:
   - "API Certified" = actual certification
   - "Meets API SP" = meets standard but not certified
   - "Approved" vs "Exceeds" vs "Meets"
4. Focus on TECHNICAL specs, ignore marketing language:
   ✅ Extract: "API SP", "ILSAC GF-6A", "dexos1 Gen 3", "VW 504 00"
   ❌ Ignore: "Advanced Protection", "Superior Performance", "Engine Clean"
5. Normalize OEM specs to standard format:
   - "dexos1 Gen 3" → "GM-DEXOS1-G3"
   - "dexos1™ Generation 3" → "GM-DEXOS1-G3"
   - "VW 504 00" → "VW-504.00"
   - "BMW LL-01" → "BMW-LL-01"
   - "MB 229.51" → "MB-229.51"
   - "Ford WSS-M2C947-B1" → "FORD-WSS-M2C947-B1"
   - "MERCON LV" → "FORD-MERCON-LV"

CONFIDENCE SCORING:
- 0.95-1.0: Crystal clear label, all specs visible
- 0.85-0.94: Good clarity, minor uncertainty on 1-2 specs
- 0.70-0.84: Readable but some specs unclear or partially visible
- 0.50-0.69: Poor image quality or label partially obscured
- Below 0.50: Cannot reliably extract specs

QUALITY CHECKS:
- If label is blurry, set confidence < 0.70 and note in warnings
- If only partial specs visible, set confidence < 0.80
- If multiple conflicting specs found, flag as warning
- Always be conservative with confidence - better to flag for review`,

      generationConfig: {
        temperature: 0.1, // Low temperature for consistency
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            product_name: { 
              type: SchemaType.STRING,
              description: 'Full product name from label'
            },
            brand: { 
              type: SchemaType.STRING,
              description: 'Brand/manufacturer name'
            },
            fluid_type: { 
              type: SchemaType.STRING,
              description: 'Type of automotive fluid (engine_oil, transmission_fluid, coolant, brake_fluid, etc.)'
            },
            base_stock: {
              type: SchemaType.STRING,
              description: 'Base oil type (full_synthetic, synthetic_blend, conventional, mineral, unknown)'
            },
            viscosity: { 
              type: SchemaType.STRING,
              description: 'Viscosity grade (e.g., 0W20, 5W30, 75W90, DOT4)'
            },
            api_service_class: { 
              type: SchemaType.STRING,
              description: 'API service classification (e.g., SP, SN-PLUS, CK-4)'
            },
            acea_class: { 
              type: SchemaType.STRING,
              description: 'ACEA classification (e.g., C3, C5, A3/B4)'
            },
            ilsac_class: { 
              type: SchemaType.STRING,
              description: 'ILSAC classification (e.g., GF-6A, GF-6B)'
            },
            jaso_class: {
              type: SchemaType.STRING,
              description: 'JASO classification for motorcycles (e.g., MA, MA2)'
            },
            oem_approvals: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  raw_text: { 
                    type: SchemaType.STRING,
                    description: 'Exact text from label'
                  },
                  normalized_code: { 
                    type: SchemaType.STRING,
                    description: 'Standardized code (e.g., GM-DEXOS1-G3)'
                  },
                  manufacturer: {
                    type: SchemaType.STRING,
                    description: 'OEM manufacturer (e.g., General Motors, Ford, BMW)'
                  },
                  status: { 
                    type: SchemaType.STRING,
                    description: 'Approval status (licensed, approved, meets, exceeds)'
                  }
                },
                required: ['raw_text', 'normalized_code', 'status']
              },
              description: 'OEM specifications and approvals'
            },
            low_saps: { 
              type: SchemaType.BOOLEAN,
              description: 'Low Sulfated Ash, Phosphorus, and Sulfur'
            },
            high_mileage: { 
              type: SchemaType.BOOLEAN,
              description: 'Formulated for high-mileage engines'
            },
            container_size: {
              type: SchemaType.STRING,
              description: 'Container size (e.g., 5 quarts, 1 gallon)'
            },
            confidence_score: { 
              type: SchemaType.NUMBER,
              description: 'Confidence in extraction accuracy (0.0-1.0)'
            },
            warnings: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: 'Any warnings or uncertainties about the extraction'
            }
          },
          required: ['product_name', 'fluid_type', 'confidence_score']
        }
      }
    })

    // Build prompt for label extraction
    const prompt = `Analyze ${photos.length === 1 ? 'this' : 'these'} automotive fluid product label photo${photos.length > 1 ? 's' : ''}.

TASK: Extract ALL technical specifications visible on the label(s).

Focus on:
- Product name and brand
- Fluid type and viscosity grade
- Industry certifications (API, ACEA, ILSAC, JASO)
- OEM approvals (GM dexos, Ford WSS, VW, BMW LL, Mercedes MB, etc.)
- Base stock type (synthetic, blend, conventional)
- Special properties (low SAPS, high mileage)
- Container size

IMPORTANT:
- Only extract what you can clearly read on the label
- Set confidence score based on image quality and visibility
- If any specs are unclear, note in warnings array
- Return complete JSON with all available information

Number of photos: ${photos.length}
${photos.length > 1 ? 'TIP: Multiple photos may show front/back of same bottle - combine information from all angles' : ''}`

    // Call Gemini 3.0 vision API
    console.log('🤖 Calling Gemini 3.0 vision for label analysis...')
    const result = await model.generateContent([prompt, ...photosBase64])
    const responseText = result.response.text()
    
    // Parse structured JSON response
    let extracted
    try {
      extracted = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      console.error('Raw response:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: responseText },
        { status: 500 }
      )
    }

    console.log('✓ Extracted specs:', extracted.product_name)
    console.log(`  Confidence: ${(extracted.confidence_score * 100).toFixed(0)}%`)

    // Normalize OEM approvals using mapping table
    if (extracted.oem_approvals && extracted.oem_approvals.length > 0) {
      console.log(`🔄 Normalizing ${extracted.oem_approvals.length} OEM approval(s)...`)
      
      const normalizedApprovals = await Promise.all(
        extracted.oem_approvals.map(async (approval: any) => {
          // Check if we have a mapping for this spec
          const mappingResult = await query(`
            SELECT 
              normalized_code,
              manufacturer,
              spec_type,
              notes
            FROM oem_spec_mappings 
            WHERE LOWER(raw_text) = LOWER($1)
            LIMIT 1
          `, [approval.raw_text])
          
          if (mappingResult.rows.length > 0) {
            const mapping = mappingResult.rows[0]
            console.log(`  ✓ Mapped "${approval.raw_text}" → ${mapping.normalized_code}`)
            
            return {
              ...approval,
              normalized_code: mapping.normalized_code,
              manufacturer: mapping.manufacturer,
              spec_type: mapping.spec_type,
              notes: mapping.notes,
              was_normalized: true
            }
          }
          
          // No mapping found - use AI's normalization
          console.log(`  ⚠️ No mapping for "${approval.raw_text}" - using AI normalization`)
          return {
            ...approval,
            was_normalized: false
          }
        })
      )
      
      extracted.oem_approvals = normalizedApprovals
    }

    // Determine if needs review
    const needsReview = extracted.confidence_score < 0.8 || 
                       (extracted.warnings && extracted.warnings.length > 0)

    console.log(`✓ Label scan complete - ${needsReview ? '⚠️ NEEDS REVIEW' : '✅ VERIFIED'}`)

    return NextResponse.json({
      success: true,
      extracted,
      needs_review: needsReview,
      metadata: {
        photos_processed: photos.length,
        extraction_date: new Date().toISOString(),
        model: 'gemini-3-flash-preview'
      }
    })

  } catch (error: any) {
    console.error('=== LABEL SCAN ERROR ===')
    console.error('Error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        error: 'Failed to scan label',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
