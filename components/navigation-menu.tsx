'use client'

import { motion, Variants } from 'framer-motion'
import Link from 'next/link'
import {
  Mail,
  BarChart2,
  Repeat,
  Server,
  LinkIcon,
  BookOpen,
  Layout,
  Users2,
  FileText,
  Phone,
  Plus
} from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'
import { useSession } from './session-provider'

// Tools data - updated with team-specific paths
const getTools = (selectedTeamId: string | null) => [
  {
    title: "BlueMailer",
    href: selectedTeamId ? `/tools/teams/${selectedTeamId}/bluemailer` : "/tools/bluemailer",
    description: "An email template editor and notification sender.",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    title: "Scorecard",
    href: selectedTeamId ? `/tools/teams/${selectedTeamId}/scorecard` : "/tools/scorecard",
    description: "Tracks the volume and availability of applications.",
    icon: <BarChart2 className="h-4 w-4" />,
  },
  {
    title: "LinkManager",
    href: selectedTeamId ? `/tools/teams/${selectedTeamId}/linkio` : "/tools/linkmanager",
    description: "Manages important links for your team.",
    icon: <LinkIcon className="h-4 w-4" />,
  },
  {
    title: "To-Hub",
    href: "/tools/to-hub",
    description: "Helps with shift transition.",
    icon: <Repeat className="h-4 w-4" />,
  },
  {
    title: "EnvMatrix",
    href: "/tools/envmatrix",
    description: "Keep details about your applications such as firewall, IP, and related details.",
    icon: <Server className="h-4 w-4" />,
  },
]

// Resources data
const resources: { title: string; href: string; description: string; icon: React.ReactNode }[] = [
  {
    title: "Documentation",
    href: "/docs",
    description: "Comprehensive guides and API references for Ensemble features.",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Templates",
    href: "/resources/templates",
    description: "Pre-built workflow templates and automation recipes.",
    icon: <Layout className="h-4 w-4" />,
  },
  {
    title: "Community",
    href: "/community",
    description: "Join discussions, share workflows, and connect with other users.",
    icon: <Users2 className="h-4 w-4" />,
  },
]

const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: [0.55, 0.055, 0.675, 0.19],
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export function MainMenu({ scrolled = false }: { scrolled?: boolean }) {
  const { selectedTeamId } = useSession()
  const tools = getTools(selectedTeamId)
  
  const getMenuClasses = () => {
    return scrolled
      ? "text-foreground hover:text-foreground/90"
      : " hover:/90"
  }

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-2">
        <NavigationMenuItem>
          <NavigationMenuTrigger className={`bg-transparent hover:bg-transparent ${getMenuClasses()} transition-colors duration-200`}>Tools</NavigationMenuTrigger>
          <NavigationMenuContent>
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]"
            >
              {tools.map((tool, index) => (
                <NavigationMenuLink key={tool.href} asChild>
                  <motion.a
                    custom={index}
                    variants={itemVariants}
                    href={tool.href}
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium leading-none">
                      {tool.icon}
                      {tool.title}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {tool.description}
                    </p>
                  </motion.a>
                </NavigationMenuLink>
              ))}
            </motion.div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className={`bg-transparent hover:bg-transparent ${getMenuClasses()} transition-colors duration-200`}>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid w-[400px] gap-3 p-4 md:w-[500px] lg:w-[600px]"
            >
              <div className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md cursor-pointer"
                    href="/docs"
                  >
                    <BookOpen className="h-6 w-6" />
                    <div className="mb-2 mt-4 text-lg font-medium">
                      Documentation
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Comprehensive guides and API references for all Ensemble features.
                    </p>
                  </a>
                </NavigationMenuLink>
              </div>
              <div className="grid gap-1">
                {resources.map((resource, index) => (
                  <NavigationMenuLink key={resource.href} asChild>
                    <motion.a
                      custom={index}
                      variants={itemVariants}
                      href={resource.href}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium leading-none">
                        {resource.icon}
                        {resource.title}
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {resource.description}
                      </p>
                    </motion.a>
                  </NavigationMenuLink>
                ))}
              </div>
            </motion.div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className={`bg-transparent hover:bg-transparent ${getMenuClasses()} transition-colors duration-200`}>Teams</NavigationMenuTrigger>
          <NavigationMenuContent>
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-[400px] p-4"
            >
              <NavigationMenuLink asChild>
                <Link
                  href="/team/register"
                  className="flex select-none items-center gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                >
                  <Plus className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium leading-none">Register New Team</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Request a new team for your organization
                    </p>
                  </div>
                </Link>
              </NavigationMenuLink>
            </motion.div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
            <NavigationMenuLink href='/docs' className={`bg-transparent hover:bg-transparent ${getMenuClasses()} transition-colors duration-200`}>
              <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                <FileText className="h-4 w-4" />
                Docs
              </motion.div>
            </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
            <NavigationMenuLink href='/contact' className={`bg-transparent hover:bg-transparent ${getMenuClasses()} transition-colors duration-200`}>
              <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                <Phone className="h-4 w-4" />
                Contact
              </motion.div>
            </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}