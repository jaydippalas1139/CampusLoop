// src/pages/api/requests/verify.ts
import type { APIRoute } from 'astro';
import { verifyHandover, getSessionUser } from '../../../lib/db';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const token = cookies.get('campusloop_session')?.value;
    const user = token ? getSessionUser(token) : null;

    if (!user) {
      return new Response(JSON.stringify({ error: 'Please sign in to verify handover.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { requestId, code } = await request.json();
    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Missing transaction request ID.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = verifyHandover(requestId, user.id, code);
    return new Response(JSON.stringify({
      message: 'Item handover verified successfully! +35 Green Points credited.',
      ...result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Verification failed.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
