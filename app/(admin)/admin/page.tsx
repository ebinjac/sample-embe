import { Metadata } from 'next'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { getDashboardStats } from '@/lib/auth/admin-actions'

export const metadata: Metadata = {
  title: 'Dashboard | Admin Panel | Ensemble',
  description: 'Admin dashboard for managing team registrations and system statistics',
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()
  
  return <AdminDashboard stats={stats} />
}