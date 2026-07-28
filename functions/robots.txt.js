// One shared build is deployed to both ardoiseeduc.com (the public
// marketplace - worth indexing) and saas.ardoiseeduc.com (a login portal
// for founders managing their own school - no public content, no reason
// for a search engine to crawl it). A static public/robots.txt can't
// vary by host, hence a Pages Function instead.
export async function onRequestGet(context) {
  const host = context.request.headers.get('host') || ''
  const isSaas = host.includes('saas')

  const body = isSaas
    ? 'User-agent: *\nDisallow: /\n'
    : [
        'User-agent: *',
        'Allow: /',
        'Disallow: /portal',
        'Disallow: /login',
        'Disallow: /register',
        'Disallow: /forgot-password',
        '',
        `Sitemap: https://${host}/sitemap.xml`,
        '',
      ].join('\n')

  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
