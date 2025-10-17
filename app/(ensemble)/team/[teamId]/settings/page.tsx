import { Metadata } from 'next'

import { getTeamById } from '@/lib/auth/team-actions'
import { TeamSettings } from '@/components/teams/team-settings'

export const metadata: Metadata = {
  title: 'Team Settings | Ensemble',
  description: 'Manage team settings and applications',
}

interface TeamSettingsPageProps {
  params: {
    teamId: string
  }
}

export default async function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  // Fetch team data server-side
  const team = await getTeamById(params.teamId)
  
  if (!team) {
    return <div>Team not found</div>
  }
  
  return <TeamSettings team={team} />
}