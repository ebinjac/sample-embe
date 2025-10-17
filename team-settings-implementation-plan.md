# Team Settings Page Implementation Plan

## Overview
Create a comprehensive team settings page at `app/(ensemble)/team/[teamId]/settings/page.tsx` for managing team details and applications.

## Page Structure

### 1. Page Component (`app/(ensemble)/team/[teamId]/settings/page.tsx`)
```tsx
import { Metadata } from 'next'
import { TeamSettings } from '@/components/teams/team-settings'
import { getTeamById } from '@/lib/auth/team-actions'

export const metadata: Metadata = {
  title: 'Team Settings | Ensemble',
  description: 'Manage team settings and applications',
}

interface TeamSettingsPageProps {
  params: {
    teamId: string
  }
}

export default async function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  // Fetch team data server-side
  const team = await getTeamById(params.teamId)
  
  if (!team) {
    return <div>Team not found</div>
  }
  
  return <TeamSettings team={team} />
}
```

### 2. Team Settings Component (`components/teams/team-settings.tsx`)
```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  Settings, 
  Package, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Users, 
  Mail, 
  Building2, 
  Shield, 
  Search,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useSession } from '@/components/session-provider'
import { useRouter } from 'next/navigation'
import { updateTeam, getTeamApplications, addApplicationToTeam, removeApplicationFromTeam } from '@/lib/auth/team-actions'
import { fetchApplicationFromCentralAPI } from '@/lib/services/central-api'

interface TeamSettingsProps {
  team: any
}

interface Application {
  id: string
  assetId: number
  applicationName: string
  tla: string
  lifeCycleStatus?: string
  tier?: string
  // ... other application fields
}

export function TeamSettings({ team }: TeamSettingsProps) {
  const { session } = useSession()
  const router = useRouter()
  
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(true)
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  const [isSavingTeam, setIsSavingTeam] = useState(false)
  const [isAddingApplication, setIsAddingApplication] = useState(false)
  const [isRemovingApplication, setIsRemovingApplication] = useState<string | null>(null)
  
  // Form states
  const [teamForm, setTeamForm] = useState({
    teamName: team.teamName,
    userGroup: team.userGroup,
    adminGroup: team.adminGroup,
    contactName: team.contactName,
    contactEmail: team.contactEmail
  })
  
  const [newApplicationForm, setNewApplicationForm] = useState({
    assetId: '',
    tla: ''
  })
  
  const [isAddApplicationDialogOpen, setIsAddApplicationDialogOpen] = useState(false)
  const [isRemoveApplicationDialogOpen, setIsRemoveApplicationDialogOpen] = useState(false)
  const [applicationToRemove, setApplicationToRemove] = useState<Application | null>(null)
  
  // Check if user is admin of this team
  const isAdmin = session?.teams?.find((t: any) => t.id === team.id)?.isAdmin || false
  
  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const apps = await getTeamApplications(team.id)
        setApplications(apps)
      } catch (error) {
        console.error('Failed to fetch applications:', error)
        toast.error('Failed to load applications')
      } finally {
        setIsLoadingApplications(false)
      }
    }
    
    fetchApplications()
  }, [team.id])
  
  // Handle team form changes
  const handleTeamFormChange = (field: string, value: string) => {
    setTeamForm(prev => ({ ...prev, [field]: value }))
  }
  
  // Handle new application form changes
  const handleNewApplicationFormChange = (field: string, value: string) => {
    setNewApplicationForm(prev => ({ ...prev, [field]: value }))
  }
  
  // Save team details
  const handleSaveTeam = async () => {
    if (!isAdmin) {
      toast.error('You do not have permission to edit team details')
      return
    }
    
    setIsSavingTeam(true)
    try {
      const result = await updateTeam(team.id, teamForm)
      
      if (result.success) {
        toast.success('Team details updated successfully')
        setIsEditingTeam(false)
        // Refresh the page to get updated data
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update team details')
      }
    } catch (error) {
      console.error('Failed to update team:', error)
      toast.error('An error occurred while updating team details')
    } finally {
      setIsSavingTeam(false)
    }
  }
  
  // Add application to team
  const handleAddApplication = async () => {
    if (!isAdmin) {
      toast.error('You do not have permission to add applications')
      return
    }
    
    if (!newApplicationForm.assetId || !newApplicationForm.tla) {
      toast.error('Please fill in all required fields')
      return
    }
    
    // Check TLA uniqueness
    const tlaExists = applications.some(app => app.tla === newApplicationForm.tla)
    if (tlaExists) {
      toast.error('An application with this TLA already exists in this team')
      return
    }
    
    setIsAddingApplication(true)
    try {
      // First fetch application details from Central API
      const centralApiData = await fetchApplicationFromCentralAPI(newApplicationForm.assetId)
      
      if (!centralApiData) {
        toast.error('Application not found in Central API')
        return
      }
      
      // Add application to team
      const result = await addApplicationToTeam(team.id, {
        assetId: parseInt(newApplicationForm.assetId),
        tla: newApplicationForm.tla,
        // Map other fields from Central API
        applicationName: centralApiData.applicationName,
        lifeCycleStatus: centralApiData.lifeCycleStatus,
        tier: centralApiData.tier,
        // ... map other fields as needed
      })
      
      if (result.success) {
        toast.success('Application added successfully')
        setIsAddApplicationDialogOpen(false)
        setNewApplicationForm({ assetId: '', tla: '' })
        
        // Refresh applications list
        const apps = await getTeamApplications(team.id)
        setApplications(apps)
      } else {
        toast.error(result.error || 'Failed to add application')
      }
    } catch (error) {
      console.error('Failed to add application:', error)
      toast.error('An error occurred while adding application')
    } finally {
      setIsAddingApplication(false)
    }
  }
  
  // Remove application from team
  const handleRemoveApplication = async () => {
    if (!isAdmin || !applicationToRemove) {
      toast.error('You do not have permission to remove applications')
      return
    }
    
    setIsRemovingApplication(applicationToRemove.id)
    try {
      const result = await removeApplicationFromTeam(applicationToRemove.id)
      
      if (result.success) {
        toast.success('Application removed successfully')
        setIsRemoveApplicationDialogOpen(false)
        setApplicationToRemove(null)
        
        // Refresh applications list
        const apps = await getTeamApplications(team.id)
        setApplications(apps)
      } else {
        toast.error(result.error || 'Failed to remove application')
      }
    } catch (error) {
      console.error('Failed to remove application:', error)
      toast.error('An error occurred while removing application')
    } finally {
      setIsRemovingApplication(null)
    }
  }
  
  const openRemoveApplicationDialog = (application: Application) => {
    setApplicationToRemove(application)
    setIsRemoveApplicationDialogOpen(true)
  }
  
  return (
    <motion.div
      className="container mx-auto px-4 py-8 max-w-4xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Team Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage team details and applications
        </p>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Team Details</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>
        
        {/* Team Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Team Information
                  </CardTitle>
                  <CardDescription>
                    View and edit team details
                  </CardDescription>
                </div>
                
                {isAdmin && (
                  <div className="flex gap-2">
                    {isEditingTeam ? (
                      <>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleSaveTeam}
                          disabled={isSavingTeam}
                        >
                          {isSavingTeam ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Saving
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsEditingTeam(false)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditingTeam(true)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="teamName">Team Name</Label>
                    {isEditingTeam ? (
                      <Input
                        id="teamName"
                        value={teamForm.teamName}
                        onChange={(e) => handleTeamFormChange('teamName', e.target.value)}
                        disabled={!isAdmin}
                      />
                    ) : (
                      <p className="font-medium">{team.teamName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="userGroup">User Group</Label>
                    {isEditingTeam ? (
                      <Input
                        id="userGroup"
                        value={teamForm.userGroup}
                        onChange={(e) => handleTeamFormChange('userGroup', e.target.value)}
                        disabled={!isAdmin}
                      />
                    ) : (
                      <p className="font-medium">{team.userGroup}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="adminGroup">Admin Group</Label>
                    {isEditingTeam ? (
                      <Input
                        id="adminGroup"
                        value={teamForm.adminGroup}
                        onChange={(e) => handleTeamFormChange('adminGroup', e.target.value)}
                        disabled={!isAdmin}
                      />
                    ) : (
                      <p className="font-medium">{team.adminGroup}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contactName">Contact Name</Label>
                    {isEditingTeam ? (
                      <Input
                        id="contactName"
                        value={teamForm.contactName}
                        onChange={(e) => handleTeamFormChange('contactName', e.target.value)}
                        disabled={!isAdmin}
                      />
                    ) : (
                      <p className="font-medium">{team.contactName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    {isEditingTeam ? (
                      <Input
                        id="contactEmail"
                        type="email"
                        value={teamForm.contactEmail}
                        onChange={(e) => handleTeamFormChange('contactEmail', e.target.value)}
                        disabled={!isAdmin}
                      />
                    ) : (
                      <p className="font-medium">{team.contactEmail}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={team.isActive ? 'default' : 'secondary'}>
                        {team.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isAdmin && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Only team admins can edit team details
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Applications
                  </CardTitle>
                  <CardDescription>
                    Manage applications associated with this team
                  </CardDescription>
                </div>
                
                {isAdmin && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setIsAddApplicationDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Application
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingApplications ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                  <p className="mb-4">
                    {isAdmin ? 'Add applications to this team to get started' : 'This team has no applications yet'}
                  </p>
                  {isAdmin && (
                    <Button onClick={() => setIsAddApplicationDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Application
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{application.applicationName}</h3>
                            <Badge variant="outline">{application.tla}</Badge>
                            {application.lifeCycleStatus && (
                              <Badge variant="secondary">{application.lifeCycleStatus}</Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            Asset ID: {application.assetId}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openRemoveApplicationDialog(application)}
                              disabled={isRemovingApplication === application.id}
                            >
                              {isRemovingApplication === application.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Removing
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!isAdmin && applications.length > 0 && (
                <div className="bg-muted/30 p-4 rounded-lg mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Only team admins can add or remove applications
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Application Dialog */}
      <Dialog open={isAddApplicationDialogOpen} onOpenChange={setIsAddApplicationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
            <DialogDescription>
              Add a new application to this team by Asset ID
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="assetId">Asset ID</Label>
              <Input
                id="assetId"
                placeholder="Enter Asset ID"
                value={newApplicationForm.assetId}
                onChange={(e) => handleNewApplicationFormChange('assetId', e.target.value)}
                disabled={isAddingApplication}
              />
            </div>
            
            <div>
              <Label htmlFor="tla">TLA (Three Letter Abbreviation)</Label>
              <Input
                id="tla"
                placeholder="Enter TLA"
                value={newApplicationForm.tla}
                onChange={(e) => handleNewApplicationFormChange('tla', e.target.value)}
                disabled={isAddingApplication}
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be unique within this team
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddApplicationDialogOpen(false)}
              disabled={isAddingApplication}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddApplication}
              disabled={isAddingApplication || !newApplicationForm.assetId || !newApplicationForm.tla}
            >
              {isAddingApplication ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding
                </>
              ) : (
                'Add Application'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Remove Application Confirmation Dialog */}
      <AlertDialog open={isRemoveApplicationDialogOpen} onOpenChange={setIsRemoveApplicationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{applicationToRemove?.applicationName}" from this team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingApplication !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveApplication}
              disabled={isRemovingApplication !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingApplication ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
```

