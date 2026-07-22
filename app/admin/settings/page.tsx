'use client'

import { useEffect, useState } from 'react'
import { getSettings, saveSettings } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Palette } from 'lucide-react'

const COLOR_PRESETS = [
  { name: 'Xanh navy', primary: '#1e3a5f', gradient: 'from-blue-900 via-blue-800 to-blue-900' },
  { name: 'Xanh dương', primary: '#1e40af', gradient: 'from-blue-700 via-blue-600 to-blue-700' },
  { name: 'Xanh lá', primary: '#166534', gradient: 'from-green-800 via-green-700 to-green-800' },
  { name: 'Tím', primary: '#581c87', gradient: 'from-purple-900 via-purple-800 to-purple-900' },
  { name: 'Đỏ đậm', primary: '#991b1b', gradient: 'from-red-900 via-red-800 to-red-900' },
  { name: 'Cam', primary: '#9a3412', gradient: 'from-orange-800 via-orange-700 to-orange-800' },
  { name: 'Đen', primary: '#1c1917', gradient: 'from-gray-900 via-gray-800 to-gray-900' },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await saveSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      alert('Lỗi khi lưu cài đặt')
    } finally {
      setSaving(false)
    }
  }

  function applyPreset(preset: typeof COLOR_PRESETS[0]) {
    setSettings(prev => ({
      ...prev,
      primaryColor: preset.primary,
      headerGradient: preset.gradient,
    }))
  }

  function updateSetting(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div className="text-gray-500 py-12 text-center">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
          <p className="text-gray-500 mt-1">Cài đặt thông tin trường học và giao diện</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu thay đổi'}
        </Button>
      </div>

      {/* Color Customization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Tùy chỉnh màu sắc
        </h2>

        <div className="mb-4">
          <Label>Màu chủ đạo</Label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="color"
              value={settings.primaryColor || '#1e3a5f'}
              onChange={(e) => updateSetting('primaryColor', e.target.value)}
              className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
            />
            <Input
              value={settings.primaryColor || '#1e3a5f'}
              onChange={(e) => updateSetting('primaryColor', e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <div>
          <Label>Màu preset nhanh</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {COLOR_PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  settings.primaryColor === preset.primary
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: preset.primary }}
                />
                <span className="text-sm">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6">
          <Label>Xem trước</Label>
          <div className={`mt-2 bg-gradient-to-r ${settings.headerGradient || 'from-blue-900 via-blue-800 to-blue-900'} rounded-lg p-4 text-white`}>
            <p className="font-bold">{settings.schoolName || 'Tên trường'}</p>
            <p className="text-sm opacity-80">{settings.schoolAddress || 'Địa chỉ'}</p>
          </div>
        </div>
      </div>

      {/* School Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Thông tin trường học</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tên trường</Label>
            <Input
              value={settings.schoolName || ''}
              onChange={(e) => updateSetting('schoolName', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={settings.schoolWebsite || ''}
              onChange={(e) => updateSetting('schoolWebsite', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Địa chỉ</Label>
            <Input
              value={settings.schoolAddress || ''}
              onChange={(e) => updateSetting('schoolAddress', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Điện thoại</Label>
            <Input
              value={settings.schoolPhone || ''}
              onChange={(e) => updateSetting('schoolPhone', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={settings.schoolEmail || ''}
              onChange={(e) => updateSetting('schoolEmail', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Quản lý nội dung</Label>
            <Input
              value={settings.schoolManager || ''}
              onChange={(e) => updateSetting('schoolManager', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Giờ làm việc</Label>
            <Input
              value={settings.workingHours || ''}
              onChange={(e) => updateSetting('workingHours', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
