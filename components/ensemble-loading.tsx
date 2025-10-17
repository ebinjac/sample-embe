'use client'

import { motion } from 'framer-motion'
import EnsembleLogo from './ensemble-logo'

interface EnsembleLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export function EnsembleLoading({ size = 'md', message = 'Authenticating...' }: EnsembleLoadingProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn" as const
      }
    }
  }

  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
        delay: 0.1
      }
    }
  }

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  }

  const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.3
      }
    }
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center space-y-8"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="relative">
        {/* Animated background glow */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-primary/20 blur-xl`}
          variants={pulseVariants}
          animate="animate"
          style={{
            width: size === 'sm' ? '4rem' : size === 'md' ? '6rem' : '8rem',
            height: size === 'sm' ? '4rem' : size === 'md' ? '6rem' : '8rem'
          }}
        />
        
        {/* Logo */}
        <motion.div
          className={`${sizeClasses[size]} relative`}
          variants={logoVariants}
          initial="initial"
          animate="animate"
        >
          <EnsembleLogo className="w-full h-full" />
        </motion.div>
      </div>

      {/* Loading message */}
      <motion.div
        className="flex flex-col items-center space-y-3"
        variants={textVariants}
        initial="initial"
        animate="animate"
      >
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse delay-75" />
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse delay-150" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          {message}
        </p>
      </motion.div>
    </motion.div>
  )
}

export default EnsembleLoading