'use client'

import { forwardRef, useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "sm", className = "", children, ...props }, ref) => {
    const [mounted, setMounted] = useState(false)
    const { theme, systemTheme, resolvedTheme } = useTheme()
    
    useEffect(() => {
      setMounted(true)
    }, [])

    const currentTheme = theme === 'system' ? systemTheme : theme
    const isDark = mounted && (resolvedTheme === 'dark' || currentTheme === 'dark')

    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"

    const variants = {
      default: isDark 
        ? "bg-white text-black hover:bg-gray-100 shadow-2xl shadow-white/25" 
        : "bg-black text-white hover:bg-gray-800 shadow-2xl shadow-black/25",
      outline: isDark
        ? "border border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/30"
        : "border border-black/20 bg-black/5 backdrop-blur-xl text-black hover:bg-black/10 hover:border-black/30",
      ghost: isDark
        ? "text-white/90 hover:text-white hover:bg-white/10"
        : "text-black/90 hover:text-black hover:bg-black/10",
    }

    const sizes = {
      sm: "h-9 px-4 py-2 text-sm",
      md: "h-10 px-6 py-2 text-base",
      lg: "px-8 py-6 text-lg",
    }

    const ringColor = isDark ? "focus-visible:ring-white/20" : "focus-visible:ring-black/20"
    const shimmerColor = isDark ? "from-transparent via-white/20 to-transparent" : "from-transparent via-black/20 to-transparent"

    return (
      <button
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-full",
          baseClasses,
          ringColor,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center">{children}</span>
        <div className={cn(
          "absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out",
          shimmerColor
        )} />
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }