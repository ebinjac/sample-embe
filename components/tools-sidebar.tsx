'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  Link as LinkIcon,
  Settings,
  ChevronDown,
  ChevronRight,
  User,
  Sun,
  Moon,
  Send,
  TrendingUp,
  Link as LinkIcon2,
  Pin,
  Lock,
  Users as UsersIcon,
  BarChart3,
  FolderOpen,
  Grid3X3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { TeamSwitcher } from './team-switcher'
import { ThemeToggle } from './theme-toggle'
import { useSession } from './session-provider'
import { getApplications } from '@/lib/actions/applications'

interface SidebarItem {
  title: string
  href: string
  icon: React.ReactNode
  children?: SidebarItem[]
}

interface ToolsSidebarProps {
  teamId: string
  toolName: string
  navigationItems: SidebarItem[]
  children: React.ReactNode
}

// Tool icons mapping
const toolIcons: Record<string, React.ReactNode> = {
  bluemailer: <Send className="h-5 w-5" />,
  linkio: <LinkIcon2 className="h-5 w-5" />,
  scorecard: <TrendingUp className="h-5 w-5" />
}

export function ToolsSidebar({ teamId, toolName, navigationItems, children }: ToolsSidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const pathname = usePathname()
  const { session, teams, selectedTeamId } = useSession()

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  // Fetch applications for Linkio
  useEffect(() => {
    if (toolName === 'linkio' && selectedTeamId) {
      const fetchApplications = async () => {
        try {
          const apps = await getApplications(selectedTeamId)
          setApplications(apps)
        } catch (error) {
          console.error('Error fetching applications:', error)
        }
      }
      fetchApplications()
    }
  }, [toolName, selectedTeamId])

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.title)
    const hasChildren = item.children && item.children.length > 0
    const active = isActive(item.href)

    return (
      <div key={item.href}>
        <div className={level > 0 ? "ml-4" : ""}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            )}
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault()
                toggleExpanded(item.title)
              }
            }}
          >
            <div className="flex items-center gap-2 flex-1">
              {item.icon}
              <span className="font-medium">{item.title}</span>
            </div>
            {hasChildren && (
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
              />
            )}
          </Link>
        </div>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <div className="overflow-hidden">
              <div className="mt-1">
                {item.children?.map((child) =>
                  renderSidebarItem(child, level + 1)
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Get current team ID
  const currentTeamId = selectedTeamId || teamId
  
  // Update tool-specific navigation items with current team ID
  const updatedNavigationItems = navigationItems.map(item => {
    if (item.title === 'Applications' && toolName === 'linkio' && applications.length > 0) {
      return {
        ...item,
        children: applications.map(app => ({
          title: app.applicationName,
          href: `/tools/teams/${currentTeamId}/linkio/applications/${app.id}`,
          icon: <LinkIcon2 className="h-3 w-3" />
        }))
      }
    }
    
    return {
      ...item,
      href: item.href.replace(/\/tools\/teams\/[^\/]+/, `/tools/teams/${currentTeamId}`),
      children: item.children?.map(child => ({
        ...child,
        href: child.href.replace(/\/tools\/teams\/[^\/]+/, `/tools/teams/${currentTeamId}`)
      }))
    }
  })

  // Only use tool-specific navigation items
  const allNavigationItems = updatedNavigationItems

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || true) && (
          <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
              <div
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar Content */}
            <aside className={cn(
              "fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-card border-r border-border",
              "lg:block lg:translate-x-0",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {/* Tool Icon */}
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                        {toolIcons[toolName] || <Settings className="h-4 w-4" />}
                      </div>
                      <h2 className="text-lg font-semibold capitalize">{toolName}</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Team Switcher */}
                  <TeamSwitcher
                    teams={teams}
                    selectedTeamId={selectedTeamId || undefined}
                    userName={session?.user?.fullName}
                  />
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {allNavigationItems.map((item) =>
                    renderSidebarItem(item)
                  )}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-border space-y-3">
                  {/* User Details */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session?.user?.fullName || (
                          <span className="text-muted-foreground">Loading...</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session?.user?.email || (
                          <span className="text-muted-foreground">Loading...</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <ThemeToggle />
                  </div>

                  {/* Team ID */}
                  <div className="text-xs text-muted-foreground">
                    Team ID: {currentTeamId}
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}