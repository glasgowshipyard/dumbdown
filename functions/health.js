/**
 * Cloudflare Pages Function: Health check endpoint
 * GET /health
 */

export async function onRequestGet() {
  return new Response(
    JSON.stringify({ status: 'ok' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}
