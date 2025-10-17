'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Shield, Settings, BarChart3, ArrowRight, Star } from 'lucide-react'
import { useSession } from '@/components/session-provider'
import { useAuthBlueSSO } from '@/hooks/useAuthBlueSSO'
import { Beams } from '@/components/ethereal-beams'
import { Button } from '@/components/hero-button'
import { EnsembleLoading } from '@/components/ensemble-loading'
import { useTheme } from 'next-themes'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
}

const heroVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
}

const badgeVariants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
}

const headingVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
}

const subtitleVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
}

const buttonVariants = {
  hidden: {
    opacity: 0,
    y: 25,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  hover: {
    scale: 1.05,
  },
  tap: {
    scale: 0.98,
  }
}

const featureCardVariants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
  hover: {
    y: -10,
    scale: 1.02,
  }
}

const iconVariants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -180
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.2,
    rotate: 5,
  }
}

const featureCards = [
  {
    icon: Users,
    title: 'Team Management',
    description: 'Onboard teams through Active Directory groups and manage team membership.',
    color: 'text-blue-600',
  },
  {
    icon: Shield,
    title: 'Security & Access',
    description: 'Enterprise-grade authentication with SSO integration and role-based access.',
    color: 'text-green-600',
  },
  {
    icon: BarChart3,
    title: 'Metrics Dashboard',
    description: 'Track reliability metrics, KPIs, and team performance indicators.',
    color: 'text-purple-600',
  },
  {
    icon: Settings,
    title: 'Automation Tools',
    description: 'Streamline operations with notification automation and workflow tools.',
    color: 'text-orange-600',
  },
]

export default function Home() {
  const { session, teams, selectedTeamId, isLoading } = useSession()
  const { user, loading: ssoLoading } = useAuthBlueSSO()
  const { theme, systemTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const featureCardsRef = useRef(null)
  const isFeatureCardsInView = useInView(featureCardsRef, { once: true, amount: 0.2 })
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = mounted && (resolvedTheme === 'dark' || currentTheme === 'dark')
  
  // Consolidate loading states - show loading if either is loading or if we don't have both user and session
  const isAppLoading = !mounted || ssoLoading || (isLoading && !session)

  const themeColors = {
    background: isDark ? "bg-black" : "bg-white",
    badgeBg: isDark ? "bg-white/5" : "bg-black/5",
    badgeBorder: isDark ? "border-white/10" : "border-black/10",
    badgeText: isDark ? "text-white/90" : "text-black/90",
    iconColor: isDark ? "text-white" : "text-black",
    headingText: isDark ? "text-white" : "text-black",
    gradientFrom: isDark ? "from-white" : "from-black",
    gradientVia: isDark ? "via-gray-200" : "via-gray-800",
    gradientTo: isDark ? "to-gray-400" : "to-gray-600",
    subtitleText: isDark ? "text-white/80" : "text-black/80",
    gradientOverlay: isDark ? "from-black/50 via-transparent to-black/30" : "from-white/50 via-transparent to-white/30"
  }

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${mounted ? themeColors.background : 'bg-background'}`}>
      {/* Loading State */}
      <AnimatePresence mode="wait">
        {isAppLoading && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 z-0">
              <Beams
                beamWidth={2.5}
                beamHeight={18}
                beamNumber={15}
                lightColor="#ffffff"
                speed={2.5}
                noiseIntensity={2}
                scale={0.15}
                rotation={43}
              />
            </div>
            <div className="relative z-10">
              <EnsembleLoading size="lg" message="Authenticating your session..." />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beams Background */}
      <div className="absolute inset-0 z-0">
        <Beams
          beamWidth={2.5}
          beamHeight={18}
          beamNumber={15}
          lightColor="#ffffff"
          speed={2.5}
          noiseIntensity={2}
          scale={0.15}
          rotation={43}
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex min-h-screen items-center pt-16">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            {/* Badge */}
            <motion.div
              className={`mb-8 inline-flex items-center rounded-full ${themeColors.badgeBg} backdrop-blur-xl border ${themeColors.badgeBorder} px-4 py-2 text-sm ${themeColors.badgeText}`}
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <motion.div
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Star className={`mr-2 h-4 w-4 ${themeColors.iconColor}`} />
              </motion.div>
              Ensemble is now beta
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className={`mb-6 text-4xl font-bold tracking-tight ${themeColors.headingText} sm:text-7xl lg:text-8xl`}
              variants={headingVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                One Platform.
              </motion.span>{" "}
              <motion.span
                className={`bg-gradient-to-r ${themeColors.gradientFrom} ${themeColors.gradientVia} ${themeColors.gradientTo} bg-clip-text text-transparent`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Endless Efficiency.
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className={`mb-10 text-lg leading-8 ${themeColors.subtitleText} sm:text-xl lg:text-2xl max-w-3xl mx-auto`}
              variants={subtitleVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            >
              Ensemble brings together all the essential tools and automations your team needs — from notifications and scorecards to handovers and planning — all in one unified portal.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button size="md" className="font-semibold">
                  Know More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button variant="outline" size="md" className="font-semibold">
                  View Tools
                </Button>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Gradient Overlay for better text readability */}
      <div className={`absolute inset-0 z-0 bg-gradient-to-t ${themeColors.gradientOverlay}`} />

      {/* Content Section */}
      <div className="relative z-10 bg-background">
        <div className="container mx-auto px-6 lg:px-8 py-12">

          {/* Feature Cards */}
          <motion.div
            ref={featureCardsRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
            variants={containerVariants}
            initial="hidden"
            animate={isFeatureCardsInView ? "visible" : "hidden"}
          >
            {featureCards.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={featureCardVariants}
                whileHover="hover"
                custom={index}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-500 border-0 bg-background/50 backdrop-blur-sm group">
                  <CardHeader className="text-center">
                    <motion.div
                      className="mx-auto mb-4"
                      variants={iconVariants}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <feature.icon className={`h-12 w-12 ${feature.color} transition-colors duration-300 group-hover:scale-110`} />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                    >
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </motion.div>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    >
                      <CardDescription className="text-center">
                        {feature.description}
                      </CardDescription>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Team Information */}
          {session && teams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-background/50 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Teams
                  </CardTitle>
                  <CardDescription>
                    You have access to {teams.length} team{teams.length > 1 ? 's' : ''} in Ensemble.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                      <motion.div
                        key={team.id}
                        className={`p-4 rounded-lg border ${
                          team.id === selectedTeamId
                            ? 'bg-primary/10 border-primary/20'
                            : 'bg-muted/30 border-border/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{team.teamName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {team.isAdmin ? 'Administrator' : 'Member'}
                            </p>
                          </div>
                          {team.id === selectedTeamId && (
                            <div className="h-2 w-2 bg-primary rounded-full" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Getting Started */}
          {!isLoading && !session && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="max-w-2xl mx-auto bg-background/50 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>
                    Ensemble is authenticating your session through Single Sign-On.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Establishing secure connection...
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
