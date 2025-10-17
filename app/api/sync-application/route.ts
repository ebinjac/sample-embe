import { NextRequest, NextResponse } from 'next/server'
import { syncApplicationWithCentralAPI } from '@/lib/auth/team-actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId } = body
    
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: 'Application ID is required' },
        { status: 400 }
      )
    }
    
    const result = await syncApplicationWithCentralAPI(applicationId)
    
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('API error syncing application:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}