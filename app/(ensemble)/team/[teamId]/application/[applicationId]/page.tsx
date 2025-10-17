import { Metadata } from 'next'

import { getApplicationById } from '@/lib/auth/team-actions'
import { ApplicationView } from '@/components/teams/application-view'

export const metadata: Metadata = {
  title: 'Application Details | Ensemble',
  description: 'View application details',
}

interface ApplicationViewPageProps {
  params: {
    teamId: string
    applicationId: string
  }
}

export default async function ApplicationViewPage({ params }: ApplicationViewPageProps) {
  // Fetch application data server-side
  const application = await getApplicationById(params.applicationId, params.teamId)
  
  if (!application) {
    return <div>Application not found</div>
  }
  
  return <ApplicationView application={application} teamId={params.teamId} />
}