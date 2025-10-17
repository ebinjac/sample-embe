'use server'

import { db } from '@/db'
import { links, linkApplications, linkTags } from '@/db/schema/linkmanager'
import { eq, and, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getLinkById } from './links'

export type BulkLinkInput = {
  title: string
  url: string
  description?: string
  categoryId?: string
  visibility: 'private' | 'public'
  isPinned?: boolean
  applicationIds?: string[]
  tagIds?: string[]
}

export async function bulkCreateLinks(
  linksData: BulkLinkInput[],
  teamId: string,
  userId: string
) {
  // Validate all URLs first
  for (const linkData of linksData) {
    try {
      new URL(linkData.url)
    } catch {
      throw new Error(`Invalid URL format: ${linkData.url}`)
    }
  }

  // Create all links
  const createdLinks = []
  for (const linkData of linksData) {
    const [newLink] = await db
      .insert(links)
      .values({
        title: linkData.title,
        url: linkData.url,
        description: linkData.description,
        categoryId: linkData.categoryId,
        visibility: linkData.visibility,
        isPinned: linkData.isPinned || false,
        teamId,
        createdBy: userId,
        updatedBy: userId
      })
      .returning()

    // Associate with applications if provided
    if (linkData.applicationIds && linkData.applicationIds.length > 0) {
      await db
        .insert(linkApplications)
        .values(
          linkData.applicationIds.map(appId => ({
            linkId: newLink.id,
            applicationId: appId
          }))
        )
    }

    // Associate with tags if provided
    if (linkData.tagIds && linkData.tagIds.length > 0) {
      await db
        .insert(linkTags)
        .values(
          linkData.tagIds.map(tagId => ({
            linkId: newLink.id,
            tagId
          }))
        )
    }

    createdLinks.push(newLink)
  }

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return createdLinks
}

export async function bulkDeleteLinks(
  linkIds: string[],
  teamId: string,
  userId: string
) {
  // Check permissions for all links
  for (const linkId of linkIds) {
    const link = await getLinkById(linkId, teamId, userId)
    if (link.createdBy !== userId) {
      throw new Error(`Only the creator can delete link: ${link.title}`)
    }
  }

  // Delete all links (cascade will handle related records)
  await db
    .delete(links)
    .where(and(
      inArray(links.id, linkIds),
      eq(links.teamId, teamId)
    ))

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true, deletedCount: linkIds.length }
}

export async function bulkUpdateVisibility(
  linkIds: string[],
  visibility: 'private' | 'public',
  teamId: string,
  userId: string
) {
  // Check permissions for all links
  for (const linkId of linkIds) {
    const link = await getLinkById(linkId, teamId, userId)
    if (link.createdBy !== userId) {
      throw new Error(`Only the creator can update link: ${link.title}`)
    }
  }

  // Update visibility for all links
  await db
    .update(links)
    .set({
      visibility,
      updatedAt: new Date(),
      updatedBy: userId
    })
    .where(and(
      inArray(links.id, linkIds),
      eq(links.teamId, teamId)
    ))

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true, updatedCount: linkIds.length }
}

export async function bulkPinLinks(
  linkIds: string[],
  isPinned: boolean,
  teamId: string,
  userId: string
) {
  // Check permissions for all links
  for (const linkId of linkIds) {
    const link = await getLinkById(linkId, teamId, userId)
    if (link.createdBy !== userId) {
      throw new Error(`Only the creator can update link: ${link.title}`)
    }
  }

  // Update pin status for all links
  await db
    .update(links)
    .set({
      isPinned,
      updatedAt: new Date(),
      updatedBy: userId
    })
    .where(and(
      inArray(links.id, linkIds),
      eq(links.teamId, teamId)
    ))

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true, updatedCount: linkIds.length }
}

export async function bulkUpdateCategory(
  linkIds: string[],
  categoryId: string | null,
  teamId: string,
  userId: string
) {
  // Check permissions for all links
  for (const linkId of linkIds) {
    const link = await getLinkById(linkId, teamId, userId)
    if (link.createdBy !== userId) {
      throw new Error(`Only the creator can update link: ${link.title}`)
    }
  }

  // Update category for all links
  await db
    .update(links)
    .set({
      categoryId,
      updatedAt: new Date(),
      updatedBy: userId
    })
    .where(and(
      inArray(links.id, linkIds),
      eq(links.teamId, teamId)
    ))

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true, updatedCount: linkIds.length }
}

export async function bulkAddApplications(
  linkIds: string[],
  applicationIds: string[],
  teamId: string,
  userId: string
) {
  // Check permissions for all links
  for (const linkId of linkIds) {
    const link = await getLinkById(linkId, teamId, userId)
    if (link.createdBy !== userId) {
      throw new Error(`Only the creator can update link: ${link.title}`)
    }
  }

  // Add application associations for all links
  const associations = []
  for (const linkId of linkIds) {
    for (const applicationId of applicationIds) {
      associations.push({
        linkId,
        applicationId
      })
    }
  }

  await db
    .insert(linkApplications)
    .values(associations)
    .onConflictDoNothing() // Avoid duplicates

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true, addedCount: associations.length }
}

export async function bulkRemoveApplications(
  linkIds: string[],
  applicationIds: string[],
  teamId: string,
  userId: string
) {
  // Check permissions for all links
  for (const linkId of linkIds) {
    const link = await getLinkById(linkId, teamId, userId)
    if (link.createdBy !== userId) {
      throw new Error(`Only the creator can update link: ${link.title}`)
    }
  }

  // Remove application associations for all links
  let removedCount = 0
  for (const linkId of linkIds) {
    const result = await db
      .delete(linkApplications)
      .where(and(
        eq(linkApplications.linkId, linkId),
        inArray(linkApplications.applicationId, applicationIds)
      ))

    removedCount += result.rowCount || 0
  }

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true, removedCount }
}

export async function bulkAddTags(
  linkIds: string[],
  tagIds: string[],
  teamId: string,
  userId: string
) {
  // Check permissions for all links
  for (const linkId of linkIds) {
    const link = await getLinkById(linkId, teamId, userId)
    if (link.createdBy !== userId) {
      throw new Error(`Only the creator can update link: ${link.title}`)
    }
  }

  // Add tag associations for all links
  const associations = []
  for (const linkId of linkIds) {
    for (const tagId of tagIds) {
      associations.push({
        linkId,
        tagId
      })
    }
  }

  await db
    .insert(linkTags)
    .values(associations)
    .onConflictDoNothing() // Avoid duplicates

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true, addedCount: associations.length }
}

export async function bulkRemoveTags(
  linkIds: string[],
  tagIds: string[],
  teamId: string,
  userId: string
) {
  // Check permissions for all links
  for (const linkId of linkIds) {
    const link = await getLinkById(linkId, teamId, userId)
    if (link.createdBy !== userId) {
      throw new Error(`Only the creator can update link: ${link.title}`)
    }
  }

  // Remove tag associations for all links
  let removedCount = 0
  for (const linkId of linkIds) {
    const result = await db
      .delete(linkTags)
      .where(and(
        eq(linkTags.linkId, linkId),
        inArray(linkTags.tagId, tagIds)
      ))

    removedCount += result.rowCount || 0
  }

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true, removedCount }
}