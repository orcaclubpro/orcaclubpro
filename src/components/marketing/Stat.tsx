export type StatProps = {
  /** The big number/figure, e.g. '53%' or '2.4s'. */
  value: string
  /** What the figure means. */
  label: string
  /** Cited source — always attribute third-party figures. */
  source?: { name: string; url: string }
}

/**
 * Stat with optional cited source. Styled from the existing card + figure
 * tokens (black/40 card, extralight cyan figure, gray-400 label).
 */
export function Stat({ value, label, source }: StatProps) {
  return (
    <div className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl h-full">
      <p className="text-3xl md:text-4xl font-extralight text-cyan-400 mb-2">{value}</p>
      <p className="text-sm text-gray-400 font-light leading-relaxed">{label}</p>
      {source && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs text-gray-500 font-light underline underline-offset-4 decoration-white/20 hover:text-gray-300 transition-colors"
        >
          Source: {source.name}
        </a>
      )}
    </div>
  )
}
