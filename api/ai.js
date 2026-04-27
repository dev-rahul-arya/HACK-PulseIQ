// Vercel serverless function: forwards /api/ai → Anthropic Messages API.
// Mirrors the Vite dev proxy in vite.config.js so production keeps the same
// contract: the browser POSTs an Anthropic-shaped request, the key stays
// server-side via process.env.ANTHROPIC_API_KEY.

export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY not set in Vercel project env' },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body,
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return Response.json(
      { error: 'Proxy error', detail: String(err) },
      { status: 502 }
    );
  }
}