## API Functions

### 1. Team Actions (`lib/auth/team-actions.ts`)
```tsx
// Add these functions to the existing file

/**
 * Get team by ID
 */
export async function getTeamById(teamId: string) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    
    // Check if user is a member of this team
    const team = session.teams.find(t => t.id === teamId)
    if (!team) {
      throw new Error('Team not found or access denied')
    }
    
    // Get full team details from database
    const teamDetails = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)
    
    return teamDetails[0] || null
  } catch (error) {
    console.error('Failed to get team:', error)
    throw error
  }
}

/**
 * Update team details
 */
export async function updateTeam(teamId: string, teamData: {
  teamName: string
  userGroup: string
  adminGroup: string
  contactName: string
  contactEmail: string
}) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Check if user is admin of this team
    const team = session.teams.find(t => t.id === teamId)
    if (!team || !team.isAdmin) {
      return { success: false, error: 'Access denied' }
    }
    
    // Update team in database
    await db
      .update(teams)
      .set({
        ...teamData,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update team:', error)
    return { success: false, error: 'Failed to update team' }
  }
}

/**
 * Get applications for a team
 */
export async function getTeamApplications(teamId: string) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    
    // Check if user is a member of this team
    const team = session.teams.find(t => t.id === teamId)
    if (!team) {
      throw new Error('Team not found or access denied')
    }
    
    // Get applications from database
    const apps = await db
      .select()
      .from(applications)
      .where(eq(applications.teamId, teamId))
      .orderBy(applications.applicationName)
    
    return apps
  } catch (error) {
    console.error('Failed to get team applications:', error)
    throw error
  }
}

/**
 * Add application to team
 */
export async function addApplicationToTeam(teamId: string, applicationData: {
  assetId: number
  tla: string
  applicationName: string
  lifeCycleStatus?: string
  tier?: string
  // ... other application fields
}) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Check if user is admin of this team
    const team = session.teams.find(t => t.id === teamId)
    if (!team || !team.isAdmin) {
      return { success: false, error: 'Access denied' }
    }
    
    // Check if TLA is unique within this team
    const existingApp = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.teamId, teamId),
          eq(applications.tla, applicationData.tla)
        )
      )
      .limit(1)
    
    if (existingApp.length > 0) {
      return { success: false, error: 'An application with this TLA already exists in this team' }
    }
    
    // Add application to database
    await db.insert(applications).values({
      ...applicationData,
      teamId,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    })
    
    return { success: true }
  } catch (error) {
    console.error('Failed to add application to team:', error)
    return { success: false, error: 'Failed to add application' }
  }
}

/**
 * Remove application from team
 */
export async function removeApplicationFromTeam(applicationId: string) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get application to check team membership
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
    
    if (!app.length) {
      return { success: false, error: 'Application not found' }
    }
    
    // Check if user is admin of this team
    const team = session.teams.find(t => t.id === app[0].teamId)
    if (!team || !team.isAdmin) {
      return { success: false, error: 'Access denied' }
    }
    
    // Remove application from database
    await db
      .delete(applications)
      .where(eq(applications.id, applicationId))
    
    return { success: true }
  } catch (error) {
    console.error('Failed to remove application from team:', error)
    return { success: false, error: 'Failed to remove application' }
  }
}
```

