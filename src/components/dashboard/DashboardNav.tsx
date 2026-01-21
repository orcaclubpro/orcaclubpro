'use client'

import Link from 'next/link'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import type { User } from '@/types/payload-types'

export function DashboardNav({ user }: { user: User }) {
  const handleLogout = async () => {
    await logoutAction()
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/u/${user.username}`} className="text-xl font-bold">
            <span className="text-white">ORCA</span>
            <span className="gradient-text">CLUB</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Link
              href={`/u/${user.username}`}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href={`/u/${user.username}/projects`}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Projects
            </Link>
            <Link
              href={`/u/${user.username}/orders`}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Orders
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-700">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-700 hover:bg-gray-800"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
