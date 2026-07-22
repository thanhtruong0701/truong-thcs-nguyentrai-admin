'use server'

import { db } from '@/lib/db'
import { quizzes, quizQuestions, quizAttempts, user } from '@/lib/db/schema'
import { desc, eq, count, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAdmin, requireAuth } from '@/lib/auth-helpers'

export async function getQuizzes() {
  await requireAdmin()
  return db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      description: quizzes.description,
      courseId: quizzes.courseId,
      timeLimit: quizzes.timeLimit,
      maxAttempts: quizzes.maxAttempts,
      isPublished: quizzes.isPublished,
      createdBy: quizzes.createdBy,
      createdAt: quizzes.createdAt,
      updatedAt: quizzes.updatedAt,
      questionCount: count(quizQuestions.id),
    })
    .from(quizzes)
    .leftJoin(quizQuestions, eq(quizzes.id, quizQuestions.quizId))
    .groupBy(quizzes.id)
    .orderBy(desc(quizzes.createdAt))
}

export async function getQuizById(id: string) {
  await requireAdmin()
  const quiz = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1)
  if (!quiz[0]) return null

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, id))
    .orderBy(quizQuestions.orderIndex)

  return { ...quiz[0], questions }
}

export async function getPublishedQuizzes() {
  return db.select().from(quizzes).where(eq(quizzes.isPublished, true)).orderBy(desc(quizzes.createdAt))
}

export async function getQuizForStudent(id: string) {
  const quiz = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1)
  if (!quiz[0] || !quiz[0].isPublished) return null

  const questions = await db
    .select({
      id: quizQuestions.id,
      quizId: quizQuestions.quizId,
      questionText: quizQuestions.questionText,
      questionType: quizQuestions.questionType,
      options: quizQuestions.options,
      points: quizQuestions.points,
      orderIndex: quizQuestions.orderIndex,
    })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, id))
    .orderBy(quizQuestions.orderIndex)

  return { ...quiz[0], questions }
}

export async function getStudentAttempt(quizId: string) {
  const currentUser = await requireAuth()
  const attempts = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.quizId, quizId))
    .orderBy(desc(quizAttempts.startedAt))
  return attempts.filter(a => a.studentId === currentUser.id)
}

export async function getQuizAttempts(quizId: string) {
  await requireAdmin()
  return db
    .select({
      id: quizAttempts.id,
      quizId: quizAttempts.quizId,
      studentId: quizAttempts.studentId,
      score: quizAttempts.score,
      totalPoints: quizAttempts.totalPoints,
      startedAt: quizAttempts.startedAt,
      completedAt: quizAttempts.completedAt,
      studentName: user.name,
      studentEmail: user.email,
    })
    .from(quizAttempts)
    .leftJoin(user, eq(quizAttempts.studentId, user.id))
    .where(eq(quizAttempts.quizId, quizId))
    .orderBy(desc(quizAttempts.completedAt))
}

export async function createQuiz(data: {
  title: string
  description?: string
  timeLimit?: number
  maxAttempts?: number
}) {
  const currentUser = await requireAdmin()

  const result = await db
    .insert(quizzes)
    .values({
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description || null,
      timeLimit: data.timeLimit || null,
      maxAttempts: data.maxAttempts || 1,
      isPublished: false,
      createdBy: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  revalidatePath('/admin/quizzes')
  return result[0]
}

export async function updateQuiz(
  id: string,
  data: {
    title?: string
    description?: string
    timeLimit?: number
    maxAttempts?: number
    isPublished?: boolean
  }
) {
  await requireAdmin()

  const result = await db
    .update(quizzes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(quizzes.id, id))
    .returning()

  revalidatePath('/admin/quizzes')
  return result[0]
}

export async function deleteQuiz(id: string) {
  await requireAdmin()
  await db.delete(quizzes).where(eq(quizzes.id, id))
  revalidatePath('/admin/quizzes')
}

export async function publishQuiz(id: string, isPublished: boolean) {
  await requireAdmin()
  await db.update(quizzes).set({ isPublished, updatedAt: new Date() }).where(eq(quizzes.id, id))
  revalidatePath('/admin/quizzes')
}

export async function addQuestion(quizId: string, data: {
  questionText: string
  questionType?: string
  options: string[]
  correctAnswer: string
  points?: number
}) {
  await requireAdmin()

  const maxOrder = await db
    .select({ max: sql<number>`coalesce(max(${quizQuestions.orderIndex}), 0)` })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))

  const result = await db
    .insert(quizQuestions)
    .values({
      id: crypto.randomUUID(),
      quizId,
      questionText: data.questionText,
      questionType: data.questionType || 'multiple_choice',
      options: JSON.stringify(data.options),
      correctAnswer: data.correctAnswer,
      points: data.points || 1,
      orderIndex: (maxOrder[0]?.max || 0) + 1,
      createdAt: new Date(),
    })
    .returning()

  revalidatePath('/admin/quizzes')
  return result[0]
}

export async function updateQuestion(
  id: string,
  data: {
    questionText?: string
    questionType?: string
    options?: string[]
    correctAnswer?: string
    points?: number
  }
) {
  await requireAdmin()

  const updateData: any = { ...data }
  if (data.options) {
    updateData.options = JSON.stringify(data.options)
  }

  const result = await db
    .update(quizQuestions)
    .set(updateData)
    .where(eq(quizQuestions.id, id))
    .returning()

  revalidatePath('/admin/quizzes')
  return result[0]
}

export async function deleteQuestion(id: string) {
  await requireAdmin()
  await db.delete(quizQuestions).where(eq(quizQuestions.id, id))
  revalidatePath('/admin/quizzes')
}

export async function submitQuizAttempt(quizId: string, answers: Record<string, string>) {
  const currentUser = await requireAuth()

  const quiz = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1)
  if (!quiz[0]) throw new Error('Quiz not found')

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.orderIndex)

  let score = 0
  let totalPoints = 0

  for (const q of questions) {
    totalPoints += q.points
    const userAnswer = answers[q.id]
    if (q.questionType === 'fill_in') {
      if (userAnswer?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        score += q.points
      }
    } else {
      if (userAnswer === q.correctAnswer) {
        score += q.points
      }
    }
  }

  const result = await db
    .insert(quizAttempts)
    .values({
      id: crypto.randomUUID(),
      quizId,
      studentId: currentUser.id,
      score,
      totalPoints,
      answers: JSON.stringify(answers),
      startedAt: new Date(),
      completedAt: new Date(),
    })
    .returning()

  revalidatePath('/quizzes')
  return { ...result[0], questions }
}
