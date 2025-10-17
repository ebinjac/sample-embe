import { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { checkAdminAccess } from '@/lib/auth/actions'

export const metadata: Metadata = {
  title: 'Admin Panel | Ensemble',
  description: 'Ensemble Admin Panel for managing teams and requests',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}