// src/pages/api/auth/register.ts
import type { APIRoute } from 'astro';
import { registerUser } from '../../../lib/db';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    const { name, email, password, department } = data;

    if (!name || !email || !password || !department) {
      return new Response(JSON.stringify({ error: 'All fields are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = registerUser(name.trim(), email.trim().toLowerCase(), password, department.trim());

    cookies.set('campusloop_session', token, {
      path: '/',
      httpOnly: true,
      secure: false, // development compatible
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return new Response(JSON.stringify({ success: true, message: 'Account created successfully.' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Registration failed.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
