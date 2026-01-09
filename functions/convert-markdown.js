/**
 * Cloudflare Pages Function: Markdown to Dumbdown conversion
 * POST /convert-markdown
 */

import { MarkdownConverter } from '../src/markdown-converter.js';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { markdown } = body;

    if (!markdown || typeof markdown !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: 'Please provide markdown text in the request body as { markdown: "..." }'
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

    const result = MarkdownConverter.convert(markdown);

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
    console.error('Markdown conversion error:', error);
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
