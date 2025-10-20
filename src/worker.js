/**
 * Dumbdown Cloudflare Worker
 * Entry point for Cloudflare Workers deployment
 */

import { Converter } from './converter';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle incoming requests
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    try {
      // Health check
      if (pathname === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        });
      }

      // Conversion endpoint
      if (pathname === '/convert' && request.method === 'POST') {
        const body = await request.json();
        const { text } = body;

        if (!text || typeof text !== 'string') {
          return new Response(
            JSON.stringify({
              error: 'Invalid request',
              message: 'Please provide HTML text in the request body as { text: "..." }',
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS,
              },
            }
          );
        }

        try {
          const result = Converter.convert(text);
          return new Response(
            JSON.stringify({
              success: true,
              dumbdown: result,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS,
              },
            }
          );
        } catch (error) {
          console.error('Conversion error:', error);
          return new Response(
            JSON.stringify({
              error: 'Conversion failed',
              message: error.message,
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS,
              },
            }
          );
        }
      }

      // Serve static files (web UI)
      if (pathname === '/' || pathname === '/index.html') {
        try {
          const html = await env.ASSETS.get('index.html');
          if (html) {
            return new Response(html, {
              status: 200,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=3600',
                ...CORS_HEADERS,
              },
            });
          }
        } catch (e) {
          // Fall through to 404
        }
      }

      if (pathname === '/script.js') {
        try {
          const js = await env.ASSETS.get('script.js');
          if (js) {
            return new Response(js, {
              status: 200,
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'public, max-age=3600',
                ...CORS_HEADERS,
              },
            });
          }
        } catch (e) {
          // Fall through to 404
        }
      }

      // 404
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Endpoint not found. Try POST /convert or GET /health',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    } catch (error) {
      console.error('Server error:', error);
      return new Response(
        JSON.stringify({
          error: 'Server error',
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }
  },
};
