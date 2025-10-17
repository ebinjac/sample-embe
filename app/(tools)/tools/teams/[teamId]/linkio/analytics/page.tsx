'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/components/session-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Link as LinkIcon,
  Users,
  Pin,
  Lock,
  Calendar,
  Clock
} from 'lucide-react'
import { getLinks, getRecentlyAccessedLinks } from '@/lib/actions/linkmanager/links'
import { getCategories } from '@/lib/actions/linkmanager/categories'
import { getTags } from '@/lib/actions/linkmanager/tags'
import { getApplications } from '@/lib/actions/applications'

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

interface Category {
  id: string
  name: string
  description?: string
  color?: string
}

interface Tag {
  id: string
  name: string
}

interface Application {
  id: string
  applicationName: string
  tla: string
  assetId: number
}

export default function AnalyticsPage({ params }: { params: { teamId: string } }) {
  const { session } = useSession()
  const teamId = params.teamId
  const userId = session?.user?.id

  const [links, setLinks] = useState<Link[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [recentLinks, setRecentLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data for analytics
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return

      try {
        setLoading(true)
        
        const [
          linksResult,
          categoriesResult,
          tagsResult,
          applicationsResult,
          recentLinksResult
        ] = await Promise.all([
          getLinks({ teamId, userId }),
          getCategories(teamId),
          getTags(teamId),
          getApplications(teamId),
          getRecentlyAccessedLinks(teamId, userId, 10)
        ])
        
        // Transform the data to match our interfaces
        const transformedLinks = linksResult.links.map(link => ({
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
        
        const transformedCategories = categoriesResult.map(category => ({
          ...category,
          description: category.description || undefined,
          color: category.color || undefined
        }))
        
        const transformedRecentLinks = recentLinksResult.map(link => ({
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
        setCategories(transformedCategories)
        setTags(tagsResult)
        setApplications(applicationsResult)
        setRecentLinks(transformedRecentLinks)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, teamId])

  // Calculate analytics
  const totalLinks = links.length
  const totalPrivateLinks = links.filter(link => link.visibility === 'private').length
  const totalPublicLinks = links.filter(link => link.visibility === 'public').length
  const totalPinnedLinks = links.filter(link => link.isPinned).length
  const totalAccessCount = links.reduce((sum, link) => sum + link.accessCount, 0)
  const averageAccessCount = totalLinks > 0 ? Math.round(totalAccessCount / totalLinks) : 0
  
  // Get top accessed links
  const topAccessedLinks = [...links]
    .sort((a, b) => b.accessCount - a.accessCount)
    .slice(0, 5)
  
  // Get links by category
  const linksByCategory = categories.map(category => ({
    name: category.name,
    count: links.filter(link => link.categoryId === category.id).length
  })).filter(cat => cat.count > 0)
  
  // Get most used tags
  const tagUsage: Record<string, number> = {}
  links.forEach(link => {
    // This would need to be implemented with actual tag associations
    // For now, we'll just use placeholder data
  })
  
  const mostUsedTags = tags
    .map(tag => ({
      name: tag.name,
      count: Math.floor(Math.random() * 20) + 1 // Placeholder data
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  if (!userId) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-destructive">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-purple-500" />
        <h1 className="text-3xl font-bold">Link Analytics</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLinks}</div>
            <p className="text-xs text-muted-foreground">
              {totalPinnedLinks} pinned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Links</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPublicLinks}</div>
            <p className="text-xs text-muted-foreground">
              Visible to everyone
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Private Links</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPrivateLinks}</div>
            <p className="text-xs text-muted-foreground">
              Only visible to you
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccessCount}</div>
            <p className="text-xs text-muted-foreground">
              {averageAccessCount} avg per link
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="top-links" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="top-links">Top Links</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="top-links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Most Accessed Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topAccessedLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No links with access data yet</p>
              ) : (
                <div className="space-y-4">
                  {topAccessedLinks.map((link, index) => (
                    <div key={link.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{link.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant={link.visibility === 'public' ? 'default' : 'secondary'} className="text-xs">
                              {link.visibility}
                            </Badge>
                            {link.isPinned && <Pin className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{link.accessCount}</div>
                        <p className="text-xs text-muted-foreground">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Links by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {linksByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories with links yet</p>
              ) : (
                <div className="space-y-4">
                  {linksByCategory.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <h4 className="font-medium">{category.name}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{category.count}</div>
                        <p className="text-xs text-muted-foreground">links</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Used Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {mostUsedTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags with usage data yet</p>
              ) : (
                <div className="space-y-4">
                  {mostUsedTags.map((tag, index) => (
                    <div key={tag.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <h4 className="font-medium">{tag.name}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{tag.count}</div>
                        <p className="text-xs text-muted-foreground">links</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {recentLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Eye className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium">{link.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant={link.visibility === 'public' ? 'default' : 'secondary'} className="text-xs">
                              {link.visibility}
                            </Badge>
                            {link.isPinned && <Pin className="h-3 w-3" />}
                            {link.lastAccessedAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(link.lastAccessedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{link.accessCount}</div>
                        <p className="text-xs text-muted-foreground">total views</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}