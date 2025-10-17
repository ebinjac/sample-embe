'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Trash2, 
  Eye, 
  EyeOff, 
  Pin, 
  PinOff, 
  Tag, 
  FolderOpen,
  X,
  Check
} from 'lucide-react'
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

interface BulkActionsBarProps {
  selectedLinkIds: string[]
  teamId: string
  onActionComplete: () => void
  onBulkOperation: (operation: string, data: any) => void
}

export function BulkActionsBar({ selectedLinkIds, teamId, onActionComplete, onBulkOperation }: BulkActionsBarProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Form states
  const [visibilityAction, setVisibilityAction] = useState<'public' | 'private' | ''>('')
  const [pinAction, setPinAction] = useState<'pin' | 'unpin' | ''>('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [applicationAction, setApplicationAction] = useState<'add' | 'remove'>('add')
  const [tagAction, setTagAction] = useState<'add' | 'remove'>('add')

  // Load categories, tags, and applications when popover opens
  const handlePopoverOpen = async (open: boolean) => {
    setIsPopoverOpen(open)
    if (open && (categories.length === 0 || tags.length === 0 || applications.length === 0)) {
      try {
        const [categoriesResult, tagsResult, applicationsResult] = await Promise.all([
          getCategories(teamId),
          getTags(teamId),
          getApplications(teamId)
        ])
        
        // Transform the data to match our Category interface
        const transformedCategories = categoriesResult.map(category => ({
          ...category,
          description: category.description || undefined,
          color: category.color || undefined
        }))
        
        setCategories(transformedCategories)
        setTags(tagsResult)
        setApplications(applicationsResult)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load options')
      }
    }
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

  const handleBulkDelete = async () => {
    await onBulkOperation('delete', {})
    setShowDeleteDialog(false)
    setIsPopoverOpen(false)
  }

  const handleApplyAction = async (action: string) => {
    let data: any = {}
    
    switch (action) {
      case 'visibility':
        data.visibility = visibilityAction
        break
      case 'pin':
        data.isPinned = pinAction === 'pin'
        break
      case 'category':
        data.categoryId = selectedCategory
        break
      case 'applications':
        data.applicationIds = selectedApplications
        data.operation = applicationAction
        break
      case 'tags':
        data.tagIds = selectedTags
        data.operation = tagAction
        break
    }
    
    const operation = applicationAction === 'add' || tagAction === 'add' 
      ? `add${action.charAt(0).toUpperCase() + action.slice(1)}`
      : `remove${action.charAt(0).toUpperCase() + action.slice(1)}`
    
    await onBulkOperation(operation, data)
    setIsPopoverOpen(false)
    
    // Reset form
    setVisibilityAction('')
    setPinAction('')
    setSelectedCategory(null)
    setSelectedApplications([])
    setSelectedTags([])
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
        <Badge variant="secondary" className="px-2 py-1">
          {selectedLinkIds.length} selected
        </Badge>
        
        <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Bulk Actions
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <div className="space-y-4 p-2">
              <h4 className="font-medium">Bulk Actions</h4>
              <Separator />
              
              {/* Visibility */}
              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={visibilityAction}
                    onValueChange={(value: 'public' | 'private') => setVisibilityAction(value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Change visibility" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Button 
                    size="sm" 
                    onClick={() => handleApplyAction('visibility')}
                    disabled={!visibilityAction}
                  >
                    Apply
                  </Button>
                </div>
              </div>
              
              {/* Pin Status */}
              <div className="space-y-2">
                <Label>Pin Status</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={pinAction}
                    onValueChange={(value: 'pin' | 'unpin') => setPinAction(value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Change pin status" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Button 
                    size="sm" 
                    onClick={() => handleApplyAction('pin')}
                    disabled={!pinAction}
                  >
                    Apply
                  </Button>
                </div>
              </div>
              
              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedCategory || "no-category"}
                    onValueChange={(value) => setSelectedCategory(value === "no-category" ? null : value)}
                  >
                    <SelectTrigger className="flex-1">
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
                  <Button 
                    size="sm" 
                    onClick={() => handleApplyAction('category')}
                  >
                    Apply
                  </Button>
                </div>
              </div>
              
              {/* Applications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Applications</Label>
                  <Select
                    value={applicationAction}
                    onValueChange={(value: 'add' | 'remove') => setApplicationAction(value)}
                  >
                    <SelectTrigger className="w-24 h-8">
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
                    <Button 
                      size="sm" 
                      onClick={() => handleApplyAction('applications')}
                      disabled={selectedApplications.length === 0}
                    >
                      {applicationAction === 'add' ? 'Add' : 'Remove'}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tags</Label>
                  <Select
                    value={tagAction}
                    onValueChange={(value: 'add' | 'remove') => setTagAction(value)}
                  >
                    <SelectTrigger className="w-24 h-8">
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
                    <Button 
                      size="sm" 
                      onClick={() => handleApplyAction('tags')}
                      disabled={selectedTags.length === 0}
                    >
                      {tagAction === 'add' ? 'Add' : 'Remove'}
                    </Button>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPopoverOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

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
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}