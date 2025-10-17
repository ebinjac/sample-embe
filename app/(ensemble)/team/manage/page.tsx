import { Metadata } from 'next'
import { TeamManagement } from '@/components/teams/team-management'

export const metadata: Metadata = {
  title: 'Team Management | Ensemble',
  description: 'View and manage all your teams',
}

export default function TeamManagePage() {
  return <TeamManagement />
}