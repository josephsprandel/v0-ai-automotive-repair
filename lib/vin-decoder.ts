/**
 * VIN Decoder Module
 * 
 * Uses NHTSA API for VIN decoding. Can be replaced with other services.
 * API Documentation: https://vpic.nhtsa.dot.gov/api/
 */

export interface VINDecodeResult {
  vin: string
  year?: string
  make?: string
  model?: string
  trim?: string
  error?: string
  raw?: any
}

/**
 * Decode VIN using NHTSA API (free, no API key required)
 * 
 * @param vin - 17 character VIN
 * @returns Decoded vehicle information
 */
export async function decodeVIN(vin: string): Promise<VINDecodeResult> {
  // Validate VIN format
  if (!vin || vin.length !== 17) {
    return {
      vin,
      error: 'Invalid VIN - must be exactly 17 characters'
    }
  }

  try {
    console.log('[VIN Decoder] Decoding VIN:', vin)

    // Call NHTSA API
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.Results || !Array.isArray(data.Results)) {
      throw new Error('Invalid API response format')
    }

    // Extract relevant fields from NHTSA response
    const results = data.Results
    
    const getField = (variableId: number): string => {
      const field = results.find((r: any) => r.VariableId === variableId)
      return field?.Value || ''
    }

    const year = getField(29) // Model Year
    const make = getField(26) // Make
    const model = getField(28) // Model
    const trim = getField(109) // Trim

    console.log('[VIN Decoder] Decoded:', { year, make, model, trim })

    return {
      vin,
      year: year || undefined,
      make: make || undefined,
      model: model || undefined,
      trim: trim || undefined,
      raw: data
    }

  } catch (error: any) {
    console.error('[VIN Decoder] Error:', error)
    return {
      vin,
      error: error.message || 'Failed to decode VIN'
    }
  }
}

/**
 * Alternative: Decode VIN using a different service
 * Placeholder for future implementations (e.g., paid APIs with better data)
 */
export async function decodeVINAlternative(vin: string): Promise<VINDecodeResult> {
  // TODO: Implement alternative decoder (e.g., CarMD, VINAudit, etc.)
  return {
    vin,
    error: 'Alternative decoder not implemented'
  }
}
