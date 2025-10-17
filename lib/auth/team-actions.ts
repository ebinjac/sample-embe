'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/db/index'
import { teamRegistrationRequests, teams, applications } from '@/db/schema/teams'
import { getCurrentSession } from './actions'
import { randomUUID } from 'crypto'
import { eq, and, desc, inArray } from 'drizzle-orm'

// Zod schema for team registration validation
const teamRegistrationSchema = z.object({
  teamName: z.string()
    .min(3, 'Team name must be at least 3 characters long')
    .max(100, 'Team name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Team name can only contain letters, numbers, spaces, hyphens, and underscores'),
  userGroup: z.string()
    .min(3, 'User group must be at least 3 characters long')
    .max(100, 'User group must be less than 100 characters')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'User group must start with a letter and contain only uppercase letters, numbers, and underscores'),
  adminGroup: z.string()
    .min(3, 'Admin group must be at least 3 characters long')
    .max(100, 'Admin group must be less than 100 characters')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Admin group must start with a letter and contain only uppercase letters, numbers, and underscores'),
  contactName: z.string()
    .min(3, 'Contact name must be at least 3 characters long')
    .max(100, 'Contact name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Contact name can only contain letters and spaces'),
  contactEmail: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
})

// Type for team registration input
export type TeamRegistrationInput = z.infer<typeof teamRegistrationSchema>

// Result type for team registration
export interface TeamRegistrationResult {
  success: boolean
  data?: {
    requestId: string
    status: 'pending' | 'approved' | 'rejected'
  }
  error?: string
}

/**
 * Submit a team registration request
 * This creates a record in the team_registration_requests table
 */
export async function submitTeamRegistration(data: TeamRegistrationInput): Promise<TeamRegistrationResult> {
  try {
    // Get current user session
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: 'You must be logged in to submit a team registration request'
      }
    }

    // Validate input data
    const validatedData = teamRegistrationSchema.parse(data)

    // Check if a request with the same team name already exists
    const existingRequest = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.teamName, validatedData.teamName))

    if (existingRequest.length > 0) {
      return {
        success: false,
        error: 'A registration request for this team name already exists'
      }
    }

    // Create the registration request
    const requestId = randomUUID()
    await db.insert(teamRegistrationRequests).values({
      id: requestId,
      teamName: validatedData.teamName,
      userGroup: validatedData.userGroup,
      adminGroup: validatedData.adminGroup,
      contactName: validatedData.contactName,
      contactEmail: validatedData.contactEmail,
      status: 'pending',
      requestedBy: session.user.id,
    })

    // Revalidate the home page to show updated state
    revalidatePath('/')

    return {
      success: true,
      data: {
        requestId,
        status: 'pending'
      }
    }
  } catch (error) {
    console.error('Team registration failed:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid input: ${error.issues.map(e => e.message).join(', ')}`
      }
    }

    return {
      success: false,
      error: 'Failed to submit team registration request. Please try again.'
    }
  }
}

/**
 * Get all team registration requests for the current user
 */
export async function getUserTeamRegistrationRequests() {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return []
    }

    const requests = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.requestedBy, session.user.id))
      .orderBy(desc(teamRegistrationRequests.requestedAt))

    return requests
  } catch (error) {
    console.error('Failed to get team registration requests:', error)
    return []
  }
}

/**
 * Check if a team name is available for registration
 */
export async function checkTeamNameAvailability(teamName: string): Promise<{ available: boolean; message?: string }> {
  try {
    // Check existing teams
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.teamName, teamName))
      .limit(1)

    if (existingTeam.length > 0) {
      return {
        available: false,
        message: 'This team name is already in use'
      }
    }

    // Check existing registration requests
    const existingRequest = await db
      .select()
      .from(teamRegistrationRequests)
      .where(
        and(
          eq(teamRegistrationRequests.teamName, teamName),
          eq(teamRegistrationRequests.status, 'pending')
        )
      )
      .limit(1)

    if (existingRequest.length > 0) {
      return {
        available: false,
        message: 'A registration request for this team name is already pending'
      }
    }

    return { available: true }
  } catch (error) {
    console.error('Failed to check team name availability:', error)
    return {
      available: false,
      message: 'Unable to verify team name availability'
    }
  }
}

/**
 * Get team registration request by ID
 */
