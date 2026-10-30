// src/pages/api/items/index.ts
import type { APIRoute } from 'astro';
import { getItems, addItem, getSessionUser } from '../../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const items = getItems();
    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const token = cookies.get('campusloop_session')?.value;
    const user = token ? getSessionUser(token) : null;

    if (!user) {
      return new Response(JSON.stringify({ error: 'You must be logged in to list an item.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    const { title, category, action_type, condition, department, location, description, image_url, price } = data;

    if (!title || !category || !action_type || !condition || !department || !location) {
      return new Response(JSON.stringify({ error: 'Missing required listing fields.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = addItem(user.id, {
      title,
      category,
      action_type,
      price: price ? Number(price) : 0,
      condition,
      department,
      location,
      description,
      image_url: image_url || '/images/arduino_kit.jpg'
    });

    return new Response(JSON.stringify({ success: true, id, message: 'Resource listed successfully!' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to list resource.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
