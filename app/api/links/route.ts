import { NextRequest, NextResponse } from 'next/server'
import { getLinks, createLink } from '@/lib/actions/linkmanager/links'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const userId = session.user.id
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const visibility = searchParams.get('visibility') as 'private' | 'public' | undefined
    const applicationId = searchParams.get('applicationId') || undefined
    const tagId = searchParams.get('tagId') || undefined
    const isPinned = searchParams.get('isPinned') === 'true' ? true : searchParams.get('isPinned') === 'false' ? false : undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const result = await getLinks({
      teamId,
      userId,
      page,
      limit,
      search,
      categoryId,
      visibility,
      applicationId,
      tagId,
      isPinned,
      sortBy,
      sortOrder
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching links:', error)
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { teamId, linkData } = body

    if (!teamId || !linkData) {
      return NextResponse.json({ error: 'Team ID and link data are required' }, { status: 400 })
    }

    const result = await createLink(linkData, teamId, session.user.id)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating link:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create link' }, { status: 500 })
  }
}