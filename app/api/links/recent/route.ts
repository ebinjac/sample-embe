import { NextRequest, NextResponse } from 'next/server'
import { getRecentlyAccessedLinks } from '@/lib/actions/linkmanager/links'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const links = await getRecentlyAccessedLinks(teamId, session.user.id, limit)
    return NextResponse.json(links)
  } catch (error) {
    console.error('Error fetching recently accessed links:', error)
    return NextResponse.json({ error: 'Failed to fetch recently accessed links' }, { status: 500 })
  }
}