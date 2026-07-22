'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createQuiz } from '@/app/actions/quizzes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function NewQuizPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    timeLimit: '',
    maxAttempts: '1',
  })

  async function handleCreate() {
    if (!form.title.trim()) {
      alert('Vui lòng nhập tên bài kiểm tra')
      return
    }

    setSaving(true)
    try {
      const quiz = await createQuiz({
        title: form.title,
        description: form.description || undefined,
        timeLimit: form.timeLimit ? parseInt(form.timeLimit) : undefined,
        maxAttempts: parseInt(form.maxAttempts) || 1,
      })
      router.push(`/admin/quizzes/${quiz.id}`)
    } catch (error) {
      alert('Lỗi khi tạo bài kiểm tra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/quizzes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo bài kiểm tra mới</h1>
          <p className="text-gray-500 mt-1">Nhập thông tin cơ bản cho bài kiểm tra</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <Label htmlFor="title">Tên bài kiểm tra *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ví dụ: Kiểm tra giữa kỳ Toán 6"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="description">Mô tả</Label>
          <Input
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả ngắn về bài kiểm tra..."
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timeLimit">Thời gian (phút, để trống = không giới hạn)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={form.timeLimit}
              onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}
              placeholder="45"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="maxAttempts">Số lần làm bài tối đa</Label>
            <Input
              id="maxAttempts"
              type="number"
              value={form.maxAttempts}
              onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/admin/quizzes">
            <Button variant="outline">Hủy</Button>
          </Link>
          <Button onClick={handleCreate} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Đang tạo...' : 'Tạo mới'}
          </Button>
        </div>
      </div>
    </div>
  )
}
