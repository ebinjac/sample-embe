'use client'

import { useEffect, useState } from 'react'

// Client-side cookie reading utility
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}`)
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  
  return null
}

// Decode JWT without verification (for immediate UI updates)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Hook to get session data directly from client-side cookie
 * This provides immediate access without server calls
 */
export function useClientSession() {
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Function to update session from cookie
  const updateSessionFromCookie = () => {
    const token = getCookieValue('ensemble-session')
    
    if (token) {
      try {
        const decoded = decodeJWT(token)
        setSession(decoded)
      } catch (error) {
        console.error('Failed to decode session token:', error)
        setSession(null)
      }
    } else {
      setSession(null)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    // Initial load
    updateSessionFromCookie()
    
    // Set up interval to check for cookie changes
    const interval = setInterval(() => {
      updateSessionFromCookie()
    }, 1000) // Check every second
    
    // Set up custom event listener for immediate updates
    const handleSessionUpdate = () => {
      updateSessionFromCookie()
    }
    
    window.addEventListener('session-updated', handleSessionUpdate)
    
    // Cleanup
    return () => {
      clearInterval(interval)
      window.removeEventListener('session-updated', handleSessionUpdate)
    }
  }, [])

  return { session, isLoading, refreshSession: updateSessionFromCookie }
}