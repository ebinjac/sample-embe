'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Eye, EyeOff, Globe } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createLink, updateLink } from '@/lib/actions/linkmanager/links'
import { getCategories, createCategory } from '@/lib/actions/linkmanager/categories'
import { getTags, createTag } from '@/lib/actions/linkmanager/tags'
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

interface LinkFormData {
  title: string
  url: string
  description?: string
  categoryId?: string | null
  visibility: 'private' | 'public'
  isPinned: boolean
  applicationIds: string[]
  tagIds: string[]
}

interface LinkFormProps {
  teamId: string
  userId: string
  linkId?: string // For edit mode
  onClose: () => void
  onSuccess: (link: any) => void
}

export function LinkForm({ teamId, userId, linkId, onClose, onSuccess }: LinkFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [favicon, setFavicon] = useState<string>('')
  const [formData, setFormData] = useState<LinkFormData>({
    title: '',
    url: '',
    description: '',
    categoryId: '',
    visibility: 'private',
    isPinned: false,
    applicationIds: [],
    tagIds: []
  })

  // Function to fetch favicon for a URL
  const fetchFavicon = useCallback(async (url: string) => {
    if (!url) return ''
    
    try {
      const urlObj = new URL(url)
      const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`
      
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
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
      
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
  }, [])

  // Load categories and tags immediately
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
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    if (teamId) {
      fetchData()
    }
  }, [teamId])

  // Load applications separately and asynchronously
  const loadApplications = useCallback(async () => {
    if (applications.length > 0) return // Already loaded
    
    setLoadingApplications(true)
    try {
      const applicationsData = await getApplications(teamId)
      setApplications(applicationsData)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoadingApplications(false)
    }
  }, [teamId, applications.length])

  // Load link data for edit mode
  useEffect(() => {
    if (linkId) {
      // For now, we'll skip loading link data for edit mode
      // This would require a getLinkById server action
    }
  }, [linkId, teamId])

  // Fetch favicon when URL changes
  useEffect(() => {
    if (formData.url) {
      fetchFavicon(formData.url).then(setFavicon)
    } else {
      setFavicon('')
    }
  }, [formData.url, fetchFavicon])

  const handleChange = (field: keyof LinkFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate URL
      try {
        new URL(formData.url)
      } catch {
        toast.error('Please enter a valid URL')
        setLoading(false)
        return
      }

      // Validate title
      if (!formData.title.trim()) {
        toast.error('Please enter a title')
        setLoading(false)
        return
      }

      let savedLink
      if (linkId) {
        // Update existing link
        savedLink = await updateLink(linkId, formData, teamId, userId)
      } else {
        // Create new link
        savedLink = await createLink(formData, teamId, userId)
      }
      
      // Transform the data to match our Link interface
      const transformedLink = {
        ...savedLink,
        description: savedLink.description || undefined,
        categoryId: savedLink.categoryId || undefined,
        lastAccessedAt: savedLink.lastAccessedAt 
          ? new Date(savedLink.lastAccessedAt).toISOString() 
          : undefined,
        createdAt: new Date(savedLink.createdAt).toISOString(),
        updatedAt: savedLink.updatedAt 
          ? new Date(savedLink.updatedAt).toISOString() 
          : undefined
      }
      
      onSuccess(transformedLink)
      toast.success(linkId ? 'Link updated successfully' : 'Link created successfully')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save link')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = async () => {
    if (!newTagName.trim()) return

    try {
      const newTag = await createTag({ name: newTagName.trim() }, teamId)
      setTags(prev => [...prev, newTag])
      setFormData(prev => ({
        ...prev,
        tagIds: [...prev.tagIds, newTag.id]
      }))
      setNewTagName('')
      toast.success('Tag created successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create tag')
    }
  }

  const handleApplicationToggle = (applicationId: string) => {
    setFormData(prev => ({
      ...prev,
      applicationIds: prev.applicationIds.includes(applicationId)
        ? prev.applicationIds.filter(id => id !== applicationId)
        : [...prev.applicationIds, applicationId]
    }))
  }

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{linkId ? 'Edit Link' : 'Add New Link'}</DialogTitle>
          <DialogDescription>
            {linkId ? 'Update the link details below' : 'Create a new link to save and share with your team'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter link title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <div className="relative">
              <Input
                id="url"
                type={showPassword ? 'text' : 'url'}
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                required
                className="pr-10"
              />
              {favicon && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <img 
                    src={favicon} 
                    alt="Favicon" 
                    className="h-5 w-5 rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this link"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) => handleChange('visibility', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center">
                      <EyeOff className="h-4 w-4 mr-2" />
                      Private (only you can see)
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Public (everyone can see)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId || "no-category"}
                onValueChange={(value) => handleChange('categoryId', value === "no-category" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPinned"
              checked={formData.isPinned}
              onCheckedChange={(checked) => handleChange('isPinned', checked)}
            />
            <Label htmlFor="isPinned">Pin this link for quick access</Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Applications</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadApplications}
                disabled={loadingApplications || applications.length > 0}
                className="text-xs h-6"
              >
                {loadingApplications ? 'Loading...' : applications.length > 0 ? 'Loaded' : 'Load Apps'}
              </Button>
            </div>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {loadingApplications ? 'Loading applications...' : 'Click "Load Apps" to load applications'}
                </p>
              ) : (
                applications.map(app => (
                  <div key={app.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`app-${app.id}`}
                      checked={formData.applicationIds.includes(app.id)}
                      onCheckedChange={() => handleApplicationToggle(app.id)}
                    />
                    <Label htmlFor={`app-${app.id}`} className="text-sm">
                      {app.tla} ({app.applicationName})
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {formData.tagIds.map(tagId => {
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
              <div className="border rounded-md p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add new tag"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTagName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant={formData.tagIds.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (linkId ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}