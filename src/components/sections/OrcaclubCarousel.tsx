"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, X, Grid2X2, ChevronLeft, ChevronRight } from "lucide-react"
import { Cinzel_Decorative } from "next/font/google"

const cinzel = Cinzel_Decorative({ weight: "700", subsets: ["latin"] })

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SlideImage {
  url: string
  alt?: string
  caption?: string | null
  width?: number
  height?: number
}

export interface CarouselSlide {
  id?: string
  layout: 'horizontal' | 'vertical'
  category: 'event' | 'news' | 'merchandise' | 'announcement'
  images: SlideImage[]
  eyebrow?: string | null
  title: string
  subtitle?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
}

export interface OrcaclubCarouselProps {
  sectionLabel?: string
  slides: CarouselSlide[]
  autoPlay?: boolean
  autoPlayInterval?: number
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY = {
  event:        { label: 'Event',        color: '#67e8f9', bg: 'rgba(103,232,249,0.10)', border: 'rgba(103,232,249,0.28)' },
  news:         { label: 'News',         color: 'rgba(255,255,255,0.75)', bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.15)' },
  merchandise:  { label: 'Merchandise',  color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.28)' },
  announcement: { label: 'Announcement', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.28)' },
} as const

const fmt = (n: number) => String(n + 1).padStart(2, '0')

// ── Animation variants ─────────────────────────────────────────────────────────

const textContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
}
const textItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: 'easeIn' as const } },
}

// ── Photo Stack ────────────────────────────────────────────────────────────────

