"use server"

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db/index'
import { teams } from '@/db/schema/teams'


// Simple in-memory cache for team data
let teamCache: any[] | null = null
let teamCacheTime = 0
const TEAM_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Cached function to get active teams
async function getActiveTeams() {
  const now = Date.now()
  
  // Return cached data if still valid
  if (teamCache && (now - teamCacheTime) < TEAM_CACHE_TTL) {
    return teamCache
  }
  
  // Fetch fresh data from database
  const allTeams = await db.select().from(teams).where(eq(teams.isActive, true))
  
  // Update cache
  teamCache = allTeams
  teamCacheTime = now
  
  return allTeams
}

// Function to clear team cache (useful when teams are updated)
export async  function clearTeamCache() {
  teamCache = null
  teamCacheTime = 0
}

// Types for our session data
export interface SessionUser {
  id: string // guid from SSO
  adsId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  employeeId: string
}

export interface SessionData extends JWTPayload {
  user: SessionUser
  teams: Array<{
    id: string
    teamName: string
    userGroup: string
    adminGroup: string
    isAdmin: boolean
  }>
  selectedTeamId?: string
}

export interface AuthResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Environment variables for JWT secrets
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
)

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d' // 7 days for better persistence
const COOKIE_NAME = 'ensemble-session'

/**
 * Create a JWT token for the authenticated user
 */
export async function createSessionToken(user: SessionUser, userGroups: string[]): Promise<string> {
  // Get teams from cache or database
  const allTeams = await getActiveTeams()
  
  // Filter teams based on user's SSO groups
  const teamsWithMembership = allTeams.filter(team =>
    userGroups.includes(team.userGroup) || userGroups.includes(team.adminGroup)
  ).map(team => ({
    id: team.id,
    teamName: team.teamName,
    userGroup: team.userGroup,
    adminGroup: team.adminGroup,
    isAdmin: userGroups.includes(team.adminGroup),
  }))

  // Default to first team if available
  const selectedTeamId = teamsWithMembership.length > 0 ? teamsWithMembership[0].id : undefined

  const payload: SessionData = {
    user,
    teams: teamsWithMembership,
    selectedTeamId,
    // Standard JWT claims
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseExpirationTime(JWT_EXPIRES_IN),
    iss: 'ensemble-platform',
    aud: 'ensemble-users',
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

/**
 * Verify and decode JWT token
 */
export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'ensemble-platform',
      audience: 'ensemble-users',
    })

    return payload as SessionData
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Set session cookie with JWT token
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseExpirationTime(JWT_EXPIRES_IN),
    path: '/',
  })
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete(COOKIE_NAME)
}

/**
 * Get current session from request cookies
 */
export async function getSession(request?: NextRequest): Promise<SessionData | null> {
  try {
    let token: string | undefined

    if (request) {
      // Try to get token from request cookies
      token = request.cookies.get(COOKIE_NAME)?.value
    } else {
      // Try to get token from server-side cookies
      const cookieStore = await cookies()
      token = cookieStore.get(COOKIE_NAME)?.value
    }

    if (!token) {
      return null
    }

    return await verifySessionToken(token)
  } catch (error) {
    console.error('Failed to get session:', error)
    return null
  }
}

/**
 * Check if user has admin access to selected team
 */
export async function hasTeamAdminAccess(session: SessionData | null): Promise<boolean> {
  if (!session || !session.selectedTeamId) {
    return false
  }

  const selectedTeam = session.teams.find(team => team.id === session.selectedTeamId)
  return selectedTeam?.isAdmin || false
}

/**
 * Get user's teams with membership info
 */
export async function getUserTeams(session: SessionData | null) {
  if (!session) {
    return []
  }

  return session.teams
}

/**
 * Switch to a different team
 */
export async function switchTeam(session: SessionData | null, teamId: string): Promise<SessionData | null> {
  if (!session) {
    return null
  }

  const team = session.teams.find(t => t.id === teamId)
  if (!team) {
    return null
  }

  return {
    ...session,
    selectedTeamId: teamId,
  }
}

/**
 * Parse expiration time string to seconds
 */
function parseExpirationTime(expiration: string): number {
  const match = expiration.match(/^(\d+)([smhdwy])$/)
  if (!match) {
    // Default to 8 hours if format is invalid
    return 8 * 60 * 60
  }

  const value = parseInt(match[1], 10)
  const unit = match[2]

  const multipliers: Record<string, number> = {
    s: 1,
    min: 60, // For backward compatibility, we still support 'min' for minutes
    m: 60,   // 'm' is now reserved for minutes
    h: 60 * 60,
    d: 24 * 60 * 60,
    w: 7 * 24 * 60 * 60,
    mo: 30 * 24 * 60 * 60, // 'mo' for month
    y: 365 * 24 * 60 * 60, // Approximate year
  }

  return value * (multipliers[unit] || multipliers['h'])
}

/**
 * Refresh session token with updated data
 */
export async function refreshSession(session: SessionData): Promise<string> {
  const payload: SessionData = {
    ...session,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseExpirationTime(JWT_EXPIRES_IN),
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}