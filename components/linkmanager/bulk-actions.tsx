'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { X, Trash2, Eye, EyeOff, Pin, PinOff, Tag, FolderOpen, Layers } from 'lucide-react'
import { toast } from 'sonner'
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
import { getApplications } from '@/lib/actions/applications'

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

interface BulkActionsProps {
  selectedLinkIds: string[]
  teamId: string
  onActionComplete: () => void
  onBulkOperation: (operation: string, data: any) => void
}

export function BulkActions({ selectedLinkIds, teamId, onActionComplete, onBulkOperation }: BulkActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [applications, setApplications] = useState<Application[]>([])

  // Form states
  const [visibilityAction, setVisibilityAction] = useState<'public' | 'private' | ''>('')
  const [pinAction, setPinAction] = useState<'pin' | 'unpin' | ''>('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [applicationAction, setApplicationAction] = useState<'add' | 'remove'>('add')
  const [tagAction, setTagAction] = useState<'add' | 'remove'>('add')

  // Load categories, tags, and applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and tags
        const [categoriesResult, tagsResult] = await Promise.all([
          getCategories(teamId),
          getTags(teamId)
        ])
        
        // Transform the data to match our Category interface
        const transformedCategories = categoriesResult.map(category => ({
          ...category,
          description: category.description || undefined,
          color: category.color || undefined
        }))
        
        setCategories(transformedCategories)
        setTags(tagsResult)
        
        // Fetch applications using server action
        const applicationsData = await getApplications(teamId)
        setApplications(applicationsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    if (teamId) {
      fetchData()
    }
  }, [teamId])

  const handleBulkDelete = async () => {
    await onBulkOperation('delete', {})
    setShowDeleteDialog(false)
  }

  const handleVisibilityChange = () => {
    if (!visibilityAction) return
    onBulkOperation('updateVisibility', { visibility: visibilityAction })
    setVisibilityAction('')
  }

  const handlePinChange = () => {
    if (!pinAction) return
    onBulkOperation('pin', { isPinned: pinAction === 'pin' })
    setPinAction('')
  }

  const handleCategoryChange = () => {
    onBulkOperation('updateCategory', { categoryId: selectedCategory || null })
    setSelectedCategory('')
  }

  const handleApplicationChange = () => {
    if (selectedApplications.length === 0) return
    
    if (applicationAction === 'add') {
      onBulkOperation('addApplications', { applicationIds: selectedApplications })
    } else {
      onBulkOperation('removeApplications', { applicationIds: selectedApplications })
    }
    setSelectedApplications([])
  }

  const handleTagChange = () => {
    if (selectedTags.length === 0) return
    
    if (tagAction === 'add') {
      onBulkOperation('addTags', { tagIds: selectedTags })
    } else {
      onBulkOperation('removeTags', { tagIds: selectedTags })
    }
    setSelectedTags([])
  }

  const handleApplicationToggle = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    )
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Layers className="h-5 w-5 mr-2" />
            Bulk Actions ({selectedLinkIds.length} links selected)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delete */}
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-2">
            <Label>Visibility:</Label>
            <Select
              value={visibilityAction || "change-visibility"}
              onValueChange={(value: 'public' | 'private' | 'change-visibility') => setVisibilityAction(value === "change-visibility" ? "" : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Change visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="change-visibility">Change visibility</SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Make Public
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center">
                    <EyeOff className="h-4 w-4 mr-2" />
                    Make Private
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {visibilityAction && (
              <Button size="sm" onClick={handleVisibilityChange} disabled={loading}>
                Apply
              </Button>
            )}
          </div>

          {/* Pin Status */}
          <div className="flex items-center gap-2">
            <Label>Pin Status:</Label>
            <Select
              value={pinAction || "change-pin"}
              onValueChange={(value: 'pin' | 'unpin' | 'change-pin') => setPinAction(value === "change-pin" ? "" : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Change pin status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="change-pin">Change pin status</SelectItem>
                <SelectItem value="pin">
                  <div className="flex items-center">
                    <Pin className="h-4 w-4 mr-2" />
                    Pin
                  </div>
                </SelectItem>
                <SelectItem value="unpin">
                  <div className="flex items-center">
                    <PinOff className="h-4 w-4 mr-2" />
                    Unpin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {pinAction && (
              <Button size="sm" onClick={handlePinChange} disabled={loading}>
                Apply
              </Button>
            )}
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <Label>Category:</Label>
            <Select
              value={selectedCategory || "no-category"}
              onValueChange={(value) => setSelectedCategory(value === "no-category" ? null : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Change category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-category">No category</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleCategoryChange} disabled={loading}>
              Apply
            </Button>
          </div>

          {/* Applications */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Applications:</Label>
              <Select
                value={applicationAction}
                onValueChange={(value: 'add' | 'remove') => setApplicationAction(value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="remove">Remove</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
              {applications.map(app => (
                <div key={app.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`bulk-app-${app.id}`}
                    checked={selectedApplications.includes(app.id)}
                    onCheckedChange={() => handleApplicationToggle(app.id)}
                  />
                  <Label htmlFor={`bulk-app-${app.id}`} className="text-sm">
                    {app.applicationName} ({app.tla})
                  </Label>
                </div>
              ))}
            </div>
            {selectedApplications.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {selectedApplications.map(appId => {
                    const app = applications.find(a => a.id === appId)
                    return app ? (
                      <Badge key={appId} variant="secondary" className="flex items-center gap-1">
                        {app.tla}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleApplicationToggle(appId)}
                        />
                      </Badge>
                    ) : null
                  })}
                </div>
                <Button size="sm" onClick={handleApplicationChange} disabled={loading}>
                  {applicationAction === 'add' ? 'Add' : 'Remove'}
                </Button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Tags:</Label>
              <Select
                value={tagAction}
                onValueChange={(value: 'add' | 'remove') => setTagAction(value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="remove">Remove</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`bulk-tag-${tag.id}`}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => handleTagToggle(tag.id)}
                  />
                  <Label htmlFor={`bulk-tag-${tag.id}`} className="text-sm">
                    {tag.name}
                  </Label>
                </div>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId)
                    return tag ? (
                      <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                        {tag.name}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleTagToggle(tagId)}
                        />
                      </Badge>
                    ) : null
                  })}
                </div>
                <Button size="sm" onClick={handleTagChange} disabled={loading}>
                  {tagAction === 'add' ? 'Add' : 'Remove'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedLinkIds.length} selected link(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}