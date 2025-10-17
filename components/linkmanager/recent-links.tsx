'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { logLinkAccess } from '@/lib/actions/linkmanager/links'

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

interface RecentLinksProps {
  links: Link[]
  onLinkClick: (link: Link) => void
}

export function RecentLinks({ links, onLinkClick }: RecentLinksProps) {
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy URL')
    }
  }

  const handleLinkAccess = async (link: Link) => {
    // Log the access
    try {
      await logLinkAccess(link.id, link.createdBy)
    } catch (error) {
      console.error('Failed to log access:', error)
    }
    
    // Open the link
    onLinkClick(link)
  }

  const formatLastAccessed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) {
      return 'Just now'
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (links.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Recently Accessed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{link.title}</h4>
                  {link.isPinned && (
                    <div className="h-2 w-2 bg-primary rounded-full" title="Pinned" />
                  )}
                  <Badge variant={link.visibility === 'public' ? 'default' : 'secondary'} className="text-xs">
                    {link.visibility === 'public' ? 'Public' : 'Private'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1">{link.url}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Accessed {link.accessCount} times</span>
                  {link.lastAccessedAt && (
                    <span>• {formatLastAccessed(link.lastAccessedAt)}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyUrl(link.url)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleLinkAccess(link)}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}