import { redirect } from 'next/navigation'
import { auth } from '@/auth/auth'
import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const { workspaceSlug } = await params

  // Verify user has access to this workspace
  const workspace = session.user.workspaces?.find((w) => w.slug === workspaceSlug)

  if (!workspace) {
    // Redirect to first workspace or signin
    const first = session.user.workspaces?.[0]
    if (first) {
      redirect(`/${first.slug}`)
    }
    redirect('/auth/signin')
  }

  return <WorkspaceProvider>{children}</WorkspaceProvider>
}
