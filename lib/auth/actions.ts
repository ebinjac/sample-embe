'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  refreshSession,
  switchTeam,
  type SessionUser,
  type AuthResult
} from './session'

// Zod schema for SSO user data validation
const ssoUserSchema = z.object({
  attributes: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    fullName: z.string().min(1),
    adsId: z.string().min(1),
    guid: z.string().min(1),
    employeeId: z.string().min(1),
    email: z.string().email(),
  }),
  groups: z.array(z.string()),
})

// Type for SSO user data (matches the hook output)
type SSOUserData = {
  attributes: {
    firstName: string
    lastName: string
    fullName: string
    adsId: string
    guid: string
    employeeId: string
    email: string
  }
  groups: string[]
}

/**
 * Create or update user session based on SSO data
 * This should be called from the client when SSO data is available
 */
export async function authenticateWithSSO(ssoData: SSOUserData): Promise<AuthResult<{ authenticated: boolean }>> {
  try {
    // Validate SSO data
    const validatedData = ssoUserSchema.parse(ssoData)

    // Convert to session user format
    const sessionUser: SessionUser = {
      id: validatedData.attributes.guid,
      adsId: validatedData.attributes.adsId,
      email: validatedData.attributes.email,
      firstName: validatedData.attributes.firstName,
      lastName: validatedData.attributes.lastName,
      fullName: validatedData.attributes.fullName,
      employeeId: validatedData.attributes.employeeId,
    }

    // Create JWT token
    const token = await createSessionToken(sessionUser, validatedData.groups)

    // Set session cookie
    await setSessionCookie(token)

    // Revalidate the home page to show authenticated state
    revalidatePath('/')

    return {
      success: true,
      data: { authenticated: true }
    }
  } catch (error) {
    console.error('Authentication failed:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid SSO data: ${error.issues.map(e => e.message).join(', ')}`
      }
    }

    return {
      success: false,
      error: 'Authentication failed. Please try again.'
    }
  }
}

/**
 * Sign out user by clearing session cookie
 */
export async function signOut(): Promise<AuthResult<{ signedOut: boolean }>> {
  try {
    await clearSessionCookie()

    // Revalidate all paths to clear any cached data
    revalidatePath('/', 'layout')

    return {
      success: true,
      data: { signedOut: true }
    }
  } catch (error) {
    console.error('Sign out failed:', error)
    return {
      success: false,
      error: 'Failed to sign out. Please try again.'
    }
  }
}

/**
 * Switch user's active team
 */
export async function switchUserTeam(teamId: string): Promise<AuthResult<{ switched: boolean }>> {
  try {
    // Get current session
    const currentSession = await getSession()
    if (!currentSession) {
      return {
        success: false,
        error: 'No active session found'
      }
    }

    // Switch to new team
    const updatedSession = await switchTeam(currentSession, teamId)
    if (!updatedSession) {
      return {
        success: false,
        error: 'Team not found or access denied'
      }
    }

    // Create new token with updated team selection
    const newToken = await refreshSession(updatedSession)

    // Update session cookie
    await setSessionCookie(newToken)

    // Revalidate current path to reflect team change
    revalidatePath('/')

    return {
      success: true,
      data: { switched: true }
    }
  } catch (error) {
    console.error('Team switch failed:', error)
    return {
      success: false,
      error: 'Failed to switch team. Please try again.'
    }
  }
}

/**
 * Get current authenticated user session
 * This can be called from Server Components to get user data
 */
export async function getCurrentSession() {
  try {
    return await getSession()
  } catch (error) {
    console.error('Failed to get current session:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 * Returns boolean for simple auth checks
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}

/**
 * Get user's teams for display purposes
 */
export async function getUserTeams() {
  try {
    const session = await getSession()
    if (!session) {
      return { teams: [], selectedTeamId: null }
    }

    return {
      teams: session.teams,
      selectedTeamId: session.selectedTeamId || null,
    }
  } catch (error) {
    console.error('Failed to get user teams:', error)
    return { teams: [], selectedTeamId: null }
  }
}

/**
 * Validate session and refresh if needed
 * This can be called periodically to ensure session is valid
 */
export async function validateSession(): Promise<AuthResult<{ valid: boolean }>> {
  try {
    const session = await getSession()
    if (!session) {
      return {
        success: false,
        error: 'No active session'
      }
    }

    // Check if session is expired (JWT library handles this in verifySessionToken)
    // If we got here, session is valid

    return {
      success: true,
      data: { valid: true }
    }
  } catch (error) {
    console.error('Session validation failed:', error)
    return {
      success: false,
      error: 'Session validation failed'
    }
  }
}

/**
 * Check if user has admin access to any team
 */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    const session = await getSession()
    if (!session) {
      return false
    }

    // Check if user is admin for any team
    const hasAdminAccess = session.teams.some(team => team.isAdmin)
    return hasAdminAccess
  } catch (error) {
    console.error('Failed to check admin access:', error)
    return false
  }
}