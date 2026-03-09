import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AnimatedBackground from '@/components/layout/animated-background'
import ScrollReveal from '@/components/layout/scroll-reveal'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'solutions',
    limit: 200,
    overrideAccess: false,
  })
  return docs.map((doc) => ({ slug: doc.slug as string }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'solutions',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
  })

  const solution = docs[0]
  if (!solution) return {}

  const metaTitle = (solution.meta as any)?.title || solution.title
  const metaDescription = (solution.meta as any)?.description || solution.description
  const ogImageValue = (solution.meta as any)?.image
  const ogImageUrl =
    ogImageValue && typeof ogImageValue !== 'string' ? (ogImageValue as any).url : undefined

  return {
    title: `${metaTitle} | ORCACLUB`,
    description: metaDescription || undefined,
    robots: (solution.meta as any)?.noIndex ? 'noindex' : undefined,
    openGraph: {
      title: metaTitle,
      description: metaDescription || undefined,
      url: `https://orcaclub.pro/solutions/${slug}`,
      siteName: 'ORCACLUB',
      type: 'article',
      ...(ogImageUrl && { images: [{ url: ogImageUrl, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription || undefined,
    },
    alternates: {
      canonical: `https://orcaclub.pro/solutions/${slug}`,
    },
  }
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'solutions',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })

  const solution = docs[0]
  if (!solution) notFound()

  const layout = (solution.layout ?? []) as any[]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 pt-24 pb-32 px-8">
        <div className="max-w-3xl mx-auto">
          {/* Back nav */}
          <ScrollReveal>
            <Link
              href="/solutions"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors duration-200 mb-12 text-sm font-light"
            >
              <ArrowLeft className="w-4 h-4" />
              All Solutions
            </Link>
          </ScrollReveal>

          {/* Title + description */}
          <ScrollReveal delay={100}>
            <h1 className="text-4xl md:text-5xl font-extralight text-white mb-4 tracking-tight leading-tight">
              {solution.title}
            </h1>
            {solution.description && (
              <p className="text-xl text-gray-400 font-light leading-relaxed mb-16 border-b border-gray-800 pb-12">
                {solution.description}
              </p>
            )}
          </ScrollReveal>

          {/* Layout blocks */}
          <div className="space-y-12">
            {layout.map((block, i) => {
              if (block.blockType === 'article') {
                return (
                  <ScrollReveal key={block.id ?? i} delay={i * 50}>
                    <article className="
                      [&_h1]:text-4xl [&_h1]:font-light [&_h1]:text-white [&_h1]:mb-6 [&_h1]:mt-12 [&_h1]:leading-tight
                      [&_h2]:text-3xl [&_h2]:font-light [&_h2]:text-white [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:leading-tight
                      [&_h3]:text-2xl [&_h3]:font-light [&_h3]:text-white [&_h3]:mb-3 [&_h3]:mt-8
                      [&_h4]:text-xl [&_h4]:font-normal [&_h4]:text-white [&_h4]:mb-3 [&_h4]:mt-6
                      [&_p]:text-gray-300 [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:font-light
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
                      [&_li]:text-gray-300 [&_li]:font-light
                      [&_strong]:text-white [&_strong]:font-semibold
                      [&_em]:italic [&_em]:text-gray-300
                      [&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-cyan-300
                      [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-400/40 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-gray-400 [&_blockquote]:my-6
                      [&_hr]:border-gray-800 [&_hr]:my-8
                      [&_code]:bg-gray-900 [&_code]:text-cyan-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                      [&_pre]:bg-gray-900 [&_pre]:p-6 [&_pre]:rounded-xl [&_pre]:overflow-auto [&_pre]:mb-6
                    ">
                      <RichText data={block.content} />
                    </article>
                  </ScrollReveal>
                )
              }
              return null
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
