'use client'

import { useState, useTransition, useEffect, use } from 'react'
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion'
import { ChevronDown, Users, Crown, Check, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { switchUserTeam } from '@/lib/auth/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  teamName: string
  userGroup: string
  adminGroup: string
  isAdmin: boolean
}

interface TeamSwitcherProps {
  teams: Team[]
  selectedTeamId?: string
  userName?: string
}

const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.2,
    },
  }),
}

export function TeamSwitcher({ teams, selectedTeamId, userName }: TeamSwitcherProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [localSelectedTeamId, setLocalSelectedTeamId] = useState(selectedTeamId)
  const router = useRouter()

  // Update local state when selectedTeamId prop changes
  useEffect(() => {
    setLocalSelectedTeamId(selectedTeamId)
  }, [selectedTeamId])

  if (!teams || teams.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-medium text-primary">
            {userName ? userName.charAt(0).toUpperCase() : <Users className="h-4 w-4" />}
          </span>
        </div>
        <span className="font-medium">{userName || <span className="text-muted-foreground">Loading...</span>}</span>
      </div>
    )
  }

  const selectedTeam = teams.find(team => team.id === localSelectedTeamId)

  const handleTeamSwitch = (teamId: string) => {
    startTransition(async () => {
      const result = await switchUserTeam(teamId)

      if (result.success) {
        setIsOpen(false)

        // Update local state immediately
        setLocalSelectedTeamId(teamId)

        // Trigger custom event to update client session immediately
        window.dispatchEvent(new CustomEvent('session-updated'))

        // Get current path and handle team switching
        const currentPath = window.location.pathname
        
        // Check if we're on a tool page
        const toolPageMatch = currentPath.match(/\/tools\/teams\/[^\/]+\/([^\/]+)/)
        
        if (toolPageMatch) {
          // We're on a tool page, redirect to the same tool for the new team
          const toolName = toolPageMatch[1]
          const newPath = `/tools/teams/${teamId}/${toolName}`
          window.location.href = newPath
        } else if (currentPath.includes('/tools/teams/')) {
          // We're on a tools page but not a specific tool, update the team ID
          const newPath = currentPath.replace(/\/tools\/teams\/[^\/]+/, `/tools/teams/${teamId}`)
          window.location.href = newPath
        } else {
          // We're not on a tools page (home page, etc.), just refresh the session without hard reload
          // The router.refresh() will handle updating the server session context
          router.refresh()
        }
      } else {
        toast.error(result.error || 'Failed to switch team')
      }
    })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-accent/50 bg-accent/70"
          disabled={isPending}
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <motion.span
              className="text-xs font-medium text-primary"
              key={localSelectedTeamId}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {userName ? userName.charAt(0).toUpperCase() : <Users className="h-4 w-4" />}
            </motion.span>
          </div>

          <div className="flex flex-col items-start">
            {selectedTeam && (
              <span className="text-sm font-medium">{selectedTeam.teamName}</span>
            )}

            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {userName || <span className="text-muted-foreground">Loading...</span>}
            </span>

          </div>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </Button>
      </DropdownMenuTrigger>

      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent
            align="end"
            className="w-64"
            asChild
            forceMount
          >
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                duration: 0.15,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Switch Team</span>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {teams.map((team, index) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => handleTeamSwitch(team.id)}
                  disabled={isPending || team.id === localSelectedTeamId}
                  className="flex items-center gap-3 px-2 py-2 cursor-pointer"
                >
                  <motion.div
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-3 w-full"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {team.isAdmin && (
                        <Crown className="h-3 w-3 text-amber-500" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{team.teamName}</div>
                        <div className="text-xs text-muted-foreground">
                          {team.isAdmin ? 'Admin' : 'Member'}
                        </div>
                      </div>
                    </div>

                    {team.id === localSelectedTeamId && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </motion.div>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                key="settings"
                onClick={() => router.push(`/team/manage`)}
                className="flex items-center gap-3 px-2 py-2 cursor-pointer"
              >
                <motion.div
                  custom={teams.length}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center gap-3 w-full"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Settings className="h-4 w-4" />
                    <div>
                      <div className="font-medium text-sm">Team Management</div>
                      <div className="text-xs text-muted-foreground">
                        Manage all your teams
                      </div>
                    </div>
                  </div>
                </motion.div>
              </DropdownMenuItem>

            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  )
}