/**
 * Session Helper Functions
 * 
 * Extracts and validates user from JWT token in request headers.
 */

import jwt from 'jsonwebtoken'
import pool from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'roengine-secret-key-change-in-production'

interface User {
  id: number
  email: string
  name: string
}

interface JWTPayload {
  userId: number
  email: string
  name: string
}

/**
 * Extract and validate user from request Authorization header
 * @param request - The incoming Request object
 * @returns User object if valid token, null otherwise
 */
export async function getUserFromRequest(request: Request): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    
    // Verify JWT token
    let decoded: JWTPayload
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (jwtError) {
      return null
    }
    
    // Verify user exists and is active
    const result = await pool.query(`
      SELECT id, email, full_name as name, is_active
      FROM users
      WHERE id = $1
    `, [decoded.userId])
    
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return null
    }
    
    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name
    }
    
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

/**
 * Require authenticated user - throws if not authenticated
 * @param request - The incoming Request object
 * @returns User object
 * @throws Error if not authenticated
 */
export async function requireUser(request: Request): Promise<User> {
  const user = await getUserFromRequest(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}
