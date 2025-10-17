'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/components/session-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Grid3X3, 
  List, 
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react'
import { getApplications } from '@/lib/actions/applications'
import { getLinkCountByApplication } from '@/lib/actions/linkmanager/links'
import Link from 'next/link'

interface Application {
  id: string
  applicationName: string
  tla: string
  assetId: number
}

export default function ApplicationsPage({ params }: { params: { teamId: string } }) {
  const { session } = useSession()
  const teamId = params.teamId
  const userId = session?.user?.id

  const [applications, setApplications] = useState<Application[]>([])
  const [applicationLinkCounts, setApplicationLinkCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch applications
  const fetchApplications = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const applicationsResult = await getApplications(teamId)
      setApplications(applicationsResult)
      
      // Fetch link counts for each application
      const counts: Record<string, number> = {}
      for (const app of applicationsResult) {
        const count = await getLinkCountByApplication(app.id, teamId)
        counts[app.id] = count
      }
      setApplicationLinkCounts(counts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchApplications()
    }
  }, [userId, teamId])

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== undefined) {
        // Filter applications based on search query
        if (searchQuery.trim() === '') {
          fetchApplications()
        }
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Filter applications based on search query
  const filteredApplications = applications.filter(app =>
    app.applicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.tla.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!userId) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-6 w-6 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Applications</h1>
            <p className="text-muted-foreground">
              View links tagged to specific applications
            </p>
          </div>
        </div>
      </div>

      {/* Search and View Mode */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
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

      {/* Applications Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>{error}</p>
              <Button variant="outline" className="mt-2" onClick={() => fetchApplications()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No applications found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'No applications available for this team'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {filteredApplications.map((app) => (
            <Card key={app.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{app.applicationName}</h3>
                    <p className="text-sm text-muted-foreground">{app.tla}</p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    {applicationLinkCounts[app.id] || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Asset ID: {app.assetId}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://ensemble.com/applications/${app.assetId}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ensemble
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      asChild
                    >
                      <Link href={`/tools/teams/${teamId}/linkio/applications/${app.id}`}>
                        Links
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}