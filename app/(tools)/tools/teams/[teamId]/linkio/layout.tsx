import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ToolsSidebar } from '@/components/tools-sidebar'
import {
  Link as LinkIcon,
  Pin,
  Lock,
  Users as UsersIcon,
  BarChart3,
  FolderOpen,
  Hash as HashIcon,
  Grid3X3,
  Link as LinkIcon2
} from 'lucide-react'

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { teamId: string }
}) {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Define Link Manager navigation items with specific icons
  const linkioNavigationItems = [
    {
      title: 'All Links',
      href: `/tools/teams/${params.teamId}/linkio/all`,
      icon: <LinkIcon className="h-4 w-4" />
    },
    {
      title: 'Pinned',
      href: `/tools/teams/${params.teamId}/linkio/pinned`,
      icon: <Pin className="h-4 w-4" />
    },
    {
      title: 'Private Links',
      href: `/tools/teams/${params.teamId}/linkio/private`,
      icon: <Lock className="h-4 w-4" />
    },
    {
      title: 'Team Links',
      href: `/tools/teams/${params.teamId}/linkio/team`,
      icon: <UsersIcon className="h-4 w-4" />
    },
    {
      title: 'Categories',
      href: `/tools/teams/${params.teamId}/linkio/categories`,
      icon: <HashIcon className="h-4 w-4" />
    },
    {
      title: 'Analytics',
      href: `/tools/teams/${params.teamId}/linkio/analytics`,
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      title: 'Applications',
      href: `/tools/teams/${params.teamId}/linkio/applications`,
      icon: <Grid3X3 className="h-4 w-4" />,
      children: [] // This will be populated dynamically with applications
    }
  ]

  return (
    <ToolsSidebar
      teamId={params.teamId}
      toolName="linkio"
      navigationItems={linkioNavigationItems}
    >
      {children}
    </ToolsSidebar>
  )
}