export async function getTeamRegistrationRequest(id: string) {
  try {
    const requests = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.id, id))
      .limit(1)

    return requests[0] || null
  } catch (error) {
    console.error('Failed to get team registration request:', error)
    return null
  }
}

/**
 * Get team by ID
 */
export async function getTeamById(teamId: string) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    
    // Check if user is a member of this team
    const team = session.teams.find(t => t.id === teamId)
    if (!team) {
      throw new Error('Team not found or access denied')
    }
    
    // Get full team details from database
    const teamDetails = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)
    
    return teamDetails[0] || null
  } catch (error) {
    console.error('Failed to get team:', error)
    throw error
  }
}

/**
 * Update team details
 */
export async function updateTeam(teamId: string, teamData: {
  teamName: string
  userGroup: string
  adminGroup: string
  contactName: string
  contactEmail: string
}) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Check if user is admin of this team
    const team = session.teams.find(t => t.id === teamId)
    if (!team || !team.isAdmin) {
      return { success: false, error: 'Access denied' }
    }
    
    // Update team in database
    await db
      .update(teams)
      .set({
        ...teamData,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update team:', error)
    return { success: false, error: 'Failed to update team' }
  }
}

/**
 * Get applications for a team
 */
export async function getTeamApplications(teamId: string) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    
    // Check if user is a member of this team
    const team = session.teams.find(t => t.id === teamId)
    if (!team) {
      throw new Error('Team not found or access denied')
    }
    
    // Get applications from database
    const apps = await db
      .select()
      .from(applications)
      .where(eq(applications.teamId, teamId))
      .orderBy(applications.applicationName)
    
    return apps
  } catch (error) {
    console.error('Failed to get team applications:', error)
    throw error
  }
}

/**
 * Get applications for multiple teams in a single query
 */
export async function getApplicationsForMultipleTeams(teamIds: string[]) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    
    // Verify user is a member of all requested teams
    const validTeamIds = teamIds.filter(teamId =>
      session.teams.some(t => t.id === teamId)
    )
    
    if (validTeamIds.length === 0) {
      return {}
    }
    
    // Import the in operator from drizzle-orm
    const { inArray } = await import('drizzle-orm')
    
    // Get all applications for the teams in a single query using IN operator
    const allApps = await db
      .select()
      .from(applications)
      .where(inArray(applications.teamId, validTeamIds))
      .orderBy(applications.teamId, applications.applicationName)
    
    // Group applications by teamId
    const groupedApps: Record<string, any[]> = {}
    allApps.forEach(app => {
      if (!groupedApps[app.teamId]) {
        groupedApps[app.teamId] = []
      }
      groupedApps[app.teamId].push(app)
    })
    
    return groupedApps
  } catch (error) {
    console.error('Failed to get applications for multiple teams:', error)
    throw error
  }
}

/**
 * Fetch application details from Central API (server-side)
 */
