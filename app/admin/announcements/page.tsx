'use client'

import { useEffect, useState } from 'react'
import { getAnnouncements, deleteAnnouncement, togglePinAnnouncement } from '@/app/actions/announcements'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Star, Edit2, Bell } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  imageUrl?: string | null
  isPinned: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [pinning, setPinning] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    try {
      const data = await getAnnouncements()
      setAnnouncements(data)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Xóa thông báo "${title}"?`)) return

    setDeleting(id)
    try {
      await deleteAnnouncement(id)
      setAnnouncements(announcements.filter((a) => a.id !== id))
    } catch (error) {
      alert('Lỗi khi xóa thông báo')
    } finally {
      setDeleting(null)
    }
  }

  async function handleTogglePin(id: string, isPinned: boolean) {
    setPinning(id)
    try {
      await togglePinAnnouncement(id, !isPinned)
      setAnnouncements(
        announcements.map((a) =>
          a.id === id ? { ...a, isPinned: !isPinned } : a
        )
      )
    } catch (error) {
      alert('Lỗi khi ghim thông báo')
    } finally {
      setPinning(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-500 mt-1">Quản lý thông báo nhà trường</p>
        </div>
        <Link href="/admin/announcements/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Thêm thông báo
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">Chưa có thông báo nào</p>
          <Link href="/admin/announcements/new">
            <Button>Tạo thông báo đầu tiên</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-sm ${
                announcement.isPinned
                  ? 'border-blue-200 bg-blue-50/50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {announcement.imageUrl && (
                  <img
                    src={announcement.imageUrl}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {announcement.title}
                    </h3>
                    {announcement.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        <Star className="w-3 h-3 fill-current" />
                        Ghim
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(announcement.createdAt).toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePin(announcement.id, announcement.isPinned)}
                    disabled={pinning === announcement.id}
                    className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                    title={announcement.isPinned ? 'Bỏ ghim' : 'Ghim'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        announcement.isPinned
                          ? 'fill-blue-500 text-blue-500'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>

                  <Link href={`/admin/announcements/${announcement.id}/edit`}>
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </Link>

                  <button
                    onClick={() => handleDelete(announcement.id, announcement.title)}
                    disabled={deleting === announcement.id}
                    className="p-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
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
