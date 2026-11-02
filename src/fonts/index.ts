import localFont from 'next/font/local'

// Self-hosted fonts. Every family is vendored here (latin subset, woff2, OFL
// license next to each) so `next build` never fetches fonts.googleapis.com —
// a build that depends on the network fails whenever Google is unreachable.
// Variable files cover the full weight range each family was loaded with.
// Import fonts from here; never switch back to the Google font loader.

// Site-wide sans (root layout) — weights 300–800
export const montserrat = localFont({
  src: './montserrat/Montserrat-latin-wght.woff2',
  weight: '300 800',
  style: 'normal',
  variable: '--font-montserrat',
  display: 'swap',
})

// Site-wide mono (root layout) — full variable range, as before
export const jetbrainsMono = localFont({
  src: './jetbrains-mono/JetBrainsMono-latin-wght.woff2',
  weight: '100 800',
  style: 'normal',
  variable: '--font-mono',
  display: 'swap',
})

// SONAR type system — reading serif, UI sans, data mono
export const sonarSerif = localFont({
  src: [
    { path: './newsreader/Newsreader-latin-wght.woff2', weight: '300 600', style: 'normal' },
    { path: './newsreader/Newsreader-latin-italic-wght.woff2', weight: '300 600', style: 'italic' },
  ],
  variable: '--font-sonar-serif',
  display: 'swap',
})

export const sonarSans = localFont({
  src: './jost/Jost-latin-wght.woff2',
  weight: '300 600',
  style: 'normal',
  variable: '--font-sonar-sans',
  display: 'swap',
})

export const sonarMono = localFont({
  src: './jetbrains-mono/JetBrainsMono-latin-wght.woff2',
  weight: '400 500',
  style: 'normal',
  variable: '--font-sonar-mono',
  display: 'swap',
})

// ORCACLUB wordmark — Cinzel Decorative 700
export const cinzelDecorative = localFont({
  src: './cinzel-decorative/CinzelDecorative-latin-700.woff2',
  weight: '700',
  style: 'normal',
  display: 'swap',
})

// Contact form display face — UnifrakturMaguntia 400
export const unifrakturMaguntia = localFont({
  src: './unifraktur-maguntia/UnifrakturMaguntia-latin-400.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
})
