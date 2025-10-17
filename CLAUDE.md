# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible. Simple solutions are easier to understand, maintain, and debug.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. Implement features only when they are needed, not when you anticipate they might be useful in the future.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server

### Database Operations
- `npm run db:generate` - Generate Drizzle migration files from schema
- `npm run db:push` - Push schema changes directly to database
- Database migrations are output to `./drizzle` directory

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.5.5 with App Router and React 19
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS v4 with shadcn/ui components (New York style)
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI primitives via shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **State Management**: Built-in React hooks and context

### Project Structure
- `app/` - Next.js App Router pages and layouts
- `components/ui/` - shadcn/ui reusable components
- `components/` - Custom application components
- `lib/` - Utility functions and configurations
- `hooks/` - Custom React hooks
- `db/schema/` - Drizzle database schema definitions
- `db/index.ts` - Database client export
- `drizzle.config.ts` - Drizzle ORM configuration

### Database Setup
- Uses Drizzle ORM with PostgreSQL
- Schema files located in `db/schema/` directory
- Database connection via `DATABASE_URL` environment variable
- Migration files generated in `./drizzle` directory
- Database client exported from `db/index.ts`

### UI Component System
- shadcn/ui components configured with path aliases:
  - `@/components` for components
  - `@/lib/utils` for utilities
  - `@/components/ui` for UI components
- Tailwind CSS configured with CSS variables for theming
- Dark/light theme support via CSS custom properties
- Components use class-variance-authority for variant management

### Path Aliases
- `@/*` maps to project root
- `@/components` → `./components`
- `@/lib` → `./lib`
- `@/hooks` → `./hooks`
- `@/components/ui` → `./components/ui`

### Environment Configuration
- Uses `.env` files for configuration
- `dotenv/config` imported in database and drizzle config files
- Required: `DATABASE_URL` for PostgreSQL connection

### Key Dependencies
- **Database**: `drizzle-orm`, `pg`, `drizzle-kit`
- **UI**: `@radix-ui/*` components, `lucide-react` icons
- **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **Styling**: `tailwindcss`, `clsx`, `tailwind-merge`
- **Charts**: `recharts` for data visualization
- **Theme**: `next-themes` for dark/light mode

### Development Notes
- Project uses Turbopack for faster development builds
- TypeScript configured with strict mode and ES2017 target
- PostCSS configured with Tailwind CSS v4 plugin
- Geist font family configured globally via next/font

# Next.js Development Rules

## Project Structure & Conventions

- Use the App Router structure with `page.tsx` files in route directories
- Client components must be explicitly marked with `'use client'` at the top of the file
- Use kebab-case for directory names (e.g., `components/auth-form`, `app/user-profile`)
- Use PascalCase for component files (e.g., `AuthForm.tsx`, `UserProfile.tsx`)
- Prefer named exports over default exports: `export function Button() { /* ... */ }`

## Component Architecture

### Server vs Client Components

- **Minimize `'use client'` directives** - keep most components as React Server Components (RSC)
- Only use client components when you need:
  - Browser APIs (localStorage, window, etc.)
  - Event handlers (onClick, onChange, etc.)
  - State hooks (useState, useReducer)
  - Effect hooks (useEffect, useLayoutEffect)
  - Custom hooks that use client-only features
- **Create small client component wrappers** around interactive elements instead of making entire pages client-side
- Wrap client components in `<Suspense>` with meaningful fallback UI

### State Management Strategy

- **Avoid unnecessary `useState` and `useEffect`** when possible
- Use React Server Components for data fetching
- Use React Server Actions for form handling and mutations
- Use URL search params for shareable/bookmarkable state
- Use `nuqs` for URL search param state management with type safety
- Use React Query (`@tanstack/react-query`) **only** for client-side data fetching when absolutely necessary (polling, real-time updates, optimistic updates)

## UI & Styling

### shadcn/ui

- Use **shadcn/ui** components as the primary UI component library
- Install components using: `npx shadcn@latest add <component-name>`
- Customize components in `components/ui/` directory as needed
- Follow shadcn/ui patterns for composition and prop interfaces

### Theming & Colors

- Implement **dark and light mode** support using `next-themes`
- Use CSS variables defined in `app/globals.css` for theme colors:
  ```css
  --background, --foreground
  --card, --card-foreground
  --primary, --primary-foreground
  --secondary, --secondary-foreground
  --muted, --muted-foreground
  --accent, --accent-foreground
  --destructive, --destructive-foreground
  --border, --input, --ring
  ```
- Access theme colors via Tailwind classes: `bg-background`, `text-foreground`, `border-border`, etc.
- Always test components in both dark and light modes
- Use `dark:` prefix for dark mode specific styles when needed

### Animations

- Use **Framer Motion** for all animations and transitions
- Keep animations subtle and purposeful - enhance UX without being distracting
- Common animation patterns:
  - Page transitions: `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}`
  - Staggered lists: Use `staggerChildren` with `variants`
  - Hover effects: Use `whileHover` and `whileTap`
  - Layout animations: Use `layout` prop for automatic layout transitions
- Wrap animated components with `motion.div` or use `motion()` wrapper
- Define reusable animation variants in constants:
  ```typescript
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }
  ```

## Data & Validation

### Database - Drizzle ORM

- Use **Drizzle ORM** for all database operations
- Define schemas in `db/schema/` directory using Drizzle's schema builder
- Use `db/index.ts` for database client initialization
- Prefer Drizzle's query builder over raw SQL
- Use typed queries with proper TypeScript inference
- Example schema structure:
  ```typescript
  import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
  
  export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow()
  })
  ```

### Form Validation - Zod

- Use **Zod** for all form validation and data parsing
- Define schemas co-located with forms or in `lib/validations/`
- Use with `react-hook-form` for form state management
- Validate on both client and server side (reuse same Zod schemas)
- Example validation:
  ```typescript
  import { z } from 'zod'
  
  export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters')
  })
  
  export type LoginInput = z.infer<typeof loginSchema>
  ```

## Data Fetching & Mutations

### Server Actions (Primary Method)

- **Always use Server Actions** for forms, mutations, and data operations
- **Never use traditional API routes** (`app/api/`) unless absolutely necessary (webhooks, third-party integrations)
- Define Server Actions in separate files with `'use server'` directive:
  ```typescript
  'use server'
  
  export async function createUser(formData: FormData) {
    // Validate with Zod
    // Perform database operation
    // Revalidate cache if needed
  }
  ```
- Use `revalidatePath()` or `revalidateTag()` to update cached data
- Return typed results with success/error states:
  ```typescript
  type ActionResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string }
  ```

### Client-Side Fetching (When Necessary)

- Use **React Query** (`@tanstack/react-query`) for client-side data fetching only when needed:
  - Real-time data that updates frequently
  - Polling requirements
  - Optimistic UI updates
  - Complex client-side caching needs
- Configure React Query in `app/providers.tsx`
- Prefer Server Components and Server Actions for most data needs

## Code Quality

- Use TypeScript strict mode
- Implement proper error handling in Server Actions with try-catch
- Use Zod's `safeParse()` for graceful validation error handling
- Keep components focused and single-purpose
- Extract business logic into separate utility functions
- Use proper TypeScript types - avoid `any`
- Follow React Server Component patterns - don't pass functions as props from Server to Client Components

## Performance

- Leverage React Server Components for automatic code splitting
- Use `loading.tsx` for route-level loading states
- Implement proper Suspense boundaries
- Optimize images with Next.js `<Image>` component
- Use `next/font` for font optimization
- Minimize client-side JavaScript bundle size