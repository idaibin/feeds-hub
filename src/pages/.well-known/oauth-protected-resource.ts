import type { APIRoute } from 'astro';
import {
  getMcpProtectedResourceMetadata,
  mcpHttpErrorResponse,
} from '@/lib/feed-mcp-security';

export const prerender = false;

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

export const GET: APIRoute = ({ request }) => {
  try {
    const metadata = getMcpProtectedResourceMetadata(process.env);
    return new Response(JSON.stringify(metadata), {
      headers: {
        ...corsHeaders,
        'cache-control': 'public, max-age=300',
        'content-type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    const response = mcpHttpErrorResponse(error);
    for (const [name, value] of Object.entries(corsHeaders)) response.headers.set(name, value);
    return response;
  }
};

export const OPTIONS: APIRoute = () => new Response(null, {
  status: 204,
  headers: corsHeaders,
});
