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
  CheckCircle,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from '@/components/session-provider'
import { useRouter } from 'next/navigation'
import { updateTeam, getTeamApplications, removeApplicationFromTeam } from '@/lib/auth/team-actions'
import { ApplicationStepper } from '@/components/teams/application-stepper'
import { TeamDashboard } from '@/components/teams/team-dashboard'

interface TeamSettingsProps {
  team: any
}

import { Application } from '@/types/application'

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
  
  const [isAddApplicationStepperOpen, setIsAddApplicationStepperOpen] = useState(false)
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
  
  // Refresh applications list
  const refreshApplications = async () => {
    try {
      const apps = await getTeamApplications(team.id)
      setApplications(apps)
    } catch (error) {
      console.error('Failed to refresh applications:', error)
      toast.error('Failed to refresh applications')
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

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="details">Team Details</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <TeamDashboard teamId={team.id} team={team} />
        </TabsContent>
        
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
                    onClick={() => setIsAddApplicationStepperOpen(true)}
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
                    <Button onClick={() => setIsAddApplicationStepperOpen(true)}>
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
                          <Link href={`/team/${team.id}/application/${application.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          
                          {isAdmin && (
                            <>
                              <Link href={`/team/${team.id}/application/${application.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>
                              
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
                            </>
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
      
      {/* Application Stepper */}
      <ApplicationStepper
        teamId={team.id}
        isOpen={isAddApplicationStepperOpen}
        onClose={() => setIsAddApplicationStepperOpen(false)}
        onSuccess={refreshApplications}
      />
      
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