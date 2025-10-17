'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { TeamSwitcher } from '@/components/team-switcher'
import { useSession } from '@/components/session-provider'
import {
  Link as LinkIcon,
  Pin,
  Lock,
  Users,
  BarChart3,
  Grid3X3,
  Plus,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronRight,
  Upload
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { getApplications } from '@/lib/actions/applications'
import { getLinkCountByApplication } from '@/lib/actions/linkmanager/links'

interface Application {
  id: string
  applicationName: string
  tla: string
  assetId: number
}

interface LinkioSidebarProps {
  teamId: string
  className?: string
}

export function LinkioSidebar({ teamId, className }: LinkioSidebarProps) {
  const pathname = usePathname()
  const { session, teams, selectedTeamId } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [applicationLinkCounts, setApplicationLinkCounts] = useState<Record<string, number>>({})
  const [applicationsOpen, setApplicationsOpen] = useState(false)

  // Fetch applications on component mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const apps = await getApplications(teamId)
        setApplications(apps)
        
        // Fetch link counts for each application
        const counts: Record<string, number> = {}
        for (const app of apps) {
          const count = await getLinkCountByApplication(app.id, teamId)
          counts[app.id] = count
        }
        setApplicationLinkCounts(counts)
      } catch (error) {
        console.error('Error fetching applications:', error)
      }
    }

    if (teamId) {
      fetchApplications()
    }
  }, [teamId])

  const isActive = (path: string) => {
    return pathname === path || (path !== `/tools/teams/${teamId}/linkio` && pathname.startsWith(path))
  }

  const mainNav = [
    {
      title: 'All Links',
      href: `/tools/teams/${teamId}/linkio/all`,
      icon: LinkIcon,
    },
    {
      title: 'Pinned',
      href: `/tools/teams/${teamId}/linkio/pinned`,
      icon: Pin,
    },
    {
      title: 'Private Links',
      href: `/tools/teams/${teamId}/linkio/private`,
      icon: Lock,
    },
    {
      title: 'Team Links',
      href: `/tools/teams/${teamId}/linkio/team`,
      icon: Users,
    },
    {
      title: 'Analytics',
      href: `/tools/teams/${teamId}/linkio/analytics`,
      icon: BarChart3,
    },
    {
      title: 'Import Links',
      href: `/tools/teams/${teamId}/linkio/import`,
      icon: Upload,
    },
  ]

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <TeamSwitcher
            teams={teams}
            selectedTeamId={selectedTeamId || undefined}
            userName={session?.user?.fullName}
          />
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Link Manager
          </h2>
          <div className="space-y-1">
            {mainNav.map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <Separator />
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Applications
          </h2>
          <Collapsible open={applicationsOpen} onOpenChange={setApplicationsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-4">
                <Grid3X3 className="mr-2 h-4 w-4" />
                Applications
                {applicationsOpen ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {applications.length === 0 ? (
                <p className="px-4 text-sm text-muted-foreground">No applications found</p>
              ) : (
                <ScrollArea className="h-48">
                  {applications.map((app) => (
                    <Button
                      key={app.id}
                      variant={isActive(`/tools/teams/${teamId}/linkio/applications/${app.id}`) ? "secondary" : "ghost"}
                      className="w-full justify-start px-4"
                      asChild
                    >
                      <Link href={`/tools/teams/${teamId}/linkio/applications/${app.id}`}>
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate">{app.applicationName}</span>
                          <Badge variant="outline" className="ml-2">
                            {applicationLinkCounts[app.id] || 0}
                          </Badge>
                        </div>
                      </Link>
                    </Button>
                  ))}
                </ScrollArea>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}