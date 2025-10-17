import { Metadata } from 'next'
import { AdminTeams } from '@/components/admin/admin-teams'

interface PageProps {
  searchParams: {
    page?: string
    limit?: string
    search?: string
    isActive?: string
  }
}

export const metadata: Metadata = {
  title: 'Teams | Admin Panel | Ensemble',
  description: 'Manage teams and team settings',
}

export default async function AdminTeamsPage({
  searchParams
}: PageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '10')
  const search = searchParams.search || undefined
  const isActive = searchParams.isActive ? searchParams.isActive === 'true' : undefined

  return (
    <AdminTeams 
      initialPage={page} 
      initialLimit={limit} 
      initialSearch={search}
      initialIsActive={isActive}
    />
  )
}