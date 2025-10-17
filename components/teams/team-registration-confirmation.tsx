'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useSession } from '@/components/session-provider'
import { useClientSession } from '@/hooks/use-client-session'
import { useRouter } from 'next/navigation'
import { getTeamRegistrationRequest } from '@/lib/auth/team-actions'
import { 
  Users, 
  Building2, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  XCircle,
  ArrowLeft,
  Loader2,
  Copy
} from 'lucide-react'

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

interface TeamRegistrationConfirmationProps {
  request: {
    id: string
    teamName: string
    userGroup: string
    adminGroup: string
    contactName: string
    contactEmail: string
    status: 'pending' | 'approved' | 'rejected'
    requestedAt: Date
    reviewedAt?: Date
    reviewedBy?: string
    comments?: string
  }
}

export function TeamRegistrationConfirmation({ request }: TeamRegistrationConfirmationProps) {
  const { session } = useSession()
  const { session: clientSession } = useClientSession()
  const router = useRouter()
  const [currentRequest, setCurrentRequest] = useState(request)
  
  // Use client session for immediate access, fall back to provider session
  const effectiveSession = clientSession || session


  // Copy registration ID to clipboard
  const copyRegistrationId = () => {
    navigator.clipboard.writeText(request.id)
    toast.success('Registration ID copied to clipboard')
  }

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />,
          text: 'Pending Review',
          description: 'Your request is being reviewed by administrators.'
        }
      case 'approved':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Approved',
          description: 'Your team registration has been approved!'
        }
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-4 w-4" />,
          text: 'Rejected',
          description: 'Your team registration has been rejected.'
        }
      default:
        return {
          variant: 'outline' as const,
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Unknown',
          description: 'Unknown request status.'
        }
    }
  }

  const statusInfo = getStatusInfo(currentRequest.status)
  const formattedDate = new Date(currentRequest.requestedAt).toLocaleString()

  return (
    <motion.div
      className="min-h-screen bg-background py-12 px-4"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Team Registration</h1>
            </div>
          </div>
        </motion.div>

        {/* Status Card */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          className="mb-6"
        >
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Registration Status</CardTitle>
                <Badge variant={statusInfo.variant} className="gap-1">
                  {statusInfo.icon}
                  {statusInfo.text}
                </Badge>
              </div>
              <CardDescription>{statusInfo.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Registration ID */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                  <div>
                    <p className="text-sm font-medium">Registration ID</p>
                    <p className="text-xs text-muted-foreground">Reference for your request</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs px-2 py-1 bg-background rounded border">
                      {request.id.substring(0, 8)}...
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyRegistrationId}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Request Date */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                  <div>
                    <p className="text-sm font-medium">Submitted On</p>
                    <p className="text-xs text-muted-foreground">Date and time of submission</p>
                  </div>
                  <p className="text-sm">{formattedDate}</p>
                </div>

                {/* Reviewed Date (if available) */}
                {currentRequest.reviewedAt && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                    <div>
                      <p className="text-sm font-medium">Reviewed On</p>
                      <p className="text-xs text-muted-foreground">Date and time of review</p>
                    </div>
                    <p className="text-sm">
                      {new Date(currentRequest.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Comments (if available) */}
                {currentRequest.comments && (
                  <div className="p-3 bg-muted/30 rounded-md">
                    <p className="text-sm font-medium mb-2">Admin Comments</p>
                    <p className="text-sm text-muted-foreground">{currentRequest.comments}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Details Card */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Details
              </CardTitle>
              <CardDescription>
                Information about the team you requested to register
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Name</p>
                    <p className="font-medium">{currentRequest.teamName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User Group</p>
                    <p className="font-medium">{currentRequest.userGroup}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admin Group</p>
                    <p className="font-medium">{currentRequest.adminGroup}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
                    <p className="font-medium">{currentRequest.contactName}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{currentRequest.contactEmail}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Steps Card */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="bg-muted/30 border-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentRequest.status === 'pending' && (
                <>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">1</Badge>
                    <div>
                      <p className="font-medium">Wait for Review</p>
                      <p className="text-sm text-muted-foreground">
                        Administrators will review your request. This typically takes 1-2 business days.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">2</Badge>
                    <div>
                      <p className="font-medium">Check Status</p>
                      <p className="text-sm text-muted-foreground">
                        You can return to this page to check the status of your request.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">3</Badge>
                    <div>
                      <p className="font-medium">Receive Notification</p>
                      <p className="text-sm text-muted-foreground">
                        You'll be notified via email when a decision is made.
                      </p>
                    </div>
                  </div>
                </>
              )}
              
              {currentRequest.status === 'approved' && (
                <>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 bg-green-500/10 text-green-700 border-green-200">✓</Badge>
                    <div>
                      <p className="font-medium">Team Created</p>
                      <p className="text-sm text-muted-foreground">
                        Your team has been created and is ready to use. You can now switch to your team from the header.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 bg-green-500/10 text-green-700 border-green-200">✓</Badge>
                    <div>
                      <p className="font-medium">Add Team Members</p>
                      <p className="text-sm text-muted-foreground">
                        Team members can now join using their Active Directory credentials.
                      </p>
                    </div>
                  </div>
                </>
              )}
              
              {currentRequest.status === 'rejected' && (
                <>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 bg-red-500/10 text-red-700 border-red-200">✗</Badge>
                    <div>
                      <p className="font-medium">Request Rejected</p>
                      <p className="text-sm text-muted-foreground">
                        Your team registration request was rejected. Please review the admin comments above.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">1</Badge>
                    <div>
                      <p className="font-medium">Submit New Request</p>
                      <p className="text-sm text-muted-foreground">
                        You can submit a new team registration request with updated information.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}