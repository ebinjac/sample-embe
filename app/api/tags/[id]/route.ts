import { NextRequest, NextResponse } from 'next/server'
import { getTagById, updateTag, deleteTag } from '@/lib/actions/linkmanager/tags'
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

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const tag = await getTagById(params.id, teamId)
    
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error fetching tag:', error)
    return NextResponse.json({ error: 'Failed to fetch tag' }, { status: 500 })
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
    const { teamId, tagData } = body

    if (!teamId || !tagData) {
      return NextResponse.json({ error: 'Team ID and tag data are required' }, { status: 400 })
    }

    const result = await updateTag(params.id, tagData, teamId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update tag' }, { status: 500 })
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

    const result = await deleteTag(params.id, teamId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete tag' }, { status: 500 })
  }
}