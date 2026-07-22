'use client'

import { useEffect, useState } from 'react'
import { getPages, createPage, deletePage, updatePage, uploadPageImage } from '@/app/actions/pages'
import { getMenuItems } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/modal'
import { ImageUpload } from '@/components/image-upload'
import { Plus, Trash2, Edit2, FileText, Eye, EyeOff } from 'lucide-react'

interface Page {
  id: string
  menuItemId: string | null
  title: string
  content: string
  imageUrl?: string | null
  isPublished: boolean
  createdAt: Date
  menuLabel?: string | null
}

interface MenuItem {
  id: string
  label: string
  link: string
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [menuItemsList, setMenuItemsList] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    menuItemId: '',
    title: '',
    content: '',
    imageUrl: '',
  })

  useEffect(() => {
    Promise.all([getPages(), getMenuItems()])
      .then(([p, m]) => {
        setPages(p)
        setMenuItemsList(m)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setEditingPage(null)
    setForm({ menuItemId: '', title: '', content: '', imageUrl: '' })
    setShowModal(true)
  }

  function openEdit(page: Page) {
    setEditingPage(page)
    setForm({
      menuItemId: page.menuItemId || '',
      title: page.title,
      content: page.content,
      imageUrl: page.imageUrl || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung')
      return
    }

    setSaving(true)
    try {
      if (editingPage) {
        await updatePage(editingPage.id, {
          menuItemId: form.menuItemId || null,
          title: form.title,
          content: form.content,
          imageUrl: form.imageUrl || undefined,
        })
      } else {
        await createPage({
          menuItemId: form.menuItemId || null,
          title: form.title,
          content: form.content,
          imageUrl: form.imageUrl || undefined,
        })
      }
      setShowModal(false)
      // Refresh list
      const data = await getPages()
      setPages(data)
    } catch (error) {
      alert(editingPage ? 'Lỗi khi cập nhật' : 'Lỗi khi tạo mới')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa nội dung "${title}"?`)) return
    setDeleting(id)
    try {
      await deletePage(id)
      setPages(pages.filter(p => p.id !== id))
    } catch (error) {
      alert('Lỗi khi xóa')
    } finally {
      setDeleting(null)
    }
  }

  async function handleTogglePublish(id: string, isPublished: boolean) {
    try {
      await updatePage(id, { isPublished: !isPublished })
      setPages(pages.map(p => p.id === id ? { ...p, isPublished: !isPublished } : p))
    } catch (error) {
      alert('Lỗi khi cập nhật')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nội dung trang</h1>
          <p className="text-gray-500 mt-1">Quản lý nội dung hiển thị trên các danh mục</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Thêm nội dung
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">Chưa có nội dung nào</p>
          <Button onClick={openCreate}>Thêm nội dung đầu tiên</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map(page => (
            <div
              key={page.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-sm ${
                page.isPublished ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{page.title}</h3>
                    {page.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <Eye className="w-3 h-3" /> Hiện
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                        <EyeOff className="w-3 h-3" /> Ẩn
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{page.content}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {page.menuLabel && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {page.menuLabel}
                      </span>
                    )}
                    <span>{new Date(page.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePublish(page.id, page.isPublished)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title={page.isPublished ? 'Ẩn' : 'Hiện'}
                  >
                    {page.isPublished ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(page)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(page.id, page.title)}
                    disabled={deleting === page.id}
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
        title={editingPage ? 'Sửa nội dung' : 'Thêm nội dung mới'}
      >
        <div className="space-y-4">
          <div>
            <Label>Danh mục</Label>
            <select
              value={form.menuItemId}
              onChange={(e) => setForm({ ...form, menuItemId: e.target.value })}
              className="mt-1 w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">-- Không gắn danh mục --</option>
              {menuItemsList.map(item => (
                <option key={item.id} value={item.id}>{item.label} ({item.link})</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tiêu đề *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tiêu đề..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Nội dung *</Label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Nhập nội dung..."
              rows={8}
              className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
            />
          </div>
          <div>
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url || '' })}
              onUpload={uploadPageImage}
              label="Ảnh đại diện (tùy chọn)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Đang lưu...' : editingPage ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