### 2. Central API Service (`lib/services/central-api.ts`)
```tsx
/**
 * Service for interacting with the Central API
 */

interface CentralAPIResponse {
  data: {
    application: {
      name: string
      assetId: number
      lifeCycleStatus: string
      risk: {
        bia: string
      }
      ownershipInfo: {
        applicationowner: {
          email: string
          fullName: string
          band: string
        }
        applicationManager: {
          email: string
          fullName: string
          band: string
        }
        applicationOwnerLeader1: {
          email: string
          fullName: string
          band: string
        }
        applicationOwnerLeader2: {
          email: string
          fullName: string
          band: string
        }
        ownerSVp: {
          email: string
          fullName: string
          band: string
        }
        businessOwner: {
          email: string
          fullName: string
          band: string
        }
        businessOwnerLeader1: {
          email: string
          fullName: string
          band: string
        }
        productionSupportOwner: {
          email: string
          fullName: string
          band: string
        }
        productionSupportOwnerLeader1: {
          email: string
          fullName: string
          band: string
        }
        pmo: {
          email: string
          fullName: string
          band: string
        }
        unitCIo: {
          fullName: string
        }
      }
    }
  }
}

/**
 * Fetch application details from Central API
 */
export async function fetchApplicationFromCentralAPI(assetId: string | number) {
  try {
    const response = await fetch(`http://localhost:8008/api/central?assetId=${assetId}`)
    
    if (!response.ok) {
      throw new Error(`Central API returned ${response.status}`)
    }
    
    const data: CentralAPIResponse = await response.json()
    
    // Map Central API response to our database schema
    return mapCentralAPIDataToApplication(data.data.application)
  } catch (error) {
    console.error('Failed to fetch application from Central API:', error)
    return null
  }
}

