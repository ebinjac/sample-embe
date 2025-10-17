'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  Settings, 
  Package, 
  Plus, 
  Users, 
  Building2, 
  Crown, 
  Search,
  Loader2,
  ChevronRight,
  Eye,
  Edit
} from 'lucide-react'
import { useSession } from '@/components/session-provider'
import { useRouter } from 'next/navigation'
import { getTeamApplications, getApplicationsForMultipleTeams } from '@/lib/auth/team-actions'
import Link from 'next/link'

interface Team {
  id: string
  teamName: string
  userGroup: string
  adminGroup: string
  isAdmin: boolean
  isActive: boolean
  contactName: string
  contactEmail: string
}

interface Application {
  id: string
  assetId: number
  applicationName: string
  tla: string
  lifeCycleStatus?: string | null
  tier?: string | null
}

interface TeamWithApplications extends Team {
  applications: Application[]
  applicationCount: number
}

export function TeamManagement() {
  const { session } = useSession()
  const router = useRouter()
  
  const [teamsWithApplications, setTeamsWithApplications] = useState<TeamWithApplications[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  
  // Get teams from session
  const teams = session?.teams || []
  
  // Fetch applications for all teams
  useEffect(() => {
    const fetchApplicationsForAllTeams = async () => {
      if (!teams || teams.length === 0) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        // Get all team IDs
        const teamIds = teams.map((team: Team) => team.id)
        
        // Fetch applications for all teams in a single query
        const applicationsByTeam = await getApplicationsForMultipleTeams(teamIds)
        
        // Combine team data with applications
        const teamsWithApps = teams.map((team: Team) => {
          const applications = applicationsByTeam[team.id] || []
          return {
            ...team,
            applications,
            applicationCount: applications.length
          }
        })
        
        setTeamsWithApplications(teamsWithApps)
      } catch (error) {
        console.error('Failed to fetch team applications:', error)
        toast.error('Failed to load team data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchApplicationsForAllTeams()
  }, [teams])
  
  // Filter teams based on search term
  const filteredTeams = teamsWithApplications.filter(team =>
    team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Toggle team expansion
  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }
  
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return (
    <motion.div
      className="container mx-auto px-4 py-8 max-w-6xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all your teams and applications
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Teams List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No teams found' : 'No teams yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Register a team to get started'
              }
            </p>
            {!searchTerm && (
              <Link href="/team/register">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Register a Team
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {team.isAdmin ? (
                        <Crown className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Users className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{team.teamName}</CardTitle>
                        <Badge variant={team.isActive ? 'default' : 'secondary'}>
                          {team.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {team.isAdmin && (
                          <Badge variant="outline" className="text-amber-500 border-amber-500">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span>Team: {team.userGroup}</span>
                        <span>Contact: {team.contactName}</span>
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link href={`/team/${team.id}/settings`}>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Settings
                      </Button>
                    </Link>
                    
                    {team.applicationCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTeamExpansion(team.id)}
                        className="text-muted-foreground"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        {team.applicationCount} Apps
                        <motion.div
                          animate={{ rotate: expandedTeams.has(team.id) ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {/* Applications List (Expandable) */}
              {team.applicationCount > 0 && expandedTeams.has(team.id) && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Applications
                    </h4>
                    
                    <div className="space-y-2">
                      {team.applications.map((application) => (
                        <div
                          key={application.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{application.tla}</Badge>
                            <div>
                              <div className="font-medium text-sm">{application.applicationName}</div>
                              <div className="text-xs text-muted-foreground">
                                Asset ID: {application.assetId}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {application.lifeCycleStatus && (
                              <Badge variant="secondary" className="text-xs">
                                {application.lifeCycleStatus}
                              </Badge>
                            )}
                            {application.tier && (
                              <Badge variant="outline" className="text-xs">
                                {application.tier}
                              </Badge>
                            )}
                            <Link href={`/team/${team.id}/settings?tab=applications`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t flex justify-center">
                      <Link href={`/team/${team.id}/settings?tab=applications`}>
                        <Button variant="outline" size="sm">
                          Manage Applications
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Floating Action Button */}
      <Link href="/team/register" className="fixed bottom-6 right-6">
        <Button size="lg" className="rounded-full shadow-lg">
          <Plus className="h-5 w-5 mr-2" />
          Register Team
        </Button>
      </Link>
    </motion.div>
  )
}