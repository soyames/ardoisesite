// Generated at request time (not build time) so newly registered schools
// and teachers show up without needing a redeploy - Firestore's REST
// query endpoint is subject to the same security rules as the client
// SDK, so this only ever lists what's already publicly readable.
const PROJECT_ID = 'ardoise-8cbf6'

const MARKETPLACE_STATIC_PATHS = [
  '/', '/schools', '/teachers', '/partenaires', '/jobs', '/how-it-works',
  '/install', '/privacy', '/cookies', '/terms', '/contact',
]

async function queryDocumentIds(collectionId, fieldFilter) {
  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      ...(fieldFilter ? { where: { fieldFilter } } : {}),
      select: { fields: [{ fieldPath: '__name__' }] },
      limit: 1000,
    },
  }
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
  )
  if (!res.ok) return []
  const rows = await res.json()
  return rows.filter((r) => r.document).map((r) => r.document.name.split('/').pop())
}

function xmlEscape(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildXml(urls) {
  const items = urls.map((loc) => `  <url><loc>${xmlEscape(loc)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`
}

export async function onRequestGet(context) {
  const host = context.request.headers.get('host') || 'ardoiseeduc.com'
  const base = `https://${host}`

  if (host.includes('saas')) {
    // The SaaS domain is a login portal for founders, not public
    // content - one entry, matching its robots.txt (Disallow: /).
    return new Response(buildXml([base + '/']), {
      headers: { 'content-type': 'application/xml; charset=utf-8' },
    })
  }

  let schoolIds = []
  let teacherIds = []
  try {
    ;[schoolIds, teacherIds] = await Promise.all([
      queryDocumentIds('schools'),
      queryDocumentIds('users', { field: { fieldPath: 'role' }, op: 'EQUAL', value: { stringValue: 'teacher' } }),
    ])
  } catch (err) {
    // Firestore unreachable - still serve the static pages below rather
    // than failing the whole sitemap.
  }

  const urls = [
    ...MARKETPLACE_STATIC_PATHS.map((p) => base + p),
    ...schoolIds.map((id) => `${base}/schools/${id}`),
    ...teacherIds.map((id) => `${base}/teachers/${id}`),
  ]

  return new Response(buildXml(urls), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}
