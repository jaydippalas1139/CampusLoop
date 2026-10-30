// src/pages/api/notifications/index.ts
import type { APIRoute } from 'astro';
import { getUserNotifications, getSessionUser } from '../../../lib/db';

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('campusloop_session')?.value;
  const user = token ? getSessionUser(token) : null;

  if (!user) {
    return new Response(JSON.stringify({ notifications: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const notifications = getUserNotifications(user.id);
  return new Response(JSON.stringify({ notifications }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ cookies }) => {
  const token = cookies.get('campusloop_session')?.value;
  const user = token ? getSessionUser(token) : null;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { markNotificationsRead } = await import('../../../lib/db');
  markNotificationsRead(user.id);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

