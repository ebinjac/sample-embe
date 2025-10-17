'use server'

import { db } from '@/db'
import { links, linkTags, tags } from '@/db/schema/linkmanager'
import { getSession } from '@/lib/auth/session'
import { parseCSV, parseMarkdown, parseHTML, parseJSON } from '@/lib/parsers/link-parsers'
import { revalidatePath } from 'next/cache'
import { toast } from 'sonner'
import { eq } from 'drizzle-orm'

export interface ParsedLink {
  url: string
  title?: string
  description?: string
  tags?: string[]
  isPrivate?: boolean
  isPinned?: boolean
  applicationId?: string
}

export async function bulkImportLinks(
  teamId: string,
  fileContent: string,
  fileType: 'csv' | 'markdown' | 'html' | 'json'
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    let parsedLinks: ParsedLink[] = []

    switch (fileType) {
      case 'csv':
        parsedLinks = parseCSV(fileContent)
        break
      case 'markdown':
        parsedLinks = parseMarkdown(fileContent)
        break
      case 'html':
        parsedLinks = parseHTML(fileContent)
        break
      case 'json':
        parsedLinks = parseJSON(fileContent)
        break
      default:
        return { success: false, error: 'Unsupported file type' }
    }

    if (parsedLinks.length === 0) {
      return { success: false, error: 'No valid links found in file' }
    }

    // Insert links into database
    const insertedLinks = await db.insert(links).values(
      parsedLinks.map(link => ({
        url: link.url,
        title: link.title || '',
        description: link.description || '',
        visibility: link.isPrivate ? 'private' as const : 'public' as const,
        isPinned: link.isPinned || false,
        createdBy: session.user.id,
        teamId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    ).returning()

    // Handle tags if provided
    if (parsedLinks.some(link => link.tags && link.tags.length > 0)) {
      for (let i = 0; i < parsedLinks.length; i++) {
        const link = parsedLinks[i]
        const insertedLink = insertedLinks[i]
        
        if (link.tags && link.tags.length > 0) {
          // Create or get tags
          const tagRecords = await Promise.all(
            link.tags.map(async (tagName) => {
              // Check if tag already exists
              const existingTag = await db.select()
                .from(tags)
                .where(eq(tags.name, tagName))
                .limit(1)
              
              if (existingTag.length > 0) {
                return existingTag[0]
              }
              
              // Create new tag
              const newTags = await db.insert(tags).values({
                name: tagName,
                teamId,
                createdAt: new Date(),
              }).returning()
              
              return newTags[0]
            })
          )
          
          // Link tags to the link
          if (tagRecords.length > 0) {
            await db.insert(linkTags).values(
              tagRecords.map(tag => ({
                linkId: insertedLink.id,
                tagId: tag.id,
                createdAt: new Date(),
              }))
            )
          }
        }
      }
    }

    revalidatePath(`/tools/teams/${teamId}/linkio`)
    
    return { 
      success: true, 
      message: `Successfully imported ${insertedLinks.length} links`,
      count: insertedLinks.length
    }
  } catch (error) {
    console.error('Error importing links:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to import links' 
    }
  }
}