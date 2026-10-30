// src/lib/db.ts
import { DatabaseSync } from 'node:sqlite';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Ensure data folder exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'campusloop.db');
let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(dbPath);
    _db.exec('PRAGMA foreign_keys = ON;');
    initSchema(_db);
  }
  return _db;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === key;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      department TEXT NOT NULL,
      avatar TEXT,
      green_points INTEGER DEFAULT 100,
      reputation REAL DEFAULT 5.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      action_type TEXT NOT NULL,
      price REAL DEFAULT 0,
      condition TEXT NOT NULL,
      department TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      status TEXT DEFAULT 'AVAILABLE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      requester_id INTEGER NOT NULL,
      owner_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      duration_days INTEGER DEFAULT 14,
      proposed_spot TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'PENDING',
      meet_time TEXT,
      meet_spot TEXT,
      owner_note TEXT,
      handover_code TEXT,
      qr_token TEXT,
      is_handed_over INTEGER DEFAULT 0,
      is_returned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY(requester_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrate requests table if columns don't exist
  try { db.exec("ALTER TABLE requests ADD COLUMN meet_time TEXT;"); } catch {}
  try { db.exec("ALTER TABLE requests ADD COLUMN meet_spot TEXT;"); } catch {}
  try { db.exec("ALTER TABLE requests ADD COLUMN owner_note TEXT;"); } catch {}
  try { db.exec("ALTER TABLE requests ADD COLUMN handover_code TEXT;"); } catch {}
  try { db.exec("ALTER TABLE requests ADD COLUMN qr_token TEXT;"); } catch {}
  try { db.exec("ALTER TABLE requests ADD COLUMN is_handed_over INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE requests ADD COLUMN is_returned INTEGER DEFAULT 0;"); } catch {}

  // Seed default users if empty
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users;').get() as any).count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, department, avatar, green_points, reputation)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    const defaultPass = hashPassword('campus123');

    // 1. Dipesh Chauhan
    insertUser.run('Dipesh Chauhan', 'dipesh@campusloop.in', defaultPass, 'Computer Science & Engineering', 'DC', 480, 5.0);
    // 2. Ajay Vaniya
    insertUser.run('Ajay Vaniya', 'ajay@campusloop.in', defaultPass, 'Computer Science & Engineering', 'AV', 410, 4.9);
    // 3. Nisarg Trivedi
    insertUser.run('Nisarg Trivedi', 'nisarg@campusloop.in', defaultPass, 'Computer Science & Engineering', 'NT', 390, 5.0);
    // 4. Nilrajsinh Gohil
    insertUser.run('Nilrajsinh Gohil', 'nilraj@campusloop.in', defaultPass, 'Computer Science & Engineering', 'NG', 360, 4.8);
    // 5. Priya Sharma
    insertUser.run('Priya Sharma', 'priya@campusloop.in', defaultPass, 'Chemical Sciences', 'PS', 310, 4.9);
    // 6. Rohan Patel
    insertUser.run('Rohan Patel', 'rohan@campusloop.in', defaultPass, 'Information Technology', 'RP', 290, 4.9);
  }

  // Seed default items if empty
  const itemCount = (db.prepare('SELECT COUNT(*) as count FROM items;').get() as any).count;
  if (itemCount === 0) {
    const insertItem = db.prepare(`
      INSERT INTO items (id, owner_id, title, category, action_type, price, condition, department, location, description, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    // Owner 2: Ajay Vaniya
    insertItem.run(
      'CL-ITEM-01',
      2,
      'Casio fx-991EX ClassWiz Scientific Calculator',
      'Calculators',
      'borrow',
      0,
      'Like New',
      'CSE',
      'Library Ground Floor Foyer',
      'High-resolution natural textbook display with 552 functions. Needed for Engineering Mathematics & Physics exams. Dual solar + battery power.',
      '/images/calculator.jpg',
      'AVAILABLE'
    );

    // Owner 3: Nisarg Trivedi
    insertItem.run(
      'CL-ITEM-02',
      3,
      'Arduino Uno R3 Dev Kit + Sensor Pack',
      'Electronics',
      'borrow',
      0,
      'Good Condition',
      'CSE',
      'C-Block IoT & Embedded Systems Lab',
      'Full embedded kit with Arduino Uno, breadboard, HC-SR04 ultrasonic sensor, DHT11 temp sensor, jumper cables, and 5V relay module for IoT lab assignments.',
      '/images/arduino_kit.jpg',
      'AVAILABLE'
    );

    // Owner 4: Nilrajsinh Gohil
    insertItem.run(
      'CL-ITEM-03',
      4,
      'Data Structures & OS Concepts Stack',
      'Books & Notes',
      'exchange',
      0,
      'Like New',
      'CSE',
      'Campus Central Canteen Gazebo',
      'Mark Allen Weiss DSA textbook + Silberschatz Operating System Concepts. Want to swap for 5th Semester Database Management Systems book.',
      '/images/textbooks.jpg',
      'AVAILABLE'
    );

    // Owner 1: Dipesh Chauhan
    insertItem.run(
      'CL-ITEM-04',
      1,
      'Engineering Mini Drafter & Sheet Tube',
      'Lab & Workshop Gear',
      'borrow',
      0,
      'Like New',
      'Mechanical',
      'Mechanical Workshop Room 104',
      'Essential for 1st & 2nd semester Engineering Graphics and Drawing coursework. Steel arm clamp, zero drift, includes waterproof chart carrying tube.',
      '/images/mini_drafter.jpg',
      'AVAILABLE'
    );

    // Owner 5: Priya Sharma
    insertItem.run(
      'CL-ITEM-05',
      5,
      'Cotton Lab Coat + Anti-Fog Goggles',
      'Lab & Workshop Gear',
      'donate',
      0,
      'Good Condition',
      'Chemical',
      'Pharmacy Building Reception',
      'Graduating senior donating heavy-duty cotton lab coat (Size L, freshly laundered) + UV protective safety goggles. Free gift to any junior or 1st-year student.',
      '/images/mini_drafter.jpg',
      'AVAILABLE'
    );

    // Owner 6: Rohan Patel
    insertItem.run(
      'CL-ITEM-06',
      6,
      'Raspberry Pi 4 Model B (4GB RAM)',
      'Electronics',
      'borrow',
      0,
      'Like New',
      'IT',
      'Tech Park Block D, 3rd Floor',
      'Includes official USB-C 15W power supply, micro-HDMI to HDMI cable, and 32GB Class 10 SanDisk card. Perfect for Computer Networks and Final Year Projects.',
      '/images/arduino_kit.jpg',
      'AVAILABLE'
    );
  }
}

// User Authentication Methods
export function registerUser(name: string, email: string, password: string, department: string) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?;').get(email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const hash = hashPassword(password);
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL';
  
  const insert = db.prepare(`
    INSERT INTO users (name, email, password_hash, department, avatar, green_points, reputation)
    VALUES (?, ?, ?, ?, ?, 100, 5.0);
  `);
  const result = insert.run(name, email, hash, department, initials);
  const userId = Number(result.lastInsertRowid);

  // Return new session token
  return createSession(userId);
}

export function loginUser(email: string, password: string) {
  const db = getDb();
  const user = db.prepare('SELECT id, password_hash FROM users WHERE email = ?;').get(email) as any;
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error('Invalid email or password.');
  }

  return createSession(user.id);
}

export function createSession(userId: number) {
  const db = getDb();
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days

  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?);').run(token, userId, expiresAt);
  return token;
}

export function getSessionUser(token: string) {
  if (!token) return null;
  const db = getDb();
  const session = db.prepare(`
    SELECT s.token, s.expires_at, u.id, u.name, u.email, u.department, u.avatar, u.green_points, u.reputation
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?;
  `).get(token, Date.now()) as any;

  if (!session) return null;
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    department: session.department,
    avatar: session.avatar,
    green_points: session.green_points,
    reputation: session.reputation
  };
}

export function deleteSession(token: string) {
  if (!token) return;
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token = ?;').run(token);
}

// Items API Methods
export function getItems() {
  const db = getDb();
  return db.prepare(`
    SELECT i.*, u.name as owner_name, u.avatar as owner_avatar, u.reputation as owner_reputation
    FROM items i
    JOIN users u ON i.owner_id = u.id
    ORDER BY i.created_at DESC;
  `).all() as any[];
}

export function addItem(ownerId: number, data: {
  title: string;
  category: string;
  action_type: string;
  price?: number;
  condition: string;
  department: string;
  location: string;
  description?: string;
  image_url: string;
}) {
  const db = getDb();
  const id = `CL-ITEM-${Date.now().toString(36).toUpperCase()}`;

  db.prepare(`
    INSERT INTO items (id, owner_id, title, category, action_type, price, condition, department, location, description, image_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE');
  `).run(
    id,
    ownerId,
    data.title,
    data.category,
    data.action_type,
    data.price || 0,
    data.condition,
    data.department,
    data.location,
    data.description || '',
    data.image_url
  );

  // Award 20 green points for listing resource
  db.prepare('UPDATE users SET green_points = green_points + 20 WHERE id = ?;').run(ownerId);

  return id;
}

// Requests API Methods
export function createBorrowRequest(data: {
  itemId: string;
  requesterId: number;
  durationDays: number;
  proposedSpot: string;
  notes?: string;
}) {
  const db = getDb();
  const item = db.prepare('SELECT owner_id, title, action_type FROM items WHERE id = ?;').get(data.itemId) as any;
  if (!item) throw new Error('Item not found');

  if (item.owner_id === data.requesterId) {
    throw new Error('You cannot request your own resource.');
  }

  const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`;

  db.prepare(`
    INSERT INTO requests (id, item_id, requester_id, owner_id, action_type, duration_days, proposed_spot, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING');
  `).run(
    requestId,
    data.itemId,
    data.requesterId,
    item.owner_id,
    item.action_type,
    data.durationDays,
    data.proposedSpot,
    data.notes || ''
  );

  // Notify owner
  const requester = db.prepare('SELECT name FROM users WHERE id = ?;').get(data.requesterId) as any;
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, 'REQUEST_RECEIVED');
  `).run(
    item.owner_id,
    `New Request for ${item.title}`,
    `${requester.name} has requested to ${item.action_type} your "${item.title}". Proposed meeting spot: ${data.proposedSpot}.`
  );

  return requestId;
}

export function getUserRequests(userId: number) {
  const db = getDb();
  
  const incoming = db.prepare(`
    SELECT r.*, i.title as item_title, i.image_url as item_image, u.name as requester_name, u.email as requester_email, u.department as requester_dept
    FROM requests r
    JOIN items i ON r.item_id = i.id
    JOIN users u ON r.requester_id = u.id
    WHERE r.owner_id = ?
    ORDER BY r.created_at DESC;
  `).all(userId) as any[];

  const outgoing = db.prepare(`
    SELECT r.*, i.title as item_title, i.image_url as item_image, u.name as owner_name, u.email as owner_email, u.department as owner_dept
    FROM requests r
    JOIN items i ON r.item_id = i.id
    JOIN users u ON r.owner_id = u.id
    WHERE r.requester_id = ?
    ORDER BY r.created_at DESC;
  `).all(userId) as any[];

  return { incoming, outgoing };
}

export function respondToRequest(
  requestId: string, 
  ownerId: number, 
  status: 'ACCEPTED' | 'REJECTED',
  meetDetails?: { meetTime?: string; meetSpot?: string; ownerNote?: string }
) {
  const db = getDb();
  const req = db.prepare('SELECT * FROM requests WHERE id = ? AND owner_id = ?;').get(requestId, ownerId) as any;
  if (!req) throw new Error('Request not found or unauthorized.');

  if (status === 'ACCEPTED') {
    const meetTime = meetDetails?.meetTime || 'Tomorrow 1:30 PM (Lunch Break)';
    const meetSpot = meetDetails?.meetSpot || req.proposed_spot || 'Library Ground Floor Foyer';
    const ownerNote = meetDetails?.ownerNote || '';
    const handoverCode = Math.floor(1000 + Math.random() * 9000).toString();
    const qrToken = `CAMPUSLOOP-TRX-${requestId}-${handoverCode}`;

    db.prepare(`
      UPDATE requests 
      SET status = 'ACCEPTED', meet_time = ?, meet_spot = ?, owner_note = ?, handover_code = ?, qr_token = ?
      WHERE id = ?;
    `).run(meetTime, meetSpot, ownerNote, handoverCode, qrToken, requestId);

    db.prepare("UPDATE items SET status = 'HANDOVER_PENDING' WHERE id = ?;").run(req.item_id);

    const item = db.prepare('SELECT title FROM items WHERE id = ?;').get(req.item_id) as any;
    const owner = db.prepare('SELECT name FROM users WHERE id = ?;').get(ownerId) as any;

    const notifMsg = `${owner.name} accepted your request for "${item.title}". Meetup scheduled for: ${meetTime} at ${meetSpot}.${ownerNote ? ' Note: ' + ownerNote : ''} Verification PIN: ${handoverCode}.`;

    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, 'REQUEST_ACCEPTED');
    `).run(
      req.requester_id,
      `Request Accepted: ${item.title}`,
      notifMsg
    );

    return { 
      success: true, 
      status: 'ACCEPTED', 
      meetTime, 
      meetSpot, 
      handoverCode, 
      qrToken 
    };
  } else {
    db.prepare("UPDATE requests SET status = 'REJECTED' WHERE id = ?;").run(requestId);
    
    const item = db.prepare('SELECT title FROM items WHERE id = ?;').get(req.item_id) as any;
    const owner = db.prepare('SELECT name FROM users WHERE id = ?;').get(ownerId) as any;

    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, 'REQUEST_REJECTED');
    `).run(
      req.requester_id,
      `Request Declined: ${item.title}`,
      `${owner.name} was unable to fulfill your request for "${item.title}".`
    );

    return { success: true, status: 'REJECTED' };
  }
}

export function verifyHandover(requestId: string, currentUserId: number, code?: string) {
  const db = getDb();
  const req = db.prepare('SELECT * FROM requests WHERE id = ?;').get(requestId) as any;
  if (!req) throw new Error('Transaction not found.');

  // Must be owner or requester
  if (req.owner_id !== currentUserId && req.requester_id !== currentUserId) {
    throw new Error('You are not authorized for this transaction.');
  }

  // If code is provided and exists, verify it
  if (code && req.handover_code && code.trim() !== req.handover_code.trim()) {
    throw new Error('Invalid verification PIN. Please verify the code.');
  }

  db.prepare(`
    UPDATE requests 
    SET status = 'HANDED_OVER', is_handed_over = 1 
    WHERE id = ?;
  `).run(requestId);

  const itemNewStatus = req.action_type === 'borrow' ? 'BORROWED' : req.action_type === 'exchange' ? 'EXCHANGED' : req.action_type === 'donate' ? 'DONATED' : 'SOLD';
  db.prepare('UPDATE items SET status = ? WHERE id = ?;').run(itemNewStatus, req.item_id);

  // Award Green Points (+35 to both)
  db.prepare('UPDATE users SET green_points = green_points + 35 WHERE id = ?;').run(req.owner_id);
  db.prepare('UPDATE users SET green_points = green_points + 35 WHERE id = ?;').run(req.requester_id);

  const item = db.prepare('SELECT title FROM items WHERE id = ?;').get(req.item_id) as any;

  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, 'HANDOVER_VERIFIED');
  `).run(
    req.owner_id,
    `Handover Verified: ${item.title}`,
    `Handover of "${item.title}" successfully confirmed. +35 Green Points credited to your account!`
  );

  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, 'HANDOVER_VERIFIED');
  `).run(
    req.requester_id,
    `Handover Verified: ${item.title}`,
    `You have physically received "${item.title}". Handover confirmed! +35 Green Points credited!`
  );

  return { success: true, status: 'HANDED_OVER', pointsEarned: 35 };
}

export function getUserNotifications(userId: number) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20;
  `).all(userId) as any[];
}

export function markNotificationsRead(userId: number) {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?;').run(userId);
  return { success: true };
}
