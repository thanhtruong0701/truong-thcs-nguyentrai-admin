'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getQuizzes, deleteQuiz, publishQuiz } from '@/app/actions/quizzes'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Eye, EyeOff, ClipboardCheck, Edit2 } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  description?: string | null
  timeLimit?: number | null
  maxAttempts?: number | null
  isPublished: boolean
  createdAt: Date
  questionCount: number
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  async function fetchQuizzes() {
    try {
      const data = await getQuizzes()
      setQuizzes(data)
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa bài kiểm tra "${title}"?`)) return
    setDeleting(id)
    try {
      await deleteQuiz(id)
      setQuizzes(quizzes.filter(q => q.id !== id))
    } catch (error) {
      alert('Lỗi khi xóa')
    } finally {
      setDeleting(null)
    }
  }

  async function handleTogglePublish(id: string, isPublished: boolean) {
    try {
      await publishQuiz(id, !isPublished)
      setQuizzes(quizzes.map(q => q.id === id ? { ...q, isPublished: !isPublished } : q))
    } catch (error) {
      alert('Lỗi khi cập nhật')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bài kiểm tra</h1>
          <p className="text-gray-500 mt-1">Quản lý bài kiểm tra cho học sinh</p>
        </div>
        <Link href="/admin/quizzes/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Tạo bài kiểm tra
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">Chưa có bài kiểm tra nào</p>
          <Link href="/admin/quizzes/new">
            <Button>Tạo bài kiểm tra đầu tiên</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-sm ${
                quiz.isPublished ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                    {quiz.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <Eye className="w-3 h-3" /> Xuất bản
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                        <EyeOff className="w-3 h-3" /> Nháp
                      </span>
                    )}
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-gray-500 line-clamp-1 mb-2">{quiz.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{quiz.questionCount} câu hỏi</span>
                    {quiz.timeLimit && <span>Thời gian: {quiz.timeLimit} phút</span>}
                    <span>Số lần tối đa: {quiz.maxAttempts}</span>
                    <span>{new Date(quiz.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePublish(quiz.id, quiz.isPublished)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title={quiz.isPublished ? 'Gỡ xuất bản' : 'Xuất bản'}
                  >
                    {quiz.isPublished ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                  <Link href={`/admin/quizzes/${quiz.id}`}>
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition" title="Chỉnh sửa">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    disabled={deleting === quiz.id}
                    className="p-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
