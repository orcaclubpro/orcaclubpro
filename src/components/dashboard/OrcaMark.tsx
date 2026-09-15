/**
 * The orca mark.
 *
 * The source art is a white silhouette on transparency, so an `<img>` of it is
 * invisible on the light themes. Drawn as a CSS mask filled with `currentColor`
 * instead, it takes the colour of whatever it sits in — white on Charcoal, ink on
 * Sonar and Light — from one asset, with no per-theme variants to keep in sync.
 *
 * `size` is the box; the artwork is inset inside its square canvas, so the orca
 * reads about a third smaller than the number you pass.
 */
export function OrcaMark({
  size = 34,
  className,
  style,
}: {
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  const mask = 'url(/orcaclubpro.png) center / contain no-repeat'
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: 'currentColor',
        WebkitMask: mask,
        mask,
        ...style,
      }}
    />
  )
}
