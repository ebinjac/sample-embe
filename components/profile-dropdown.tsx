'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { LogOut, User, Settings, FileText, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/auth/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProfileDropdownProps {
  userName: string
  userEmail: string
  userAvatar?: string
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
    transition: {
      duration: 0.15,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: [0.55, 0.055, 0.675, 0.19],
    },
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
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export function ProfileDropdown({ userName, userEmail, userAvatar }: ProfileDropdownProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    startTransition(async () => {
      const result = await signOut()
      if (result.success) {
        toast.success('Successfully signed out')
        setIsOpen(false)
      } else {
        toast.error(result.error || 'Sign out failed')
      }
    })
  }

  const handleProfileClick = () => {
    // Navigate to profile page
    router.push('/profile')
    setIsOpen(false)
  }

  const handleMyRequestsClick = () => {
    // Navigate to profile page with requests tab
    router.push('/profile?tab=requests')
    setIsOpen(false)
  }

  const handleSettingsClick = () => {
    // Navigate to profile page with settings tab
    router.push('/profile?tab=settings')
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 w-10 p-0 hover:bg-accent/50"
          disabled={isPending}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
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
            >
              <DropdownMenuLabel className="flex items-center gap-3 px-3 py-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <motion.button
                  custom={0}
                  variants={itemVariants}
                  onClick={handleProfileClick}
                  className="flex items-center gap-3 w-full cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </motion.button>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <motion.button
                  custom={1}
                  variants={itemVariants}
                  onClick={handleMyRequestsClick}
                  className="flex items-center gap-3 w-full cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>My Requests</span>
                </motion.button>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <motion.button
                  custom={2}
                  variants={itemVariants}
                  onClick={handleSettingsClick}
                  className="flex items-center gap-3 w-full cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </motion.button>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <motion.button
                  custom={3}
                  variants={itemVariants}
                  onClick={handleSignOut}
                  disabled={isPending}
                  className="flex items-center gap-3 w-full cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isPending ? 'Signing out...' : 'Sign Out'}</span>
                </motion.button>
              </DropdownMenuItem>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  )
}