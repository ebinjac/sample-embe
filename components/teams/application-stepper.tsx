'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Search, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  Mail,
  MessageSquare,
  Users,
  Hash,
  FileText
} from 'lucide-react'
import { fetchApplicationFromCentralAPI, addApplicationToTeam } from '@/lib/auth/team-actions'

interface ApplicationStepperProps {
  teamId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ApplicationFormData {
  assetId: string
  shortIdentifier: string
  applicationName: string
  lifeCycleStatus?: string | null
  tier?: string | null
  escalationEmail: string
  contactEmail: string
  teamEmail: string
  slackChannel: string
  snowGroup: string
  description: string
}

const steps = [
  { id: 'search', title: 'Find Application', description: 'Search by Asset ID' },
  { id: 'details', title: 'Application Details', description: 'Configure application settings' },
  { id: 'review', title: 'Review & Add', description: 'Review and add application' }
]

export function ApplicationStepper({ teamId, isOpen, onClose, onSuccess }: ApplicationStepperProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [searchedAssetId, setSearchedAssetId] = useState('')
  const [applicationData, setApplicationData] = useState<any>(null)
  const [formData, setFormData] = useState<ApplicationFormData>({
    assetId: '',
    shortIdentifier: '',
    applicationName: '',
    lifeCycleStatus: '',
    tier: '',
    escalationEmail: '',
    contactEmail: '',
    teamEmail: '',
    slackChannel: '',
    snowGroup: '',
    description: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setSearchedAssetId('')
      setApplicationData(null)
      setFormData({
        assetId: '',
        shortIdentifier: '',
        applicationName: '',
        lifeCycleStatus: '',
        tier: '',
        escalationEmail: '',
        contactEmail: '',
        teamEmail: '',
        slackChannel: '',
        snowGroup: '',
        description: ''
      })
      setErrors({})
    }
  }, [isOpen])

