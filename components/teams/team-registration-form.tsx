'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useSession } from '@/components/session-provider'
import { useClientSession } from '@/hooks/use-client-session'
import { useRouter } from 'next/navigation'
import { submitTeamRegistration, checkTeamNameAvailability, type TeamRegistrationInput } from '@/lib/auth/team-actions'
import { Users, Building2, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Form validation schema
const formSchema = z.object({
  teamName: z.string()
    .min(3, 'Team name must be at least 3 characters long')
    .max(100, 'Team name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Team name can only contain letters, numbers, spaces, hyphens, and underscores'),
  userGroup: z.string()
    .min(3, 'User group must be at least 3 characters long')
    .max(100, 'User group must be less than 100 characters')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'User group must start with a letter and contain only uppercase letters, numbers, and underscores'),
  adminGroup: z.string()
    .min(3, 'Admin group must be at least 3 characters long')
    .max(100, 'Admin group must be less than 100 characters')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Admin group must start with a letter and contain only uppercase letters, numbers, and underscores'),
  contactName: z.string()
    .min(3, 'Contact name must be at least 3 characters long')
    .max(100, 'Contact name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Contact name can only contain letters and spaces'),
  contactEmail: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
})

type FormData = z.infer<typeof formSchema>

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3 }
}

const formVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const formItemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
}

export function TeamRegistrationForm() {
  const { session, isLoading } = useSession()
  const { session: clientSession, isLoading: isClientLoading } = useClientSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamNameCheck, setTeamNameCheck] = useState<{ checking: boolean; available?: boolean; message?: string }>({
    checking: false
  })
  
  // Use client session for immediate access, fall back to provider session
  const effectiveSession = clientSession || session
  const effectiveLoading = isClientLoading ? false : isLoading

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange'
  })

  const teamName = watch('teamName')

  // Check team name availability
  useEffect(() => {
    if (teamName && teamName.length >= 3) {
      const timeoutId = setTimeout(async () => {
        setTeamNameCheck({ checking: true })
        try {
          const result = await checkTeamNameAvailability(teamName)
          setTeamNameCheck({ checking: false, available: result.available, message: result.message })
        } catch (error) {
          setTeamNameCheck({ checking: false, available: false, message: 'Failed to check availability' })
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    } else {
      setTeamNameCheck({ checking: false })
    }
  }, [teamName])

  // Redirect if not authenticated - but only after client session has had a chance to initialize
  useEffect(() => {
    // Wait for both client session and provider session to finish loading
    if (!isClientLoading && !isLoading) {
      if (!effectiveSession) {
        router.push('/')
      }
    }
  }, [effectiveSession, isClientLoading, isLoading, router])

  const onSubmit = async (data: FormData) => {
    if (!effectiveSession) return

    setIsSubmitting(true)
    try {
      const result = await submitTeamRegistration(data as TeamRegistrationInput)

      if (result.success) {
        toast.success('Team registration request submitted successfully!')
        reset()
        // Redirect to the confirmation page with the request ID
        router.push(`/team/register/${result.data?.requestId}`)
      } else {
        toast.error(result.error || 'Failed to submit team registration request')
      }
    } catch (error) {
      console.error('Team registration error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading only if both hooks are still loading
  if (isClientLoading || isLoading || !effectiveSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-background py-12 px-4 mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-foreground">Register New Team</h1>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Request a new team for your organization. Once submitted, your request will be reviewed by administrators.
          </p>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Information
              </CardTitle>
              <CardDescription>
                Please provide the required information for your team registration request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <motion.div
                  variants={formVariants}
                  initial="initial"
                  animate="animate"
                  className='space-y-4'
                >
                  {/* Team Name */}
                  <motion.div variants={formItemVariants} className="space-y-2">
                    <Label htmlFor="teamName">Team Name *</Label>
                    <Input
                      id="teamName"
                      placeholder="e.g., Engineering Team"
                      {...register('teamName', {
                        onChange: () => trigger('teamName')
                      })}
                      className={`${
                        teamNameCheck.available === false ? 'border-destructive' : 
                        teamNameCheck.available === true ? 'border-green-500' : ''
                      }`}
                    />
                    {errors.teamName && (
                      <p className="text-sm text-destructive">{errors.teamName.message}</p>
                    )}
                    {teamName && (
                      <div className="flex items-center gap-2 text-sm">
                        {teamNameCheck.checking ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-muted-foreground">Checking availability...</span>
                          </>
                        ) : teamNameCheck.available === true ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-500">Team name is available</span>
                          </>
                        ) : teamNameCheck.available === false ? (
                          <>
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-destructive">{teamNameCheck.message}</span>
                          </>
                        ) : null}
                      </div>
                    )}
                  </motion.div>

                  {/* User Group */}
                  <motion.div variants={formItemVariants} className="space-y-2">
                    <Label htmlFor="userGroup">User Group *</Label>
                    <Input
                      id="userGroup"
                      placeholder="e.g., ENSEMBLE_USERS"
                      {...register('userGroup')}
                    />
                    {errors.userGroup && (
                      <p className="text-sm text-destructive">{errors.userGroup.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Active Directory group for team members (uppercase letters, numbers, and underscores only)
                    </p>
                  </motion.div>

                  {/* Admin Group */}
                  <motion.div variants={formItemVariants} className="space-y-2">
                    <Label htmlFor="adminGroup">Admin Group *</Label>
                    <Input
                      id="adminGroup"
                      placeholder="e.g., ENSEMBLE_ADMINS"
                      {...register('adminGroup')}
                    />
                    {errors.adminGroup && (
                      <p className="text-sm text-destructive">{errors.adminGroup.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Active Directory group for team administrators (uppercase letters, numbers, and underscores only)
                    </p>
                  </motion.div>

                  {/* Contact Name */}
                  <motion.div variants={formItemVariants} className="space-y-2">
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input
                      id="contactName"
                      placeholder="e.g., John Doe"
                      {...register('contactName')}
                    />
                    {errors.contactName && (
                      <p className="text-sm text-destructive">{errors.contactName.message}</p>
                    )}
                  </motion.div>

                  {/* Contact Email */}
                  <motion.div variants={formItemVariants} className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="e.g., john.doe@company.com"
                        className="pl-10"
                        {...register('contactEmail')}
                      />
                    </div>
                    {errors.contactEmail && (
                      <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
                    )}
                  </motion.div>
                </motion.div>

                {/* Form Actions */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-3 pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    type="submit"
                    disabled={!isValid || isSubmitting || teamNameCheck.available === false}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Registration Request'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reset()}
                    disabled={isSubmitting}
                  >
                    Reset Form
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Information Card */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-muted/30 border-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Registration Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <div>
                  <p className="font-medium">Submit Request</p>
                  <p className="text-sm text-muted-foreground">Fill out the form with your team details</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <div>
                  <p className="font-medium">Review Process</p>
                  <p className="text-sm text-muted-foreground">Administrators will review your request</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <div>
                  <p className="font-medium">Approval</p>
                  <p className="text-sm text-muted-foreground">You'll be notified once a decision is made</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}