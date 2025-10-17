import { NextRequest, NextResponse } from 'next/server'
import { getCategories, createCategory } from '@/lib/actions/linkmanager/categories'
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

    const categories = await getCategories(teamId)
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { teamId, categoryData } = body

    if (!teamId || !categoryData) {
      return NextResponse.json({ error: 'Team ID and category data are required' }, { status: 400 })
    }

    const result = await createCategory(categoryData, teamId, session.user.id)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create category' }, { status: 500 })
  }
}