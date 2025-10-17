import { NextRequest, NextResponse } from 'next/server'
import { logLinkAccess } from '@/lib/actions/linkmanager/links'
import { getSession } from '@/lib/auth/session'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await logLinkAccess(params.id, session.user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging link access:', error)
    return NextResponse.json({ error: 'Failed to log link access' }, { status: 500 })
  }
}