'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Users, 
  Building2, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Eye,
  Calendar,
  Power,
  PowerOff,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { getTeams, toggleTeamStatus } from '@/lib/auth/admin-actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface Team {
  id: string
  teamName: string
  userGroup: string
  adminGroup: string
  contactName: string
  contactEmail: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

interface AdminTeamsTableProps {
  data: Team[]
  totalPages: number
  totalCount: number
  currentPage: number
  onPageChange: (page: number) => void
  onRefresh: () => void
  isLoading?: boolean
}

export function AdminTeamsTable({
  data,
  totalPages,
  totalCount,
  currentPage,
  onPageChange,
  onRefresh,
  isLoading = false
}: AdminTeamsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('')
  
  // Dialog states
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  // Define columns
  const columns = useMemo<ColumnDef<Team>[]>(
    () => [
      {
        accessorKey: 'teamName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 h-8 font-semibold"
          >
            Team Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue('teamName')}</div>,
      },
      {
        accessorKey: 'userGroup',
        header: 'User Group',
        cell: ({ row }) => <div className="text-sm">{row.getValue('userGroup')}</div>,
      },
      {
        accessorKey: 'adminGroup',
        header: 'Admin Group',
        cell: ({ row }) => <div className="text-sm">{row.getValue('adminGroup')}</div>,
      },
      {
        accessorKey: 'contactName',
        header: 'Contact',
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.getValue('contactName')}</div>
            <div className="text-muted-foreground">{row.original.contactEmail}</div>
          </div>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.getValue('isActive') as boolean
          return (
            <Badge variant={isActive ? 'default' : 'secondary'} className="gap-1">
              {isActive ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Inactive
                </>
              )}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 h-8 font-semibold"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt'))
          return <div className="text-sm">{date.toLocaleString()}</div>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const team = row.original
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTeam(team)
                  setIsDetailsOpen(true)
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              
              <Button
                variant={team.isActive ? "destructive" : "default"}
                size="sm"
                onClick={() => {
                  setSelectedTeam(team)
                  setIsToggleDialogOpen(true)
                }}
                disabled={isProcessing === team.id}
              >
                {isProcessing === team.id ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : team.isActive ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-1" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-1" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          )
        },
      },
    ],
    [isProcessing]
  )

  // Filter data based on active status filter and global filter
  const filteredData = useMemo(() => {
    let filtered = data
    
    // Apply active status filter
    if (isActiveFilter && isActiveFilter !== 'all') {
      filtered = filtered.filter(team => 
        (isActiveFilter === 'true' && team.isActive) || 
        (isActiveFilter === 'false' && !team.isActive)
      )
    }
    
    // Apply global filter
    if (globalFilter) {
      filtered = filtered.filter(team =>
        team.teamName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        team.contactName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        team.contactEmail.toLowerCase().includes(globalFilter.toLowerCase())
      )
    }
    
    return filtered
  }, [data, isActiveFilter, globalFilter])

  // Create table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  })

  // Toggle team status
  const handleToggleStatus = async () => {
    if (!selectedTeam) return
    
    setIsProcessing(selectedTeam.id)
    try {
      const newStatus = !selectedTeam.isActive
      const result = await toggleTeamStatus(selectedTeam.id, newStatus)
      
      if (result.success) {
        toast.success(`Team ${newStatus ? 'activated' : 'deactivated'} successfully`)
        setIsToggleDialogOpen(false)
        onRefresh()
      } else {
        toast.error(result.error || `Failed to ${newStatus ? 'activate' : 'deactivate'} team`)
      }
    } catch (error) {
      console.error('Failed to toggle team status:', error)
      toast.error(`An error occurred while ${selectedTeam.isActive ? 'deactivating' : 'activating'} the team`)
    } finally {
      setIsProcessing(null)
    }
  }

  // Open toggle dialog
  const openToggleDialog = (team: Team) => {
    setSelectedTeam(team)
    setIsToggleDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by team name..."
                  className="pl-10"
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            {filteredData.length} of {totalCount} team{totalCount !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No teams found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsActiveFilter('')
                  setGlobalFilter('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground">
                  Showing {filteredData.length} of {totalCount} results
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Page</p>
                    <p className="text-sm font-medium">
                      {currentPage} of {totalPages}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Team Details</DialogTitle>
            <DialogDescription>
              Full information about the team
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeam && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Team Name</label>
                  <p className="font-medium">{selectedTeam.teamName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={selectedTeam.isActive ? 'default' : 'secondary'} className="gap-1">
                      {selectedTeam.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Group</label>
                  <p className="font-medium">{selectedTeam.userGroup}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Admin Group</label>
                  <p className="font-medium">{selectedTeam.adminGroup}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
                  <p className="font-medium">{selectedTeam.contactName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                  <p className="font-medium">{selectedTeam.contactEmail}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="font-medium">
                    {new Date(selectedTeam.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="font-medium">
                    {new Date(selectedTeam.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant={selectedTeam?.isActive ? "destructive" : "default"}
              onClick={() => {
                setIsDetailsOpen(false)
                openToggleDialog(selectedTeam!)
              }}
              disabled={!selectedTeam}
            >
              {selectedTeam?.isActive ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Deactivate Team
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Activate Team
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Dialog */}
      <AlertDialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedTeam?.isActive ? 'Deactivate Team' : 'Activate Team'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedTeam?.isActive ? 'deactivate' : 'activate'} the team "{selectedTeam?.teamName}"?
              {selectedTeam?.isActive 
                ? ' Team members will no longer be able to access this team.' 
                : ' Team members will be able to access this team again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsToggleDialogOpen(false)}
              disabled={isProcessing === selectedTeam?.id}
            >
              Cancel
            </Button>
            <Button
              variant={selectedTeam?.isActive ? "destructive" : "default"}
              onClick={handleToggleStatus}
              disabled={isProcessing === selectedTeam?.id}
            >
              {isProcessing === selectedTeam?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedTeam?.isActive ? (
                'Deactivate'
              ) : (
                'Activate'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}