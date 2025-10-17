'use client'

import { motion, Easing } from 'framer-motion'
import { TeamSwitcher } from './team-switcher'
import { ProfileDropdown } from './profile-dropdown'
import { MainMenu } from './navigation-menu'
import { ThemeToggle } from './theme-toggle'
import EnsembleLogo from './ensemble-logo'
import { useAuthBlueSSO, type SSOUser } from '@/hooks/useAuthBlueSSO'
import { authenticateWithSSO } from '@/lib/auth/actions'
import { useSession } from './session-provider'
import { useClientSession } from '@/hooks/use-client-session'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { useTheme } from 'next-themes'

const headerVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
}

export function Header() {
  const { user } = useAuthBlueSSO()
  const { session, teams, selectedTeamId, isLoading: sessionLoading, refreshSession } = useSession()
  const { session: clientSession, isLoading: isClientLoading, refreshSession: refreshClientSession } = useClientSession()
  const { theme, systemTheme, resolvedTheme } = useTheme()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Prioritize client session for immediate updates
  const effectiveSession = clientSession || session
  const effectiveLoading = isClientLoading ? false : sessionLoading
  const effectiveTeams = clientSession?.teams || teams
  const effectiveSelectedTeamId = clientSession?.selectedTeamId || selectedTeamId

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20
      setScrolled(isScrolled)
    }

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll)
    
    // Call once to set initial state
    handleScroll()

    // Clean up event listener
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle mounting for SSR hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = mounted && (resolvedTheme === 'dark' || currentTheme === 'dark')

  // Handle SSO authentication when user data is available
  useEffect(() => {
    if (user && !isAuthenticated) {
      handleAuthentication(user)
    }
  }, [user, isAuthenticated])

  // Update local state when session context changes
  useEffect(() => {
    if (effectiveSession && !effectiveLoading) {
      setIsAuthenticated(true)
    } else if (!effectiveSession && !effectiveLoading) {
      setIsAuthenticated(false)
    }
  }, [effectiveSession, effectiveLoading])

  const handleAuthentication = async (ssoUser: SSOUser) => {
    try {
      const result = await authenticateWithSSO(ssoUser)

      if (result.success) {
        setIsAuthenticated(true)
        // Refresh session data after successful authentication
        await refreshSession()
      } else {
        toast.error(result.error || 'Authentication failed')
      }
    } catch (err) {
      console.error('Authentication error:', err)
      toast.error('Authentication failed')
    }
  }

  // Helper function to get header classes based on scroll state and theme
  const getHeaderClasses = () => {
    const baseClasses = "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
    
    if (scrolled) {
      return `${baseClasses} border-b ${
        isDark
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      } shadow-sm`
    } else {
      return `${baseClasses} border-transparent ${
        isDark
          ? "bg-transparent"
          : "bg-transparent"
      }`
    }
  }

  // Helper function to get text color classes based on scroll state and theme
  const getTextClasses = () => {
    if (scrolled) {
      return isDark ? "text-white" : "text-foreground"
    } else {
      return isDark ? "text-white" : "text-black"
    }
  }

  // Show unauthenticated state only if we don't have user or client session
  if (!user && !clientSession) {
    return (
      <motion.header
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className={getHeaderClasses()}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8">
                <EnsembleLogo />
              </div>
              <div>
                <h1 className={`text-lg font-semibold ${getTextClasses()}`}>Ensemble</h1>
                <p className={`text-sm ${scrolled ? 'text-muted-foreground' : 'text-white/80'}`}>Authenticating...</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`h-9 w-24 rounded bg-muted animate-pulse ${!scrolled && 'bg-white/20'}`} />
            </div>
          </div>
        </div>
      </motion.header>
    )
  }

  // Show authenticated state
  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className={getHeaderClasses()}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <motion.div
              className="h-8 w-8"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <EnsembleLogo />
            </motion.div>

            <div>
              <motion.h1
                className={`text-lg font-semibold ${getTextClasses()}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                Ensemble
              </motion.h1>
              {teams.length > 0 && (
                <motion.p
                  className={`text-sm hidden sm:block ${
                    scrolled ? 'text-muted-foreground' : 'text-white/80'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                
                </motion.p>
              )}
            </div>
          </div>

          {/* Navigation Menu - Desktop */}
          <div className="hidden md:block">
            <MainMenu scrolled={scrolled} />
          </div>

          {/* Right side items */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Team Switcher */}
            <TeamSwitcher
              key={effectiveSelectedTeamId}
              teams={effectiveTeams}
              selectedTeamId={effectiveSelectedTeamId || undefined}
              userName={user?.attributes?.fullName || effectiveSession?.user?.fullName || 'User'}
            />

            {/* Profile Dropdown */}
            <ProfileDropdown
              userName={user?.attributes?.fullName || effectiveSession?.user?.fullName || 'User'}
              userEmail={user?.attributes?.email || effectiveSession?.user?.email || ''}
            />
          </div>
        </div>

        {/* Mobile Navigation - Could be added later */}
        <div className={`md:hidden border-t py-2 ${
          scrolled ? 'border-border/40' : 'border-white/20'
        }`}>
          <MainMenu scrolled={scrolled} />
        </div>
      </div>
    </motion.header>
  )
}