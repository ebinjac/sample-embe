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
  Link as LinkIcon,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import { LinkCard } from '@/components/linkmanager/link-card'
import { LinkForm } from '@/components/linkmanager/link-form'
import { SearchFilter } from '@/components/linkmanager/search-filter'
import { BulkActionsBar } from '@/components/linkmanager/bulk-actions-bar'
import { 
  getLinks, 
  createLink, 
  updateLink, 
  deleteLink
} from '@/lib/actions/linkmanager/links'
import { getLinkApplications, getLinkCountByApplication } from '@/lib/actions/linkmanager/links'
import { getApplications } from '@/lib/actions/applications'
import { useRouter } from 'next/navigation'

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

interface Application {
  id: string
  applicationName: string
  tla: string
  assetId: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ApplicationLinksPage({ 
  params 
}: { 
  params: { teamId: string; applicationId: string } 
}) {
  const { session } = useSession()
  const router = useRouter()
  const teamId = params.teamId
  const applicationId = params.applicationId
  const userId = session?.user?.id

  const [links, setLinks] = useState<Link[]>([])
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedLinks, setSelectedLinks] = useState<string[]>([])

  // Fetch application and links
  const fetchApplicationLinks = async (filters = {}) => {
    if (!userId) return

    try {
      setLoading(true)
      
      // Fetch application details
      const applications = await getApplications(teamId)
      const app = applications.find(a => a.id === applicationId)
      if (!app) {
        setError('Application not found')
        return
      }
      setApplication(app)
      
      // Fetch links for this application
      const result = await getLinks({
        teamId,
        userId,
        page: 1,
        limit: 20,
        applicationId,
        ...filters
      })
      
      // Transform the data to match our Link interface
      const transformedLinks = result.links.map(link => ({
        ...link,
        description: link.description || undefined,
        categoryId: link.categoryId || undefined,
        lastAccessedAt: link.lastAccessedAt 
          ? new Date(link.lastAccessedAt).toISOString() 
          : undefined,
        createdAt: new Date(link.createdAt).toISOString(),
        updatedAt: link.updatedAt 
          ? new Date(link.updatedAt).toISOString() 
          : undefined
      }))
      
      setLinks(transformedLinks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (userId && applicationId) {
      fetchApplicationLinks()
    }
  }, [userId, teamId, applicationId])

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchApplicationLinks(searchQuery ? { search: searchQuery } : {})
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
    console.log('Bulk operation:', operation, data)
    // This would be implemented with the actual bulk operations
    // For now, just refresh the links
    fetchApplicationLinks()
    setSelectedLinks([])
  }

  if (!userId) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {application && (
              <>
                <h1 className="text-3xl font-bold">{application.applicationName}</h1>
                <p className="text-muted-foreground">
                  Links tagged to this application ({application.tla})
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {application && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://ensemble.com/applications/${application.assetId}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Ensemble
            </Button>
          )}
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedLinks.length > 0 && (
        <BulkActionsBar
          selectedLinkIds={selectedLinks}
          teamId={teamId}
          onActionComplete={() => {
            setSelectedLinks([])
            fetchApplicationLinks()
          }}
          onBulkOperation={handleBulkOperation}
        />
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search links for ${application?.applicationName || 'this application'}...`}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
          onFilterChange={(filters: any) => fetchApplicationLinks(filters)}
          teamId={teamId}
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
              <Button variant="outline" className="mt-2" onClick={() => fetchApplicationLinks()}>
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
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : `No links tagged to ${application?.applicationName || 'this application'} yet`
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add a Link
                </Button>
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
              showBulkSelection={selectedLinks.length > 0}
            />
          ))}
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