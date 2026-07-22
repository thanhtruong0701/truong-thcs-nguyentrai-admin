'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllCourses, createCourse, deleteCourse, updateCourse } from '@/app/actions/courses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/modal'
import { Plus, Trash2, Edit2, BookOpen, Eye, EyeOff, FileText } from 'lucide-react'

interface Course {
  id: string
  title: string
  description?: string | null
  gradeLevel?: number | null
  teacherId: string
  isPublished: boolean
  createdAt: Date
  teacherName?: string | null
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    gradeLevel: '',
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    try {
      const data = await getAllCourses()
      setCourses(data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingCourse(null)
    setForm({ title: '', description: '', gradeLevel: '' })
    setShowModal(true)
  }

  function openEdit(course: Course) {
    setEditingCourse(course)
    setForm({
      title: course.title,
      description: course.description || '',
      gradeLevel: course.gradeLevel?.toString() || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim()) {
      alert('Vui lòng nhập tên khóa học')
      return
    }

    setSaving(true)
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, {
          title: form.title,
          description: form.description || undefined,
          gradeLevel: form.gradeLevel ? parseInt(form.gradeLevel) : undefined,
        })
      } else {
        await createCourse(
          form.title,
          form.description || undefined,
          form.gradeLevel ? parseInt(form.gradeLevel) : undefined
        )
      }
      setShowModal(false)
      await fetchCourses()
    } catch (error) {
      alert(editingCourse ? 'Lỗi khi cập nhật' : 'Lỗi khi tạo mới')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa khóa học "${title}"?`)) return
    setDeleting(id)
    try {
      await deleteCourse(id)
      setCourses(courses.filter(c => c.id !== id))
    } catch (error) {
      alert('Lỗi khi xóa')
    } finally {
      setDeleting(null)
    }
  }

  async function handleTogglePublish(id: string, isPublished: boolean) {
    try {
      await updateCourse(id, { isPublished: !isPublished })
      setCourses(courses.map(c => c.id === id ? { ...c, isPublished: !isPublished } : c))
    } catch (error) {
      alert('Lỗi khi cập nhật')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khóa học</h1>
          <p className="text-gray-500 mt-1">Quản lý khóa học và bài giảng</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Thêm khóa học
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">Chưa có khóa học nào</p>
          <Button onClick={openCreate}>Tạo khóa học đầu tiên</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <div
              key={course.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-sm ${
                course.isPublished ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    {course.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <Eye className="w-3 h-3" /> Xuất bản
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                        <EyeOff className="w-3 h-3" /> Nháp
                      </span>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-sm text-gray-500 line-clamp-1 mb-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {course.gradeLevel && <span>Lớp {course.gradeLevel}</span>}
                    {course.teacherName && <span>GV: {course.teacherName}</span>}
                    <span>{new Date(course.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="p-2 rounded-lg hover:bg-blue-50 transition"
                    title="Quản lý bài giảng"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                  </Link>
                  <button
                    onClick={() => handleTogglePublish(course.id, course.isPublished)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title={course.isPublished ? 'Gỡ xuất bản' : 'Xuất bản'}
                  >
                    {course.isPublished ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(course)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id, course.title)}
                    disabled={deleting === course.id}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCourse ? 'Sửa khóa học' : 'Thêm khóa học mới'}
      >
        <div className="space-y-4">
          <div>
            <Label>Tên khóa học *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ví dụ: Toán học lớp 6"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Mô tả</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về khóa học..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
            />
          </div>
          <div>
            <Label>Khối lớp</Label>
            <select
              value={form.gradeLevel}
              onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
              className="mt-1 w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">-- Chọn khối --</option>
              <option value="6">Lớp 6</option>
              <option value="7">Lớp 7</option>
              <option value="8">Lớp 8</option>
              <option value="9">Lớp 9</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Đang lưu...' : editingCourse ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