export async function fetchApplicationFromCentralAPI(assetId: number) {
  try {
    console.log(`Fetching application from Central API with assetId: ${assetId}`)
    const response = await fetch(`http://localhost:8008/api/central?assetId=${assetId}`)
    
    if (!response.ok) {
      console.error(`Central API returned ${response.status}`)
      throw new Error(`Central API returned ${response.status}`)
    }
    
    const data: any = await response.json()
    console.log('Central API response:', JSON.stringify(data, null, 2))
    
    // Check if the response has the expected structure
    if (!data) {
      console.error('Invalid response structure from Central API: no data')
      return null
    }
    
    // Try to extract the application data from different possible structures
    let applicationData = null
    if (data.data && data.data.application) {
      applicationData = data.data.application
    } else if (data.application) {
      applicationData = data.application
    } else {
      // The entire response might be the application data
      applicationData = data
    }
    
    if (!applicationData) {
      console.error('Invalid response structure from Central API: no application data found')
      return null
    }
    
    // Check if required fields exist
    if (!applicationData.name || !applicationData.assetId) {
      console.error('Required fields missing in application data')
      console.log('Application data:', applicationData)
      return null
    }
    
    console.log('Mapping application data:', applicationData)
    
    // Map Central API response to our database schema
    return {
      applicationName: applicationData.name,
      assetId: applicationData.assetId,
      lifeCycleStatus: applicationData.lifeCycleStatus || null,
      tier: applicationData.risk?.bia || null,
      
      // VP = ProductionSupportOwnerLeader1, Director = ProductionSupportOwner
      vpName: applicationData.ownershipInfo?.productionSupportOwnerLeader1?.fullName || null,
      vpEmail: applicationData.ownershipInfo?.productionSupportOwnerLeader1?.email || null,
      directorName: applicationData.ownershipInfo?.productionSupportOwner?.fullName || null,
      directorEmail: applicationData.ownershipInfo?.productionSupportOwner?.email || null,
      
      // All ownership data from Central API
      applicationOwnerName: applicationData.ownershipInfo?.applicationowner?.fullName || null,
      applicationOwnerEmail: applicationData.ownershipInfo?.applicationowner?.email || null,
      applicationOwnerBand: applicationData.ownershipInfo?.applicationowner?.band || null,
      applicationManagerName: applicationData.ownershipInfo?.applicationManager?.fullName || null,
      applicationManagerEmail: applicationData.ownershipInfo?.applicationManager?.email || null,
      applicationManagerBand: applicationData.ownershipInfo?.applicationManager?.band || null,
      applicationOwnerLeader1Name: applicationData.ownershipInfo?.applicationOwnerLeader1?.fullName || null,
      applicationOwnerLeader1Email: applicationData.ownershipInfo?.applicationOwnerLeader1?.email || null,
      applicationOwnerLeader1Band: applicationData.ownershipInfo?.applicationOwnerLeader1?.band || null,
      applicationOwnerLeader2Name: applicationData.ownershipInfo?.applicationOwnerLeader2?.fullName || null,
      applicationOwnerLeader2Email: applicationData.ownershipInfo?.applicationOwnerLeader2?.email || null,
      applicationOwnerLeader2Band: applicationData.ownershipInfo?.applicationOwnerLeader2?.band || null,
      ownerSvpName: applicationData.ownershipInfo?.ownerSVp?.fullName || null,
      ownerSvpEmail: applicationData.ownershipInfo?.ownerSVp?.email || null,
      ownerSvpBand: applicationData.ownershipInfo?.ownerSVp?.band || null,
      businessOwnerName: applicationData.ownershipInfo?.businessOwner?.fullName || null,
      businessOwnerEmail: applicationData.ownershipInfo?.businessOwner?.email || null,
      businessOwnerBand: applicationData.ownershipInfo?.businessOwner?.band || null,
      businessOwnerLeader1Name: applicationData.ownershipInfo?.businessOwnerLeader1?.fullName || null,
      businessOwnerLeader1Email: applicationData.ownershipInfo?.businessOwnerLeader1?.email || null,
      businessOwnerLeader1Band: applicationData.ownershipInfo?.businessOwnerLeader1?.band || null,
      productionSupportOwnerName: applicationData.ownershipInfo?.productionSupportOwner?.fullName || null,
      productionSupportOwnerEmail: applicationData.ownershipInfo?.productionSupportOwner?.email || null,
      productionSupportOwnerBand: applicationData.ownershipInfo?.productionSupportOwner?.band || null,
      productionSupportOwnerLeader1Name: applicationData.ownershipInfo?.productionSupportOwnerLeader1?.fullName || null,
      productionSupportOwnerLeader1Email: applicationData.ownershipInfo?.productionSupportOwnerLeader1?.email || null,
      productionSupportOwnerLeader1Band: applicationData.ownershipInfo?.productionSupportOwnerLeader1?.band || null,
      pmoName: applicationData.ownershipInfo?.pmo?.fullName || null,
      pmoEmail: applicationData.ownershipInfo?.pmo?.email || null,
      pmoBand: applicationData.ownershipInfo?.pmo?.band || null,
      unitCioName: applicationData.ownershipInfo?.unitCIo?.fullName || null,
      unitCioEmail: applicationData.ownershipInfo?.unitCIo?.email || null,
      unitCioBand: applicationData.ownershipInfo?.unitCIo?.band || null,
      
      // Sync status fields
      lastCentralApiSync: new Date(),
      centralApiSyncStatus: 'success',
    }
  } catch (error) {
    console.error('Failed to fetch application from Central API:', error)
    return null
  }
}

/**
 * Add application to team
 */
