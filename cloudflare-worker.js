/**
 * Cloudflare Worker para injeção de Headers de Segurança
 * Deploy: Workers & Pages > Create Worker > Paste Code > Save and Deploy
 * Route: soykarolinareal.com/*
 */

export default {
  async fetch(request, env, ctx) {
    const response = await fetch(request);
    const newHeaders = new Headers(response.headers);

    newHeaders.set('Content-Security-Policy', "default-src 'self'; script-src 'self' https://www.googletagmanager.com 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com;");
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
