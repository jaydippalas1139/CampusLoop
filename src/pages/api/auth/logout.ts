// src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/db';

export const POST: APIRoute = async ({ cookies }) => {
  const token = cookies.get('campusloop_session')?.value;
  if (token) {
    deleteSession(token);
    cookies.delete('campusloop_session', { path: '/' });
  }

  return new Response(JSON.stringify({ success: true, message: 'Logged out successfully.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
