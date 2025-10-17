'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Save, 
  Mail, 
  Users, 
  MessageSquare, 
  Hash, 
  FileText,
  Building2,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from '@/components/session-provider'
import { useRouter } from 'next/navigation'
import { Application } from '@/types/application'
import { updateApplication } from '@/lib/auth/team-actions'

interface ApplicationEditProps {
  application: Application
  teamId: string
}

export function ApplicationEdit({ application, teamId }: ApplicationEditProps) {
  const { session } = useSession()
  const router = useRouter()
  
  // Check if user is admin of this team
  const isAdmin = session?.teams?.find((t: any) => t.id === teamId)?.isAdmin || false
  
  const [formData, setFormData] = useState({
    shortIdentifier: application.tla || '',
    escalationEmail: application.escalationEmail || '',
    contactEmail: application.contactEmail || '',
    teamEmail: application.teamEmail || '',
    slackChannel: application.slackChannel || '',
    snowGroup: application.snowGroup || '',
    description: application.description || ''
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.shortIdentifier.trim()) {
      newErrors.shortIdentifier = 'Short Identifier is required'
    }
    
    if (formData.escalationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.escalationEmail)) {
      newErrors.escalationEmail = 'Please enter a valid email address'
    }
    
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address'
    }
    
    if (formData.teamEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.teamEmail)) {
      newErrors.teamEmail = 'Please enter a valid email address'
    }
    
    if (formData.slackChannel && !formData.slackChannel.startsWith('#')) {
      newErrors.slackChannel = 'Slack channel must start with #'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Save application
  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('You do not have permission to edit this application')
      return
    }
    
    if (!validateForm()) {
      return
    }
    
    setIsSaving(true)
    try {
      const result = await updateApplication(application.id, {
        tla: formData.shortIdentifier,
        escalationEmail: formData.escalationEmail || null,
        contactEmail: formData.contactEmail || null,
        teamEmail: formData.teamEmail || null,
        slackChannel: formData.slackChannel || null,
        snowGroup: formData.snowGroup || null,
        description: formData.description || null
      })
      
      if (result.success) {
        toast.success('Application updated successfully')
        router.push(`/team/${teamId}/application/${application.id}`)
      } else {
        toast.error(result.error || 'Failed to update application')
      }
    } catch (error) {
      console.error('Failed to update application:', error)
      toast.error('An error occurred while updating application')
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <motion.div
      className="container mx-auto px-4 py-8 max-w-4xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/team/${teamId}/application/${application.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Application
            </Button>
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Application</h1>
            <p className="text-muted-foreground mt-1">
              {application.applicationName}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Application Details</TabsTrigger>
          <TabsTrigger value="overview">Application Overview</TabsTrigger>
        </TabsList>
        
        {/* Application Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Edit Application Details
              </CardTitle>
              <CardDescription>
                Update the configurable details for this application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="shortIdentifier">Short Identifier</Label>
                  <Input
                    id="shortIdentifier"
                    placeholder="Enter short identifier"
                    value={formData.shortIdentifier}
                    onChange={(e) => handleInputChange('shortIdentifier', e.target.value)}
                    maxLength={12}
                    className={errors.shortIdentifier ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 12 characters. Used in UI when application name is too long.
                  </p>
                  {errors.shortIdentifier && (
                    <p className="text-sm text-red-500 mt-1">{errors.shortIdentifier}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="escalationEmail">
                    <Mail className="h-4 inline mr-1" />
                    Escalation Email
                  </Label>
                  <Input
                    id="escalationEmail"
                    type="email"
                    placeholder="Enter escalation email"
                    value={formData.escalationEmail}
                    onChange={(e) => handleInputChange('escalationEmail', e.target.value)}
                    className={errors.escalationEmail ? 'border-red-500' : ''}
                  />
                  {errors.escalationEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.escalationEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactEmail">
                    <Mail className="h-4 inline mr-1" />
                    Contact Email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="Enter contact email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className={errors.contactEmail ? 'border-red-500' : ''}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.contactEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="teamEmail">
                    <Users className="h-4 inline mr-1" />
                    Team Email
                  </Label>
                  <Input
                    id="teamEmail"
                    type="email"
                    placeholder="Enter team email"
                    value={formData.teamEmail}
                    onChange={(e) => handleInputChange('teamEmail', e.target.value)}
                    className={errors.teamEmail ? 'border-red-500' : ''}
                  />
                  {errors.teamEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.teamEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slackChannel">
                    <MessageSquare className="h-4 inline mr-1" />
                    Slack Channel
                  </Label>
                  <Input
                    id="slackChannel"
                    placeholder="#channel-name"
                    value={formData.slackChannel}
                    onChange={(e) => handleInputChange('slackChannel', e.target.value)}
                    className={errors.slackChannel ? 'border-red-500' : ''}
                  />
                  {errors.slackChannel && (
                    <p className="text-sm text-red-500 mt-1">{errors.slackChannel}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="snowGroup">
                    <Hash className="h-4 inline mr-1" />
                    ServiceNow Group
                  </Label>
                  <Input
                    id="snowGroup"
                    placeholder="Enter ServiceNow group name"
                    value={formData.snowGroup}
                    onChange={(e) => handleInputChange('snowGroup', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">
                  <FileText className="h-4 inline mr-1" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter application description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Link href={`/team/${teamId}/application/${application.id}`}>
                  <Button variant="outline">
                    Cancel
                  </Button>
                </Link>
                
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Application Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Application Overview</CardTitle>
              <CardDescription>
                Read-only information from the Central API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Application Name</h3>
                  <p className="font-medium">{application.applicationName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Asset ID</h3>
                  <p className="font-medium">{application.assetId}</p>
                </div>
                
                {application.lifeCycleStatus && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Lifecycle Status</h3>
                    <Badge variant="secondary">{application.lifeCycleStatus}</Badge>
                  </div>
                )}
                
                {application.tier && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Tier</h3>
                    <Badge variant="outline">{application.tier}</Badge>
                  </div>
                )}
                
                {application.status && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <Badge variant={application.status === 'active' ? 'default' : 'secondary'}>
                      {application.status}
                    </Badge>
                  </div>
                )}
                
                {application.createdAt && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                    <p className="text-sm">{new Date(application.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
                
                {application.updatedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                    <p className="text-sm">{new Date(application.updatedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}