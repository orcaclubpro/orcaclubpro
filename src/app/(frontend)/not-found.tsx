import Link from 'next/link'

// Prevent static generation of this page
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-intelligence-cyan mb-4">404</h1>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-intelligence-cyan text-black font-semibold rounded-lg hover:bg-intelligence-cyan/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
