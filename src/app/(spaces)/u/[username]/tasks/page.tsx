import { redirect } from 'next/navigation'

export default async function TasksRedirectPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  redirect(`/u/${username}?tab=tasks`)
}