function PhotoStack({ images, onClick }: { images: SlideImage[]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const preview = images.slice(0, 3)
  const extra = images.length - 3

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex items-center gap-3 cursor-pointer"
      aria-label={`View all ${images.length} images`}
    >
      {/* Stacked thumbnails */}
      <div className="relative flex items-center" style={{ height: 36, width: `${preview.length * (hovered ? 30 : 22) + 14 + (extra > 0 ? (hovered ? 30 : 22) : 0)}px`, transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
        {preview.map((img, i) => (
          <div
            key={i}
            className="absolute w-9 h-9 rounded-lg overflow-hidden"
            style={{
              left: `${i * (hovered ? 30 : 22)}px`,
              zIndex: preview.length - i,
              transition: 'left 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)',
              transform: hovered ? 'rotate(0deg) scale(1.05)' : `rotate(${[-5, 4, -2][i] ?? 0}deg)`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              border: '1.5px solid rgba(255,255,255,0.2)',
            }}
          >
            {img.url && <Image src={img.url} alt={img.alt || ''} fill className="object-cover" sizes="36px" />}
          </div>
        ))}
        {extra > 0 && (
          <div
            className="absolute w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              left: `${preview.length * (hovered ? 30 : 22)}px`,
              zIndex: 0,
              transition: 'left 0.35s cubic-bezier(0.16,1,0.3,1)',
              background: 'rgba(0,0,0,0.65)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span className="text-white/55 text-[9px] font-semibold">+{extra + 1}</span>
          </div>
        )}
      </div>
      {/* Label */}
      <span className="text-[10px] text-white/30 tracking-[0.18em] uppercase font-light group-hover:text-white/60 transition-colors duration-200">
        {images.length} {images.length === 1 ? 'photo' : 'photos'}
      </span>
    </button>
  )
}

// ── Grid Modal ─────────────────────────────────────────────────────────────────

function GridModal({ slide, onClose }: { slide: CarouselSlide; onClose: () => void }) {
  const cat = CATEGORY[slide.category] ?? CATEGORY.news
  const images = slide.images
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  // Keyboard: Escape closes lightbox first, then grid
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxIdx !== null) setLightboxIdx(null)
        else onClose()
      }
      if (lightboxIdx !== null) {
        if (e.key === 'ArrowLeft')  setLightboxIdx(i => i !== null ? ((i - 1 + images.length) % images.length) : null)
        if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? ((i + 1) % images.length) : null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIdx, images.length, onClose])

  const cols = images.length === 1 ? 1 : 2

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[9000] flex flex-col"
      style={{ background: 'rgba(4,4,7,0.97)', backdropFilter: 'blur(20px) saturate(1.4)' }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 md:px-8 py-4 md:py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[0.12em] uppercase"
            style={{ color: cat.color, background: cat.bg, border: `1px solid ${cat.border}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
            {cat.label}
          </span>
          <h3 className="text-white/80 text-sm md:text-base font-light truncate">{slide.title}</h3>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <span className="text-white/25 text-xs hidden sm:block">
            {images.length} {images.length === 1 ? 'image' : 'images'}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
            aria-label="Close gallery"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {images.map((img, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.38, delay: i * 0.055, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setLightboxIdx(i)}
              className="relative group overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{
                // First image spans both columns if 3+ images
                gridColumn: images.length >= 3 && i === 0 ? '1 / -1' : undefined,
                aspectRatio: images.length >= 3 && i === 0
                  ? '16/7'
                  : slide.layout === 'vertical' ? '3/4' : '16/10',
              } as React.CSSProperties}
              aria-label={img.caption || `Image ${i + 1}`}
            >
              {img.url && (
                <Image
                  src={img.url}
                  alt={img.alt || img.caption || `Image ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority={i === 0}
                />
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Caption + index */}
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="flex items-end justify-between gap-2">
                  {img.caption && (
                    <p className="text-white/90 text-xs md:text-sm font-light leading-snug">{img.caption}</p>
                  )}
                  <span className="flex-shrink-0 text-[10px] text-white/40 font-light tabular-nums ml-auto">
                    {fmt(i)}
                  </span>
                </div>
              </div>
              {/* Click-to-expand icon hint */}
              <div className="absolute top-3 right-3 p-1.5 rounded-md bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm">
                <Grid2X2 size={11} className="text-white/60" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Internal lightbox — absolutely covers the grid modal */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.96)' }}
          >
            {/* Back to grid */}
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white text-xs tracking-wide transition-colors duration-200"
            >
              <ChevronLeft size={14} />
              Gallery
            </button>
            {/* Close all */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
            >
              <X size={17} />
            </button>
            {/* Prev */}
            {images.length > 1 && (
              <button
                onClick={() => setLightboxIdx(i => i !== null ? ((i - 1 + images.length) % images.length) : null)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/[0.07] border border-white/[0.10] text-white/50 hover:text-white hover:bg-white/[0.12] transition-all duration-200"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            {/* Next */}
            {images.length > 1 && (
              <button
                onClick={() => setLightboxIdx(i => i !== null ? ((i + 1) % images.length) : null)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/[0.07] border border-white/[0.10] text-white/50 hover:text-white hover:bg-white/[0.12] transition-all duration-200"
              >
                <ArrowRight size={16} />
              </button>
            )}
            {/* Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lightboxIdx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative max-w-[88vw] max-h-[78vh] w-full h-full"
              >
                {images[lightboxIdx]?.url && (
                  <Image
                    src={images[lightboxIdx].url}
                    alt={images[lightboxIdx].alt || images[lightboxIdx].caption || ''}
                    fill
                    className="object-contain"
                    sizes="88vw"
                    priority
                  />
                )}
              </motion.div>
            </AnimatePresence>
            {/* Caption + counter */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center pointer-events-none px-4">
              {images[lightboxIdx]?.caption && (
                <p className="text-white/60 text-sm font-light mb-1">{images[lightboxIdx].caption}</p>
              )}
              <p className="text-white/25 text-xs tracking-widest">
                {fmt(lightboxIdx)} / {fmt(images.length - 1)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Shared text content ────────────────────────────────────────────────────────

function SlideText({ slide, cat, onGridOpen }: {
  slide: CarouselSlide
  cat: typeof CATEGORY[keyof typeof CATEGORY]
  onGridOpen: () => void
}) {
  return (
    <motion.div
      variants={textContainer}
      initial="hidden"
      animate="show"
      exit="exit"
      className="flex flex-col gap-4"
    >
      {/* Category pill */}
      <motion.div variants={textItem}>
        <span
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: cat.color, background: cat.bg, border: `1px solid ${cat.border}` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
          {cat.label}
        </span>
      </motion.div>

      {/* Eyebrow */}
      {slide.eyebrow && (
        <motion.p variants={textItem} className="text-[11px] font-medium tracking-[0.22em] uppercase text-white/35">
          {slide.eyebrow}
        </motion.p>
      )}

      {/* Title */}
      <motion.h2 variants={textItem} className="text-3xl md:text-4xl lg:text-5xl font-extralight text-white leading-[1.06] tracking-tight">
        {slide.title}
      </motion.h2>

      {/* Subtitle */}
      {slide.subtitle && (
        <motion.p variants={textItem} className="text-sm text-white/40 font-light leading-relaxed max-w-[320px]">
          {slide.subtitle}
        </motion.p>
      )}

      {/* CTA + photo stack */}
      <motion.div variants={textItem} className="flex flex-wrap items-center gap-4 pt-1">
        {slide.ctaLabel && slide.ctaHref && (
          <Link
            href={slide.ctaHref}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-black bg-white hover:bg-white/92 transition-all duration-200 overflow-hidden hover:scale-[1.02] hover:shadow-lg hover:shadow-white/10"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative">{slide.ctaLabel}</span>
            <ArrowRight size={13} className="relative group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        )}
        {/* Photo stack — only if more than 1 image */}
        {slide.images.length > 1 && (
          <PhotoStack images={slide.images} onClick={onGridOpen} />
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Horizontal card ────────────────────────────────────────────────────────────

function HorizontalCard({ slide, active, totalSlides, onGridOpen, onPrev, onNext, progressKey, autoPlay, paused, interval, cat }: {
  slide: CarouselSlide
  active: number
  totalSlides: number
  onGridOpen: () => void
  onPrev: () => void
  onNext: () => void
  progressKey: number
  autoPlay: boolean
  paused: boolean
  interval: number
  cat: typeof CATEGORY[keyof typeof CATEGORY]
}) {
  const primaryImg = slide.images[0]

  return (
    <div
      className="relative overflow-hidden rounded-2xl cursor-pointer"
      style={{ height: 'clamp(420px, 60vh, 660px)', background: '#050508' }}
      onClick={slide.images.length === 1 ? onGridOpen : undefined}
    >
      {/* Background image — crossfade */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`img-h-${active}`}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1.0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {primaryImg?.url ? (
            <Image src={primaryImg.url} alt={primaryImg.alt || slide.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 85vw" priority={active === 0} />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient scrim — heavy left, fades right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(3,3,6,0.97) 0%, rgba(3,3,6,0.88) 26%, rgba(3,3,6,0.5) 50%, rgba(3,3,6,0.12) 72%, rgba(3,3,6,0.02) 100%)' }}
      />
      {/* Mobile scrim — from bottom */}
      <div
        className="absolute inset-0 md:hidden pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(3,3,6,0.95) 0%, rgba(3,3,6,0.6) 45%, rgba(3,3,6,0) 100%)' }}
      />

      {/* Ghost slide number */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`ghost-h-${active}`}
          className={`${cinzel.className} absolute -bottom-6 -left-3 select-none pointer-events-none leading-none`}
          style={{ fontSize: 'clamp(120px, 20vw, 240px)', color: 'rgba(103,232,249,0.032)' }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {fmt(active)}
        </motion.div>
      </AnimatePresence>

      {/* ORCACLUB watermark */}
      <div className={`${cinzel.className} absolute top-5 right-5 text-[9px] tracking-[0.3em] uppercase pointer-events-none select-none`} style={{ color: 'rgba(255,255,255,0.10)' }}>
        ORCACLUB
      </div>

      {/* Text content — desktop: left panel; mobile: bottom overlay */}
      <div className="absolute inset-y-0 left-0 flex flex-col justify-end md:justify-center px-7 md:px-10 lg:px-12 pb-10 md:pb-0 max-w-full md:max-w-[460px] xl:max-w-[500px]">
        <AnimatePresence mode="wait">
          <motion.div key={`text-h-${active}`}>
            <SlideText slide={slide} cat={cat} onGridOpen={onGridOpen} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Photo stack button — top right on image side (when multiple images) */}
      {slide.images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onGridOpen() }}
          className="absolute top-4 right-14 flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08]"
          style={{ border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <Grid2X2 size={12} className="text-white/40" />
          <span className="text-[10px] text-white/35 tracking-wider hidden sm:block">{slide.images.length} images</span>
        </button>
      )}

      {/* Arrow nav */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onPrev() }} className="p-2 rounded-full bg-black/40 border border-white/[0.10] text-white/45 hover:text-white hover:bg-black/60 transition-all duration-200 backdrop-blur-sm">
            <ArrowLeft size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNext() }} className="p-2 rounded-full bg-black/40 border border-white/[0.10] text-white/45 hover:text-white hover:bg-black/60 transition-all duration-200 backdrop-blur-sm">
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Vertical card ──────────────────────────────────────────────────────────────

const IMAGE_CYCLE_INTERVAL = 3200

function VerticalCard({ slide, active, totalSlides, onGridOpen, onPrev, onNext, cat }: {
  slide: CarouselSlide
  active: number
  totalSlides: number
  onGridOpen: () => void
  onPrev: () => void
  onNext: () => void
  cat: typeof CATEGORY[keyof typeof CATEGORY]
}) {
  const [imgIdx, setImgIdx]     = useState(0)
  const [imgHovered, setImgHovered] = useState(false)
  const images = slide.images
  const currentImg = images[imgIdx] ?? images[0]

  // Reset image index when slide changes
  useEffect(() => { setImgIdx(0) }, [active])

  // Auto-cycle images within the slide
  useEffect(() => {
    if (images.length <= 1 || imgHovered) return
    const id = setInterval(() => setImgIdx(i => (i + 1) % images.length), IMAGE_CYCLE_INTERVAL)
    return () => clearInterval(id)
  }, [images.length, imgHovered])

  return (
    <div className="flex justify-center">
      <div className="relative w-full">

        {/* Portrait card — full bleed image, text overlay */}
        <div
          className="relative overflow-hidden rounded-2xl w-full"
          style={{ height: 'clamp(640px, 88vh, 1000px)', background: '#050508' }}
          onMouseEnter={() => setImgHovered(true)}
          onMouseLeave={() => setImgHovered(false)}
        >
          {/* Images — crossfade cycle */}
          <AnimatePresence initial={false}>
            <motion.div
              key={`img-v-${active}-${imgIdx}`}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1.0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {currentImg?.url ? (
                <Image
                  src={currentImg.url}
                  alt={currentImg.alt || slide.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 100vw, 74vw"
                  priority={active === 0 && imgIdx === 0}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black" />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Bottom gradient scrim — text legibility only, image-forward */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(2,2,5,0.96) 0%, rgba(2,2,5,0.78) 22%, rgba(2,2,5,0.3) 44%, rgba(2,2,5,0) 64%)',
            }}
          />

          {/* Ghost slide number — very faint behind text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`ghost-v-${active}`}
              className={`${cinzel.className} absolute -bottom-4 left-3 select-none pointer-events-none leading-none`}
              style={{ fontSize: 'clamp(88px, 17vw, 190px)', color: 'rgba(103,232,249,0.025)' }}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {fmt(active)}
            </motion.div>
          </AnimatePresence>

          {/* Watermark — vertical right edge */}
          <div
            className={`${cinzel.className} absolute top-1/2 right-4 -translate-y-1/2 text-[7px] tracking-[0.5em] uppercase pointer-events-none select-none`}
            style={{ color: 'rgba(255,255,255,0.06)', writingMode: 'vertical-rl' }}
          >
            ORCACLUB
          </div>

          {/* ── Top bar: category + image counter + grid ── */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            {/* Category pill */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: cat.color, background: cat.bg, border: `1px solid ${cat.border}`, backdropFilter: 'blur(10px)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              {cat.label}
            </span>

            {/* Right: image dot strip + grid button */}
            <div className="flex items-center gap-2">
              {/* Dot progress — image cycling */}
              {images.length > 1 && (
                <div className="flex items-center gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setImgIdx(i) }}
                      className="transition-all duration-300"
                      style={{
                        width: i === imgIdx ? 16 : 5,
                        height: 5,
                        borderRadius: 3,
                        background: i === imgIdx ? cat.color : 'rgba(255,255,255,0.25)',
                      }}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
              {/* Grid button */}
              {images.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onGridOpen() }}
                  className="flex items-center gap-1 p-1.5 rounded-lg transition-all duration-200 hover:bg-white/[0.14]"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}
                  aria-label="View all images"
                >
                  <Grid2X2 size={12} className="text-white/45" />
                </button>
              )}
            </div>
          </div>

          {/* ── Image tap zones: left half = prev image, right half = next image ── */}
          {images.length > 1 && (
            <>
              <button
                className="absolute top-16 bottom-32 left-0 w-1/2 cursor-w-resize"
                onClick={(e) => { e.stopPropagation(); setImgIdx(i => ((i - 1 + images.length) % images.length)) }}
                aria-label="Previous image"
              />
              <button
                className="absolute top-16 bottom-32 right-0 w-1/2 cursor-e-resize"
                onClick={(e) => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length) }}
                aria-label="Next image"
              />
            </>
          )}

          {/* ── Text overlay — bottom zone ── */}
          <div className="absolute bottom-0 left-0 right-0 px-7 pb-7 md:px-9 md:pb-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-v-${active}`}
                variants={textContainer}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex flex-col gap-2"
              >
                {slide.eyebrow && (
                  <motion.p
                    variants={textItem}
                    className="text-[10px] font-medium tracking-[0.24em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.36)' }}
                  >
                    {slide.eyebrow}
                  </motion.p>
                )}

                <motion.h2
                  variants={textItem}
                  className="text-3xl md:text-4xl lg:text-5xl font-extralight text-white leading-[1.05] tracking-tight"
                >
                  {slide.title}
                </motion.h2>

                {slide.subtitle && (
                  <motion.p
                    variants={textItem}
                    className="text-sm font-light leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.46)' }}
                  >
                    {slide.subtitle}
                  </motion.p>
                )}

                <motion.div variants={textItem} className="flex items-center gap-3 pt-1">
                  {slide.ctaLabel && slide.ctaHref && (
                    <Link
                      href={slide.ctaHref}
                      onClick={(e) => e.stopPropagation()}
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black bg-white hover:bg-white/90 transition-all duration-200 hover:scale-[1.02]"
                    >
                      {slide.ctaLabel}
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                    </Link>
                  )}
                  {images.length > 1 && (
                    <PhotoStack images={images} onClick={onGridOpen} />
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Slide nav arrows — inside bottom-right, above text ── */}
          {totalSlides > 1 && (
            <div className="absolute bottom-[7rem] right-6 flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); onPrev() }}
                className="p-1.5 rounded-full text-white/35 hover:text-white hover:bg-white/[0.10] transition-all duration-200"
                style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(8px)' }}
              >
                <ArrowLeft size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onNext() }}
                className="p-1.5 rounded-full text-white/35 hover:text-white hover:bg-white/[0.10] transition-all duration-200"
                style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(8px)' }}
              >
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main carousel ──────────────────────────────────────────────────────────────

export default function OrcaclubCarousel({
  sectionLabel = 'ORCACLUB',
  slides,
  autoPlay = true,
  autoPlayInterval = 6000,
}: OrcaclubCarouselProps) {
  const [active, setActive]           = useState(0)
  const [paused, setPaused]           = useState(false)
  const [progressKey, setProgressKey] = useState(0)
  const [gridOpen, setGridOpen]       = useState(false)

  const interval = Math.max(autoPlayInterval, 2000)

  const go = useCallback((next: number) => {
    const clamped = ((next % slides.length) + slides.length) % slides.length
    setActive(clamped)
    setProgressKey(k => k + 1)
  }, [slides.length])

  const prev = useCallback(() => go(active - 1), [active, go])
  const next = useCallback(() => go(active + 1), [active, go])

  // Auto-advance (pause when grid is open)
  useEffect(() => {
    if (!autoPlay || paused || gridOpen || slides.length <= 1) return
    const id = setInterval(() => go(active + 1), interval)
    return () => clearInterval(id)
  }, [autoPlay, paused, gridOpen, active, interval, go, slides.length])

  if (!slides || slides.length === 0) return null

  const slide = slides[active]
  const cat   = CATEGORY[slide?.category ?? 'news'] ?? CATEGORY.news

  return (
    <>
      <section
        className="relative z-10 py-16 px-5 md:px-8 lg:px-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="max-w-7xl mx-auto">
          {/* Section label */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-5 bg-white/15" />
            <span className="text-[9px] tracking-[0.42em] uppercase text-white/18 font-light">{sectionLabel}</span>
          </div>

          {/* Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`card-${active}-${slide.layout}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {slide.layout === 'vertical' ? (
                <VerticalCard
                  slide={slide}
                  active={active}
                  totalSlides={slides.length}
                  onGridOpen={() => setGridOpen(true)}
                  onPrev={prev}
                  onNext={next}
                  cat={cat}
                />
              ) : (
                <HorizontalCard
                  slide={slide}
                  active={active}
                  totalSlides={slides.length}
                  onGridOpen={() => setGridOpen(true)}
                  onPrev={prev}
                  onNext={next}
                  progressKey={progressKey}
                  autoPlay={autoPlay}
                  paused={paused}
                  interval={interval}
                  cat={cat}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Bottom bar */}
          {slides.length > 1 && (
            <div className="mt-4">
              {/* Progress bar */}
              <div className="h-px bg-white/[0.06] rounded-full overflow-hidden mb-4">
                {autoPlay && !paused && !gridOpen && (
                  <motion.div
                    key={`prog-${progressKey}`}
                    className="h-full rounded-full"
                    style={{ background: cat.color }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: interval / 1000, ease: 'linear' }}
                  />
                )}
              </div>

              {/* Thumbnails + counter */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide pb-0.5">
                  {slides.map((s, i) => {
                    const thumb = s.images[0]
                    const isActive = i === active
                    return (
                      <button
                        key={i}
                        onClick={() => go(i)}
                        className="flex-shrink-0 relative overflow-hidden rounded-md transition-all duration-300"
                        style={{
                          width: 60, height: 40,
                          opacity: isActive ? 1 : 0.38,
                          transform: isActive ? 'scale(1.06)' : 'scale(1)',
                          outline: isActive ? `1.5px solid ${cat.color}` : '1.5px solid transparent',
                          outlineOffset: '2px',
                        }}
                        aria-label={`Slide ${i + 1}: ${s.title}`}
                      >
                        {thumb?.url ? (
                          <Image
                            src={thumb.url}
                            alt={s.title}
                            fill
                            className="object-cover"
                            style={{ filter: isActive ? 'grayscale(0)' : 'grayscale(1)' }}
                            sizes="60px"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-white/10" />
                        )}
                        {/* Vertical format indicator */}
                        {s.layout === 'vertical' && (
                          <div className="absolute bottom-0.5 right-0.5 w-1.5 h-2 rounded-sm bg-white/30" />
                        )}
                      </button>
                    )
                  })}
                </div>
                {/* Counter */}
                <div className="flex-shrink-0 flex items-center gap-1.5 text-xs tracking-widest font-light text-white/20">
                  <span style={{ color: cat.color, fontWeight: 500 }}>{fmt(active)}</span>
                  <span>/</span>
                  <span>{fmt(slides.length - 1)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Grid modal */}
      <AnimatePresence>
        {gridOpen && <GridModal slide={slide} onClose={() => setGridOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
