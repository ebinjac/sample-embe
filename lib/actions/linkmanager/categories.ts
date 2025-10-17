'use server'

import { db } from '@/db'
import { categories } from '@/db/schema/linkmanager'
import { eq, and, desc, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export type CategoryInput = {
  name: string
  description?: string
  color?: string
}

export async function getCategories(teamId: string) {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.teamId, teamId))
    .orderBy(asc(categories.name))

  return result
}

export async function getCategoryById(id: string, teamId: string) {
  const result = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.teamId, teamId)))
    .limit(1)

  return result[0]
}

export async function createCategory(data: CategoryInput, teamId: string, userId: string) {
  // Check if category with same name already exists for this team
  const existingCategory = await db
    .select()
    .from(categories)
    .where(and(eq(categories.teamId, teamId), eq(categories.name, data.name)))
    .limit(1)

  if (existingCategory.length > 0) {
    throw new Error('Category with this name already exists')
  }

  // Validate color format if provided
  if (data.color && !data.color.match(/^#[0-9A-Fa-f]{6}$/)) {
    throw new Error('Invalid color format. Use hex color format (e.g., #FF5733)')
  }

  const [newCategory] = await db
    .insert(categories)
    .values({
      name: data.name,
      description: data.description,
      color: data.color,
      teamId,
      createdBy: userId
    })
    .returning()

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return newCategory
}

export async function updateCategory(id: string, data: Partial<CategoryInput>, teamId: string) {
  // Check if category exists
  const existingCategory = await getCategoryById(id, teamId)
  if (!existingCategory) {
    throw new Error('Category not found')
  }

  // Check if another category with the same name already exists
  if (data.name && data.name !== existingCategory.name) {
    const duplicateCategory = await db
      .select()
      .from(categories)
      .where(and(eq(categories.teamId, teamId), eq(categories.name, data.name)))
      .limit(1)

    if (duplicateCategory.length > 0) {
      throw new Error('Category with this name already exists')
    }
  }

  // Validate color format if provided
  if (data.color && !data.color.match(/^#[0-9A-Fa-f]{6}$/)) {
    throw new Error('Invalid color format. Use hex color format (e.g., #FF5733)')
  }

  const [updatedCategory] = await db
    .update(categories)
    .set(data)
    .where(and(eq(categories.id, id), eq(categories.teamId, teamId)))
    .returning()

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return updatedCategory
}

export async function deleteCategory(id: string, teamId: string) {
  // Check if category exists
  const existingCategory = await getCategoryById(id, teamId)
  if (!existingCategory) {
    throw new Error('Category not found')
  }

  // Delete the category
  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.teamId, teamId)))

  revalidatePath(`/tools/teams/${teamId}/linkio`)
  return { success: true }
}