const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3001;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Pricing in EGP
const PRICING = {
  hourly: 50,
  weekly: 250,
  monthly: 1000,
  semester: 4500,
  yearly: 10000
};

// Floors: 4 floors × 500 cars
const FLOORS = 4;
const CARS_PER_FLOOR = 500;
const TOTAL_CAPACITY = FLOORS * CARS_PER_FLOOR;

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initialize DB
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDB = {
      users: [
        { id: 'u1', name: 'Admin', email: 'admin@rakni.com', password: 'admin123', role: 'admin', phone: '01000000000', createdAt: new Date().toISOString() },
        { id: 'u2', name: 'Ahmed Valet', email: 'valet@rakni.com', password: 'valet123', role: 'valet', phone: '01100000000', rating: 5.0, totalJobs: 0, wallet: 0, createdAt: new Date().toISOString() },
        { id: 'u3', name: 'Sara Student', email: 'student@rakni.com', password: 'student123', role: 'student', phone: '01200000000', studentId: 'FU-2024-001', floor: 1, slot: 1, subscription: 'monthly', createdAt: new Date().toISOString() }
      ],
      floors: {
        1: { name: 'Ground Floor', slots: 500, occupied: 12, spots: {} },
        2: { name: 'First Floor', slots: 500, occupied: 8, spots: {} },
        3: { name: 'Second Floor', slots: 500, occupied: 15, spots: {} },
        4: { name: 'Third Floor', slots: 500, occupied: 5, spots: {} }
      },
      reservations: [
        { id: 'r1', userId: 'u3', floor: 1, slot: 1, status: 'active', vehiclePlate: 'ABC-1234', vehicleType: 'sedan', startTime: new Date().toISOString(), paymentMethod: 'cash', amount: 1000, subscription: 'monthly' }
      ],
      transactions: [],
      valetRequests: [],
      settings: {
        universityName: 'RAKNI SHOKRAN',
        campus: 'Faculty of Future University - New Cairo',
        coordinates: { lat: 30.025, lng: 31.491 },
        currency: 'EGP'
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
    return defaultDB;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

let db = initDB();

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function generateId(prefix = '') {
  return prefix + crypto.randomBytes(6).toString('hex');
}

// MIME types
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Parse body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// Send JSON
function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

// Static file serving
function serveStatic(req, res) {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
}

// ===== API ROUTES =====
async function handleAPI(req, res, url, method) {
  const body = method === 'POST' ? await parseBody(req) : null;

  // Auth
  if (url === '/api/auth/login' && method === 'POST') {
    const user = db.users.find(u => u.email === body.email && u.password === body.password);
    if (!user) return sendJSON(res, 401, { error: 'Invalid credentials' });
    const { password, ...safe } = user;
    return sendJSON(res, 200, { token: 'tok_' + generateId(), user: safe });
  }

  if (url === '/api/auth/register' && method === 'POST') {
    if (db.users.find(u => u.email === body.email)) {
      return sendJSON(res, 409, { error: 'Email already exists' });
    }
    const user = {
      id: generateId('u'),
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role || 'student',
      phone: body.phone,
      studentId: body.studentId,
      rating: body.role === 'valet' ? 5.0 : undefined,
      totalJobs: body.role === 'valet' ? 0 : undefined,
      wallet: body.role === 'valet' ? 0 : undefined,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    saveDB();
    const { password, ...safe } = user;
    return sendJSON(res, 201, { user: safe });
  }

  // Dashboard stats
  if (url === '/api/dashboard' && method === 'GET') {
    let totalOccupied = 0;
    for (const f in db.floors) totalOccupied += db.floors[f].occupied;
    const activeReservations = db.reservations.filter(r => r.status === 'active').length;
    const activeValets = db.users.filter(u => u.role === 'valet').length;
    const totalRevenue = db.transactions.reduce((s, t) => s + (t.amount || 0), 0);
    return sendJSON(res, 200, {
      totalCapacity: TOTAL_CAPACITY,
      totalOccupied,
      available: TOTAL_CAPACITY - totalOccupied,
      occupancyRate: ((totalOccupied / TOTAL_CAPACITY) * 100).toFixed(1) + '%',
      activeReservations,
      activeValets,
      totalRevenue,
      floors: Object.entries(db.floors).map(([id, f]) => ({
        id: parseInt(id),
        name: f.name,
        total: f.slots,
        occupied: f.occupied,
        available: f.slots - f.occupied,
        percentage: ((f.occupied / f.slots) * 100).toFixed(1) + '%'
      }))
    });
  }

  // Floors
  if (url === '/api/floors' && method === 'GET') {
    return sendJSON(res, 200, db.floors);
  }

  // Reservations
  if (url === '/api/reservations' && method === 'GET') {
    return sendJSON(res, 200, db.reservations);
  }
  if (url === '/api/reservations' && method === 'POST') {
    const { userId, floor, slot, vehiclePlate, vehicleType, paymentMethod, subscription } = body;
    const reservation = {
      id: generateId('r'),
      userId,
      floor: floor || 1,
      slot: slot || Math.floor(Math.random() * CARS_PER_FLOOR) + 1,
      status: 'active',
      vehiclePlate: vehiclePlate || 'TBD',
      vehicleType: vehicleType || 'sedan',
      startTime: new Date().toISOString(),
      paymentMethod: paymentMethod || 'cash',
      amount: PRICING[subscription] || PRICING.hourly,
      subscription: subscription || 'hourly'
    };
    db.reservations.push(reservation);
    if (db.floors[reservation.floor]) {
      db.floors[reservation.floor].occupied++;
    }
    db.transactions.push({
      id: generateId('t'),
      reservationId: reservation.id,
      userId,
      amount: reservation.amount,
      method: paymentMethod,
      type: 'reservation',
      createdAt: new Date().toISOString()
    });
    saveDB();
    return sendJSON(res, 201, reservation);
  }

  // Valet requests
  if (url === '/api/valet/pickup' && method === 'POST') {
    const request = {
      id: generateId('v'),
      userId: body.userId,
      valetId: body.valetId,
      floor: body.floor,
      slot: body.slot,
      status: 'pending',
      vehiclePlate: body.vehiclePlate,
      createdAt: new Date().toISOString()
    };
    db.valetRequests.push(request);
    saveDB();
    return sendJSON(res, 201, request);
  }
  if (url === '/api/valet/deliver' && method === 'POST') {
    const req2 = db.valetRequests.find(v => v.id === body.requestId);
    if (req2) {
      req2.status = 'completed';
      req2.completedAt = new Date().toISOString();
      const valet = db.users.find(u => u.id === req2.valetId);
      if (valet) {
        valet.totalJobs = (valet.totalJobs || 0) + 1;
        valet.wallet = (valet.wallet || 0) + 25;
      }
      saveDB();
    }
    return sendJSON(res, 200, req2 || { error: 'Not found' });
  }

  // Students
  if (url === '/api/students' && method === 'GET') {
    const students = db.users.filter(u => u.role === 'student').map(({ password, ...s }) => s);
    return sendJSON(res, 200, students);
  }

  // Valets
  if (url === '/api/valets' && method === 'GET') {
    const valets = db.users.filter(u => u.role === 'valet').map(({ password, ...v }) => v);
    return sendJSON(res, 200, valets);
  }

  // Pricing
  if (url === '/api/pricing' && method === 'GET') {
    return sendJSON(res, 200, PRICING);
  }

  // Transactions
  if (url === '/api/transactions' && method === 'GET') {
    return sendJSON(res, 200, db.transactions);
  }

  // Settings
  if (url === '/api/settings' && method === 'GET') {
    return sendJSON(res, 200, db.settings);
  }

  sendJSON(res, 404, { error: 'API endpoint not found' });
}

// ===== SERVER =====
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;

  // CORS
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  if (url.startsWith('/api/')) {
    return handleAPI(req, res, url, method);
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`🅿️  RAKNI SHOKRAN server running at http://localhost:${PORT}`);
  console.log(`📊 Capacity: ${TOTAL_CAPACITY} cars (${FLOORS} floors × ${CARS_PER_FLOOR} slots)`);
});