  // Search for application by Asset ID
  const handleSearchApplication = async () => {
    if (!searchedAssetId.trim()) {
      setErrors({ assetId: 'Please enter an Asset ID' })
      return
    }

    setIsSearching(true)
    setErrors({})

    try {
      const data = await fetchApplicationFromCentralAPI(parseInt(searchedAssetId))
      
      if (!data) {
        setErrors({ assetId: 'Application not found. Please check the Asset ID and try again.' })
        return
      }

      setApplicationData(data)
      setFormData(prev => ({
        ...prev,
        assetId: searchedAssetId,
        applicationName: data.applicationName || '',
        lifeCycleStatus: data.lifeCycleStatus || '',
        tier: data.tier || ''
      }))
      
      // Auto-generate a short identifier from the application name
      if (data.applicationName) {
        const shortId = data.applicationName
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 12)
          .toUpperCase()
        setFormData(prev => ({ ...prev, shortIdentifier: shortId }))
      }
    } catch (error) {
      console.error('Failed to search application:', error)
      setErrors({ assetId: 'Failed to search for application. Please try again.' })
    } finally {
      setIsSearching(false)
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

  // Handle form field changes
  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Move to next step
  const handleNext = () => {
    if (currentStep === 0) {
      // Validate search step
      if (!applicationData) {
        setErrors({ assetId: 'Please search for and select an application first' })
        return
      }
    } else if (currentStep === 1) {
      // Validate details step
      if (!validateForm()) {
        return
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  // Move to previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  // Submit application
  const handleSubmit = async () => {
    setIsAdding(true)
    try {
      // Filter out null values from optional fields
      const { assetId, shortIdentifier, applicationName, ...optionalFields } = formData
      const filteredOptionalFields: Record<string, any> = {}
      
      Object.entries(optionalFields).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          filteredOptionalFields[key] = value
        }
      })
      
      // Get the application data from the Central API to include all ownership fields
      const result = await addApplicationToTeam(teamId, {
        assetId: parseInt(assetId),
        shortIdentifier,
        applicationName,
        lifeCycleStatus: applicationData.lifeCycleStatus || undefined,
        tier: applicationData.tier || undefined,
        escalationEmail: formData.escalationEmail || undefined,
        contactEmail: formData.contactEmail || undefined,
        teamEmail: formData.teamEmail || undefined,
        slackChannel: formData.slackChannel || undefined,
        snowGroup: formData.snowGroup || undefined,
        description: formData.description || undefined,
        // Include all ownership fields from Central API
        productionSupportOwnerLeader1Name: applicationData.productionSupportOwnerLeader1Name || undefined,
        productionSupportOwnerLeader1Email: applicationData.productionSupportOwnerLeader1Email || undefined,
        productionSupportOwnerName: applicationData.productionSupportOwnerName || undefined,
        productionSupportOwnerEmail: applicationData.productionSupportOwnerEmail || undefined,
        applicationOwnerName: applicationData.applicationOwnerName || undefined,
        applicationOwnerEmail: applicationData.applicationOwnerEmail || undefined,
        applicationOwnerBand: applicationData.applicationOwnerBand || undefined,
        applicationManagerName: applicationData.applicationManagerName || undefined,
        applicationManagerEmail: applicationData.applicationManagerEmail || undefined,
        applicationManagerBand: applicationData.applicationManagerBand || undefined,
        applicationOwnerLeader1Name: applicationData.applicationOwnerLeader1Name || undefined,
        applicationOwnerLeader1Email: applicationData.applicationOwnerLeader1Email || undefined,
        applicationOwnerLeader1Band: applicationData.applicationOwnerLeader1Band || undefined,
        applicationOwnerLeader2Name: applicationData.applicationOwnerLeader2Name || undefined,
        applicationOwnerLeader2Email: applicationData.applicationOwnerLeader2Email || undefined,
        applicationOwnerLeader2Band: applicationData.applicationOwnerLeader2Band || undefined,
        ownerSvpName: applicationData.ownerSvpName || undefined,
        ownerSvpEmail: applicationData.ownerSvpEmail || undefined,
        ownerSvpBand: applicationData.ownerSvpBand || undefined,
        businessOwnerName: applicationData.businessOwnerName || undefined,
        businessOwnerEmail: applicationData.businessOwnerEmail || undefined,
        businessOwnerBand: applicationData.businessOwnerBand || undefined,
        businessOwnerLeader1Name: applicationData.businessOwnerLeader1Name || undefined,
        businessOwnerLeader1Email: applicationData.businessOwnerLeader1Email || undefined,
        businessOwnerLeader1Band: applicationData.businessOwnerLeader1Band || undefined,
        productionSupportOwnerBand: applicationData.productionSupportOwnerBand || undefined,
        productionSupportOwnerLeader1Band: applicationData.productionSupportOwnerLeader1Band || undefined,
        pmoName: applicationData.pmoName || undefined,
        pmoEmail: applicationData.pmoEmail || undefined,
        pmoBand: applicationData.pmoBand || undefined,
        unitCioName: applicationData.unitCioName || undefined,
        unitCioEmail: applicationData.unitCioEmail || undefined,
        unitCioBand: applicationData.unitCioBand || undefined
      })
      
      if (result.success) {
        toast.success('Application added successfully')
        onClose()
        onSuccess()
      } else {
        toast.error(result.error || 'Failed to add application')
        
        // If it's a duplicate Asset ID error, show a more helpful message
        if (result.error?.includes('duplicate key value violates unique constraint') ||
            result.error?.includes('Asset ID already exists')) {
          toast.error('This application is already associated with a team. Each application can only be added to one team.')
          setCurrentStep(0)
        }
      }
    } catch (error) {
      console.error('Failed to add application:', error)
      toast.error('An error occurred while adding application')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Application</DialogTitle>
          <DialogDescription>
            Add a new application to your team
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index < currentStep 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : index === currentStep 
                    ? 'border-primary text-primary' 
                    : 'border-muted text-muted-foreground'
              }`}>
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <div className={`ml-2 text-sm ${
                index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Step 1: Search Application */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="assetId">Asset ID</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="assetId"
                      placeholder="Enter Asset ID"
                      value={searchedAssetId}
                      onChange={(e) => setSearchedAssetId(e.target.value)}
                      disabled={isSearching}
                      className={errors.assetId ? 'border-red-500' : ''}
                    />
                    <Button 
                      onClick={handleSearchApplication}
                      disabled={isSearching || !searchedAssetId.trim()}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                  {errors.assetId && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.assetId}
                    </p>
                  )}
                </div>

                {applicationData && (
                  <Card >
                    <CardHeader>
                      <CardTitle className="text-green-500 flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Application Found
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Name:</span> {applicationData.applicationName}
                        </div>
                        <div>
                          <span className="font-medium">Asset ID:</span> {applicationData.assetId}
                        </div>
                        {applicationData.lifeCycleStatus && (
                          <div>
                            <span className="font-medium">Status:</span>{' '}
                            <Badge variant="secondary" className="ml-1">
                              {applicationData.lifeCycleStatus}
                            </Badge>
                          </div>
                        )}
                        {applicationData.tier && (
                          <div>
                            <span className="font-medium">Tier:</span> {applicationData.tier}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 2: Application Details */}
            {currentStep === 1 && applicationData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="applicationName">Application Name</Label>
                    <Input
                      id="applicationName"
                      value={formData.applicationName}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div>
                    <Label htmlFor="escalationEmail">
                      <Mail className="w-4 h-4 inline mr-1" />
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
                      <Mail className="w-4 h-4 inline mr-1" />
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
                      <Users className="w-4 h-4 inline mr-1" />
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
                      <MessageSquare className="w-4 h-4 inline mr-1" />
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
                      <Hash className="w-4 h-4 inline mr-1" />
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
                    <FileText className="w-4 h-4 inline mr-1" />
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
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Application Details</CardTitle>
                    <CardDescription>
                      Please review the application details before adding it to your team.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Application Name:</span>
                        <p>{formData.applicationName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Asset ID:</span>
                        <p>{formData.assetId}</p>
                      </div>
                      <div>
                        <span className="font-medium">Short Identifier:</span>
                        <p>{formData.shortIdentifier}</p>
                      </div>
                      {formData.lifeCycleStatus && (
                        <div>
                          <span className="font-medium">Lifecycle Status:</span>
                          <p>{formData.lifeCycleStatus}</p>
                        </div>
                      )}
                      {formData.tier && (
                        <div>
                          <span className="font-medium">Tier:</span>
                          <p>{formData.tier}</p>
                        </div>
                      )}
                      {formData.escalationEmail && (
                        <div>
                          <span className="font-medium">Escalation Email:</span>
                          <p>{formData.escalationEmail}</p>
                        </div>
                      )}
                      {formData.contactEmail && (
                        <div>
                          <span className="font-medium">Contact Email:</span>
                          <p>{formData.contactEmail}</p>
                        </div>
                      )}
                      {formData.teamEmail && (
                        <div>
                          <span className="font-medium">Team Email:</span>
                          <p>{formData.teamEmail}</p>
                        </div>
                      )}
                      {formData.slackChannel && (
                        <div>
                          <span className="font-medium">Slack Channel:</span>
                          <p>{formData.slackChannel}</p>
                        </div>
                      )}
                      {formData.snowGroup && (
                        <div>
                          <span className="font-medium">ServiceNow Group:</span>
                          <p>{formData.snowGroup}</p>
                        </div>
                      )}
                      {formData.description && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Description:</span>
                          <p>{formData.description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dialog Footer */}
        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding
                  </>
                ) : (
                  'Add Application'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}