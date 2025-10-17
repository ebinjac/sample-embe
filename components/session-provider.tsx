'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getCurrentSession, getUserTeams } from '@/lib/auth/actions'

// Client-side session cache
let sessionCache: any = null
let sessionCacheTime = 0
const SESSION_CACHE_TTL = 30 * 1000 // 30 seconds

interface SessionContextType {
  session: any | null
  teams: any[]
  selectedTeamId: string | null
  isLoading: boolean
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(() => {
    // Initialize from cache if available and not expired
    const now = Date.now()
    if (sessionCache && (now - sessionCacheTime) < SESSION_CACHE_TTL) {
      return sessionCache
    }
    return null
  })
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshSession = useCallback(async (forceRefresh = false) => {
    // Skip if we have cached session and not forcing refresh
    const now = Date.now()
    if (!forceRefresh && sessionCache && (now - sessionCacheTime) < SESSION_CACHE_TTL) {
      // Use cached session
      setSession(sessionCache)
      return
    }

    try {
      setIsLoading(true)
      
      const currentSession = await getCurrentSession()
      
      // Update cache
      sessionCache = currentSession
      sessionCacheTime = now
      
      // Always update teams data when session is refreshed
      if (currentSession) {
        setTeams(currentSession.teams || [])
        setSelectedTeamId(currentSession.selectedTeamId || null)
      } else {
        setTeams([])
        setSelectedTeamId(null)
      }
      
      setSession(currentSession)
    } catch (error) {
      console.error('Failed to refresh session:', error)
      setSession(null)
      setTeams([])
      setSelectedTeamId(null)
      // Clear cache on error
      sessionCache = null
      sessionCacheTime = 0
    } finally {
      setIsLoading(false)
    }
  }, [session])

  useEffect(() => {
    // Only refresh on mount if we don't have a session or cache is expired
    const now = Date.now()
    if (!session && (!sessionCache || (now - sessionCacheTime) >= SESSION_CACHE_TTL)) {
      refreshSession()
    }
  }, [refreshSession, session])

  const value = {
    session,
    teams,
    selectedTeamId,
    isLoading,
    refreshSession,
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}