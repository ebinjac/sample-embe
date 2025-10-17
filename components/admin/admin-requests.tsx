'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { 
  FileText, 
  Users, 
  TrendingUp
} from 'lucide-react'
import { 
  getTeamRegistrationRequests
} from '@/lib/auth/admin-actions'
import { AdminRequestsTable } from '@/components/admin/admin-requests-table'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

interface AdminRequestsProps {
  initialPage?: number
  initialLimit?: number
  initialStatus?: string
  initialSearch?: string
}

export function AdminRequests({ 
  initialPage = 1,
  initialLimit = 10,
  initialStatus,
  initialSearch
}: AdminRequestsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [requests, setRequests] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isLoading, setIsLoading] = useState(true)
  
  // Filter states
  const [status, setStatus] = useState(initialStatus || '')
  const [search, setSearch] = useState(initialSearch || '')

  // Update URL when filters change
  const updateURL = (page: number, newStatus?: string, newSearch?: string) => {
    const params = new URLSearchParams()
    
    if (page > 1) params.set('page', page.toString())
    if (newStatus) params.set('status', newStatus)
    if (newSearch) params.set('search', newSearch)
    
    const url = `${pathname}${params.toString() ? '?' + params.toString() : ''}`
    router.push(url)
  }

  // Fetch requests
  const fetchRequests = async (page: number, statusFilter?: string, searchFilter?: string) => {
    setIsLoading(true)
    try {
      const result = await getTeamRegistrationRequests({
        page,
        limit: initialLimit,
        status: statusFilter,
        search: searchFilter
      })
      
      setRequests(result.requests)
      setTotalPages(result.totalPages)
      setTotalCount(result.totalCount)
      setCurrentPage(result.currentPage)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      toast.error('Failed to load requests')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchRequests(currentPage, status, search)
  }, [currentPage, status, search])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL(page, status, search)
  }

  // Handle filter change
  const handleStatusChange = (newStatus: string) => {
    const statusValue = newStatus === 'all' ? '' : newStatus
    setStatus(statusValue)
    setCurrentPage(1)
    updateURL(1, statusValue, search)
  }

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1)
    updateURL(1, status, search)
  }

  // Handle search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Registration Requests</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage team registration requests
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {totalCount} total requests
          </div>
        </div>
      </div>

      {/* Table Component */}
      <AdminRequestsTable
        data={requests}
        totalPages={totalPages}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onRefresh={() => fetchRequests(currentPage, status, search)}
        isLoading={isLoading}
      />
    </motion.div>
  )
}