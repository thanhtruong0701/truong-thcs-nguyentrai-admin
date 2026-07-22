'use client'

import { useEffect, useState } from 'react'
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/modal'
import { Plus, Trash2, Edit2, FolderTree, GripVertical, Eye, EyeOff } from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  link: string
  orderIndex: number
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}

export default function AdminMenusPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({ label: '', link: '', orderIndex: 0 })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      const data = await getMenuItems()
      setItems(data)
    } catch (error) {
      console.error('Failed to fetch menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingItem(null)
    setForm({ label: '', link: '/', orderIndex: items.length })
    setShowModal(true)
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item)
    setForm({ label: item.label, link: item.link, orderIndex: item.orderIndex })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.label.trim() || !form.link.trim()) {
      alert('Vui lòng nhập đầy đủ tên và đường dẫn')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, form)
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...form, updatedAt: new Date() } : i))
      } else {
        const result = await createMenuItem(form)
        setItems([...items, result].sort((a, b) => a.orderIndex - b.orderIndex))
      }
      setShowModal(false)
    } catch (error) {
      alert(editingItem ? 'Lỗi khi cập nhật' : 'Lỗi khi tạo mới')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Xóa danh mục "${label}"?`)) return

    setDeleting(id)
    try {
      await deleteMenuItem(id)
      setItems(items.filter(i => i.id !== id))
    } catch (error) {
      alert('Lỗi khi xóa')
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggleVisibility(id: string, isVisible: boolean) {
    try {
      await updateMenuItem(id, { isVisible: !isVisible })
      setItems(items.map(i => i.id === id ? { ...i, isVisible: !isVisible } : i))
    } catch (error) {
      alert('Lỗi khi cập nhật')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục</h1>
          <p className="text-gray-500 mt-1">Quản lý các mục menu trên trang web</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Thêm danh mục
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderTree className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">Chưa có danh mục nào</p>
          <Button onClick={openCreate}>Tạo danh mục đầu tiên</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">STT</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Tên</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Đường dẫn</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Thứ tự</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Hiển thị</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{item.link}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{item.orderIndex}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleVisibility(item.id, item.isVisible)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          item.isVisible
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {item.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {item.isVisible ? 'Hiện' : 'Ẩn'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.label)}
                          disabled={deleting === item.id}
                          className="p-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
      >
        <div className="space-y-4 p-1">
          <div>
            <Label htmlFor="label">Tên danh mục</Label>
            <Input
              id="label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ví dụ: Giới thiệu, Tin tức..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="link">Đường dẫn (link)</Label>
            <Input
              id="link"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="Ví dụ: /about, /tin-tuc..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="order">Thứ tự hiển thị</Label>
            <Input
              id="order"
              type="number"
              value={form.orderIndex}
              onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
