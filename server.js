const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;
const PUBLIC = path.join(__dirname, 'public');
const DB = path.join(__dirname, 'data', 'db.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });

function genId() { return crypto.randomBytes(8).toString('hex'); }
let _idSeq = 100;
function nextId() { return ++_idSeq; }

function initDB() {
  if (!fs.existsSync(DB)) {
    const d = {
      users: [
        { id: 'u1', fullName: 'Admin', email: 'admin@rakni.com', password: 'admin123', role: 'ADMIN', phone: '01000000000', university: 'University of Future', branch: 'Cairo', createdAt: new Date().toISOString() },
        { id: 'u2', fullName: 'Ahmed Valet', email: 'valet@rakni.com', password: 'valet123', role: 'VALET', phone: '01100000000', rating: 5, totalJobs: 0, wallet: 0, createdAt: new Date().toISOString() },
        { id: 'u3', fullName: 'Sara Student', email: 'student@rakni.com', password: 'student123', role: 'STUDENT', phone: '01200000000', studentId: 'FU-2024-001', university: 'University of Future', branch: 'Cairo New Capital', createdAt: new Date().toISOString() }
      ],
      spots: (function(){
        const s=[];
        const floors=['A','B','C','D'];
        const floorNames=['الطابق الأرضي','الطابق الأول','الطابق الثاني','الطابق الثالث'];
        let id=1;
        for(let f=0;f<4;f++){
          for(let n=1;n<=250;n++){
            s.push({id:id++,floor:f+1,spotCode: floors[f]+'-'+String(n).padStart(2,'0'),status:'available'});
          }
        }
        return s;
      })(),
      vehicles: [
        { id: 1, userId: 'u3', plateNumber: 'ABC-1234', makeModel: 'Toyota Corolla', color: 'White', brand: 'Toyota' }
      ],
      orders: [
        { id: 1, userId: 'u3', spotId: 2, vehicleId: 1, status: 'PARKED', pickupLocation: 'Gate 3', createdAt: new Date().toISOString() }
      ],
      payments: [
        { id: 1, orderId: 1, userId: 'u3', amount: 50, method: 'KNET', status: 'completed', createdAt: new Date().toISOString() }
      ]
    };
    fs.writeFileSync(DB, JSON.stringify(d, null, 2));
    return d;
  }
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}

let db = initDB();
function save() { fs.writeFileSync(DB, JSON.stringify(db, null, 2)); }

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' });
  res.end(JSON.stringify(data));
}

function auth(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  const token = h.slice(7);
  return db.users.find(u => u._token === token) || null;
}

const MIME = { '.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2' };