export async function addApplicationToTeam(teamId: string, applicationData: {
  assetId: number
  shortIdentifier: string
  applicationName: string
  lifeCycleStatus?: string
  tier?: string
  escalationEmail?: string
  contactEmail?: string
  teamEmail?: string
  slackChannel?: string
  snowGroup?: string
  description?: string
  // All ownership fields from Central API
  productionSupportOwnerLeader1Name?: string
  productionSupportOwnerLeader1Email?: string
  productionSupportOwnerName?: string
  productionSupportOwnerEmail?: string
  applicationOwnerName?: string
  applicationOwnerEmail?: string
  applicationOwnerBand?: string
  applicationManagerName?: string
  applicationManagerEmail?: string
  applicationManagerBand?: string
  applicationOwnerLeader1Name?: string
  applicationOwnerLeader1Email?: string
  applicationOwnerLeader1Band?: string
  applicationOwnerLeader2Name?: string
  applicationOwnerLeader2Email?: string
  applicationOwnerLeader2Band?: string
  ownerSvpName?: string
  ownerSvpEmail?: string
  ownerSvpBand?: string
  businessOwnerName?: string
  businessOwnerEmail?: string
  businessOwnerBand?: string
  businessOwnerLeader1Name?: string
  businessOwnerLeader1Email?: string
  businessOwnerLeader1Band?: string
  productionSupportOwnerBand?: string
  productionSupportOwnerLeader1Band?: string
  pmoName?: string
  pmoEmail?: string
  pmoBand?: string
  unitCioName?: string
  unitCioEmail?: string
  unitCioBand?: string
}) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Check if user is admin of this team
    const team = session.teams.find(t => t.id === teamId)
    if (!team || !team.isAdmin) {
      return { success: false, error: 'Access denied' }
    }
    
    // Check if Short Identifier is unique within this team
    const existingShortId = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.teamId, teamId),
          eq(applications.tla, applicationData.shortIdentifier)
        )
      )
      .limit(1)
    
    if (existingShortId.length > 0) {
      return { success: false, error: 'An application with this Short Identifier already exists in this team' }
    }
    
    // Note: We're allowing the same Asset ID to be added to multiple teams
    // Only the Short Identifier needs to be unique within each team
    
    // Debug logging
    console.log('Adding application to database with data:', JSON.stringify(applicationData, null, 2))
    
    // Add application to database
    await db.insert(applications).values({
      // Basic fields
      teamId,
      assetId: applicationData.assetId,
      applicationName: applicationData.applicationName,
      tla: applicationData.shortIdentifier,
      lifeCycleStatus: applicationData.lifeCycleStatus || null,
      tier: applicationData.tier || null,
      
      // User-entered fields
      escalationEmail: applicationData.escalationEmail || null,
      contactEmail: applicationData.contactEmail || null,
      teamEmail: applicationData.teamEmail || null,
      slackChannel: applicationData.slackChannel || null,
      snowGroup: applicationData.snowGroup || null,
      description: applicationData.description || null,
      
      // VP and Director mappings
      vpName: applicationData.productionSupportOwnerLeader1Name || null,
      vpEmail: applicationData.productionSupportOwnerLeader1Email || null,
      directorName: applicationData.productionSupportOwnerName || null,
      directorEmail: applicationData.productionSupportOwnerEmail || null,
      
      // All ownership data from Central API
      applicationOwnerName: applicationData.applicationOwnerName || null,
      applicationOwnerEmail: applicationData.applicationOwnerEmail || null,
      applicationOwnerBand: applicationData.applicationOwnerBand || null,
      applicationManagerName: applicationData.applicationManagerName || null,
      applicationManagerEmail: applicationData.applicationManagerEmail || null,
      applicationManagerBand: applicationData.applicationManagerBand || null,
      applicationOwnerLeader1Name: applicationData.applicationOwnerLeader1Name || null,
      applicationOwnerLeader1Email: applicationData.applicationOwnerLeader1Email || null,
      applicationOwnerLeader1Band: applicationData.applicationOwnerLeader1Band || null,
      applicationOwnerLeader2Name: applicationData.applicationOwnerLeader2Name || null,
      applicationOwnerLeader2Email: applicationData.applicationOwnerLeader2Email || null,
      applicationOwnerLeader2Band: applicationData.applicationOwnerLeader2Band || null,
      ownerSvpName: applicationData.ownerSvpName || null,
      ownerSvpEmail: applicationData.ownerSvpEmail || null,
      ownerSvpBand: applicationData.ownerSvpBand || null,
      businessOwnerName: applicationData.businessOwnerName || null,
      businessOwnerEmail: applicationData.businessOwnerEmail || null,
      businessOwnerBand: applicationData.businessOwnerBand || null,
      businessOwnerLeader1Name: applicationData.businessOwnerLeader1Name || null,
      businessOwnerLeader1Email: applicationData.businessOwnerLeader1Email || null,
      businessOwnerLeader1Band: applicationData.businessOwnerLeader1Band || null,
      productionSupportOwnerName: applicationData.productionSupportOwnerName || null,
      productionSupportOwnerEmail: applicationData.productionSupportOwnerEmail || null,
      productionSupportOwnerBand: applicationData.productionSupportOwnerBand || null,
      productionSupportOwnerLeader1Name: applicationData.productionSupportOwnerLeader1Name || null,
      productionSupportOwnerLeader1Email: applicationData.productionSupportOwnerLeader1Email || null,
      productionSupportOwnerLeader1Band: applicationData.productionSupportOwnerLeader1Band || null,
      pmoName: applicationData.pmoName || null,
      pmoEmail: applicationData.pmoEmail || null,
      pmoBand: applicationData.pmoBand || null,
      unitCioName: applicationData.unitCioName || null,
      unitCioEmail: applicationData.unitCioEmail || null,
      unitCioBand: applicationData.unitCioBand || null,
      
      // Sync status fields
      lastCentralApiSync: new Date(),
      centralApiSyncStatus: 'success',
      
      // Metadata
      status: 'active',
      createdBy: session.user.id,
      updatedBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    console.log('Application added successfully to database')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to add application to team:', error)
    return { success: false, error: 'Failed to add application' }
  }
}

