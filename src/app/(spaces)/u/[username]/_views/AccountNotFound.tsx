import { HelpCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Rendered by client-experience tab pages when the user's client account is
// missing or stale (resolveClientAccount returned null).
export function AccountNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-16 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-5">
          <HelpCircle className="size-7 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--space-text-primary)] mb-2">Account Not Found</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Your client account could not be found. Please contact support for assistance.
        </p>
        <Button asChild size="sm" className="bg-[var(--space-accent)] text-white hover:bg-[var(--space-accent)]/90 font-medium">
          <a href="/contact" className="gap-2">
            <Mail className="size-3.5" />
            Contact Support
          </a>
        </Button>
      </div>
    </div>
  )
}
