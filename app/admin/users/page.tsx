'use client'

import { useEffect, useState } from 'react'
import { getAllUsers, createUser, deleteUser, updateUserRole } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/modal'
import { Plus, Trash2, Users, Shield, GraduationCap, User } from 'lucide-react'

interface User {
  id: string
  name?: string | null
  email: string
  role: string
  createdAt: Date
}

const roleLabels: Record<string, string> = {
  admin: 'Quản trị',
  teacher: 'Giáo viên',
  student: 'Học sinh',
}

const roleIcons: Record<string, any> = {
  admin: Shield,
  teacher: GraduationCap,
  student: User,
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin')
      return
    }

    setSaving(true)
    try {
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role as 'admin' | 'teacher' | 'student',
      })
      setShowModal(false)
      setForm({ name: '', email: '', password: '', role: 'student' })
      await fetchUsers()
    } catch (error) {
      alert('Lỗi khi tạo người dùng')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa người dùng "${name}"?`)) return
    setDeleting(id)
    try {
      await deleteUser(id)
      setUsers(users.filter(u => u.id !== id))
    } catch (error) {
      alert('Lỗi khi xóa')
    } finally {
      setDeleting(null)
    }
  }

  async function handleChangeRole(id: string, newRole: string) {
    try {
      await updateUserRole(id, newRole as 'admin' | 'teacher' | 'student')
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    } catch (error) {
      alert('Lỗi khi cập nhật vai trò')
    }
  }

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
          <p className="text-gray-500 mt-1">Quản lý tài khoản người dùng</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'admin', 'teacher', 'student'].map(role => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === role
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {role === 'all' ? 'Tất cả' : roleLabels[role]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Chưa có người dùng nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Họ tên</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Vai trò</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Ngày tạo</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(user => {
                  const RoleIcon = roleIcons[user.role] || User
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {(user.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{user.name || 'Chưa đặt tên'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}
                        >
                          <option value="student">Học sinh</option>
                          <option value="teacher">Giáo viên</option>
                          <option value="admin">Quản trị</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleDelete(user.id, user.name || user.email)}
                            disabled={deleting === user.id}
                            className="p-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Thêm người dùng mới"
      >
        <div className="space-y-4">
          <div>
            <Label>Họ và tên *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nguyễn Văn A"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Mật khẩu *</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Vai trò</Label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="mt-1 w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
              <option value="admin">Quản trị</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Đang tạo...' : 'Tạo mới'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
