import { NextRequest, NextResponse } from 'next/server'
import { getTags, createTag } from '@/lib/actions/linkmanager/tags'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
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

    const tags = await getTags(teamId)
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { teamId, tagData } = body

    if (!teamId || !tagData) {
      return NextResponse.json({ error: 'Team ID and tag data are required' }, { status: 400 })
    }

    const result = await createTag(tagData, teamId)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create tag' }, { status: 500 })
  }
}