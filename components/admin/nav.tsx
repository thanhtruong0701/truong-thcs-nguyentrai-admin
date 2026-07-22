'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Bell,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  FolderTree,
  FileDown,
  ClipboardCheck,
  FileText,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/announcements', label: 'Thông báo', icon: Bell },
  { href: '/admin/courses', label: 'Khóa học', icon: BookOpen },
  { href: '/admin/menus', label: 'Danh mục', icon: FolderTree },
  { href: '/admin/pages', label: 'Nội dung trang', icon: FileText },
  { href: '/admin/files', label: 'Tài liệu', icon: FileDown },
  { href: '/admin/quizzes', label: 'Kiểm tra', icon: ClipboardCheck },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
]

export default function AdminNav({ user }: { user: any }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    // Clear cookies server-side
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    // Also clear client-side cookies as fallback
    document.cookie = 'user-session=; path=/; max-age=0'
    document.cookie = 'user-role=; path=/; max-age=0'
    window.location.href = '/sign-in'
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-gray-900">Admin</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          {isOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
              <hr className="my-2 border-gray-100" />
              <a
                href={process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                <ExternalLink className="w-5 h-5" />
                <span className="text-sm">Trang web</span>
              </a>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition text-left"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Đăng xuất</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex lg:flex-col bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-base">NT</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Admin Panel</p>
            <p className="text-xs text-gray-500">THCS Nguyễn Trãi</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
          <hr className="my-4 border-gray-100" />
          <a
            href={process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="text-sm">Trang web</span>
          </a>
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {(user.name || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email || 'admin'}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-center gap-2 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>
    </>
  )
}
