'use server'

/**
 * Developer Access Control
 * Handles developer-only authentication and access
 *
 * IMPORTANT: The DEVELOPER_KEY_HASH environment variable MUST be set
 * No default/hardcoded keys - must be explicitly configured
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'

/**
 * Get developer key hash from environment variable
 * Throws error if not set
 */
function getDeveloperKeyHash(): string {
  const keyHash = process.env.DEVELOPER_KEY_HASH

  if (!keyHash) {
    throw new Error(
      'DEVELOPER_KEY_HASH environment variable is not set. ' +
      'You must explicitly set the developer security key hash. ' +
      'Generate it with: node -e "const c = require(\'crypto\'); console.log(c.createHash(\'sha256\').update(\'YOUR-SECURE-KEY\').digest(\'hex\'));"'
    )
  }

  return keyHash
}

/**
 * Verify developer access with security key
 */
export async function verifyDeveloperAccess(developerKey: string) {
  try {
    // Get the hash from environment variable (required, no defaults)
    const expectedHash = getDeveloperKeyHash()

    // Hash the provided key
    const hash = crypto
      .createHash('sha256')
      .update(developerKey)
      .digest('hex')

    // Compare with environment variable hash
    const isValid = hash === expectedHash

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid developer key',
      }
    }

    // Create a developer session token
    const token = crypto.randomBytes(32).toString('hex')
    const cookieStore = await cookies()

    // Set secure cookie for developer access (24 hours)
    cookieStore.set('dev_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return {
      success: true,
      message: 'Developer access granted',
      token,
    }
  } catch (error) {
    console.error('Error verifying developer access:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify developer access',
    }
  }
}

/**
 * Check if current request has valid developer access
 */
export async function checkDeveloperAccess(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('dev_access_token')

    return !!token && !!token.value
  } catch (error) {
    console.error('Error checking developer access:', error)
    return false
  }
}

/**
 * Revoke developer access
 */
export async function revokeDeveloperAccess() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('dev_access_token')

    return {
      success: true,
      message: 'Developer access revoked',
    }
  } catch (error) {
    console.error('Error revoking developer access:', error)
    return {
      success: false,
      message: 'Failed to revoke developer access',
    }
  }
}
