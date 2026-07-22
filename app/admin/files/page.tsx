'use client'

import { useEffect, useState, useRef } from 'react'
import { getFileUploads, uploadFile, uploadMultipleFiles, deleteFileUpload } from '@/app/actions/files'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileDown, Upload, Trash2, FileText, FileSpreadsheet, FileArchive, File, Download, X, CheckCircle } from 'lucide-react'

interface FileUpload {
  id: string
  title: string
  description?: string | null
  fileUrl: string
  fileName: string
  fileType: string
  fileSize?: number | null
  category?: string | null
  downloadCount: number
  isPublished: boolean
  createdAt: Date
}

interface UploadProgress {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

const CATEGORIES = [
  { value: 'general', label: 'Chung' },
  { value: 'tai-lieu', label: 'Tài liệu' },
  { value: 'de-thi', label: 'Đề thi' },
  { value: 'phan-cong', label: 'Phân công' },
  { value: 'quy-che', label: 'Quy chế' },
  { value: 'bao-cao', label: 'Báo cáo' },
]

function getFileIcon(type: string) {
  switch (type) {
    case 'doc':
    case 'docx':
      return <FileText className="w-5 h-5 text-blue-600" />
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />
    case 'pdf':
      return <File className="w-5 h-5 text-red-600" />
    case 'rar':
    case 'zip':
      return <FileArchive className="w-5 h-5 text-yellow-600" />
    default:
      return <File className="w-5 h-5 text-gray-600" />
  }
}

function formatFileSize(bytes?: number) {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function AdminFilesPage() {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    try {
      const data = await getFileUploads()
      setFiles(data)
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList) return
    const filesArray = Array.from(fileList)
    setSelectedFiles(prev => [...prev, ...filesArray])
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) {
      alert('Vui lòng chọn file để upload')
      return
    }

    setUploading(true)
    const progress: UploadProgress[] = selectedFiles.map(file => ({
      file,
      status: 'pending' as const,
    }))
    setUploadProgress(progress)

    try {
      if (selectedFiles.length === 1) {
        // Upload single file with title
        const file = selectedFiles[0]
        const title = form.title.trim() || file.name.replace(/\.[^/.]+$/, '')
        setUploadProgress(prev => prev.map((p, i) => i === 0 ? { ...p, status: 'uploading' } : p))
        
        await uploadFile(file, title, form.description, form.category)
        
        setUploadProgress(prev => prev.map((p, i) => i === 0 ? { ...p, status: 'done' } : p))
      } else {
        // Upload multiple files - each file uses its own name as title
        await uploadMultipleFiles(selectedFiles, form.category)
        setUploadProgress(prev => prev.map(p => ({ ...p, status: 'done' })))
      }

      // Reset form after success
      setTimeout(() => {
        setForm({ title: '', description: '', category: 'general' })
        setSelectedFiles([])
        setUploadProgress([])
        setShowForm(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchFiles()
      }, 1000)
    } catch (error: any) {
      setUploadProgress(prev => prev.map(p => 
        p.status === 'pending' || p.status === 'uploading' 
          ? { ...p, status: 'error', error: error.message } 
          : p
      ))
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa file "${title}"?`)) return

    setDeleting(id)
    try {
      await deleteFileUpload(id)
      setFiles(files.filter(f => f.id !== id))
    } catch (error) {
      alert('Lỗi khi xóa file')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tài liệu</h1>
          <p className="text-gray-500 mt-1">Quản lý tài liệu tải về (doc, excel, pdf, rar, zip)</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4" />
          Upload file
        </Button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Upload file mới</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Tên file (chỉ khi upload 1 file)</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Để trống sẽ dùng tên file gốc"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Danh mục</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Mô tả (áp dụng cho tất cả file)</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về file..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="file">Chọn file (doc, docx, xls, xlsx, pdf, rar, zip - tối đa 50MB/file, chọn nhiều file được)</Label>
            <input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".doc,.docx,.xls,.xlsx,.pdf,.rar,.zip"
              multiple
              onChange={handleFileSelect}
              className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {/* Selected files list */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-500">Đã chọn {selectedFiles.length} file:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.name.split('.').pop() || '')}
                        <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                        <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload progress */}
            {uploadProgress.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-500">Tiến trình upload:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadProgress.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        {item.status === 'done' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : item.status === 'error' ? (
                          <X className="w-4 h-4 text-red-500" />
                        ) : item.status === 'uploading' ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <div className="w-4 h-4 bg-gray-300 rounded-full" />
                        )}
                        <span className="text-sm text-gray-700 truncate max-w-xs">{item.file.name}</span>
                        {item.error && <span className="text-xs text-red-500">({item.error})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => { setShowForm(false); setSelectedFiles([]); setUploadProgress([]) }}>
              Hủy
            </Button>
            <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0} className="bg-blue-600 hover:bg-blue-700">
              {uploading ? 'Đang upload...' : `Upload ${selectedFiles.length > 1 ? `${selectedFiles.length} file` : ''}`}
            </Button>
          </div>
        </div>
      )}

      {/* Files List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileDown className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">Chưa có file nào</p>
          <Button onClick={() => setShowForm(true)}>Upload file đầu tiên</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{file.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{file.fileName}</span>
                    <span className="uppercase bg-gray-100 px-1.5 py-0.5 rounded">{file.fileType}</span>
                    <span>{formatFileSize(file.fileSize || undefined)}</span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {file.downloadCount || 0}
                    </span>
                    {file.category && (
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {CATEGORIES.find(c => c.value === file.category)?.label || file.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Tải về"
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id, file.title)}
                    disabled={deleting === file.id}
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
