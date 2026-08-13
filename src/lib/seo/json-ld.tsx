/**
 * Renders one JSON-LD script tag. Pass a single schema object or an array
 * (arrays are emitted as an @graph).
 *
 *   <JsonLd data={[serviceSchema({...}), faqSchema('/websites', faqs)]} />
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : { '@context': 'https://schema.org', ...data }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  )
}
