'use server'

import { db } from '@/db'
import { applications } from '@/db/schema/teams'
import { eq } from 'drizzle-orm'

export async function getApplications(teamId: string) {
  const result = await db
    .select({
      id: applications.id,
      applicationName: applications.applicationName,
      tla: applications.tla,
      assetId: applications.assetId,
      description: applications.description,
      status: applications.status,
      tier: applications.tier,
      teamId: applications.teamId,
      createdAt: applications.createdAt
    })
    .from(applications)
    .where(eq(applications.teamId, teamId))
    .orderBy(applications.applicationName)

  return result
}