import { Metadata } from 'next'
import { AdminReports } from '@/components/admin/admin-reports'

export const metadata: Metadata = {
  title: 'Reports | Admin Panel | Ensemble',
  description: 'View system reports and analytics',
}

export default function AdminReportsPage() {
  return <AdminReports />
}