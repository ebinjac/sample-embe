'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/components/session-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  MoreHorizontal,
  Link as LinkIcon,
  Upload
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LinkCard } from '@/components/linkmanager/link-card'
import { LinkForm } from '@/components/linkmanager/link-form'
import { SearchFilter } from '@/components/linkmanager/search-filter'
import { BulkActionsBar } from '@/components/linkmanager/bulk-actions-bar'
import { PinnedLinks } from '@/components/linkmanager/pinned-links'
import { RecentLinks } from '@/components/linkmanager/recent-links'
import { 
  getLinks, 
  getPinnedLinks, 
  getRecentlyAccessedLinks, 
  createLink, 
  updateLink, 
  deleteLink
} from '@/lib/actions/linkmanager/links'
import {
  bulkDeleteLinks,
  bulkUpdateVisibility,
  bulkPinLinks,
  bulkUpdateCategory,
  bulkAddApplications,
  bulkRemoveApplications,
  bulkAddTags,
  bulkRemoveTags
} from '@/lib/actions/linkmanager/bulk-operations'
import { getCategories } from '@/lib/actions/linkmanager/categories'
import { getTags } from '@/lib/actions/linkmanager/tags'

interface Link {
  id: string
  title: string
  url: string
  description?: string
  categoryId?: string
  visibility: 'private' | 'public'
  isPinned: boolean
  accessCount: number
  lastAccessedAt?: string
  teamId: string
  createdBy: string
  createdAt: string
  updatedAt?: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface LinksResponse {
  links: Link[]
  pagination: Pagination
}

export default function LinkManagerPage({ params }: { params: { teamId: string } }) {
  const { session } = useSession()
  const teamId = params.teamId
  const userId = session?.user?.id

  const [links, setLinks] = useState<Link[]>([])
  const [pinnedLinks, setPinnedLinks] = useState<Link[]>([])
  const [recentLinks, setRecentLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedLinks, setSelectedLinks] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Fetch links
  const fetchLinks = async (filters = {}) => {
    if (!userId) return

    try {
      setLoading(true)
      const result = await getLinks({
        teamId,
        userId,
        page: 1,
        limit: 20,
        ...filters
      })
      
      // Transform the data to match our Link interface
      const transformedLinks = result.links.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description || undefined,
        categoryId: link.categoryId || undefined,
        visibility: link.visibility,
        isPinned: link.isPinned,
        accessCount: link.accessCount,
        lastAccessedAt: link.lastAccessedAt 
          ? new Date(link.lastAccessedAt).toISOString() 
          : undefined,
        teamId: link.teamId,
        createdBy: link.createdBy,
        createdAt: new Date(link.createdAt).toISOString(),
        updatedAt: link.updatedAt 
          ? new Date(link.updatedAt).toISOString() 
          : undefined
      }))
      