/**
 * Get application by ID
 */
export async function getApplicationById(applicationId: string, teamId?: string) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    
    // Get application from database
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
    
    if (!app.length) {
      return null
    }
    
    // Check if user has access to this application
    const application = app[0]
    
    // If teamId is provided, verify the application belongs to that team
    if (teamId && application.teamId !== teamId) {
      return null
    }
    
    // Check if user is a member of the application's team
    const team = session.teams.find(t => t.id === application.teamId)
    if (!team) {
      return null
    }
    
    return application
  } catch (error) {
    console.error('Failed to get application:', error)
    throw error
  }
}

/**
 * Update application details
 */
export async function updateApplication(applicationId: string, updateData: {
  tla?: string
  escalationEmail?: string | null
  contactEmail?: string | null
  teamEmail?: string | null
  slackChannel?: string | null
  snowGroup?: string | null
  description?: string | null
}) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get application to check team membership
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
    
    if (!app.length) {
      return { success: false, error: 'Application not found' }
    }
    
    // Check if user is admin of this team
    const team = session.teams.find(t => t.id === app[0].teamId)
    if (!team || !team.isAdmin) {
      return { success: false, error: 'Access denied' }
    }
    
    // Check if TLA is unique within this team (if being updated)
    if (updateData.tla) {
      const existingApp = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.teamId, app[0].teamId),
            eq(applications.tla, updateData.tla),
            // Exclude the current application from the check
            // This allows updating the application with its own TLA
            // Note: We need to add a condition to exclude the current app
          )
        )
        .limit(1)
      
      if (existingApp.length > 0 && existingApp[0].id !== applicationId) {
        return { success: false, error: 'An application with this Short Identifier already exists in this team' }
      }
    }
    
    // Update application in database
    await db
      .update(applications)
      .set({
        ...updateData,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId))
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update application:', error)
    return { success: false, error: 'Failed to update application' }
  }
}

/**
 * Sync application with Central API
 */
