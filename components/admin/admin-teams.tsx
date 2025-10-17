'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { 
  Users, 
  TrendingUp
} from 'lucide-react'
import { getTeams } from '@/lib/auth/admin-actions'
import { AdminTeamsTable } from '@/components/admin/admin-teams-table'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

interface AdminTeamsProps {
  initialPage?: number
  initialLimit?: number
  initialSearch?: string
  initialIsActive?: boolean
}

export function AdminTeams({ 
  initialPage = 1,
  initialLimit = 10,
  initialSearch,
  initialIsActive
}: AdminTeamsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [teams, setTeams] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isLoading, setIsLoading] = useState(true)
  
  // Filter states
  const [isActive, setIsActive] = useState(initialIsActive !== undefined ? initialIsActive : undefined)
  const [search, setSearch] = useState(initialSearch || '')

  // Update URL when filters change
  const updateURL = (page: number, newSearch?: string, newIsActive?: boolean) => {
    const params = new URLSearchParams()
    
    if (page > 1) params.set('page', page.toString())
    if (newSearch) params.set('search', newSearch)
    if (newIsActive !== undefined) params.set('isActive', newIsActive.toString())
    
    const url = `${pathname}${params.toString() ? '?' + params.toString() : ''}`
    router.push(url)
  }

  // Fetch teams
  const fetchTeams = async (page: number, searchFilter?: string, isActiveFilter?: boolean) => {
    setIsLoading(true)
    try {
      const result = await getTeams({
        page,
        limit: initialLimit,
        search: searchFilter,
        isActive: isActiveFilter
      })
      
      setTeams(result.teams)
      setTotalPages(result.totalPages)
      setTotalCount(result.totalCount)
      setCurrentPage(result.currentPage)
    } catch (error) {
      console.error('Failed to fetch teams:', error)
      toast.error('Failed to load teams')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchTeams(currentPage, search, isActive)
  }, [currentPage, search, isActive])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL(page, search, isActive)
  }

  // Handle filter change
  const handleIsActiveChange = (value: string) => {
    const newIsActive = value === 'all' ? undefined : value === 'true'
    setIsActive(newIsActive)
    setCurrentPage(1)
    updateURL(1, search, newIsActive)
  }

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1)
    updateURL(1, search, isActive)
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
          <h1 className="text-3xl font-bold text-foreground">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage teams and team settings
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {totalCount} total teams
          </div>
        </div>
      </div>

      {/* Table Component */}
      <AdminTeamsTable
        data={teams}
        totalPages={totalPages}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onRefresh={() => fetchTeams(currentPage, search, isActive)}
        isLoading={isLoading}
      />
    </motion.div>
  )
}