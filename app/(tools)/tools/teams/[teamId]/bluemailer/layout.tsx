import { ToolsSidebar } from '@/components/tools-sidebar'
import { Mail, BarChart2 } from 'lucide-react'

const bluemailerNavigationItems = [
  {
    title: 'Email Templates',
    href: '/tools/teams/[teamId]/bluemailer/templates',
    icon: <Mail className="h-4 w-4" />
  },
  {
    title: 'Campaigns',
    href: '/tools/teams/[teamId]/bluemailer/campaigns',
    icon: <Mail className="h-4 w-4" />
  },
  {
    title: 'Analytics',
    href: '/tools/teams/[teamId]/bluemailer/analytics',
    icon: <BarChart2 className="h-4 w-4" />
  }
]

export default function BlueMailerLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { teamId: string }
}) {
  // Replace [teamId] placeholder with actual teamId
  const navigationItems = bluemailerNavigationItems.map(item => ({
    ...item,
    href: item.href.replace('[teamId]', params.teamId)
  }))

  return (
    <ToolsSidebar 
      teamId={params.teamId} 
      toolName="bluemailer" 
      navigationItems={navigationItems}
    >
      {children}
    </ToolsSidebar>
  )
}