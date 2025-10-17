'use server'

import { db } from '@/db'
import { links, linkApplications, linkTags, linkAccessLog, tags } from '@/db/schema/linkmanager'
import { applications } from '@/db/schema/teams'
import { eq, and, desc, asc, ilike, count, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export type LinkInput = {
  title: string
  url: string
  description?: string
  categoryId?: string | null
  visibility: 'private' | 'public'
  isPinned?: boolean
  applicationIds?: string[]
  tagIds?: string[]
}

export async function getLinks({
  teamId,
  userId,
  page = 1,
  limit = 20,
  search,
  categoryId,
  visibility,
  applicationId,
  tagId,
  isPinned,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}: {
  teamId: string
  userId: string
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  visibility?: 'private' | 'public'
  applicationId?: string
  tagId?: string
  isPinned?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const offset = (page - 1) * limit

  // Get all links first, then filter in memory
  let allLinks = await db
    .select()
    .from(links)
    .where(eq(links.teamId, teamId))

  // Filter by visibility
  allLinks = allLinks.filter(link => {
    if (visibility) {
      return link.visibility === visibility
    } else {
      return link.visibility === 'public' || (link.visibility === 'private' && link.createdBy === userId)
    }
  })

  // Filter by search
  if (search) {
    allLinks = allLinks.filter(link => 
      link.title.toLowerCase().includes(search.toLowerCase()) ||
      (link.description && link.description.toLowerCase().includes(search.toLowerCase()))
    )
  }

  // Filter by category
  if (categoryId) {
    allLinks = allLinks.filter(link => link.categoryId === categoryId)
  }

  // Filter by pinned status
  if (isPinned !== undefined) {
    allLinks = allLinks.filter(link => link.isPinned === isPinned)
  }

  // Filter by application
  if (applicationId) {
    const linkIdsWithApplication = await db
      .select({ linkId: linkApplications.linkId })
      .from(linkApplications)
      .where(eq(linkApplications.applicationId, applicationId))
    
    const applicationLinkIds = linkIdsWithApplication.map(item => item.linkId)
    allLinks = allLinks.filter(link => applicationLinkIds.includes(link.id))
  }

  // Filter by tag
  if (tagId) {
    const linkIdsWithTag = await db
      .select({ linkId: linkTags.linkId })
      .from(linkTags)
      .where(eq(linkTags.tagId, tagId))
    
    const tagLinkIds = linkIdsWithTag.map(item => item.linkId)
    allLinks = allLinks.filter(link => tagLinkIds.includes(link.id))
  }

  // Sort the links
  allLinks.sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'accessCount':
        aValue = a.accessCount
        bValue = b.accessCount
        break
      case 'lastAccessedAt':
        aValue = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0
        bValue = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0
        break
      case 'createdAt':
      default:
        aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0
        bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0
        break
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    }
  })

  // Paginate
  const totalCount = allLinks.length
  const paginatedLinks = allLinks.slice(offset, offset + limit)

  return {
    links: paginatedLinks,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  }
}

export async function getLinkById(id: string, teamId: string, userId: string) {
  const result = await db
    .select()
    .from(links)
    .where(and(eq(links.id, id), eq(links.teamId, teamId)))
    .limit(1)

  const link = result[0]
  if (!link) {
    throw new Error('Link not found')
  }

  // Check visibility permissions
  if (link.visibility === 'private' && link.createdBy !== userId) {
    throw new Error('Access denied')
  }

  return link
}

export async function createLink(data: LinkInput, teamId: string, userId: string) {
  // Validate URL format
  try {
    new URL(data.url)
  } catch {
    throw new Error('Invalid URL format')
  }

  // Create the link
  const [newLink] = await db
    .insert(links)
    .values({
      title: data.title,
      url: data.url,
      description: data.description,
      categoryId: data.categoryId && data.categoryId.trim() !== "" ? data.categoryId : null,
      visibility: data.visibility,
      isPinned: data.isPinned || false,
      teamId,
      createdBy: userId,
      updatedBy: userId
    })
    .returning()

  // Associate with applications if provided
  if (data.applicationIds && data.applicationIds.length > 0) {
    await db
      .insert(linkApplications)
      .values(
        data.applicationIds.map(appId => ({
          linkId: newLink.id,
          applicationId: appId
        }))
      )
  }

  // Associate with tags if provided
  if (data.tagIds && data.tagIds.length > 0) {
    await db
      .insert(linkTags)
      .values(
        data.tagIds.map(tagId => ({
          linkId: newLink.id,
          tagId
        }))
      )
  }

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return newLink
}

