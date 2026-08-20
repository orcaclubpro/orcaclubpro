import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/u/', '/login', '/c/', '/timelines/']
      }
    ],
    sitemap: 'https://orcaclub.pro/sitemap.xml',
    host: 'https://orcaclub.pro'
  }
} 