async function api(req, res, url, method) {
  // OPTIONS
  if (method === 'OPTIONS') { res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' }); return res.end(); }

  // Health
  if (url === '/api/healthz' && method === 'GET') return json(res, 200, { ok: true });

  // Auth: Login
  if (url === '/api/auth/login' && method === 'POST') {
    const body = await readBody(req);
    const user = db.users.find(u => u.email === body.email && u.password === body.password);
    if (!user) return json(res, 401, { error: 'البريد أو كلمة المرور غير صحيحة' });
    user._token = 'tok_' + genId();
    save();
    const { password, _token, ...safe } = user;
    return json(res, 200, { accessToken: user._token, user: safe });
  }

  // Auth: Register
  if (url === '/api/auth/register' && method === 'POST') {
    const body = await readBody(req);
    if (db.users.find(u => u.email === body.email)) return json(res, 409, { error: 'البريد مسجل مسبقاً' });
    const user = { id: 'u' + genId(), fullName: body.fullName || body.name, email: body.email, password: body.password, role: body.role || 'STUDENT', phone: body.phone || '', studentId: body.studentId || '', university: body.university || '', branch: body.branch || '', createdAt: new Date().toISOString() };
    db.users.push(user);
    user._token = 'tok_' + genId();
    save();
    const { password, _token, ...safe } = user;
    return json(res, 201, { accessToken: user._token, user: safe });
  }

  // Auth: Me
  if (url === '/api/auth/me' && method === 'GET') {
    const u = auth(req);
    if (!u) return json(res, 401, { error: 'غير مصرح' });
    const { password, _token, ...safe } = u;
    return json(res, 200, safe);
  }

  // Dashboard
  if (url === '/api/dashboard' && method === 'GET') {
    const totalSpots = db.spots.length;
    const occupied = db.spots.filter(s => s.status === 'occupied').length;
    const available = db.spots.filter(s => s.status === 'available').length;
    const activeOrders = db.orders.filter(o => !['COMPLETED','CANCELLED'].includes(o.status)).length;
    const completedOrders = db.orders.filter(o => o.status === 'COMPLETED').length;
    const totalRevenue = db.payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
    const floors = [1, 2, 3, 4].map(f => {
      const fSpots = db.spots.filter(s => s.floor === f);
      return { id: f, name: ['الطابق الأرضي (A)', 'الطابق الأول (B)', 'الطابق الثاني (C)', 'الطابق الثالث (D)'][f-1], total: fSpots.length, occupied: fSpots.filter(s => s.status === 'occupied').length, available: fSpots.filter(s => s.status === 'available').length };
    });
    return json(res, 200, { totalSpots, occupiedSpots: occupied, availableSpots: available, activeOrders, completedOrders, totalRevenue, floors, activeValets: db.users.filter(u => u.role === 'VALET').length, totalStudents: db.users.filter(u => u.role === 'STUDENT').length });
  }

  // Spots
  if (url === '/api/spots' && method === 'GET') return json(res, 200, db.spots);
  if (url === '/api/spots' && method === 'POST') {
    const body = await readBody(req);
    const spot = { id: nextId(), floor: body.floor, spotCode: body.spotCode, status: body.status || 'available' };
    db.spots.push(spot); save();
    return json(res, 201, spot);
  }
  const spotPatch = url.match(/^\/api\/spots\/(.+)\/status$/);
  if (spotPatch && method === 'PATCH') {
    const body = await readBody(req);
    const spot = db.spots.find(s => String(s.id) === String(spotPatch[1]));
    if (!spot) return json(res, 404, { error: 'Spot not found' });
    spot.status = body.status;
    if (body.userId) spot.userId = body.userId;
    save();
    return json(res, 200, spot);
  }

  // Vehicles
  if (url === '/api/vehicles' && method === 'GET') {
    const enriched = db.vehicles.map(v => {
      const user = db.users.find(u => u.id === v.userId) || null;
      return { ...v, userName: user?.fullName || '' };
    });
    return json(res, 200, enriched);
  }
  if (url === '/api/vehicles' && method === 'POST') {
    const body = await readBody(req);
    const v = { id: nextId(), userId: body.userId, plateNumber: body.plateNumber || body.plate, makeModel: body.makeModel || body.brand, color: body.color || '', brand: body.brand || '' };
    db.vehicles.push(v); save();
    return json(res, 201, v);
  }
  const vDel = url.match(/^\/api\/vehicles\/(.+)$/);
  if (vDel && method === 'DELETE') {
    db.vehicles = db.vehicles.filter(v => v.id !== vDel[1]); save();
    return json(res, 200, { ok: true });
  }

  // Orders
  if (url === '/api/orders' && method === 'GET') {
    const enriched = db.orders.map(o => {
      const vehicle = db.vehicles.find(v => v.id === o.vehicleId) || null;
      const spot = db.spots.find(s => s.id === o.spotId) || null;
      const user = db.users.find(u => u.id === o.userId) || null;
      return { ...o, vehicle, spot, userName: user?.fullName || '' };
    });
    return json(res, 200, enriched);
  }
  if (url === '/api/orders' && method === 'POST') {
    const body = await readBody(req);
    const u = auth(req);
    let spotId = body.spotId || null;
    if (!spotId && body.preferredSpotCode) {
      const found = db.spots.find(s => s.spotCode === body.preferredSpotCode && s.status === 'available');
      if (found) {
        spotId = found.id;
        found.status = 'occupied';
      }
    }
    const order = { id: nextId(), userId: u?.id || body.userId, spotId, vehicleId: body.vehicleId, preferredFloor: body.preferredFloor || null, preferredSpotCode: body.preferredSpotCode || null, status: body.status || 'REQUESTED', pickupLocation: body.pickupLocation || '', createdAt: new Date().toISOString() };
    db.orders.push(order); save();
    return json(res, 201, order);
  }
  const oTrans = url.match(/^\/api\/orders\/(.+)\/transition$/);
  if (oTrans && method === 'POST') {
    const body = await readBody(req);
    const order = db.orders.find(o => String(o.id) === String(oTrans[1]));
    if (!order) return json(res, 404, { error: 'Order not found' });
    order.status = body.status;
    if (body.status === 'COMPLETED') order.completedAt = new Date().toISOString();
    save();
    return json(res, 200, order);
  }

  // Payments
  if (url === '/api/payments' && method === 'GET') {
    const enriched = db.payments.map(p => {
      const order = db.orders.find(o => o.id === p.orderId) || null;
      const vehicle = order ? db.vehicles.find(v => v.id === order.vehicleId) || null : null;
      return { ...p, order, vehicle, plateNumber: vehicle?.plateNumber || '' };
    });
    return json(res, 200, enriched);
  }
  if (url === '/api/payments' && method === 'POST') {
    const body = await readBody(req);
    const u = auth(req);
    const order = db.orders.find(o => o.id === body.orderId) || null;
    const p = { id: nextId(), orderId: body.orderId, userId: u?.id || order?.userId, amount: 50, method: body.paymentMethod || body.method || 'KNET', status: 'completed', createdAt: new Date().toISOString() };
    db.payments.push(p); save();
    return json(res, 201, p);
  }

  json(res, 404, { error: 'Not found' });
}

// Static server
const server = http.createServer(async (req, res) => {
  let url = req.url.split('?')[0];
  const method = req.method;

  if (url.startsWith('/api/')) return api(req, res, url, method);

  if (url === '/') url = '/index.html';
  if (url === '/spots') url = '/spots-map.html';
  const filePath = path.join(PUBLIC, url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(PUBLIC, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(d2);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' }); res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🅿️  رَكْنِي شكراً running at http://0.0.0.0:${PORT}`);
  console.log(`📊 Spots: ${db.spots.length} | Users: ${db.users.length} | Orders: ${db.orders.length}`);
});
