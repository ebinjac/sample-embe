'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Eye,
  Activity,
  Calendar,
  User
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getRecentActivity, getRegistrationTrends } from '@/lib/auth/admin-actions'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface DashboardStats {
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  totalTeams: number
  activeTeams: number
}

interface AdminDashboardProps {
  stats: DashboardStats
}

interface ActivityItem {
  id: string
  type: 'request' | 'decision' | 'team_update'
  action: string
  entityType: 'team_registration' | 'team'
  entityName: string
  timestamp: Date
  user: string
  details: any
}

interface TrendData {
  date: string
  pending: number
  approved: number
  rejected: number
}

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

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(true)
  const [isLoadingTrends, setIsLoadingTrends] = useState(true)

  const totalRequests = stats.pendingRequests + stats.approvedRequests + stats.rejectedRequests
  const approvalRate = totalRequests > 0 ? Math.round((stats.approvedRequests / totalRequests) * 100) : 0

  // Fetch recent activity
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await getRecentActivity(10)
        setRecentActivity(data)
      } catch (error) {
        console.error('Failed to fetch recent activity:', error)
      } finally {
        setIsLoadingActivity(false)
      }
    }

    fetchActivity()
  }, [])

  // Fetch trends
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await getRegistrationTrends()
        setTrends(data)
      } catch (error) {
        console.error('Failed to fetch trends:', error)
      } finally {
        setIsLoadingTrends(false)
      }
    }

    fetchTrends()
  }, [])

  // Format timestamp for display
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  // Get activity icon and color
  const getActivityInfo = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'request':
        return {
          icon: <FileText className="h-4 w-4" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        }
      case 'decision':
        return {
          icon: activity.action === 'approved' ?
            <CheckCircle className="h-4 w-4" /> :
            <XCircle className="h-4 w-4" />,
          color: activity.action === 'approved' ? 'text-green-600' : 'text-red-600',
          bgColor: activity.action === 'approved' ?
            'bg-green-100 dark:bg-green-900/20' :
            'bg-red-100 dark:bg-red-900/20'
        }
      case 'team_update':
        return {
          icon: activity.action === 'activated' ?
            <CheckCircle className="h-4 w-4" /> :
            <XCircle className="h-4 w-4" />,
          color: activity.action === 'activated' ? 'text-green-600' : 'text-orange-600',
          bgColor: activity.action === 'activated' ?
            'bg-green-100 dark:bg-green-900/20' :
            'bg-orange-100 dark:bg-orange-900/20'
        }
      default:
        return {
          icon: <Activity className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20'
        }
    }
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of team registrations and system statistics
        </p>
      </div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Pending Requests */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Waiting for review
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Approved Requests */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.approvedRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully approved
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rejected Requests */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected Requests</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.rejectedRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Not approved
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Teams */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalTeams}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeTeams} active
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Trends Chart */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          className="lg:col-span-2"
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Registration Trends (Last 30 Days)
              </CardTitle>
              <CardDescription>
                Daily registration request statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTrends ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-64">
                  <ChartContainer
                    config={{
                      pending: {
                        label: "Pending",
                        color: "hsl(45, 100%, 50%)",
                      },
                      approved: {
                        label: "Approved",
                        color: "hsl(142, 76%, 36%)",
                      },
                      rejected: {
                        label: "Rejected",
                        color: "hsl(0, 84%, 60%)",
                      },
                    }}
                    className="h-full w-full"
                  >
                    <AreaChart data={trends} margin={{ left: 12, right: 12 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }}
                      />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <defs>
                        <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(45, 100%, 50%)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(45, 100%, 50%)" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="fillApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="fillRejected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <Area
                        dataKey="pending"
                        type="natural"
                        fill="url(#fillPending)"
                        fillOpacity={0.4}
                        stroke="hsl(45, 100%, 50%)"
                        stackId="a"
                      />
                      <Area
                        dataKey="approved"
                        type="natural"
                        fill="url(#fillApproved)"
                        fillOpacity={0.4}
                        stroke="hsl(142, 76%, 36%)"
                        stackId="a"
                      />
                      <Area
                        dataKey="rejected"
                        type="natural"
                        fill="url(#fillRejected)"
                        fillOpacity={0.4}
                        stroke="hsl(0, 84%, 60%)"
                        stackId="a"
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-start gap-2 text-sm">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 leading-none font-medium">
                    Total requests in the last 30 days: {trends.reduce((sum, day) => sum + day.pending + day.approved + day.rejected, 0)}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 leading-none">
                    Daily registration trends
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Approval Rate */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Approval Rate
              </CardTitle>
              <CardDescription>
                Percentage of approved requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{approvalRate}%</div>
                <Badge variant={approvalRate >= 70 ? 'default' : approvalRate >= 50 ? 'secondary' : 'destructive'}>
                  {approvalRate >= 70 ? 'Good' : approvalRate >= 50 ? 'Average' : 'Low'}
                </Badge>
              </div>
              <div className="mt-4 w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${approvalRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.pendingRequests > 0 && (
              <Link href="/admin/requests?status=pending">
                <Button className="w-full justify-start" variant="default">
                  <FileText className="h-4 w-4 mr-2" />
                  Review Pending Requests ({stats.pendingRequests})
                </Button>
              </Link>
            )}
            
            <Link href="/admin/requests">
              <Button className="w-full justify-start" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View All Requests
              </Button>
            </Link>
            
            <Link href="/admin/teams">
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Teams
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest team registration requests and approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const activityInfo = getActivityInfo(activity)
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className={`p-2 rounded-full ${activityInfo.bgColor}`}>
                        <div className={activityInfo.color}>
                          {activityInfo.icon}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {activity.action === 'submitted' && 'New '}
                          {activity.action === 'approved' && 'Approved '}
                          {activity.action === 'rejected' && 'Rejected '}
                          {activity.action === 'activated' && 'Activated '}
                          {activity.action === 'deactivated' && 'Deactivated '}
                          {activity.entityType === 'team_registration' ? 'registration request' : 'team'}: {activity.entityName}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatTimestamp(activity.timestamp)}</span>
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
    </motion.div>
  )
}