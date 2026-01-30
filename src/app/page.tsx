import { redirect } from 'next/navigation'
import { auth } from '@/auth/auth'

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const firstWorkspace = session.user.workspaces?.[0]
  if (firstWorkspace) {
    redirect(`/${firstWorkspace.slug}`)
  }

  redirect('/dashboard')
}
