'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { X, Filter, RotateCcw } from 'lucide-react'
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

interface SearchFilterProps {
  onFilterChange: (filters: any) => void
  teamId: string
}

interface FilterState {
  search: string
  categoryId: string
  visibility: 'private' | 'public' | ''
  isPinned: boolean | null
  applicationIds: string[]
  tagIds: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function SearchFilter({ onFilterChange, teamId }: SearchFilterProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categoryId: '',
    visibility: '',
    isPinned: null,
    applicationIds: [],
    tagIds: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

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
        console.error('Error fetching filter data:', error)
      }
    }

    if (teamId) {
      fetchData()
    }
  }, [teamId])

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Only send non-empty filters
    const activeFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, v]) => 
        v !== '' && v !== null && v !== undefined && 
        (!(Array.isArray(v)) || v.length > 0)
      )
    )
    
    onFilterChange(activeFilters)
  }

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      categoryId: '',
      visibility: '',
      isPinned: null,
      applicationIds: [],
      tagIds: [],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
    setFilters(defaultFilters)
    onFilterChange({})
  }

  const handleApplicationToggle = (applicationId: string) => {
    const newApplicationIds = filters.applicationIds.includes(applicationId)
      ? filters.applicationIds.filter(id => id !== applicationId)
      : [...filters.applicationIds, applicationId]
    
    updateFilter('applicationIds', newApplicationIds)
  }

  const handleTagToggle = (tagId: string) => {
    const newTagIds = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter(id => id !== tagId)
      : [...filters.tagIds, tagId]
    
    updateFilter('tagIds', newTagIds)
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'sortBy' && key !== 'sortOrder' &&
    value !== '' && value !== null && value !== undefined && 
    (!(Array.isArray(value)) || value.length > 0)
  )

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => 
    key !== 'sortBy' && key !== 'sortOrder' &&
    value !== '' && value !== null && value !== undefined && 
    (!(Array.isArray(value)) || value.length > 0)
  ).length

  return (
    <div className="flex items-center gap-2">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Input
          placeholder="Search links..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pr-8"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => updateFilter('search', '')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Category */}
              <div className="col-span-2">
                <Label htmlFor="filter-category" className="text-xs">Category</Label>
                <Select
                  value={filters.categoryId || "all-categories"}
                  onValueChange={(value) => updateFilter('categoryId', value === "all-categories" ? "" : value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-categories">All</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility */}
              <div>
                <Label className="text-xs">Visibility</Label>
                <Select
                  value={filters.visibility || "all-links"}
                  onValueChange={(value: 'private' | 'public' | 'all-links') => updateFilter('visibility', value === "all-links" ? "" : value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-links">All</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pinned Status */}
              <div>
                <Label className="text-xs">Pinned</Label>
                <Select
                  value={filters.isPinned === null ? 'all-links' : filters.isPinned.toString()}
                  onValueChange={(value) =>
                    updateFilter('isPinned', value === 'all-links' ? null : value === 'true')
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-links">All</SelectItem>
                    <SelectItem value="true">Pinned</SelectItem>
                    <SelectItem value="false">Not Pinned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Applications */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Applications</Label>
                {filters.applicationIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs"
                    onClick={() => updateFilter('applicationIds', [])}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="border rounded-md p-2 max-h-24 overflow-y-auto space-y-1">
                {applications.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No apps</p>
                ) : (
                  applications.slice(0, 5).map(app => (
                    <div key={app.id} className="flex items-center space-x-1">
                      <Checkbox
                        id={`filter-app-${app.id}`}
                        checked={filters.applicationIds.includes(app.id)}
                        onCheckedChange={() => handleApplicationToggle(app.id)}
                        className="h-3 w-3"
                      />
                      <Label
                        htmlFor={`filter-app-${app.id}`}
                        className="text-xs cursor-pointer truncate flex-1"
                        title={app.applicationName}
                      >
                        {app.tla}
                      </Label>
                    </div>
                  ))
                )}
                {applications.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{applications.length - 5} more...</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Tags</Label>
                {filters.tagIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs"
                    onClick={() => updateFilter('tagIds', [])}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="border rounded-md p-2 max-h-24 overflow-y-auto space-y-1">
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tags</p>
                ) : (
                  tags.slice(0, 5).map(tag => (
                    <div key={tag.id} className="flex items-center space-x-1">
                      <Checkbox
                        id={`filter-tag-${tag.id}`}
                        checked={filters.tagIds.includes(tag.id)}
                        onCheckedChange={() => handleTagToggle(tag.id)}
                        className="h-3 w-3"
                      />
                      <Label
                        htmlFor={`filter-tag-${tag.id}`}
                        className="text-xs cursor-pointer truncate flex-1"
                        title={tag.name}
                      >
                        {tag.name}
                      </Label>
                    </div>
                  ))
                )}
                {tags.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{tags.length - 5} more...</p>
                )}
              </div>
            </div>

            {/* Sort */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="filter-sort" className="text-xs">Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilter('sortBy', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="accessCount">Views</SelectItem>
                    <SelectItem value="lastAccessedAt">Accessed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-order" className="text-xs">Order</Label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Desc</SelectItem>
                    <SelectItem value="asc">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}