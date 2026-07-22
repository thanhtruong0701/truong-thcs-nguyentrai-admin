'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadMaterial } from '@/app/actions/materials'

interface FileUploadProps {
  lessonId: string
  onSuccess?: () => void
}

export function FileUpload({ lessonId, onSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file || !title) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await uploadMaterial(lessonId, file, title)
      setFile(null)
      setTitle('')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Tải lên tài liệu</h3>
      
      <div>
        <label className="block text-sm font-medium mb-1">Tiêu đề</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề tài liệu"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tập tin</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={isLoading}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mov,.zip"
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Hỗ trợ: PDF, Word, Excel, PowerPoint, Hình ảnh, Video
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Đang tải...' : 'Tải lên'}
      </Button>
    </form>
  )
}
