// Cloudflare Pages Function - Cloudflare already resolves the visitor's
// country for every request that reaches its edge (populated from the
// request's IP, no external geo-IP service needed). Exposed here as a
// same-origin JSON endpoint so the SPA can read it client-side.
export async function onRequestGet(context) {
  const country = context.request.cf?.country || null
  return new Response(JSON.stringify({ country }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  })
}
