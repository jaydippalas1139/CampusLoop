// src/pages/api/auth/me.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../lib/db';

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('campusloop_session')?.value;
  if (!token) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const user = getSessionUser(token);
  return new Response(JSON.stringify({ user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
