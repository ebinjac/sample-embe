'use server'

import { db } from '@/db/index'
import { teams, teamRegistrationRequests } from '@/db/schema/teams'
import { eq, and, desc, count, gte, lte, like, sql } from 'drizzle-orm'
import { getCurrentSession } from './actions'
import { randomUUID } from 'crypto'

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    // Get counts for different statuses
    const pendingRequests = await db
      .select({ count: count() })
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.status, 'pending'))

    const approvedRequests = await db
      .select({ count: count() })
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.status, 'approved'))

    const rejectedRequests = await db
      .select({ count: count() })
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.status, 'rejected'))

    const totalTeams = await db
      .select({ count: count() })
      .from(teams)

    const activeTeams = await db
      .select({ count: count() })
      .from(teams)
      .where(eq(teams.isActive, true))

    return {
      pendingRequests: pendingRequests[0]?.count || 0,
      approvedRequests: approvedRequests[0]?.count || 0,
      rejectedRequests: rejectedRequests[0]?.count || 0,
      totalTeams: totalTeams[0]?.count || 0,
      activeTeams: activeTeams[0]?.count || 0,
    }
  } catch (error) {
    console.error('Failed to get dashboard stats:', error)
    return {
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalTeams: 0,
      activeTeams: 0,
    }
  }
}

/**
 * Get all team registration requests with filtering
 */
export async function getTeamRegistrationRequests(options: {
  page?: number
  limit?: number
  status?: string
  search?: string
}) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    // Build conditions
    const conditions = []
    
    // Apply status filter
    if (options.status) {
      conditions.push(eq(teamRegistrationRequests.status, options.status as 'pending' | 'approved' | 'rejected'))
    }

    // Apply search filter
    if (options.search) {
      conditions.push(like(teamRegistrationRequests.teamName, `%${options.search}%`))
    }

    // Build the query
    const requests = await db
      .select()
      .from(teamRegistrationRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(teamRegistrationRequests.requestedAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const countResult = await db
      .select({ count: count() })
      .from(teamRegistrationRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    
    const totalCount = countResult[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      requests,
      totalPages,
      currentPage: page,
      totalCount,
    }
  } catch (error) {
    console.error('Failed to get team registration requests:', error)
    return {
      requests: [],
      totalPages: 0,
      currentPage: 1,
      totalCount: 0,
    }
  }
}

/**
 * Approve a team registration request
 */
export async function approveTeamRegistration(requestId: string, comments?: string) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get the request
    const request = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.id, requestId))
      .limit(1)

    if (request.length === 0) {
      return { success: false, error: 'Request not found' }
    }

    const registrationRequest = request[0]

    // Check if already processed
    if (registrationRequest.status !== 'pending') {
      return { success: false, error: 'Request has already been processed' }
    }

    // Create the team
    const teamId = randomUUID()
    await db.insert(teams).values({
      id: teamId,
      teamName: registrationRequest.teamName,
      userGroup: registrationRequest.userGroup,
      adminGroup: registrationRequest.adminGroup,
      contactName: registrationRequest.contactName,
      contactEmail: registrationRequest.contactEmail,
      isActive: true,
      createdBy: session.user.id,
    })

    // Update the request status
    await db
      .update(teamRegistrationRequests)
      .set({
        status: 'approved',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        comments: comments || null,
        updatedAt: new Date(),
      })
      .where(eq(teamRegistrationRequests.id, requestId))

    return { success: true, data: { teamId } }
  } catch (error) {
    console.error('Failed to approve team registration:', error)
    return { success: false, error: 'Failed to approve request' }
  }
}

/**
 * Reject a team registration request
 */
export async function rejectTeamRegistration(requestId: string, comments?: string) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get the request
    const request = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.id, requestId))
      .limit(1)

    if (request.length === 0) {
      return { success: false, error: 'Request not found' }
    }

    const registrationRequest = request[0]

    // Check if already processed
    if (registrationRequest.status !== 'pending') {
      return { success: false, error: 'Request has already been processed' }
    }

    // Update the request status
    await db
      .update(teamRegistrationRequests)
      .set({
        status: 'rejected',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        comments: comments || null,
        updatedAt: new Date(),
      })
      .where(eq(teamRegistrationRequests.id, requestId))

    return { success: true }
  } catch (error) {
    console.error('Failed to reject team registration:', error)
    return { success: false, error: 'Failed to reject request' }
  }
}

/**
 * Get all teams with filtering
 */
