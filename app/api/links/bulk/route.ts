import { NextRequest, NextResponse } from 'next/server'
import {
  bulkCreateLinks,
  bulkDeleteLinks,
  bulkUpdateVisibility,
  bulkPinLinks,
  bulkUpdateCategory,
  bulkAddApplications,
  bulkRemoveApplications,
  bulkAddTags,
  bulkRemoveTags
} from '@/lib/actions/linkmanager/bulk-operations'
import { getSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { teamId, operation, data } = body

    if (!teamId || !operation) {
      return NextResponse.json({ error: 'Team ID and operation are required' }, { status: 400 })
    }

    let result

    switch (operation) {
      case 'create':
        if (!data.links || !Array.isArray(data.links)) {
          return NextResponse.json({ error: 'Links array is required for create operation' }, { status: 400 })
        }
        result = await bulkCreateLinks(data.links, teamId, session.user.id)
        break

      case 'delete':
        if (!data.linkIds || !Array.isArray(data.linkIds)) {
          return NextResponse.json({ error: 'Link IDs array is required for delete operation' }, { status: 400 })
        }
        result = await bulkDeleteLinks(data.linkIds, teamId, session.user.id)
        break

      case 'updateVisibility':
        if (!data.linkIds || !Array.isArray(data.linkIds) || !data.visibility) {
          return NextResponse.json({ error: 'Link IDs array and visibility are required for updateVisibility operation' }, { status: 400 })
        }
        result = await bulkUpdateVisibility(data.linkIds, data.visibility, teamId, session.user.id)
        break

      case 'pin':
        if (!data.linkIds || !Array.isArray(data.linkIds) || typeof data.isPinned !== 'boolean') {
          return NextResponse.json({ error: 'Link IDs array and isPinned boolean are required for pin operation' }, { status: 400 })
        }
        result = await bulkPinLinks(data.linkIds, data.isPinned, teamId, session.user.id)
        break

      case 'updateCategory':
        if (!data.linkIds || !Array.isArray(data.linkIds)) {
          return NextResponse.json({ error: 'Link IDs array is required for updateCategory operation' }, { status: 400 })
        }
        result = await bulkUpdateCategory(data.linkIds, data.categoryId || null, teamId, session.user.id)
        break

      case 'addApplications':
        if (!data.linkIds || !Array.isArray(data.linkIds) || !data.applicationIds || !Array.isArray(data.applicationIds)) {
          return NextResponse.json({ error: 'Link IDs array and application IDs array are required for addApplications operation' }, { status: 400 })
        }
        result = await bulkAddApplications(data.linkIds, data.applicationIds, teamId, session.user.id)
        break

      case 'removeApplications':
        if (!data.linkIds || !Array.isArray(data.linkIds) || !data.applicationIds || !Array.isArray(data.applicationIds)) {
          return NextResponse.json({ error: 'Link IDs array and application IDs array are required for removeApplications operation' }, { status: 400 })
        }
        result = await bulkRemoveApplications(data.linkIds, data.applicationIds, teamId, session.user.id)
        break

      case 'addTags':
        if (!data.linkIds || !Array.isArray(data.linkIds) || !data.tagIds || !Array.isArray(data.tagIds)) {
          return NextResponse.json({ error: 'Link IDs array and tag IDs array are required for addTags operation' }, { status: 400 })
        }
        result = await bulkAddTags(data.linkIds, data.tagIds, teamId, session.user.id)
        break

      case 'removeTags':
        if (!data.linkIds || !Array.isArray(data.linkIds) || !data.tagIds || !Array.isArray(data.tagIds)) {
          return NextResponse.json({ error: 'Link IDs array and tag IDs array are required for removeTags operation' }, { status: 400 })
        }
        result = await bulkRemoveTags(data.linkIds, data.tagIds, teamId, session.user.id)
        break

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to perform bulk operation' }, { status: 500 })
  }
}