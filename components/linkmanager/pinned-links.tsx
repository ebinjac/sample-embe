'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pin, PinOff, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { updateLink, logLinkAccess } from '@/lib/actions/linkmanager/links'

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

interface PinnedLinksProps {
  links: Link[]
  onLinkClick: (link: Link) => void
  onLinkUpdate?: (updatedLink: Link) => void
}

export function PinnedLinks({ links, onLinkClick, onLinkUpdate }: PinnedLinksProps) {
  const [updatingPins, setUpdatingPins] = useState<Record<string, boolean>>({})

  const handlePinToggle = async (linkId: string, isPinned: boolean) => {
    const link = links.find(l => l.id === linkId)
    if (!link) return

    setUpdatingPins(prev => ({ ...prev, [linkId]: true }))

    try {
      const updatedLink = await updateLink(linkId, { isPinned: !isPinned }, link.teamId, link.createdBy)
      
      // Transform the data to match our Link interface
      const transformedLink = {
        ...updatedLink,
        description: updatedLink.description || undefined,
        categoryId: updatedLink.categoryId || undefined,
        lastAccessedAt: updatedLink.lastAccessedAt 
          ? new Date(updatedLink.lastAccessedAt).toISOString() 
          : undefined,
        createdAt: new Date(updatedLink.createdAt).toISOString(),
        updatedAt: updatedLink.updatedAt 
          ? new Date(updatedLink.updatedAt).toISOString() 
          : undefined
      }
      
      if (onLinkUpdate) {
        onLinkUpdate(transformedLink)
      }
      toast.success(`Link ${isPinned ? 'unpinned' : 'pinned'} successfully`)
    } catch (error) {
      toast.error('Failed to update pin status')
    } finally {
      setUpdatingPins(prev => ({ ...prev, [linkId]: false }))
    }
  }

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

  if (links.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Pin className="h-5 w-5 mr-2 text-primary" />
          Pinned Links
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <div
              key={link.id}
              className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{link.title}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant={link.visibility === 'public' ? 'default' : 'secondary'} className="text-xs">
                      {link.visibility === 'public' ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePinToggle(link.id, link.isPinned)}
                  disabled={updatingPins[link.id]}
                  className="h-6 w-6 p-0"
                >
                  {updatingPins[link.id] ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
                  ) : (
                    <PinOff className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              {link.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {link.description}
                </p>
              )}
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <span>Accessed {link.accessCount} times</span>
                {link.lastAccessedAt && (
                  <span>• Last: {new Date(link.lastAccessedAt).toLocaleDateString()}</span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyUrl(link.url)}
                  className="flex-1 h-8 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleLinkAccess(link)}
                  className="flex-1 h-8 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}