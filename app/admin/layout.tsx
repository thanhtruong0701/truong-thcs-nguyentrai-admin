import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const userSession = cookieStore.get('user-session')
  const userRole = cookieStore.get('user-role')

  if (!userSession) {
    redirect('/sign-in')
  }

  if (userRole?.value !== 'admin') {
    redirect('/')
  }

  const user = {
    id: userSession.value,
    name: 'Quản trị viên',
    email: 'admin',
    role: 'admin',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} />

      {/* Main Content - offset by sidebar width on desktop */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
