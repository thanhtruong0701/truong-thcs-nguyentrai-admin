'use client'

import { useEffect, useState } from 'react'
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/modal'
import { Plus, Trash2, Edit2, FolderTree, Eye, EyeOff, ChevronRight } from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  link: string
  icon: string | null
  menuType: string | null
  parentId: string | null
  orderIndex: number
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}

const ICON_OPTIONS = [
  '📄', '📖', '📰', '📚', '📝', '📋', '📌', '📢',
  '⚖️', '🏫', '👨‍🏫', '👩‍🎓', '🎓', '🏆', '📅', '📊',
  '🤝', '💡', '📁', '🎬', '😊', '📞', '📧', '🔗',
  '🌟', '📷', '🖼️', '🎯', '🔔', '📜', '🏅', '🗓️',
]

export default function AdminMenusPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({
    label: '',
    link: '/',
    icon: '📄',
    menuType: 'page',
    parentId: '',
    orderIndex: 0,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  function toggleRow(id: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      const data = await getMenuItems()
      setItems(data as MenuItem[])
    } catch (error) {
      console.error('Failed to fetch menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingItem(null)
    const rootItems = items.filter(i => !i.parentId)
    setForm({ label: '', link: '/', icon: '📄', menuType: 'page', parentId: '', orderIndex: rootItems.length })
    setShowModal(true)
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item)
    setForm({
      label: item.label,
      link: item.link,
      icon: item.icon || '📄',
      menuType: item.menuType || 'page',
      parentId: item.parentId || '',
      orderIndex: item.orderIndex,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.label.trim()) {
      alert('Vui lòng nhập tên danh mục')
      return
    }
    if (form.menuType !== 'category' && !form.link.trim()) {
      alert('Vui lòng nhập đường dẫn')
      return
    }

    setSaving(true)
    try {
      const payload = {
        label: form.label,
        link: form.menuType === 'category' ? '#' : form.link,
        icon: form.icon,
        menuType: form.menuType,
        parentId: form.parentId || null,
        orderIndex: form.orderIndex,
      }

      if (editingItem) {
        await updateMenuItem(editingItem.id, payload)
      } else {
        await createMenuItem(payload)
      }
      setShowModal(false)
      await fetchItems()
    } catch (error) {
      alert(editingItem ? 'Lỗi khi cập nhật' : 'Lỗi khi tạo mới')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, label: string) {
    // Check if has children
    const hasChildren = items.some(i => i.parentId === id)
    if (hasChildren) {
      alert(`Không thể xóa "${label}" vì còn có menu con. Hãy xóa menu con trước.`)
      return
    }
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

  // Build tree structure
  const rootItems = items.filter(i => !i.parentId).sort((a, b) => a.orderIndex - b.orderIndex)
  const getChildren = (parentId: string) =>
    items.filter(i => i.parentId === parentId).sort((a, b) => a.orderIndex - b.orderIndex)

  // Root items only (for parent selector - exclude self and descendants when editing)
  const parentOptions = items.filter(i =>
    !i.parentId && // chỉ chọn root menu làm cha
    (!editingItem || i.id !== editingItem.id) // không chọn chính nó
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục</h1>
          <p className="text-gray-500 mt-1">Quản lý menu & danh mục con trên trang web</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Thêm danh mục
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 bg-blue-50 rounded-lg px-4 py-2">
        <span className="font-medium text-blue-700">Hướng dẫn:</span>
        <span>📂 <b>Danh mục cha</b> = nhóm chứa menu con (không có link)</span>
        <span>📄 <b>Trang</b> = dẫn đến trang nội dung</span>
        <span>↳ Menu con = thuộc về danh mục cha</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rootItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderTree className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">Chưa có danh mục nào</p>
          <Button onClick={openCreate}>Tạo danh mục đầu tiên</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Icon & Tên</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Đường dẫn</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Loại</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Thứ tự</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Hiển thị</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rootItems.map((item) => {
                const children = getChildren(item.id)
                const isExpanded = expandedRows.has(item.id)
                return (
                  <div key={item.id} className="contents">
                    {/* Root menu row */}
                    <tr className="hover:bg-gray-50 transition-colors bg-white">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {children.length > 0 ? (
                            <button
                              onClick={() => toggleRow(item.id)}
                              className="p-1 hover:bg-gray-200 rounded transition"
                              title={isExpanded ? 'Thu gọn mục con' : 'Xem mục con'}
                            >
                              <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          ) : (
                            <span className="w-6" />
                          )}
                          <span className="text-xl">{item.icon || '📄'}</span>
                          <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                          {children.length > 0 && (
                            <button
                              onClick={() => toggleRow(item.id)}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 font-medium transition cursor-pointer"
                            >
                              {children.length} mục con {isExpanded ? '▲' : '▼'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{item.link}</code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.menuType === 'category'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {item.menuType === 'category' ? '📂 Danh mục cha' : '📄 Trang'}
                        </span>
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

                    {/* Children rows - Chỉ hiện khi được mở */}
                    {isExpanded && children.map((child) => (
                      <tr key={child.id} className="hover:bg-blue-50/30 transition-colors bg-blue-50/10">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2 pl-6">
                            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-lg">{child.icon || '📄'}</span>
                            <span className="text-sm text-gray-700">{child.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <code className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">{child.link}</code>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                            ↳ Menu con
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-sm text-gray-400">{child.orderIndex}</span>
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleToggleVisibility(child.id, child.isVisible)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              child.isVisible
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {child.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {child.isVisible ? 'Hiện' : 'Ẩn'}
                          </button>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(child)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(child.id, child.label)}
                              disabled={deleting === child.id}
                              className="p-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </div>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
      >
        <div className="space-y-4 p-1">

          {/* Icon picker */}
          <div>
            <Label>Icon hiển thị</Label>
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {ICON_OPTIONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`w-9 h-9 text-xl rounded-lg border-2 flex items-center justify-center transition-all hover:scale-110 ${
                    form.icon === icon
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div className="mt-1 text-xs text-gray-400">Icon đã chọn: <span className="text-lg">{form.icon}</span></div>
          </div>

          {/* Loại menu */}
          <div>
            <Label>Loại danh mục</Label>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, menuType: 'page', link: form.link === '#' ? '/' : form.link })}
                className={`flex-1 py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.menuType === 'page'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                📄 Trang có nội dung
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, menuType: 'category', link: '#' })}
                className={`flex-1 py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.menuType === 'category'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                📂 Danh mục cha (nhóm)
              </button>
            </div>
          </div>

          {/* Tên */}
          <div>
            <Label htmlFor="label">Tên danh mục *</Label>
            <Input
              id="label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ví dụ: Giới thiệu, Tin tức, Học vụ..."
              className="mt-1"
            />
          </div>

          {/* Link - ẩn khi là category */}
          {form.menuType !== 'category' && (
            <div>
              <Label htmlFor="link">Đường dẫn (link) *</Label>
              <div className="mt-1 space-y-2">
                <select
                  value={
                    ['/', '/bai-viet', '/tai-lieu', '/tkb', '/gioi-thieu', '/tro-giup', '/thu-vien', '/lien-he', '/courses', '/quizzes'].includes(form.link)
                      ? form.link
                      : 'custom'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setForm({ ...form, link: e.target.value })
                    }
                  }}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                >
                  <option value="/">Trang chủ (/)</option>
                  <option value="/bai-viet">Trang bài viết (/bai-viet)</option>
                  <option value="/tai-lieu">Trang tài liệu học tập (/tai-lieu)</option>
                  <option value="/tkb">Trang Thời khóa biểu (/tkb)</option>
                  <option value="/gioi-thieu">Trang Giới thiệu (/gioi-thieu)</option>
                  <option value="/tro-giup">Trang Trợ giúp (/tro-giup)</option>
                  <option value="/thu-vien">Trang Thư viện (/thu-vien)</option>
                  <option value="/lien-he">Trang Liên hệ (/lien-he)</option>
                  <option value="/courses">Trang Khóa học (/courses)</option>
                  <option value="/quizzes">Trang Kiểm tra (/quizzes)</option>
                  <option value="custom">✏️ Nhập đường dẫn tùy chỉnh khác...</option>
                </select>

                <Input
                  id="link"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="Ví dụ: /gioi-thieu, /tin-tuc..."
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Chọn từ danh sách trang gợi ý trên hoặc tự gõ theo định dạng ví dụ: /tin-tuc</p>
            </div>
          )}

          {/* Parent menu */}
          <div>
            <Label htmlFor="parentId">Menu cha (để trống = menu chính)</Label>
            <select
              id="parentId"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              className="mt-1 w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">-- Không có (hiển thị ở menu chính) --</option>
              {parentOptions.map(item => (
                <option key={item.id} value={item.id}>
                  {item.icon || '📄'} {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Thứ tự */}
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