export async function updateLink(id: string, data: Partial<LinkInput>, teamId: string, userId: string) {
  // Check if link exists and user has permission
  const existingLink = await getLinkById(id, teamId, userId)
  
  if (existingLink.createdBy !== userId) {
    throw new Error('Only the creator can update a link')
  }

  // Validate URL format if provided
  if (data.url) {
    try {
      new URL(data.url)
    } catch {
      throw new Error('Invalid URL format')
    }
  }

  // Update the link
  const updateData = {
    ...data,
    updatedAt: new Date(),
    updatedBy: userId
  }
  
  // Handle categoryId separately to convert empty string to null
  if (data.categoryId !== undefined) {
    (updateData as any).categoryId = data.categoryId && data.categoryId.trim() !== "" ? data.categoryId : null
  }
  
  const [updatedLink] = await db
    .update(links)
    .set(updateData)
    .where(and(eq(links.id, id), eq(links.teamId, teamId)))
    .returning()

  // Update applications if provided
  if (data.applicationIds !== undefined) {
    // Remove existing associations
    await db
      .delete(linkApplications)
      .where(eq(linkApplications.linkId, id))

    // Add new associations
    if (data.applicationIds.length > 0) {
      await db
        .insert(linkApplications)
        .values(
          data.applicationIds.map(appId => ({
            linkId: id,
            applicationId: appId
          }))
        )
    }
  }

  // Update tags if provided
  if (data.tagIds !== undefined) {
    // Remove existing associations
    await db
      .delete(linkTags)
      .where(eq(linkTags.linkId, id))

    // Add new associations
    if (data.tagIds.length > 0) {
      await db
        .insert(linkTags)
        .values(
          data.tagIds.map(tagId => ({
            linkId: id,
            tagId
          }))
        )
    }
  }

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return updatedLink
}

export async function deleteLink(id: string, teamId: string, userId: string) {
  // Check if link exists and user has permission
  const existingLink = await getLinkById(id, teamId, userId)
  
  if (existingLink.createdBy !== userId) {
    throw new Error('Only the creator can delete a link')
  }

  // Delete the link (cascade will handle related records)
  await db
    .delete(links)
    .where(and(eq(links.id, id), eq(links.teamId, teamId)))

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true }
}

export async function logLinkAccess(linkId: string, userId: string) {
  await db
    .insert(linkAccessLog)
    .values({
      linkId,
      userId,
      accessedAt: new Date(),
      userAgent: '', // Could be passed from request headers
      ipAddress: '' // Could be passed from request
    })

  // Update link access count and last accessed timestamp
  await db
    .update(links)
    .set({
      accessCount: sql`${links.accessCount} + 1`,
      lastAccessedAt: new Date()
    })
    .where(eq(links.id, linkId))
}

export async function getRecentlyAccessedLinks(teamId: string, userId: string, limit = 10) {
  const result = await db
    .select({
      id: links.id,
      title: links.title,
      url: links.url,
      description: links.description,
      categoryId: links.categoryId,
      visibility: links.visibility,
      isPinned: links.isPinned,
      accessCount: links.accessCount,
      lastAccessedAt: links.lastAccessedAt,
      teamId: links.teamId,
      createdBy: links.createdBy,
      createdAt: links.createdAt,
      updatedAt: links.updatedAt
    })
    .from(links)
    .innerJoin(linkAccessLog, eq(links.id, linkAccessLog.linkId))
    .where(and(
      eq(links.teamId, teamId),
      eq(linkAccessLog.userId, userId),
      or(
        eq(links.visibility, 'public'),
        and(eq(links.visibility, 'private'), eq(links.createdBy, userId))
      )
    ))
    .orderBy(desc(linkAccessLog.accessedAt))
    .limit(limit)

  return result
}

export async function getPinnedLinks(teamId: string, userId: string) {
  const result = await db
    .select()
    .from(links)
    .where(and(
      eq(links.teamId, teamId),
      eq(links.isPinned, true),
      or(
        eq(links.visibility, 'public'),
        and(eq(links.visibility, 'private'), eq(links.createdBy, userId))
      )
    ))
    .orderBy(desc(links.lastAccessedAt))

  return result
}

export async function getLinkCountByApplication(applicationId: string, teamId: string) {
  const result = await db
    .select({ count: count() })
    .from(linkApplications)
    .innerJoin(links, eq(linkApplications.linkId, links.id))
    .where(and(
      eq(linkApplications.applicationId, applicationId),
      eq(links.teamId, teamId)
    ))

  return result[0]?.count || 0
}

export async function getLinkApplications(linkId: string) {
  const result = await db
    .select({
      id: applications.id,
      applicationName: applications.applicationName,
      tla: applications.tla,
      assetId: applications.assetId
    })
    .from(linkApplications)
    .innerJoin(applications, eq(linkApplications.applicationId, applications.id))
    .where(eq(linkApplications.linkId, linkId))

  return result
}

export async function getLinkTags(linkId: string) {
  const result = await db
    .select({
      id: tags.id,
      name: tags.name
    })
    .from(linkTags)
    .innerJoin(tags, eq(linkTags.tagId, tags.id))
    .where(eq(linkTags.linkId, linkId))

  return result
}
