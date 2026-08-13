import Image from 'next/image'

export type Author = {
  name: string
  role: string
  blurb: string
  /** Local /public path preferred (remote hosts need next.config image config). */
  avatarUrl?: string
}

/**
 * Compact author block for spoke pages. Card styling matches the newer-page
 * pattern (bg-white/5, border-white/10).
 */
export function AuthorBio({ name, role, blurb, avatarUrl }: Author) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex items-start gap-4 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-sm font-light shrink-0"
        >
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-white font-medium">{name}</p>
        <p className="text-sm text-cyan-400/70 font-light mb-2">{role}</p>
        <p className="text-sm text-gray-400 font-light leading-relaxed">{blurb}</p>
      </div>
    </div>
  )
}
