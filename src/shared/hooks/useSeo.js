import { useEffect } from 'react'

function setMetaTag(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

function setJsonLd(id, data) {
  let el = document.getElementById(id)
  if (!data) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

const JSONLD_ID = 'seo-jsonld'

/**
 * Sets document.title, meta description, Open Graph/Twitter tags, a
 * canonical URL, and (optionally) a JSON-LD structured-data block for
 * the current page. This is a pure client-rendered SPA with no
 * server-side rendering, so these tags land after React mounts and
 * paints, not in the initial HTML response - fine for Google (which
 * renders JS before indexing) but non-JS crawlers (some link-preview
 * bots) won't see them. A real fix would be pre-rendering/SSG per
 * public page; out of scope for this pass.
 */
export function useSeo({ title, description, jsonLd } = {}) {
  useEffect(() => {
    const previousTitle = document.title
    if (title) document.title = `${title} | Ardoise`

    setMetaTag('name', 'description', description)
    setMetaTag('property', 'og:title', title ? `${title} | Ardoise` : undefined)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:type', 'website')
    setMetaTag('property', 'og:url', window.location.href)
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', title ? `${title} | Ardoise` : undefined)
    setMetaTag('name', 'twitter:description', description)
    setCanonical(window.location.origin + window.location.pathname)
    setJsonLd(JSONLD_ID, jsonLd)

    return () => {
      document.title = previousTitle
      setJsonLd(JSONLD_ID, null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, JSON.stringify(jsonLd)])
}