/**
 * Map Central API response data to our application schema
 */
function mapCentralAPIDataToApplication(centralData: any) {
  const { application } = centralData
  
  return {
    applicationName: application.name,
    assetId: application.assetId,
    lifeCycleStatus: application.lifeCycleStatus,
    tier: application.risk.bia,
    // Map ownership info
    applicationOwnerName: application.ownershipInfo.applicationowner.fullName,
    applicationOwnerEmail: application.ownershipInfo.applicationowner.email,
    applicationOwnerBand: application.ownershipInfo.applicationowner.band,
    applicationManagerName: application.ownershipInfo.applicationManager.fullName,
    applicationManagerEmail: application.ownershipInfo.applicationManager.email,
    applicationManagerBand: application.ownershipInfo.applicationManager.band,
    applicationOwnerLeader1Name: application.ownershipInfo.applicationOwnerLeader1.fullName,
    applicationOwnerLeader1Email: application.ownershipInfo.applicationOwnerLeader1.email,
    applicationOwnerLeader1Band: application.ownershipInfo.applicationOwnerLeader1.band,
    applicationOwnerLeader2Name: application.ownershipInfo.applicationOwnerLeader2.fullName,
    applicationOwnerLeader2Email: application.ownershipInfo.applicationOwnerLeader2.email,
    applicationOwnerLeader2Band: application.ownershipInfo.applicationOwnerLeader2.band,
    ownerSvpName: application.ownershipInfo.ownerSVp.fullName,
    ownerSvpEmail: application.ownershipInfo.ownerSVp.email,
    ownerSvpBand: application.ownershipInfo.ownerSVp.band,
    businessOwnerName: application.ownershipInfo.businessOwner.fullName,
    businessOwnerEmail: application.ownershipInfo.businessOwner.email,
    businessOwnerBand: application.ownershipInfo.businessOwner.band,
    businessOwnerLeader1Name: application.ownershipInfo.businessOwnerLeader1.fullName,
    businessOwnerLeader1Email: application.ownershipInfo.businessOwnerLeader1.email,
    businessOwnerLeader1Band: application.ownershipInfo.businessOwnerLeader1.band,
    productionSupportOwnerName: application.ownershipInfo.productionSupportOwner.fullName,
    productionSupportOwnerEmail: application.ownershipInfo.productionSupportOwner.email,
    productionSupportOwnerBand: application.ownershipInfo.productionSupportOwner.band,
    productionSupportOwnerLeader1Name: application.ownershipInfo.productionSupportOwnerLeader1.fullName,
    productionSupportOwnerLeader1Email: application.ownershipInfo.productionSupportOwnerLeader1.email,
    productionSupportOwnerLeader1Band: application.ownershipInfo.productionSupportOwnerLeader1.band,
    pmoName: application.ownershipInfo.pmo.fullName,
    pmoEmail: application.ownershipInfo.pmo.email,
    pmoBand: application.ownershipInfo.pmo.band,
    unitCioName: application.ownershipInfo.unitCIo?.fullName,
  }
}
```

## Implementation Steps

1. Create the page component at `app/(ensemble)/team/[teamId]/settings/page.tsx`
2. Create the TeamSettings component at `components/teams/team-settings.tsx`
3. Add the required API functions to `lib/auth/team-actions.ts`
4. Create the Central API service at `lib/services/central-api.ts`
5. Test the functionality with different user roles (admin vs member)

## Error Handling

- Network errors when calling Central API
- Application not found in Central API
- TLA uniqueness validation
- Permission validation for admin-only actions
- Database transaction errors

## Security Considerations

- Verify user is a member of the team before allowing access
- Verify user is an admin of the team before allowing modifications
- Validate all input data
- Handle API errors gracefully
- Sanitize data from external APIs

This implementation provides a comprehensive team settings page with proper permission controls, application management, and integration with the Central API for fetching application details.