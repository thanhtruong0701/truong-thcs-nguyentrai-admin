'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createAnnouncement, uploadAnnouncementImage, uploadAnnouncementFile } from '@/app/actions/announcements'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Upload, X, Image as ImageIcon, FileText } from 'lucide-react'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Hình ảnh phải nhỏ hơn 5MB')
      return
    }

    setUploadingImage(true)
    setError('')

    try {
      const url = await uploadAnnouncementImage(file)
      setImageUrl(url)
      setImagePreview(URL.createObjectURL(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải ảnh lên')
    } finally {
      setUploadingImage(false)
    }
  }

  function handleRemoveImage() {
    setImageUrl('')
    setImagePreview('')
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      setError('File phải nhỏ hơn 20MB')
      return
    }

    setUploadingFile(true)
    setError('')

    try {
      const result = await uploadAnnouncementFile(file)
      setFileUrl(result.url)
      setFileName(result.name)
      setFileType(result.type)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải file lên')
    } finally {
      setUploadingFile(false)
    }
  }

  function handleRemoveFile() {
    setFileUrl('')
    setFileName('')
    setFileType('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function getFileIcon(type: string) {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('powerpoint') || type.includes('presentation')) return '📑'
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return '📦'
    return '📁'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await createAnnouncement({
        title: formData.title,
        content: formData.content,
        imageUrl: imageUrl || undefined,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileType: fileType || undefined,
      })
      router.push('/admin/announcements')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo thông báo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/announcements" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thêm thông báo mới</h1>
        <p className="text-gray-500 mt-1">Tạo thông báo cho học sinh và giáo viên</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập tiêu đề thông báo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nội dung <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Nhập nội dung thông báo"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hình ảnh (tùy chọn)
          </label>

          {imagePreview ? (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => imageInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
            >
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Đang tải ảnh lên...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Nhấn để chọn ảnh</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (tối đa 5MB)</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File đính kèm (tùy chọn)
          </label>

          {fileUrl ? (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-2xl">{getFileIcon(fileType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                <p className="text-xs text-gray-500">{fileType}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
            >
              {uploadingFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Đang tải file lên...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Nhấn để chọn file</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR (tối đa 20MB)</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button type="submit" disabled={loading || uploadingImage || uploadingFile} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Đang tạo...' : 'Tạo thông báo'}
          </Button>
          <Link href="/admin/announcements">
            <Button type="button" variant="outline">Hủy</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
