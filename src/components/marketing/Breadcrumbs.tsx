import { Fragment } from 'react'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

/**
 * Same shape as breadcrumbSchema() from @/lib/seo/schema takes — build ONE
 * crumbs array per page and feed it to both, so the visible trail and the
 * BreadcrumbList JSON-LD never drift.
 */
export type Crumb = { name: string; path: string }

/** Small visible breadcrumb trail. Last crumb renders as the current page. */
export function Breadcrumbs({ crumbs, className = '' }: { crumbs: Crumb[]; className?: string }) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="text-sm text-gray-500 font-light">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          // The separator is its own <li>, so it must be a sibling of the item,
          // not nested inside it: <li> inside <li> is invalid HTML, the browser
          // re-parents it, and hydration fails (React #418) on every page with
          // two or more crumbs.
          return (
            <Fragment key={crumb.path}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-gray-300 font-light">{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="hover:text-white transition-colors">
                    <Link href={crumb.path}>{crumb.name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="text-gray-600" />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
