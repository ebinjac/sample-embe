import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { applications } from '@/db/schema/teams'
import { eq, desc, asc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const sortBy = searchParams.get('sortBy') || 'applicationName'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    // Build the base query
    let baseQuery = db
      .select({
        id: applications.id,
        applicationName: applications.applicationName,
        tla: applications.tla,
        assetId: applications.assetId,
        description: applications.description,
        status: applications.status,
        tier: applications.tier,
        teamId: applications.teamId,
        createdAt: applications.createdAt
      })
      .from(applications)
      .where(eq(applications.teamId, teamId))

    // Add sorting based on the sort parameter
    let applicationsList
    if (sortBy === 'applicationName') {
      applicationsList = sortOrder === 'desc' 
        ? await baseQuery.orderBy(desc(applications.applicationName)).limit(limit)
        : await baseQuery.orderBy(asc(applications.applicationName)).limit(limit)
    } else if (sortBy === 'tla') {
      applicationsList = sortOrder === 'desc' 
        ? await baseQuery.orderBy(desc(applications.tla)).limit(limit)
        : await baseQuery.orderBy(asc(applications.tla)).limit(limit)
    } else if (sortBy === 'assetId') {
      applicationsList = sortOrder === 'desc' 
        ? await baseQuery.orderBy(desc(applications.assetId)).limit(limit)
        : await baseQuery.orderBy(asc(applications.assetId)).limit(limit)
    } else {
      // Default sorting by application name
      applicationsList = await baseQuery.orderBy(asc(applications.applicationName)).limit(limit)
    }

    return NextResponse.json(applicationsList)
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}