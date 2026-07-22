import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const cookieStore = await cookies()
  const session = cookieStore.get('user-session')
  const role = cookieStore.get('user-role')

  // If already logged in as admin, redirect to admin or redirect URL
  if (session && role?.value === 'admin') {
    const params = await searchParams
    redirect(params.redirect || '/admin')
  }

  return <AuthForm mode="sign-in" />
}
