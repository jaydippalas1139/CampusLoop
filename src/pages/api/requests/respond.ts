// src/pages/api/requests/respond.ts
import type { APIRoute } from 'astro';
import { respondToRequest, getSessionUser } from '../../../lib/db';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const token = cookies.get('campusloop_session')?.value;
    const user = token ? getSessionUser(token) : null;

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { requestId, status, meetTime, meetSpot, ownerNote } = await request.json();
    if (!requestId || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid response data.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = respondToRequest(requestId, user.id, status, { meetTime, meetSpot, ownerNote });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to update request.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
