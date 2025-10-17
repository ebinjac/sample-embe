import { NextRequest, NextResponse } from 'next/server'
import { getLinkById, updateLink, deleteLink, logLinkAccess } from '@/lib/actions/linkmanager/links'
import { getSession } from '@/lib/auth/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const logAccess = searchParams.get('logAccess') === 'true'

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const link = await getLinkById(params.id, teamId, session.user.id)
    
    // Log access if requested
    if (logAccess) {
      await logLinkAccess(params.id, session.user.id)
    }

    return NextResponse.json(link)
  } catch (error) {
    console.error('Error fetching link:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch link' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await updateLink(params.id, linkData, teamId, session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating link:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update link' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const result = await deleteLink(params.id, teamId, session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting link:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete link' }, { status: 500 })
  }
}