'use server'

import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth-helpers'

export async function getSettings() {
  const rows = await db.select().from(settings)
  const map: Record<string, string> = {}
  for (const row of rows) map[row.key] = row.value ?? ''
  return map
}

export async function getSetting(key: string) {
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1)
  return result[0]?.value ?? null
}

export async function saveSettings(data: Record<string, string>) {
  await requireAdmin()

  for (const [key, value] of Object.entries(data)) {
    const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1)
    if (existing.length > 0) {
      await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key))
    } else {
      await db.insert(settings).values({ id: crypto.randomUUID(), key, value })
    }
  }

  revalidatePath('/admin/settings')
}
