'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bell, BookOpen, Users, Menu, Settings, ArrowRight, TrendingUp, FileDown, ClipboardCheck } from 'lucide-react'
import { getDashboardStats } from '@/app/actions/admin'

interface Stats {
  announcements: number
  courses: number
  users: number
  lessons: number
  files: number
  quizzes: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ announcements: 0, courses: 0, users: 0, lessons: 0, files: 0, quizzes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Thông báo', value: stats.announcements, icon: Bell, color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50' },
    { label: 'Khóa học', value: stats.courses, icon: BookOpen, color: 'from-green-500 to-green-600', bgLight: 'bg-green-50' },
    { label: 'Tài liệu', value: stats.files, icon: FileDown, color: 'from-orange-500 to-orange-600', bgLight: 'bg-orange-50' },
    { label: 'Bài kiểm tra', value: stats.quizzes, icon: ClipboardCheck, color: 'from-purple-500 to-purple-600', bgLight: 'bg-purple-50' },
  ]

  const adminActions = [
    {
      title: 'Quản lý Thông báo',
      description: 'Thêm, chỉnh sửa, xóa thông báo. Ghim thông báo quan trọng lên đầu trang.',
      icon: Bell,
      href: '/admin/announcements',
      color: 'text-blue-600',
      bgLight: 'bg-blue-50',
      count: stats.announcements,
    },
    {
      title: 'Quản lý Khóa học',
      description: 'Tạo khóa học, quản lý bài giảng và tài liệu học tập cho học sinh.',
      icon: BookOpen,
      href: '/admin/courses',
      color: 'text-green-600',
      bgLight: 'bg-green-50',
      count: stats.courses,
    },
    {
      title: 'Quản lý Danh mục',
      description: 'Thêm, chỉnh sửa, sắp xếp các mục menu trên trang web.',
      icon: Menu,
      href: '/admin/menus',
      color: 'text-orange-600',
      bgLight: 'bg-orange-50',
    },
    {
      title: 'Quản lý Tài liệu',
      description: 'Upload và quản lý tài liệu tải về (doc, excel, pdf, rar, zip).',
      icon: FileDown,
      href: '/admin/files',
      color: 'text-red-600',
      bgLight: 'bg-red-50',
      count: stats.files,
    },
    {
      title: 'Bài kiểm tra',
      description: 'Tạo và quản lý bài kiểm tra cho học sinh với nhiều loại câu hỏi.',
      icon: ClipboardCheck,
      href: '/admin/quizzes',
      color: 'text-purple-600',
      bgLight: 'bg-purple-50',
      count: stats.quizzes,
    },
    {
      title: 'Quản lý Người dùng',
      description: 'Quản lý tài khoản giáo viên, học sinh và phân quyền truy cập.',
      icon: Users,
      href: '/admin/users',
      color: 'text-gray-600',
      bgLight: 'bg-gray-100',
      count: stats.users,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
        <p className="text-gray-500 mt-1">Chào mừng trở lại! Quản lý nội dung trường học.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgLight} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stat.value}
                </span>
              </div>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quản lý nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${action.bgLight} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    {action.count !== undefined && action.count > 0 && (
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                        {action.count}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {action.description}
                  </p>
                  <div className="flex items-center text-sm text-blue-600 font-medium">
                    Quản lý <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
