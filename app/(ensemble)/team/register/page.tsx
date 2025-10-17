import { TeamRegistrationForm } from '@/components/teams/team-registration-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register New Team | Ensemble',
  description: 'Request a new team for your organization in Ensemble',
}

export default function TeamRegisterPage() {
  return <TeamRegistrationForm />
}