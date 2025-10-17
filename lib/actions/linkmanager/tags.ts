'use server'

import { db } from '@/db'
import { tags } from '@/db/schema/linkmanager'
import { eq, and, desc, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export type TagInput = {
  name: string
}

export async function getTags(teamId: string) {
  const result = await db
    .select()
    .from(tags)
    .where(eq(tags.teamId, teamId))
    .orderBy(asc(tags.name))

  return result
}

export async function getTagById(id: string, teamId: string) {
  const result = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, id), eq(tags.teamId, teamId)))
    .limit(1)

  return result[0]
}

export async function createTag(data: TagInput, teamId: string) {
  // Check if tag with same name already exists for this team
  const existingTag = await db
    .select()
    .from(tags)
    .where(and(eq(tags.teamId, teamId), eq(tags.name, data.name)))
    .limit(1)

  if (existingTag.length > 0) {
    throw new Error('Tag with this name already exists')
  }

  const [newTag] = await db
    .insert(tags)
    .values({
      name: data.name,
      teamId
    })
    .returning()

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return newTag
}

export async function updateTag(id: string, data: Partial<TagInput>, teamId: string) {
  // Check if tag exists
  const existingTag = await getTagById(id, teamId)
  if (!existingTag) {
    throw new Error('Tag not found')
  }

  // Check if another tag with the same name already exists
  if (data.name && data.name !== existingTag.name) {
    const duplicateTag = await db
      .select()
      .from(tags)
      .where(and(eq(tags.teamId, teamId), eq(tags.name, data.name)))
      .limit(1)

    if (duplicateTag.length > 0) {
      throw new Error('Tag with this name already exists')
    }
  }

  const [updatedTag] = await db
    .update(tags)
    .set(data)
    .where(and(eq(tags.id, id), eq(tags.teamId, teamId)))
    .returning()

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return updatedTag
}

export async function deleteTag(id: string, teamId: string) {
  // Check if tag exists
  const existingTag = await getTagById(id, teamId)
  if (!existingTag) {
    throw new Error('Tag not found')
  }

  // Delete the tag
  await db
    .delete(tags)
    .where(and(eq(tags.id, id), eq(tags.teamId, teamId)))

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true }
}