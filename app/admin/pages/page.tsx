'use client'

import { useEffect, useState, useRef } from 'react'
import { getPages, createPage, deletePage, updatePage, uploadPageImage, uploadPageFile } from '@/app/actions/pages'
import { getMenuItems } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/modal'
import { Plus, Trash2, Edit2, FileText, Eye, EyeOff, Upload, X, File, Image as ImageIcon } from 'lucide-react'

interface Attachment {
  url: string
  name: string
  type: string
  isImage: boolean
  allowDownload: boolean  // cho phép tải xuống
}

interface Page {
  id: string
  menuItemId: string | null
  title: string
  content: string
  imageUrl?: string | null
  files?: string | null
  isPublished: boolean
  createdAt: Date
  menuLabel?: string | null
}

interface MenuItem {
  id: string
  label: string
  link: string
}

function getFileIcon(type: string) {
  if (type?.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />
  if (type?.includes('word') || type?.includes('document')) return <FileText className="w-4 h-4 text-blue-500" />
  if (type?.includes('excel') || type?.includes('spreadsheet')) return <FileText className="w-4 h-4 text-green-500" />
  return <File className="w-4 h-4 text-gray-500" />
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
    attachments: [] as Attachment[],
  })

  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    Promise.all([getPages(), getMenuItems()])
      .then(([p, m]) => { setPages(p); setMenuItemsList(m) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setEditingPage(null)
    setForm({ menuItemId: '', title: '', content: '', imageUrl: '', attachments: [] })
    setShowModal(true)
  }

  function openEdit(page: Page) {
    setEditingPage(page)
    let attachments: Attachment[] = []
    try { if (page.files) attachments = JSON.parse(page.files) } catch {}
    setForm({
      menuItemId: page.menuItemId || '',
      title: page.title,
      content: page.content,
      imageUrl: page.imageUrl || '',
      attachments,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung'); return
    }
    setSaving(true)
    try {
      const filesJson = form.attachments.length > 0 ? JSON.stringify(form.attachments) : null
      if (editingPage) {
        await updatePage(editingPage.id, {
          menuItemId: form.menuItemId || null,
          title: form.title, content: form.content,
          imageUrl: form.imageUrl || undefined,
          files: filesJson || undefined,
        })
      } else {
        await createPage({
          menuItemId: form.menuItemId || null,
          title: form.title, content: form.content,
          imageUrl: form.imageUrl || undefined,
          files: filesJson || undefined,
        })
      }
      setShowModal(false)
      const data = await getPages(); setPages(data)
    } catch { alert('Lỗi khi lưu') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa bài viết "${title}"?`)) return
    setDeleting(id)
    try { await deletePage(id); setPages(pages.filter(p => p.id !== id)) }
    catch { alert('Lỗi khi xóa') }
    finally { setDeleting(null) }
  }

  async function handleTogglePublish(id: string, isPublished: boolean) {
    try {
      await updatePage(id, { isPublished: !isPublished })
      setPages(pages.map(p => p.id === id ? { ...p, isPublished: !isPublished } : p))
    } catch { alert('Lỗi khi cập nhật') }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Ảnh phải nhỏ hơn 5MB'); return }
    setUploadingImage(true)
    try {
      const url = await uploadPageImage(file)
      setForm(prev => ({ ...prev, imageUrl: url }))
    } catch { alert('Lỗi khi tải ảnh') }
    finally { setUploadingImage(false); if (imageInputRef.current) imageInputRef.current.value = '' }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 20 * 1024 * 1024) { alert('File phải nhỏ hơn 20MB'); return }
    setUploadingFile(true)
    try {
      const result = await uploadPageFile(file)
      setForm(prev => ({
        ...prev,
        // mặc định allowDownload = true khi upload mới
        attachments: [...prev.attachments, { url: result.url, name: result.name, type: result.type, isImage: false, allowDownload: true }]
      }))
    } catch { alert('Lỗi khi tải file') }
    finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  function removeAttachment(index: number) {
    setForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bài viết theo danh mục</h1>
          <p className="text-gray-500 mt-1">Thêm bài viết, nội dung cho từng danh mục trên menu</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Thêm bài viết
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Chưa có bài viết nào</p>
          <Button onClick={openCreate}>Thêm bài viết đầu tiên</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map(page => {
            let attachments: Attachment[] = []
            try { if (page.files) attachments = JSON.parse(page.files) } catch {}
            return (
              <div key={page.id} className={`bg-white rounded-xl border p-4 transition-all hover:shadow-sm ${page.isPublished ? 'border-gray-200' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{page.title}</h3>
                      {page.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full"><Eye className="w-3 h-3" /> Hiện</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full"><EyeOff className="w-3 h-3" /> Ẩn</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{page.content}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      {page.menuLabel && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{page.menuLabel}</span>}
                      {attachments.length > 0 && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{attachments.length} file</span>}
                      <span>{new Date(page.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleTogglePublish(page.id, page.isPublished)} className="p-2 rounded-lg hover:bg-gray-100 transition" title={page.isPublished ? 'Ẩn' : 'Hiện'}>
                      {page.isPublished ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-green-600" />}
                    </button>
                    <button onClick={() => openEdit(page)} className="p-2 rounded-lg hover:bg-gray-100 transition" title="Chỉnh sửa">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(page.id, page.title)} disabled={deleting === page.id} className="p-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50" title="Xóa">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPage ? 'Sửa bài viết' : 'Thêm bài viết mới'}>
        <div className="space-y-4">
          <div>
            <Label>Gắn vào danh mục</Label>
            <select value={form.menuItemId} onChange={(e) => setForm({ ...form, menuItemId: e.target.value })} className="mt-1 w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm">
              <option value="">-- Chọn danh mục --</option>
              {menuItemsList.map(item => <option key={item.id} value={item.id}>{item.label} ({item.link})</option>)}
            </select>
          </div>
          <div>
            <Label>Tiêu đề *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nhập tiêu đề..." className="mt-1" />
          </div>
          <div>
            <Label>Nội dung *</Label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Nhập nội dung..." rows={6} className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none" />
          </div>

          {/* Ảnh đại diện */}
          <div>
            <Label>Ảnh đại diện (tùy chọn)</Label>
            {form.imageUrl ? (
              <div className="relative mt-1">
                <img src={form.imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
                <button type="button" onClick={() => setForm({ ...form, imageUrl: '' })} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div onClick={() => imageInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition mt-1">
                {uploadingImage ? (
                  <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm text-gray-500">Đang tải...</span></div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">Nhấn để chọn ảnh (PNG, JPG, GIF - max 5MB)</span>
                  </div>
                )}
              </div>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          {/* File đính kèm - nhiều file */}
          <div>
            <Label>File đính kèm (nhiều file được, max 20MB/file)</Label>
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition mt-1">
              {uploadingFile ? (
                <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm text-gray-500">Đang tải...</span></div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Nhấn để chọn file (PDF, DOC, XLS, PPT, ZIP, RAR...)</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.mp4,.mov" onChange={handleFileUpload} className="hidden" />

            {/* Danh sách file đã chọn */}
            {form.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {form.attachments.map((att, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      {att.isImage ? <ImageIcon className="w-4 h-4 text-purple-500" /> : getFileIcon(att.type)}
                      <span className="text-sm text-gray-700 flex-1 truncate">{att.name}</span>
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Xem</a>
                      <button type="button" onClick={() => removeAttachment(i)} className="p-1 rounded hover:bg-red-100">
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    {/* Toggle cho phép tải */}
                    <div className="mt-2 flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={att.allowDownload}
                          onChange={(e) => {
                            setForm(prev => ({
                              ...prev,
                              attachments: prev.attachments.map((a, idx) =>
                                idx === i ? { ...a, allowDownload: e.target.checked } : a
                              )
                            }))
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <span className="text-xs text-gray-600">
                          {att.allowDownload
                            ? <span className="text-green-600 font-medium">✅ Cho phép tải xuống</span>
                            : <span className="text-gray-400">🔒 Không cho tải</span>
                          }
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
