import { ToolsSidebar } from '@/components/tools-sidebar'
import { BarChart2, FileText } from 'lucide-react'

const scorecardNavigationItems = [
  {
    title: 'Metrics',
    href: '/tools/teams/[teamId]/scorecard/metrics',
    icon: <BarChart2 className="h-4 w-4" />
  },
  {
    title: 'Performance',
    href: '/tools/teams/[teamId]/scorecard/performance',
    icon: <BarChart2 className="h-4 w-4" />
  },
  {
    title: 'History',
    href: '/tools/teams/[teamId]/scorecard/history',
    icon: <FileText className="h-4 w-4" />
  }
]

export default function ScorecardLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { teamId: string }
}) {
  // Replace [teamId] placeholder with actual teamId
  const navigationItems = scorecardNavigationItems.map(item => ({
    ...item,
    href: item.href.replace('[teamId]', params.teamId)
  }))

  return (
    <ToolsSidebar 
      teamId={params.teamId} 
      toolName="scorecard" 
      navigationItems={navigationItems}
    >
      {children}
    </ToolsSidebar>
  )
}