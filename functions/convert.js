/**
 * Cloudflare Pages Function: HTML to Dumbdown conversion
 * POST /convert
 */

import { Converter } from '../src/converter.js';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: 'Please provide HTML text in the request body as { text: "..." }'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const result = Converter.convert(text);

    return new Response(
      JSON.stringify({
        success: true,
        dumbdown: result
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('Conversion error:', error);
    return new Response(
      JSON.stringify({
        error: 'Conversion failed',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