export async function getTeams(options: {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    // Build conditions
    const conditions = []
    
    // Apply active filter
    if (options.isActive !== undefined) {
      conditions.push(eq(teams.isActive, options.isActive))
    }

    // Apply search filter
    if (options.search) {
      conditions.push(like(teams.teamName, `%${options.search}%`))
    }

    // Build the query
    const teamsList = await db
      .select()
      .from(teams)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(teams.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const countResult = await db
      .select({ count: count() })
      .from(teams)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    
    const totalCount = countResult[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      teams: teamsList,
      totalPages,
      currentPage: page,
      totalCount,
    }
  } catch (error) {
    console.error('Failed to get teams:', error)
    return {
      teams: [],
      totalPages: 0,
      currentPage: 1,
      totalCount: 0,
    }
  }
}

/**
 * Toggle team active status
 */
export async function toggleTeamStatus(teamId: string, isActive: boolean) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    await db
      .update(teams)
      .set({
        isActive,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))

    return { success: true }
  } catch (error) {
    console.error('Failed to toggle team status:', error)
    return { success: false, error: 'Failed to update team status' }
  }
}

/**
 * Get recent activity for dashboard
 */
export async function getRecentActivity(limit: number = 10) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    // Get recent registration requests
    const recentRequests = await db
      .select()
      .from(teamRegistrationRequests)
      .orderBy(desc(teamRegistrationRequests.requestedAt))
      .limit(limit)

    // Get recent team approvals/rejections
    const recentDecisions = await db
      .select()
      .from(teamRegistrationRequests)
      .where(
        and(
          eq(teamRegistrationRequests.reviewedAt, teamRegistrationRequests.reviewedAt),
          eq(teamRegistrationRequests.status, teamRegistrationRequests.status)
        )
      )
      .orderBy(desc(teamRegistrationRequests.reviewedAt))
      .limit(limit)

    // Get recent team status changes
    const recentTeams = await db
      .select()
      .from(teams)
      .orderBy(desc(teams.updatedAt))
      .limit(limit)

    // Combine and format activities
    const activities = [
      ...recentRequests.map(request => ({
        id: request.id,
        type: 'request' as const,
        action: 'submitted' as const,
        entityType: 'team_registration' as const,
        entityName: request.teamName,
        timestamp: request.requestedAt,
        user: request.requestedBy,
        details: {
          status: request.status,
          contactName: request.contactName,
          contactEmail: request.contactEmail
        }
      })),
      ...recentDecisions.map(request => ({
        id: `decision-${request.id}`,
        type: 'decision' as const,
        action: request.status as 'approved' | 'rejected',
        entityType: 'team_registration' as const,
        entityName: request.teamName,
        timestamp: request.reviewedAt!,
        user: request.reviewedBy!,
        details: {
          comments: request.comments,
          contactName: request.contactName,
          contactEmail: request.contactEmail
        }
      })),
      ...recentTeams.map(team => ({
        id: `team-${team.id}`,
        type: 'team_update' as const,
        action: team.isActive ? 'activated' : 'deactivated' as const,
        entityType: 'team' as const,
        entityName: team.teamName,
        timestamp: team.updatedAt!,
        user: team.updatedBy!,
        details: {
          isActive: team.isActive,
          contactName: team.contactName,
          contactEmail: team.contactEmail
        }
      }))
    ]

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('Failed to get recent activity:', error)
    return []
  }
}

/**
 * Get registration trends for the last 30 days
 */
export async function getRegistrationTrends() {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get requests from the last 30 days
    const recentRequests = await db
      .select()
      .from(teamRegistrationRequests)
      .where(gte(teamRegistrationRequests.requestedAt, thirtyDaysAgo))
      .orderBy(teamRegistrationRequests.requestedAt)

    // Group by day and status
    const trends: Record<string, { date: string; pending: number; approved: number; rejected: number }> = {}
    
    recentRequests.forEach(request => {
      const date = new Date(request.requestedAt).toISOString().split('T')[0]
      
      if (!trends[date]) {
        trends[date] = { date, pending: 0, approved: 0, rejected: 0 }
      }
      
      trends[date][request.status]++
    })

    // Fill in missing days with zero values
    const result = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      result.push(trends[dateStr] || { date: dateStr, pending: 0, approved: 0, rejected: 0 })
    }

    return result
  } catch (error) {
    console.error('Failed to get registration trends:', error)
    return []
  }
}