      setLinks(transformedLinks)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Fetch pinned links
  const fetchPinnedLinks = async () => {
    if (!userId) return

    try {
      const result = await getPinnedLinks(teamId, userId)
      
      // Transform the data to match our Link interface
      const transformedLinks = result.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description || undefined,
        categoryId: link.categoryId || undefined,
        visibility: link.visibility,
        isPinned: link.isPinned,
        accessCount: link.accessCount,
        lastAccessedAt: link.lastAccessedAt 
          ? new Date(link.lastAccessedAt).toISOString() 
          : undefined,
        teamId: link.teamId,
        createdBy: link.createdBy,
        createdAt: new Date(link.createdAt).toISOString(),
        updatedAt: link.updatedAt 
          ? new Date(link.updatedAt).toISOString() 
          : undefined
      }))
      
      setPinnedLinks(transformedLinks)
    } catch (err) {
      console.error('Error fetching pinned links:', err)
    }
  }

  // Fetch recent links
  const fetchRecentLinks = async () => {
    if (!userId) return

    try {
      const result = await getRecentlyAccessedLinks(teamId, userId, 5)
      
      // Transform the data to match our Link interface
      const transformedLinks = result.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description || undefined,
        categoryId: link.categoryId || undefined,
        visibility: link.visibility,
        isPinned: link.isPinned,
        accessCount: link.accessCount,
        lastAccessedAt: link.lastAccessedAt 
          ? new Date(link.lastAccessedAt).toISOString() 
          : undefined,
        teamId: link.teamId,
        createdBy: link.createdBy,
        createdAt: new Date(link.createdAt).toISOString(),
        updatedAt: link.updatedAt 
          ? new Date(link.updatedAt).toISOString() 
          : undefined
      }))
      
      setRecentLinks(transformedLinks)
    } catch (err) {
      console.error('Error fetching recent links:', err)
    }
  }

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchLinks()
      fetchPinnedLinks()
      fetchRecentLinks()
    }
  }, [userId, teamId])

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchLinks(searchQuery ? { search: searchQuery } : {})
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Handle link selection
  const handleLinkSelect = (linkId: string, selected: boolean) => {
    setSelectedLinks(prev => {
      if (selected) {
        return [...prev, linkId]
      } else {
        return prev.filter(id => id !== linkId)
      }
    })
  }

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedLinks(links.map(link => link.id))
    } else {
      setSelectedLinks([])
    }
  }

  // Show bulk actions when links are selected
  useEffect(() => {
    setShowBulkActions(selectedLinks.length > 0)
  }, [selectedLinks])

  // Handle link creation
  const handleLinkCreated = (newLink: Link) => {
    setLinks(prev => [newLink, ...prev])
    setShowCreateForm(false)
  }

  // Handle link deletion
  const handleLinkDeleted = (linkId: string) => {
    setLinks(prev => prev.filter(link => link.id !== linkId))
    setSelectedLinks(prev => prev.filter(id => id !== linkId))
  }

  // Handle link update
  const handleLinkUpdated = (updatedLink: Link) => {
    setLinks(prev => prev.map(link => 
      link.id === updatedLink.id ? updatedLink : link
    ))
  }

  // Handle bulk operations
  const handleBulkOperation = async (operation: string, data: any) => {
    try {
      switch (operation) {
        case 'delete':
          await bulkDeleteLinks(selectedLinks, teamId, userId)
          break
        case 'updateVisibility':
          await bulkUpdateVisibility(selectedLinks, data.visibility, teamId, userId)
          break
        case 'pin':
          await bulkPinLinks(selectedLinks, data.isPinned, teamId, userId)
          break
        case 'updateCategory':
          await bulkUpdateCategory(selectedLinks, data.categoryId, teamId, userId)
          break
        case 'addApplications':
          await bulkAddApplications(selectedLinks, data.applicationIds, teamId, userId)
          break
        case 'removeApplications':
          await bulkRemoveApplications(selectedLinks, data.applicationIds, teamId, userId)
          break
        case 'addTags':
          await bulkAddTags(selectedLinks, data.tagIds, teamId, userId)
          break
        case 'removeTags':
          await bulkRemoveTags(selectedLinks, data.tagIds, teamId, userId)
          break
        default:
          throw new Error('Unknown bulk operation')
      }
      
      // Refresh links after operation
      fetchLinks()
      setSelectedLinks([])
    } catch (error) {
      console.error('Bulk operation error:', error)
    }
  }

  if (!userId) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Link Manager</h1>
          <p className="text-muted-foreground">
            Manage your team's operational links and resources
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
          <Button variant="outline" onClick={() => window.location.href = `/tools/teams/${teamId}/linkio/import`}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Pinned Links */}
      {pinnedLinks.length > 0 && (
        <PinnedLinks 
          links={pinnedLinks}
          onLinkClick={(link: Link) => window.open(link.url, '_blank')}
          onLinkUpdate={handleLinkUpdated}
        />
      )}

      {/* Recent Links */}
      {recentLinks.length > 0 && (
        <RecentLinks 
          links={recentLinks}
          onLinkClick={(link: Link) => window.open(link.url, '_blank')}
        />
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <SearchFilter
          onFilterChange={(filters: any) => fetchLinks(filters)}
          teamId={teamId}
        />
      )}

      {/* Bulk Actions Bar */}
      {selectedLinks.length > 0 && (
        <BulkActionsBar
          selectedLinkIds={selectedLinks}
          teamId={teamId}
          onActionComplete={() => {
            setSelectedLinks([])
            fetchLinks()
          }}
          onBulkOperation={handleBulkOperation}
        />
      )}

      {/* Links Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading links...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>{error}</p>
              <Button variant="outline" className="mt-2" onClick={() => fetchLinks()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : links.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No links found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first link'}
              </p>
              {!searchQuery && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Link
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = `/tools/teams/${teamId}/linkio/import`}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Links
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              viewMode={viewMode}
              isSelected={selectedLinks.includes(link.id)}
              onSelect={(selected) => handleLinkSelect(link.id, selected)}
              onUpdate={handleLinkUpdated}
              onDelete={handleLinkDeleted}
              onAccess={() => window.open(link.url, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} links
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchLinks({ page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLinks({ page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Link Form Modal */}
      {showCreateForm && (
        <LinkForm
          teamId={teamId}
          userId={userId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleLinkCreated}
        />
      )}
    </div>
  )
}