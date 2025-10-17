import { Metadata } from 'next'
import { AdminRequests } from '@/components/admin/admin-requests'

interface PageProps {
  searchParams: {
    page?: string
    limit?: string
    status?: string
    search?: string
  }
}

export const metadata: Metadata = {
  title: 'Requests | Admin Panel | Ensemble',
  description: 'Review and manage team registration requests',
}

export default async function AdminRequestsPage({
  searchParams
}: PageProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '10')
  const status = searchParams.status
  const search = searchParams.search || undefined

  return (
    <AdminRequests 
      initialPage={page} 
      initialLimit={limit} 
      initialStatus={status} 
      initialSearch={search}
    />
  )
}