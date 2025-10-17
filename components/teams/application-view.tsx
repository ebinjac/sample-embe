'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Mail,
  Users,
  MessageSquare,
  Hash,
  FileText,
  Building2,
  User,
  Briefcase,
  Shield,
  Star,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/components/session-provider'
import { Application } from '@/types/application'
import { toast } from 'sonner'

interface ApplicationViewProps {
  application: Application
  teamId: string
}

export function ApplicationView({ application, teamId }: ApplicationViewProps) {
  const { session } = useSession()
  const router = useRouter()
  
  // Check if user is admin of this team
  const isAdmin = session?.teams?.find((t: any) => t.id === teamId)?.isAdmin || false
  
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Handle sync with Central API
  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/sync-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: application.id
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Application synced successfully')
        router.refresh() // Refresh the page to show updated data
      } else {
        toast.error(result.error || 'Failed to sync application')
      }
    } catch (error) {
      console.error('Failed to sync application:', error)
      toast.error('An error occurred while syncing application')
    } finally {
      setIsSyncing(false)
    }
  }
  
  return (
    <motion.div
      className="container mx-auto px-4 py-8 max-w-4xl mt-14"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/team/${teamId}/settings?tab=applications`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Applications
            </Button>
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground">{application.applicationName}</h1>
            <p className="text-muted-foreground mt-1">
              Asset ID: {application.assetId}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync
              </>
            )}
          </Button>
          
          {isAdmin && (
            <Link href={`/team/${teamId}/application/${application.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-1" />
                Edit Application
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Application Overview */}
      <Card className="shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Application Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Short Identifier</h3>
              <Badge variant="outline">{application.tla}</Badge>
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
            
            {application.lastCentralApiSync && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Last Central API Sync
                </h3>
                <p className="text-sm">{new Date(application.lastCentralApiSync).toLocaleDateString()}</p>
                {application.centralApiSyncStatus && (
                  <Badge
                    variant={application.centralApiSyncStatus === 'success' ? 'default' : 'destructive'}
                    className="mt-1"
                  >
                    {application.centralApiSyncStatus}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {application.description && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-sm">{application.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts">Contact Information</TabsTrigger>
          <TabsTrigger value="ownership">Ownership Hierarchy</TabsTrigger>
          <TabsTrigger value="support">Support Details</TabsTrigger>
        </TabsList>
        
        {/* Contact Information Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Communication channels for this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {application.escalationEmail && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Escalation Email
                    </h3>
                    <p className="text-sm">{application.escalationEmail}</p>
                  </div>
                )}
                
                {application.contactEmail && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Email</h3>
                    <p className="text-sm">{application.contactEmail}</p>
                  </div>
                )}
                
                {application.teamEmail && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Team Email
                    </h3>
                    <p className="text-sm">{application.teamEmail}</p>
                  </div>
                )}
                
                {application.slackChannel && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Slack Channel
                    </h3>
                    <p className="text-sm">{application.slackChannel}</p>
                  </div>
                )}
                
                {application.snowGroup && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      ServiceNow Group
                    </h3>
                    <p className="text-sm">{application.snowGroup}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Ownership Hierarchy Tab */}
        <TabsContent value="ownership" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Ownership Hierarchy
              </CardTitle>
              <CardDescription>
                Application ownership and management structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Application Owner */}
                {application.applicationOwnerName && (
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Application Owner</h3>
                    <p className="font-medium">{application.applicationOwnerName}</p>
                    {application.applicationOwnerEmail && (
                      <p className="text-sm text-muted-foreground">{application.applicationOwnerEmail}</p>
                    )}
                    {application.applicationOwnerBand && (
                      <Badge variant="outline" className="mt-1">{application.applicationOwnerBand}</Badge>
                    )}
                  </div>
                )}
                
                {/* Application Manager */}
                {application.applicationManagerName && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Application Manager</h3>
                    <p className="font-medium">{application.applicationManagerName}</p>
                    {application.applicationManagerEmail && (
                      <p className="text-sm text-muted-foreground">{application.applicationManagerEmail}</p>
                    )}
                    {application.applicationManagerBand && (
                      <Badge variant="outline" className="mt-1">{application.applicationManagerBand}</Badge>
                    )}
                  </div>
                )}
                
                {/* Business Owner */}
                {application.businessOwnerName && (
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Business Owner</h3>
                    <p className="font-medium">{application.businessOwnerName}</p>
                    {application.businessOwnerEmail && (
                      <p className="text-sm text-muted-foreground">{application.businessOwnerEmail}</p>
                    )}
                    {application.businessOwnerBand && (
                      <Badge variant="outline" className="mt-1">{application.businessOwnerBand}</Badge>
                    )}
                  </div>
                )}
                
                {/* Production Support Owner */}
                {application.productionSupportOwnerName && (
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Production Support Owner</h3>
                    <p className="font-medium">{application.productionSupportOwnerName}</p>
                    {application.productionSupportOwnerEmail && (
                      <p className="text-sm text-muted-foreground">{application.productionSupportOwnerEmail}</p>
                    )}
                    {application.productionSupportOwnerBand && (
                      <Badge variant="outline" className="mt-1">{application.productionSupportOwnerBand}</Badge>
                    )}
                  </div>
                )}
                
                {/* Unit CIO */}
                {application.unitCioName && (
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Unit CIO</h3>
                    <p className="font-medium">{application.unitCioName}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Support Details Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Support Details
              </CardTitle>
              <CardDescription>
                Additional support and escalation information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Owner SVP */}
                {application.ownerSvpName && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Owner SVP</h3>
                    <p className="font-medium">{application.ownerSvpName}</p>
                    {application.ownerSvpEmail && (
                      <p className="text-sm text-muted-foreground">{application.ownerSvpEmail}</p>
                    )}
                    {application.ownerSvpBand && (
                      <Badge variant="outline" className="mt-1">{application.ownerSvpBand}</Badge>
                    )}
                  </div>
                )}
                
                {/* Application Owner Leader 1 */}
                {application.applicationOwnerLeader1Name && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Application Owner Leader 1</h3>
                    <p className="font-medium">{application.applicationOwnerLeader1Name}</p>
                    {application.applicationOwnerLeader1Email && (
                      <p className="text-sm text-muted-foreground">{application.applicationOwnerLeader1Email}</p>
                    )}
                    {application.applicationOwnerLeader1Band && (
                      <Badge variant="outline" className="mt-1">{application.applicationOwnerLeader1Band}</Badge>
                    )}
                  </div>
                )}
                
                {/* Application Owner Leader 2 */}
                {application.applicationOwnerLeader2Name && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Application Owner Leader 2</h3>
                    <p className="font-medium">{application.applicationOwnerLeader2Name}</p>
                    {application.applicationOwnerLeader2Email && (
                      <p className="text-sm text-muted-foreground">{application.applicationOwnerLeader2Email}</p>
                    )}
                    {application.applicationOwnerLeader2Band && (
                      <Badge variant="outline" className="mt-1">{application.applicationOwnerLeader2Band}</Badge>
                    )}
                  </div>
                )}
                
                {/* Business Owner Leader 1 */}
                {application.businessOwnerLeader1Name && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Business Owner Leader 1</h3>
                    <p className="font-medium">{application.businessOwnerLeader1Name}</p>
                    {application.businessOwnerLeader1Email && (
                      <p className="text-sm text-muted-foreground">{application.businessOwnerLeader1Email}</p>
                    )}
                    {application.businessOwnerLeader1Band && (
                      <Badge variant="outline" className="mt-1">{application.businessOwnerLeader1Band}</Badge>
                    )}
                  </div>
                )}
                
                {/* Production Support Owner Leader 1 */}
                {application.productionSupportOwnerLeader1Name && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Production Support Owner Leader 1</h3>
                    <p className="font-medium">{application.productionSupportOwnerLeader1Name}</p>
                    {application.productionSupportOwnerLeader1Email && (
                      <p className="text-sm text-muted-foreground">{application.productionSupportOwnerLeader1Email}</p>
                    )}
                    {application.productionSupportOwnerLeader1Band && (
                      <Badge variant="outline" className="mt-1">{application.productionSupportOwnerLeader1Band}</Badge>
                    )}
                  </div>
                )}
                
                {/* PMO */}
                {application.pmoName && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">PMO</h3>
                    <p className="font-medium">{application.pmoName}</p>
                    {application.pmoEmail && (
                      <p className="text-sm text-muted-foreground">{application.pmoEmail}</p>
                    )}
                    {application.pmoBand && (
                      <Badge variant="outline" className="mt-1">{application.pmoBand}</Badge>
                    )}
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