'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Package, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Activity,
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
  Filter
} from 'lucide-react'
import { Application } from '@/types/application'
import { getTeamApplications } from '@/lib/auth/team-actions'
import { toast } from 'sonner'
import Link from 'next/link'

interface TeamDashboardProps {
  teamId: string
  team: any
}

export function TeamDashboard({ teamId, team }: TeamDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Fetch applications
  const fetchApplications = async () => {
    try {
      const apps = await getTeamApplications(teamId)
      setApplications(apps)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Refresh applications
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchApplications()
    setIsRefreshing(false)
    toast.success('Applications refreshed')
  }
  
  // Initial fetch
  useEffect(() => {
    fetchApplications()
  }, [teamId])
  
  // Calculate statistics
  const totalApplications = applications.length
  const activeApplications = applications.filter(app => app.status === 'active').length
  const productionApplications = applications.filter(app => app.lifeCycleStatus === 'Production').length
  const recentlySynced = applications.filter(app => {
    if (!app.lastCentralApiSync) return false
    const syncDate = new Date(app.lastCentralApiSync)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return syncDate > weekAgo
  }).length
  
  // Calculate tier distribution
  const tierDistribution = applications.reduce((acc, app) => {
    const tier = app.tier || 'Unknown'
    acc[tier] = (acc[tier] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Calculate lifecycle status distribution
  const lifecycleDistribution = applications.reduce((acc, app) => {
    const status = app.lifeCycleStatus || 'Unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Get applications that need sync (not synced in the last 7 days)
  const needSync = applications.filter(app => {
    if (!app.lastCentralApiSync) return true
    const syncDate = new Date(app.lastCentralApiSync)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return syncDate <= weekAgo
  })
  
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your team's applications and metrics
          </p>
        </div>
        
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered to this team
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active applications
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In production environment
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Recently Synced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentlySynced}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Synced in the last 7 days
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applications Needing Sync */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Applications Needing Sync
                </CardTitle>
                <CardDescription>
                  Applications that haven't been synced with Central API in the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {needSync.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-muted-foreground">All applications are up to date</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Applications</span>
                      <Badge variant="outline">{needSync.length}</Badge>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {needSync.slice(0, 5).map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{app.applicationName}</p>
                            <p className="text-xs text-muted-foreground">
                              Asset ID: {app.assetId}
                            </p>
                          </div>
                          <Link href={`/team/${teamId}/application/${app.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      ))}
                      {needSync.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          And {needSync.length - 5} more...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Team Information
                </CardTitle>
                <CardDescription>
                  Details about your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Team Name</h3>
                    <p className="text-sm">{team.teamName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">User Group</h3>
                    <p className="text-sm">{team.userGroup}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Admin Group</h3>
                    <p className="text-sm">{team.adminGroup}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                    <p className="text-sm">{team.contactName}</p>
                    <p className="text-sm text-muted-foreground">{team.contactEmail}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <Badge variant={team.isActive ? 'default' : 'secondary'}>
                      {team.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Applications Overview
              </CardTitle>
              <CardDescription>
                All applications registered to this team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin" />
                  <p className="text-sm text-muted-foreground mt-2">Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                  <p>This team has no applications registered</p>
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
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {application.lastCentralApiSync && (
                              <div className="flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                Synced: {new Date(application.lastCentralApiSync).toLocaleDateString()}
                              </div>
                            )}
                            
                            {application.centralApiSyncStatus && (
                              <Badge 
                                variant={application.centralApiSyncStatus === 'success' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {application.centralApiSyncStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link href={`/team/${teamId}/application/${application.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tier Distribution */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-500" />
                  Tier Distribution
                </CardTitle>
                <CardDescription>
                  Distribution of applications by BIA tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(tierDistribution).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(tierDistribution).map(([tier, count]) => (
                      <div key={tier} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{tier}</span>
                          <span>{count}</span>
                        </div>
                        <Progress 
                          value={(count / totalApplications) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Lifecycle Status Distribution */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  Lifecycle Status
                </CardTitle>
                <CardDescription>
                  Distribution of applications by lifecycle status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(lifecycleDistribution).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(lifecycleDistribution).map(([status, count]) => (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{status}</span>
                          <span>{count}</span>
                        </div>
                        <Progress 
                          value={(count / totalApplications) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}