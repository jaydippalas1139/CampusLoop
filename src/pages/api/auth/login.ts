// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { loginUser } from '../../../lib/db';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    const { email, password } = data;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = loginUser(email.trim().toLowerCase(), password);

    cookies.set('campusloop_session', token, {
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return new Response(JSON.stringify({ success: true, message: 'Logged in successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Login failed.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