export async function syncApplicationWithCentralAPI(applicationId: string) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get application to check team membership and get Asset ID
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
    
    if (!app.length) {
      return { success: false, error: 'Application not found' }
    }
    
    // Check if user is a member of the application's team
    const team = session.teams.find(t => t.id === app[0].teamId)
    if (!team) {
      return { success: false, error: 'Access denied' }
    }
    
    // Fetch updated data from Central API
    console.log(`Syncing application with Asset ID: ${app[0].assetId}`)
    const centralApiData = await fetchApplicationFromCentralAPI(app[0].assetId)
    
    if (!centralApiData) {
      return { success: false, error: 'Failed to fetch data from Central API' }
    }
    
    // Update application with fresh data from Central API
    await db
      .update(applications)
      .set({
        // Update fields from Central API
        applicationName: centralApiData.applicationName,
        lifeCycleStatus: centralApiData.lifeCycleStatus,
        tier: centralApiData.tier,
        
        // VP and Director mappings
        vpName: centralApiData.productionSupportOwnerLeader1Name,
        vpEmail: centralApiData.productionSupportOwnerLeader1Email,
        directorName: centralApiData.productionSupportOwnerName,
        directorEmail: centralApiData.productionSupportOwnerEmail,
        
        // All ownership data from Central API
        applicationOwnerName: centralApiData.applicationOwnerName,
        applicationOwnerEmail: centralApiData.applicationOwnerEmail,
        applicationOwnerBand: centralApiData.applicationOwnerBand,
        applicationManagerName: centralApiData.applicationManagerName,
        applicationManagerEmail: centralApiData.applicationManagerEmail,
        applicationManagerBand: centralApiData.applicationManagerBand,
        applicationOwnerLeader1Name: centralApiData.applicationOwnerLeader1Name,
        applicationOwnerLeader1Email: centralApiData.applicationOwnerLeader1Email,
        applicationOwnerLeader1Band: centralApiData.applicationOwnerLeader1Band,
        applicationOwnerLeader2Name: centralApiData.applicationOwnerLeader2Name,
        applicationOwnerLeader2Email: centralApiData.applicationOwnerLeader2Email,
        applicationOwnerLeader2Band: centralApiData.applicationOwnerLeader2Band,
        ownerSvpName: centralApiData.ownerSvpName,
        ownerSvpEmail: centralApiData.ownerSvpEmail,
        ownerSvpBand: centralApiData.ownerSvpBand,
        businessOwnerName: centralApiData.businessOwnerName,
        businessOwnerEmail: centralApiData.businessOwnerEmail,
        businessOwnerBand: centralApiData.businessOwnerBand,
        businessOwnerLeader1Name: centralApiData.businessOwnerLeader1Name,
        businessOwnerLeader1Email: centralApiData.businessOwnerLeader1Email,
        businessOwnerLeader1Band: centralApiData.businessOwnerLeader1Band,
        productionSupportOwnerName: centralApiData.productionSupportOwnerName,
        productionSupportOwnerEmail: centralApiData.productionSupportOwnerEmail,
        productionSupportOwnerBand: centralApiData.productionSupportOwnerBand,
        productionSupportOwnerLeader1Name: centralApiData.productionSupportOwnerLeader1Name,
        productionSupportOwnerLeader1Email: centralApiData.productionSupportOwnerLeader1Email,
        productionSupportOwnerLeader1Band: centralApiData.productionSupportOwnerLeader1Band,
        pmoName: centralApiData.pmoName,
        pmoEmail: centralApiData.pmoEmail,
        pmoBand: centralApiData.pmoBand,
        unitCioName: centralApiData.unitCioName,
        unitCioEmail: centralApiData.unitCioEmail,
        unitCioBand: centralApiData.unitCioBand,
        
        // Update sync status fields
        lastCentralApiSync: new Date(),
        centralApiSyncStatus: 'success',
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId))
    
    console.log('Application synced successfully with Central API')
    return { success: true }
  } catch (error) {
    console.error('Failed to sync application with Central API:', error)
    return { success: false, error: 'Failed to sync application' }
  }
}

/**
 * Remove application from team
 */
export async function removeApplicationFromTeam(applicationId: string) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get application to check team membership
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
    
    if (!app.length) {
      return { success: false, error: 'Application not found' }
    }
    
    // Check if user is admin of this team
    const team = session.teams.find(t => t.id === app[0].teamId)
    if (!team || !team.isAdmin) {
      return { success: false, error: 'Access denied' }
    }
    
    // Remove application from database
    await db
      .delete(applications)
      .where(eq(applications.id, applicationId))
    
    return { success: true }
  } catch (error) {
    console.error('Failed to remove application from team:', error)
    return { success: false, error: 'Failed to remove application' }
  }
}
