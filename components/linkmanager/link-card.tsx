'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  BarChart3,
  Link as LinkIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { updateLink, deleteLink, logLinkAccess } from '@/lib/actions/linkmanager/links'

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

interface LinkCardProps {
  link: Link
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onUpdate: (updatedLink: Link) => void
  onDelete: (linkId: string) => void
  onAccess: () => void
  showBulkSelection?: boolean
}

export function LinkCard({
  link,
  viewMode,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onAccess,
  showBulkSelection = true
}: LinkCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingPin, setIsUpdatingPin] = useState(false)
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [favicon, setFavicon] = useState<string>('')
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: link.title,
    url: link.url,
    description: link.description || '',
    visibility: link.visibility,
    isPinned: link.isPinned
  })

  const handlePinToggle = async () => {
    setIsUpdatingPin(true)
    try {
      const updatedLink = await updateLink(link.id, { isPinned: !link.isPinned }, link.teamId, link.createdBy)
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
      onUpdate(transformedLink)
      toast.success(`Link ${link.isPinned ? 'unpinned' : 'pinned'} successfully`)
    } catch (error) {
      toast.error('Failed to update pin status')
    } finally {
      setIsUpdatingPin(false)
    }
  }

  const handleVisibilityToggle = async () => {
    setIsUpdatingVisibility(true)
    try {
      const updatedLink = await updateLink(link.id, { visibility: link.visibility === 'private' ? 'public' : 'private' }, link.teamId, link.createdBy)
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
      onUpdate(transformedLink)
      toast.success(`Link made ${link.visibility === 'private' ? 'public' : 'private'} successfully`)
    } catch (error) {
      toast.error('Failed to update visibility')
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteLink(link.id, link.teamId, link.createdBy)
      onDelete(link.id)
      toast.success('Link deleted successfully')
    } catch (error) {
      toast.error('Failed to delete link')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(link.url)
      toast.success('URL copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy URL')
    }
  }

  const handleAccess = async () => {
    // Show opening feedback
    toast.loading('Opening link...', { id: 'opening-link' })
    
    // Log the access
    try {
      await logLinkAccess(link.id, link.createdBy)
    } catch (error) {
      console.error('Failed to log access:', error)
    }
    
    // Open the link
    onAccess()
    
    // Show success feedback
    toast.success('Link opened', { id: 'opening-link' })
  }

  const handleEdit = () => {
    setEditFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
      visibility: link.visibility,
      isPinned: link.isPinned
    })
    setShowEditDialog(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      // Validate URL
      try {
        new URL(editFormData.url)
      } catch {
        toast.error('Please enter a valid URL')
        setIsUpdating(false)
        return
      }

      // Validate title
      if (!editFormData.title.trim()) {
        toast.error('Please enter a title')
        setIsUpdating(false)
        return
      }

      // Update the link
      const updatedLink = await updateLink(link.id, {
        title: editFormData.title,
        url: editFormData.url,
        description: editFormData.description || undefined,
        visibility: editFormData.visibility,
        isPinned: editFormData.isPinned
      }, link.teamId, link.createdBy)
      
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
      
      onUpdate(transformedLink)
      toast.success('Link updated successfully')
      setShowEditDialog(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update link')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isListMode = viewMode === 'list'

  // Fetch favicon for the link
  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const url = new URL(link.url)
        const baseUrl = `${url.protocol}//${url.hostname}`
        
        // Common favicon paths to try in order
        const faviconPaths = [
          '/favicon.ico',
          '/favicon.png',
          '/apple-touch-icon.png',
          '/apple-touch-icon-precomposed.png',
          '/android-chrome-192x192.png',
          '/icon-192x192.png',
          '/icon.png',
          '/assets/favicon.ico',
          '/static/favicon.ico',
          '/images/favicon.ico',
          '/img/favicon.ico'
        ]
        
        // Try each favicon path
        for (const path of faviconPaths) {
          const faviconUrl = `${baseUrl}${path}`
          
          try {
            // Test if the favicon exists
            const response = await fetch(faviconUrl, { method: 'HEAD', mode: 'no-cors' })
            
            // If we get here, the favicon likely exists
            // Create an image to verify it loads properly
            const img = new Image()
            img.crossOrigin = 'anonymous'
            
            const isValid = await new Promise<boolean>((resolve) => {
              img.onload = () => resolve(true)
              img.onerror = () => resolve(false)
              img.src = faviconUrl
            })
            
            if (isValid) {
              return faviconUrl
            }
          } catch (error) {
            // Continue to the next path
            continue
          }
        }
        
        // If no favicon found at common paths, try Google's favicon service
        const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`
        
        // Test if Google's favicon loads
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        const isValid = await new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
          img.src = googleFaviconUrl
        })
        
        if (isValid) {
          return googleFaviconUrl
        }
        
        // If all else fails, return empty string
        return ''
      } catch (error) {
        return ''
      }
    }

    fetchFavicon().then(setFavicon)
  }, [link.url])

  return (
    <>
      <Card className={`relative ${isListMode ? 'w-full' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        {isListMode ? (
          <div className="flex items-center p-4">
            {showBulkSelection && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(checked as boolean)}
                className="mr-4"
              />
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-3 mb-1 min-w-0">
                <div className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {favicon ? (
                    <img
                      src={favicon}
                      alt="Favicon"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        setFavicon('') // Clear favicon on error to show fallback
                      }}
                    />
                  ) : (
                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-ellipsis overflow-hidden whitespace-nowrap min-w-0" title={link.title}>
                      {link.title}
                    </h3>
                    {link.isPinned && <Pin className="h-4 w-4 text-primary flex-shrink-0" />}
                    <Badge variant={link.visibility === 'public' ? 'default' : 'secondary'} className="flex-shrink-0">
                      {link.visibility === 'public' ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap mb-2" title={link.url}>
                {link.url}
              </p>
              {link.description && (
                <p className="text-sm text-muted-foreground text-ellipsis overflow-hidden line-clamp-2" title={link.description}>
                  {link.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Accessed {link.accessCount} times</span>
                  {link.lastAccessedAt && (
                    <span>Last: {formatDate(link.lastAccessedAt)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={handleCopyUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleAccess}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handlePinToggle} disabled={isUpdatingPin}>
                        {link.isPinned ? (
                          <>
                            <PinOff className="h-4 w-4 mr-2" />
                            Unpin
                          </>
                        ) : (
                          <>
                            <Pin className="h-4 w-4 mr-2" />
                            Pin
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleVisibilityToggle} disabled={isUpdatingVisibility}>
                        {link.visibility === 'private' ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Make Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Make Private
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        // This would open the edit dialog
                        // For now, we'll just show a toast
                        toast.info('Edit functionality coming soon')
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Stats
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mr-2">
                  {showBulkSelection && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelect(checked as boolean)}
                    />
                  )}
                  {link.isPinned && <Pin className="h-4 w-4 text-primary flex-shrink-0" />}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePinToggle} disabled={isUpdatingPin}>
                      {link.isPinned ? (
                        <>
                          <PinOff className="h-4 w-4 mr-2" />
                          Unpin
                        </>
                      ) : (
                        <>
                          <Pin className="h-4 w-4 mr-2" />
                          Pin
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleVisibilityToggle} disabled={isUpdatingVisibility}>
                      {link.visibility === 'private' ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Make Public
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Make Private
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Stats
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2 overflow-hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {favicon ? (
                      <img
                        src={favicon}
                        alt="Favicon"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          setFavicon('') // Clear favicon on error to show fallback
                        }}
                      />
                    ) : (
                      <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-ellipsis overflow-hidden whitespace-nowrap min-w-0" title={link.title}>
                        {link.title}
                      </h3>
                      {link.isPinned && <Pin className="h-4 w-4 text-primary flex-shrink-0" />}
                      <Badge variant={link.visibility === 'public' ? 'default' : 'secondary'} className="flex-shrink-0">
                        {link.visibility === 'public' ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                  <CollapsibleTrigger asChild>
                    <p className="text-sm text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer hover:text-foreground min-w-0" title={link.url}>
                      {link.url}
                    </p>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2">
                    {link.description && (
                      <p className="text-sm text-muted-foreground text-ellipsis overflow-hidden line-clamp-2" title={link.description}>
                        {link.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Accessed {link.accessCount} times</span>
                      {link.lastAccessedAt && (
                        <span>Last: {formatDate(link.lastAccessedAt)}</span>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleCopyUrl} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button size="sm" onClick={handleAccess} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the link "{link.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}