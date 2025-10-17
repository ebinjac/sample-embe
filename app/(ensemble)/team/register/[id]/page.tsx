import { notFound } from 'next/navigation'
import { getTeamRegistrationRequest } from '@/lib/auth/team-actions'
import { TeamRegistrationConfirmation } from '@/components/teams/team-registration-confirmation'
import { Metadata } from 'next'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const request = await getTeamRegistrationRequest(params.id)
  
  if (!request) {
    return {
      title: 'Registration Not Found | Ensemble',
      description: 'The team registration request was not found.',
    }
  }

  return {
    title: `Team Registration - ${request.teamName} | Ensemble`,
    description: `View the status of your team registration request for ${request.teamName}.`,
  }
}

export default async function TeamRegisterPage({ params }: PageProps) {
  const request = await getTeamRegistrationRequest(params.id)

  if (!request) {
    notFound()
  }

  return <TeamRegistrationConfirmation request={request} />
}