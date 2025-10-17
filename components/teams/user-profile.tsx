'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Calendar,
  FileText,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  LogOut,
  Shield,
  Bell,
  Palette
} from 'lucide-react'
import { useSession } from '@/components/session-provider'
import { useClientSession } from '@/hooks/use-client-session'
import { getUserTeamRegistrationRequests } from '@/lib/auth/team-actions'
import { signOut } from '@/lib/auth/actions'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3 }
}

export function UserProfile() {
  const { session } = useSession()
  const { session: clientSession } = useClientSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Use client session for immediate access, fall back to provider session
  const effectiveSession = clientSession || session
  
  const [userRequests, setUserRequests] = useState<any[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  
  // Get initial tab from URL query parameter
  const initialTab = searchParams.get('tab') || 'profile'
  
  // Fetch user's team registration requests
  useEffect(() => {
    const fetchUserRequests = async () => {
      if (!effectiveSession) return
      
      setIsLoadingRequests(true)
      try {
        const requests = await getUserTeamRegistrationRequests()
        setUserRequests(requests)
      } catch (error) {
        console.error('Failed to fetch user requests:', error)
        toast.error('Failed to load your requests')
      } finally {
        setIsLoadingRequests(false)
      }
    }

    fetchUserRequests()
  }, [effectiveSession])

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        toast.success('Signed out successfully')
        router.push('/')
      } else {
        toast.error(result.error || 'Failed to sign out')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('An error occurred during sign out')
    }
  }

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3 w-3" />,
          text: 'Pending'
        }
      case 'approved':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Approved'
        }
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />,
          text: 'Rejected'
        }
      default:
        return {
          variant: 'outline' as const,
          icon: <Clock className="h-3 w-3" />,
          text: 'Unknown'
        }
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (!effectiveSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const user = effectiveSession.user
  const teams = effectiveSession.teams || []

  return (
    <motion.div
      className="container mx-auto px-4 py-8 max-w-4xl"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and view your team registration requests
        </p>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
                <CardDescription>
                  Your account details and team memberships
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {user.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">{user.fullName}</h2>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Employee ID: {user.employeeId}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Teams */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Team Memberships</h3>
                  {teams.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>You are not a member of any teams yet</p>
                      <Link href="/team/register">
                        <Button variant="outline" className="mt-3">
                          <FileText className="h-4 w-4 mr-2" />
                          Register a Team
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teams.map((team: any) => (
                        <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{team.teamName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {team.isAdmin ? 'Admin' : 'Member'}
                            </p>
                          </div>
                          <Badge variant={team.isActive ? 'default' : 'secondary'}>
                            {team.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* My Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Team Registration Requests
                </CardTitle>
                <CardDescription>
                  Track the status of your team registration requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : userRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                    <p className="mb-4">You haven't submitted any team registration requests</p>
                    <Link href="/team/register">
                      <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Register a Team
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userRequests.map((request) => {
                      const statusInfo = getStatusInfo(request.status)
                      
                      return (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{request.teamName}</h3>
                                <Badge variant={statusInfo.variant} className="gap-1">
                                  {statusInfo.icon}
                                  {statusInfo.text}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Submitted: {formatDate(request.requestedAt)}</span>
                                </div>
                                
                                {request.reviewedAt && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Reviewed: {formatDate(request.reviewedAt)}</span>
                                  </div>
                                )}
                              </div>
                              
                              {request.comments && (
                                <div className="text-sm">
                                  <span className="font-medium">Comments: </span>
                                  {request.comments}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {request.status === 'pending' ? (
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  Under Review
                                </Badge>
                              ) : request.status === 'approved' ? (
                                <Link href={`/team/register/${request.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Details
                                  </Button>
                                </Link>
                              ) : (
                                <Link href={`/team/register/${request.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Details
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
                <CardDescription>
                  Manage your account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Actions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Security</h4>
                        <p className="text-sm text-muted-foreground">Manage your password and security settings</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Notifications</h4>
                        <p className="text-sm text-muted-foreground">Configure notification preferences</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Palette className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Appearance</h4>
                        <p className="text-sm text-muted-foreground">Customize the look and feel</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Customize
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                {/* Account Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Actions</h3>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <LogOut className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Sign Out</h4>
                        <p className="text-sm text-muted-foreground">Sign out of your account</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}