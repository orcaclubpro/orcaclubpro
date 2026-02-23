import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ProjectTabNavProps {
  activeTab: string
  basePath: string
}

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'sprints', label: 'Sprints' },
]

export function ProjectTabNav({ activeTab, basePath }: ProjectTabNavProps) {
  return (
    <div className="flex items-center h-11 gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`${basePath}?tab=${tab.key}`}
          className={cn(
            'px-4 h-full flex items-center text-sm font-medium border-b-2 transition-colors duration-150',
            activeTab === tab.key
              ? 'border-intelligence-cyan text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
