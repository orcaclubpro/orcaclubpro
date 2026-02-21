import { getCurrentUser } from '@/actions/auth'
import { Header } from './header'

export async function HeaderServer() {
  const user = await getCurrentUser()
  return <Header user={user} />
}
