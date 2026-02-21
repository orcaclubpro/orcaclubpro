import { redirect } from 'next/navigation'

export default async function ProjectsRedirectPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  redirect(`/u/${username}?tab=projects`)
}
