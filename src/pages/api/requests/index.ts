// src/pages/api/requests/index.ts
import type { APIRoute } from 'astro';
import { createBorrowRequest, getUserRequests, getSessionUser } from '../../../lib/db';

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('campusloop_session')?.value;
  const user = token ? getSessionUser(token) : null;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { incoming, outgoing } = getUserRequests(user.id);
  return new Response(JSON.stringify({ incoming, outgoing }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const token = cookies.get('campusloop_session')?.value;
    const user = token ? getSessionUser(token) : null;

    if (!user) {
      return new Response(JSON.stringify({ error: 'Please log in to send a request.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    const { itemId, durationDays, proposedSpot, notes } = data;

    if (!itemId || !proposedSpot) {
      return new Response(JSON.stringify({ error: 'Missing required request fields.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestId = createBorrowRequest({
      itemId,
      requesterId: user.id,
      durationDays: durationDays ? Number(durationDays) : 14,
      proposedSpot,
      notes
    });

    return new Response(JSON.stringify({ success: true, requestId, message: 'Request sent to owner successfully!' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to send request.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
