import { Metadata } from 'next'

import { getApplicationById } from '@/lib/auth/team-actions'
import { ApplicationEdit } from '@/components/teams/application-edit'

export const metadata: Metadata = {
  title: 'Edit Application | Ensemble',
  description: 'Edit application details',
}

interface ApplicationEditPageProps {
  params: {
    teamId: string
    applicationId: string
  }
}

export default async function ApplicationEditPage({ params }: ApplicationEditPageProps) {
  // Fetch application data server-side
  const application = await getApplicationById(params.applicationId, params.teamId)
  
  if (!application) {
    return <div>Application not found</div>
  }
  
  return <ApplicationEdit application={application} teamId={params.teamId} />
}