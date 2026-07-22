'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCourseById, getLessonsByCourse, getMaterialsByLesson, createLesson, deleteLesson, updateCourse } from '@/app/actions/courses'
import { uploadMaterial, deleteMaterial } from '@/app/actions/materials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/modal'
import { ArrowLeft, Plus, Trash2, Edit2, FileText, Upload, ChevronDown, ChevronRight, GripVertical, Download } from 'lucide-react'

interface Course {
  id: string
  title: string
  description?: string | null
  gradeLevel?: number | null
  isPublished: boolean
}

interface Lesson {
  id: string
  courseId: string
  title: string
  content?: string | null
  orderIndex: number
  createdAt: Date
}

interface Material {
  id: string
  lessonId: string
  title: string
  fileUrl: string
  fileType: string
  fileSize?: number | null
  createdAt: Date
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [materialsMap, setMaterialsMap] = useState<Record<string, Material[]>>({})
  const [loading, setLoading] = useState(true)
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  // Lesson modal
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonForm, setLessonForm] = useState({ title: '', content: '' })
  const [savingLesson, setSavingLesson] = useState(false)

  // Material upload
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      const [courseData, lessonsData] = await Promise.all([
        getCourseById(id),
        getLessonsByCourse(id),
      ])
      setCourse(courseData)
      setLessons(lessonsData)

      // Fetch materials for each lesson
      const materialsPromises = lessonsData.map(async (lesson) => {
        const mats = await getMaterialsByLesson(lesson.id)
        return { lessonId: lesson.id, materials: mats }
      })
      const materialsResults = await Promise.all(materialsPromises)
      const matsMap: Record<string, Material[]> = {}
      materialsResults.forEach(({ lessonId, materials }) => {
        matsMap[lessonId] = materials
      })
      setMaterialsMap(matsMap)
    } catch (error) {
      console.error('Failed to fetch course:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleLesson(lessonId: string) {
    setExpandedLessons(prev => {
      const next = new Set(prev)
      if (next.has(lessonId)) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })
  }

  // Lesson CRUD
  function openCreateLesson() {
    setEditingLesson(null)
    setLessonForm({ title: '', content: '' })
    setShowLessonModal(true)
  }

  function openEditLesson(lesson: Lesson) {
    setEditingLesson(lesson)
    setLessonForm({ title: lesson.title, content: lesson.content || '' })
    setShowLessonModal(true)
  }

  async function handleSaveLesson() {
    if (!lessonForm.title.trim()) {
      alert('Vui lòng nhập tên bài giảng')
      return
    }
    setSavingLesson(true)
    try {
      if (editingLesson) {
        // Update lesson - need to add updateLesson action
        // For now, just close modal
      } else {
        await createLesson(id, lessonForm.title, lessonForm.content || '', lessons.length)
      }
      setShowLessonModal(false)
      await fetchData()
    } catch (error) {
      alert('Lỗi khi lưu bài giảng')
    } finally {
      setSavingLesson(false)
    }
  }

  async function handleDeleteLesson(lessonId: string, title: string) {
    if (!confirm(`Xóa bài giảng "${title}"?`)) return
    try {
      await deleteLesson(lessonId)
      await fetchData()
    } catch (error) {
      alert('Lỗi khi xóa')
    }
  }

  // Material upload
  async function handleUploadMaterial(lessonId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      alert('File quá lớn. Tối đa 50MB')
      return
    }

    setUploadingLessonId(lessonId)
    setUploading(true)
    try {
      const title = file.name.replace(/\.[^/.]+$/, '')
      await uploadMaterial(lessonId, file, title)
      await fetchData()
    } catch (error) {
      alert('Lỗi khi tải file lên')
    } finally {
      setUploading(false)
      setUploadingLessonId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteMaterial(materialId: string) {
    if (!confirm('Xóa tài liệu này?')) return
    try {
      await deleteMaterial(materialId)
      await fetchData()
    } catch (error) {
      alert('Lỗi khi xóa')
    }
  }

  function formatFileSize(bytes?: number | null) {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (loading) {
    return <div className="text-gray-500 py-12 text-center">Đang tải...</div>
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Không tìm thấy khóa học</p>
        <Link href="/admin/courses"><Button variant="outline">Quay lại</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-500 mt-1">
            {course.description || 'Không có mô tả'}
            {course.gradeLevel && ` · Lớp ${course.gradeLevel}`}
          </p>
        </div>
      </div>

      {/* Lessons */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Bài giảng ({lessons.length})</h2>
          <Button onClick={openCreateLesson} size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Thêm bài
          </Button>
        </div>

        {lessons.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Chưa có bài giảng nào
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {lessons.map((lesson) => {
              const isExpanded = expandedLessons.has(lesson.id)
              const materials = materialsMap[lesson.id] || []

              return (
                <div key={lesson.id}>
                  <div className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition">
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                    <button
                      onClick={() => toggleLesson(lesson.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <span className="font-medium text-gray-900">{lesson.title}</span>
                      <span className="text-xs text-gray-400">({materials.length} tài liệu)</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setUploadingLessonId(lesson.id)
                          fileInputRef.current?.click()
                        }}
                        className="p-1.5 rounded hover:bg-blue-50 transition"
                        title="Tải file lên"
                      >
                        <Upload className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => openEditLesson(lesson)}
                        className="p-1.5 rounded hover:bg-gray-100 transition"
                        title="Sửa"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                        className="p-1.5 rounded hover:bg-red-50 transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: lesson content + materials */}
                  {isExpanded && (
                    <div className="px-6 pb-4 ml-7">
                      {lesson.content && (
                        <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{lesson.content}</p>
                      )}
                      {materials.length > 0 ? (
                        <div className="space-y-2">
                          {materials.map(mat => (
                            <div key={mat.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700 flex-1 truncate">{mat.title}</span>
                              <span className="text-xs text-gray-400">{mat.fileType.toUpperCase()}</span>
                              <span className="text-xs text-gray-400">{formatFileSize(mat.fileSize)}</span>
                              <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-white transition">
                                <Download className="w-4 h-4 text-blue-500" />
                              </a>
                              <button
                                onClick={() => handleDeleteMaterial(mat.id)}
                                className="p-1 rounded hover:bg-red-100 transition"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Chưa có tài liệu</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Hidden file input for material upload */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.mp4,.mov"
        onChange={(e) => {
          if (uploadingLessonId) {
            handleUploadMaterial(uploadingLessonId, e)
          }
        }}
      />

      {/* Create/Edit Lesson Modal */}
      <Modal
        isOpen={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        title={editingLesson ? 'Sửa bài giảng' : 'Thêm bài giảng mới'}
      >
        <div className="space-y-4">
          <div>
            <Label>Tên bài giảng *</Label>
            <Input
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              placeholder="Ví dụ: Bài 1 - Giới thiệu"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Nội dung</Label>
            <textarea
              value={lessonForm.content}
              onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
              placeholder="Mô tả nội dung bài giảng..."
              rows={4}
              className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowLessonModal(false)}>Hủy</Button>
            <Button onClick={handleSaveLesson} disabled={savingLesson} className="bg-blue-600 hover:bg-blue-700">
              {savingLesson ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
