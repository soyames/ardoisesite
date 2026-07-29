export async function onRequest(context) {
  const url = new URL(context.request.url)
  const isSaas = url.hostname.startsWith('saas.')

  const name = isSaas ? 'Ardoise SaaS' : 'Ardoise'
  const description = isSaas
    ? "Gestion scolaire tout-en-un pour les etablissements publics et prives de l'espace OHADA."
    : "L'annuaire des ecoles et plateforme de recrutement pour l'espace OHADA."

  const manifest = {
    name: name,
    short_name: name,
    description: description,
    lang: 'fr',
    theme_color: '#2B2621',
    background_color: '#F7F3EA',
    display: 'standalone',
    start_url: '/',
    scope: '/',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  })
}
