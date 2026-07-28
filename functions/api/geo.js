// Cloudflare Pages Function - Cloudflare already resolves the visitor's
// country for every request that reaches its edge (populated from the
// request's IP, no external geo-IP service needed). Exposed here as a
// same-origin JSON endpoint so the SPA can read it client-side.
//
// Known search-engine crawlers and link-preview bots (WhatsApp/Telegram/
// Facebook/etc. link unfurling matters a lot for how this marketplace
// actually gets shared in these markets) almost never crawl FROM an
// OHADA-region IP, so the geo-block would otherwise also hide the site
// from Google/Bing entirely and make every SEO effort (sitemap, meta
// tags) pointless - nothing to index. Detected bots get treated as
// "resolved, let through" here (GeoContext.jsx maps the BOT sentinel to
// the same default-country preview real OHADA visitors get) without
// weakening the block for actual human visitors, who don't send these
// user agents.
const BOT_USER_AGENT_PATTERN = /googlebot|bingbot|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|whatsapp|telegrambot|slackbot|linkedinbot|applebot|discordbot/i

export async function onRequestGet(context) {
  const country = context.request.cf?.country || null
  const userAgent = context.request.headers.get('user-agent') || ''
  const isBot = BOT_USER_AGENT_PATTERN.test(userAgent)
  return new Response(JSON.stringify({ country: isBot ? 'BOT' : country }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  })
}
