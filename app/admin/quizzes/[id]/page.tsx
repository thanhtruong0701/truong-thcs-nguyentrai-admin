'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getQuizById, updateQuiz, addQuestion, deleteQuestion, updateQuestion } from '@/app/actions/quizzes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/modal'
import { ArrowLeft, Plus, Trash2, Edit2, GripVertical, Save } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  description?: string | null
  timeLimit?: number | null
  maxAttempts?: number | null
  isPublished: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
  questions: Question[]
}

interface Question {
  id: string
  quizId: string
  questionText: string
  questionType: string
  options: string
  correctAnswer: string
  points: number
  orderIndex: number
}

export default function EditQuizPage() {
  const params = useParams()
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'multiple_choice',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: '0',
    points: '1',
  })

  useEffect(() => {
    if (params.id) {
      fetchQuiz(params.id as string)
    }
  }, [params.id])

  async function fetchQuiz(id: string) {
    try {
      const data = await getQuizById(id)
      setQuiz(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveQuiz() {
    if (!quiz) return
    setSaving(true)
    try {
      await updateQuiz(quiz.id, {
        title: quiz.title,
        description: quiz.description || undefined,
        timeLimit: quiz.timeLimit || undefined,
        maxAttempts: quiz.maxAttempts || undefined,
      })
      alert('Đã lưu thay đổi')
    } catch (error) {
      alert('Lỗi khi lưu')
    } finally {
      setSaving(false)
    }
  }

  function openAddQuestion() {
    setEditingQuestion(null)
    setQuestionForm({
      questionText: '',
      questionType: 'multiple_choice',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: '0',
      points: '1',
    })
    setShowQuestionModal(true)
  }

  function openEditQuestion(q: Question) {
    setEditingQuestion(q)
    let options: string[]
    try {
      options = JSON.parse(q.options)
    } catch {
      options = ['A', 'B', 'C', 'D']
    }
    setQuestionForm({
      questionText: q.questionText,
      questionType: q.questionType,
      options,
      correctAnswer: q.correctAnswer,
      points: String(q.points),
    })
    setShowQuestionModal(true)
  }

  async function handleSaveQuestion() {
    if (!quiz || !questionForm.questionText.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi')
      return
    }

    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, {
          questionText: questionForm.questionText,
          questionType: questionForm.questionType,
          options: questionForm.options,
          correctAnswer: questionForm.correctAnswer,
          points: parseInt(questionForm.points) || 1,
        })
      } else {
        await addQuestion(quiz.id, {
          questionText: questionForm.questionText,
          questionType: questionForm.questionType,
          options: questionForm.options,
          correctAnswer: questionForm.correctAnswer,
          points: parseInt(questionForm.points) || 1,
        })
      }
      setShowQuestionModal(false)
      await fetchQuiz(quiz.id)
    } catch (error) {
      alert('Lỗi khi lưu câu hỏi')
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('Xóa câu hỏi này?')) return
    if (!quiz) return
    try {
      await deleteQuestion(id)
      await fetchQuiz(quiz.id)
    } catch (error) {
      alert('Lỗi khi xóa')
    }
  }

  function handleTypeChange(type: string) {
    if (type === 'true_false') {
      setQuestionForm({ ...questionForm, questionType: type, options: ['Đúng', 'Sai'], correctAnswer: '0' })
    } else if (type === 'fill_in') {
      setQuestionForm({ ...questionForm, questionType: type, options: [], correctAnswer: '' })
    } else {
      setQuestionForm({ ...questionForm, questionType: type, options: ['A', 'B', 'C', 'D'], correctAnswer: '0' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Không tìm thấy bài kiểm tra</p>
        <Link href="/admin/quizzes"><Button>Quay về danh sách</Button></Link>
      </div>
    )
  }

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/quizzes">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-gray-500 mt-1">{quiz.questions.length} câu hỏi - Tổng điểm: {totalPoints}</p>
        </div>
        <Button onClick={handleSaveQuiz} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Danh sách câu hỏi</h2>
          <Button onClick={openAddQuestion} size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Thêm câu hỏi
          </Button>
        </div>

        {quiz.questions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {quiz.questions.map((q, i) => {
              let options: string[] = []
              try { options = JSON.parse(q.options) } catch {}
              return (
                <div key={q.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-sm">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">{q.questionText}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {options.map((opt, j) => (
                          <span
                            key={j}
                            className={`text-xs px-2 py-1 rounded ${
                              String(j) === q.correctAnswer
                                ? 'bg-green-100 text-green-700 font-medium'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {q.questionType === 'true_false' ? opt : `${String.fromCharCode(65 + j)}. ${opt}`}
                          </span>
                        ))}
                        {q.questionType === 'fill_in' && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                            Đáp án: {q.correctAnswer}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="capitalize">
                          {q.questionType === 'multiple_choice' ? 'Đa lựa chọn' :
                           q.questionType === 'true_false' ? 'Đúng/Sai' : 'Điền đáp án'}
                        </span>
                        <span>{q.points} điểm</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEditQuestion(q)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 rounded-lg hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Question Modal */}
      <Modal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        title={editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}
      >
        <div className="space-y-4">
          <div>
            <Label>Nội dung câu hỏi *</Label>
            <textarea
              value={questionForm.questionText}
              onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
              placeholder="Nhập nội dung câu hỏi..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:border-ring focus:ring-3 focus:ring-ring/50 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Loại câu hỏi</Label>
              <select
                value={questionForm.questionType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="mt-1 w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="multiple_choice">Đa lựa chọn</option>
                <option value="true_false">Đúng/Sai</option>
                <option value="fill_in">Điền đáp án</option>
              </select>
            </div>
            <div>
              <Label>Số điểm</Label>
              <Input
                type="number"
                value={questionForm.points}
                onChange={(e) => setQuestionForm({ ...questionForm, points: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {questionForm.questionType !== 'fill_in' && (
            <div>
              <Label>Các đáp án</Label>
              <div className="space-y-2 mt-1">
                {questionForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={questionForm.correctAnswer === String(i)}
                      onChange={() => setQuestionForm({ ...questionForm, correctAnswer: String(i) })}
                      className="w-4 h-4"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...questionForm.options]
                        newOpts[i] = e.target.value
                        setQuestionForm({ ...questionForm, options: newOpts })
                      }}
                      placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                    />
                    {questionForm.options.length > 2 && (
                      <button
                        onClick={() => {
                          const newOpts = questionForm.options.filter((_, idx) => idx !== i)
                          setQuestionForm({ ...questionForm, options: newOpts, correctAnswer: '0' })
                        }}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {questionForm.options.length < 6 && (
                <button
                  onClick={() => setQuestionForm({ ...questionForm, options: [...questionForm.options, ''] })}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Thêm đáp án
                </button>
              )}
              <p className="text-xs text-gray-400 mt-2">Chọn đáp án đúng bằng cách nhấn radio button</p>
            </div>
          )}

          {questionForm.questionType === 'fill_in' && (
            <div>
              <Label>Đáp án đúng</Label>
              <Input
                value={questionForm.correctAnswer}
                onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                placeholder="Nhập đáp án đúng"
                className="mt-1"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowQuestionModal(false)}>Hủy</Button>
            <Button onClick={handleSaveQuestion} className="bg-blue-600 hover:bg-blue-700">
              {editingQuestion ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
