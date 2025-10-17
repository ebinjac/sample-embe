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
import { toast } from 'sonner'
import { 
  FileText, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Eye,
  Calendar,
  Mail,
  Building2,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { 
  approveTeamRegistration, 
  rejectTeamRegistration 
} from '@/lib/auth/admin-actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface Request {
  id: string
  teamName: string
  userGroup: string
  adminGroup: string
  contactName: string
  contactEmail: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  reviewedAt?: string
  reviewedBy?: string
  comments?: string
}

interface AdminRequestsTableProps {
  data: Request[]
  totalPages: number
  totalCount: number
  currentPage: number
  onPageChange: (page: number) => void
  onRefresh: () => void
  isLoading?: boolean
}

export function AdminRequestsTable({
  data,
  totalPages,
  totalCount,
  currentPage,
  onPageChange,
  onRefresh,
  isLoading = false
}: AdminRequestsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [comments, setComments] = useState('')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

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

  // Define columns
  const columns = useMemo<ColumnDef<Request>[]>(
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
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          const statusInfo = getStatusInfo(status)
          return (
            <Badge variant={statusInfo.variant} className="gap-1">
              {statusInfo.icon}
              {statusInfo.text}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'requestedAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 h-8 font-semibold"
          >
            Requested
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue('requestedAt'))
          return <div className="text-sm">{date.toLocaleString()}</div>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const request = row.original
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRequest(request)
                  setIsDetailsOpen(true)
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              
              {request.status === 'pending' && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request)
                      setIsApproveDialogOpen(true)
                    }}
                    disabled={isProcessing === request.id}
                  >
                    {isProcessing === request.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Approve
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request)
                      setIsRejectDialogOpen(true)
                    }}
                    disabled={isProcessing === request.id}
                  >
                    {isProcessing === request.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1" />
                    )}
                    Reject
                  </Button>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [isProcessing]
  )

  // Filter data based on status filter and global filter
  const filteredData = useMemo(() => {
    let filtered = data
    
    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }
    
    // Apply global filter
    if (globalFilter) {
      filtered = filtered.filter(request =>
        request.teamName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        request.contactName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        request.contactEmail.toLowerCase().includes(globalFilter.toLowerCase())
      )
    }
    
    return filtered
  }, [data, statusFilter, globalFilter])

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

  // Approve request
  const handleApprove = async () => {
    if (!selectedRequest) return
    
    setIsProcessing(selectedRequest.id)
    try {
      const result = await approveTeamRegistration(selectedRequest.id, comments)
      
      if (result.success) {
        toast.success('Request approved successfully')
        setIsApproveDialogOpen(false)
        setComments('')
        onRefresh()
      } else {
        toast.error(result.error || 'Failed to approve request')
      }
    } catch (error) {
      console.error('Failed to approve request:', error)
      toast.error('An error occurred while approving the request')
    } finally {
      setIsProcessing(null)
    }
  }

  // Reject request
  const handleReject = async () => {
    if (!selectedRequest) return
    
    setIsProcessing(selectedRequest.id)
    try {
      const result = await rejectTeamRegistration(selectedRequest.id, comments)
      
      if (result.success) {
        toast.success('Request rejected successfully')
        setIsRejectDialogOpen(false)
        setComments('')
        onRefresh()
      } else {
        toast.error(result.error || 'Failed to reject request')
      }
    } catch (error) {
      console.error('Failed to reject request:', error)
      toast.error('An error occurred while rejecting the request')
    } finally {
      setIsProcessing(null)
    }
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
                  placeholder="Search by team name, contact..."
                  className="pl-10"
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>
            {filteredData.length} of {totalCount} request{totalCount !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No requests found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter('')
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
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Full information about the team registration request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Team Name</Label>
                  <p className="font-medium">{selectedRequest.teamName}</p>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusInfo(selectedRequest.status).variant} className="gap-1">
                      {getStatusInfo(selectedRequest.status).icon}
                      {getStatusInfo(selectedRequest.status).text}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>User Group</Label>
                  <p className="font-medium">{selectedRequest.userGroup}</p>
                </div>
                
                <div>
                  <Label>Admin Group</Label>
                  <p className="font-medium">{selectedRequest.adminGroup}</p>
                </div>
                
                <div>
                  <Label>Contact Name</Label>
                  <p className="font-medium">{selectedRequest.contactName}</p>
                </div>
                
                <div>
                  <Label>Contact Email</Label>
                  <p className="font-medium">{selectedRequest.contactEmail}</p>
                </div>
                
                <div>
                  <Label>Requested At</Label>
                  <p className="font-medium">
                    {new Date(selectedRequest.requestedAt).toLocaleString()}
                  </p>
                </div>
                
                {selectedRequest.reviewedAt && (
                  <div>
                    <Label>Reviewed At</Label>
                    <p className="font-medium">
                      {new Date(selectedRequest.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedRequest.comments && (
                <div>
                  <Label>Comments</Label>
                  <p className="font-medium">{selectedRequest.comments}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this team registration request? This will create a new team with the provided details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="approve-comments">Comments (Optional)</Label>
            <Textarea
              id="approve-comments"
              placeholder="Add any comments for the user..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setComments('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isProcessing === selectedRequest?.id}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isProcessing === selectedRequest?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Approve'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this team registration request? The user will need to submit a new request if they want to register this team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="reject-comments">Comments (Optional)</Label>
            <Textarea
              id="reject-comments"
              placeholder="Add any comments for the user..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setComments('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isProcessing === selectedRequest?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing === selectedRequest?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Reject'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}