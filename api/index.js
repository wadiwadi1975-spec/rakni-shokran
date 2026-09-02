const { db, auth, nextId } = require('./db');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
}

function json(res, status, data) {
  cors(res);
  res.status(status).json(data);
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url.split('?')[0];
  const method = req.method;

  // Health
  if (url === '/api/healthz' && method === 'GET') return json(res, 200, { ok: true });

  // Auth: Login
  if (url === '/api/auth/login' && method === 'POST') {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) return json(res, 401, { error: 'البريد أو كلمة المرور غير صحيحة' });
    user._token = 'tok_' + nextId();
    const { password: pw, _token, ...safe } = user;
    return json(res, 200, { accessToken: user._token, user: safe });
  }

  // Auth: Register
  if (url === '/api/auth/register' && method === 'POST') {
    const body = req.body;
    if (db.users.find(u => u.email === body.email)) return json(res, 409, { error: 'البريد مسجل مسبقاً' });
    const user = { id: 'u' + nextId(), fullName: body.fullName || body.name, email: body.email, password: body.password, role: body.role || 'STUDENT', phone: body.phone || '', studentId: body.studentId || '', university: body.university || '', branch: body.branch || '', createdAt: new Date().toISOString() };
    db.users.push(user);
    user._token = 'tok_' + nextId();
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
    const floors = [1,2,3,4].map(f => {
      const fSpots = db.spots.filter(s => s.floor === f);
      return { id: f, name: ['الطابق الأرضي (A)','الطابق الأول (B)','الطابق الثاني (C)','الطابق الثالث (D)'][f-1], total: fSpots.length, occupied: fSpots.filter(s => s.status === 'occupied').length, available: fSpots.filter(s => s.status === 'available').length };
    });
    return json(res, 200, { totalSpots, occupiedSpots: occupied, availableSpots: available, activeOrders, completedOrders, totalRevenue, floors, activeValets: db.users.filter(u => u.role === 'VALET').length, totalStudents: db.users.filter(u => u.role === 'STUDENT').length });
  }

  // Spots
  if (url === '/api/spots' && method === 'GET') return json(res, 200, db.spots);
  if (url === '/api/spots' && method === 'POST') {
    const body = req.body;
    const spot = { id: nextId(), floor: body.floor, spotCode: body.spotCode, status: body.status || 'available' };
    db.spots.push(spot);
    return json(res, 201, spot);
  }
  const spotPatch = url.match(/^\/api\/spots\/(.+)\/status$/);
  if (spotPatch && method === 'PATCH') {
    const body = req.body;
    const spot = db.spots.find(s => String(s.id) === String(spotPatch[1]));
    if (!spot) return json(res, 404, { error: 'Spot not found' });
    spot.status = body.status;
    if (body.userId) spot.userId = body.userId;
    return json(res, 200, spot);
  }

  // Vehicles
  if (url === '/api/vehicles' && method === 'GET') {
    return json(res, 200, db.vehicles.map(v => {
      const user = db.users.find(u => u.id === v.userId) || null;
      return { ...v, userName: user?.fullName || '' };
    }));
  }
  if (url === '/api/vehicles' && method === 'POST') {
    const body = req.body;
    const v = { id: nextId(), userId: body.userId, plateNumber: body.plateNumber || body.plate, makeModel: body.makeModel || body.brand, color: body.color || '', brand: body.brand || '' };
    db.vehicles.push(v);
    return json(res, 201, v);
  }
  const vDel = url.match(/^\/api\/vehicles\/(.+)$/);
  if (vDel && method === 'DELETE') {
    db.vehicles = db.vehicles.filter(v => String(v.id) !== String(vDel[1]));
    return json(res, 200, { ok: true });
  }

  // Orders
  if (url === '/api/orders' && method === 'GET') {
    return json(res, 200, db.orders.map(o => {
      const vehicle = db.vehicles.find(v => v.id === o.vehicleId) || null;
      const spot = db.spots.find(s => s.id === o.spotId) || null;
      const user = db.users.find(u => u.id === o.userId) || null;
      return { ...o, vehicle, spot, userName: user?.fullName || '' };
    }));
  }
  if (url === '/api/orders' && method === 'POST') {
    const body = req.body;
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
    db.orders.push(order);
    return json(res, 201, order);
  }
  const oTrans = url.match(/^\/api\/orders\/(.+)\/transition$/);
  if (oTrans && method === 'POST') {
    const body = req.body;
    const order = db.orders.find(o => String(o.id) === String(oTrans[1]));
    if (!order) return json(res, 404, { error: 'Order not found' });
    order.status = body.status;
    if (body.spotId) order.spotId = body.spotId;
    if (body.status === 'COMPLETED') order.completedAt = new Date().toISOString();
    return json(res, 200, order);
  }

  // Payments
  if (url === '/api/payments' && method === 'GET') {
    return json(res, 200, db.payments.map(p => {
      const order = db.orders.find(o => o.id === p.orderId) || null;
      const vehicle = order ? db.vehicles.find(v => v.id === order.vehicleId) || null : null;
      return { ...p, order, vehicle, plateNumber: vehicle?.plateNumber || '' };
    }));
  }
  if (url === '/api/payments' && method === 'POST') {
    const body = req.body;
    const u = auth(req);
    const order = db.orders.find(o => o.id === body.orderId) || null;
    const p = { id: nextId(), orderId: body.orderId, userId: u?.id || order?.userId, amount: 50, method: body.paymentMethod || body.method || 'KNET', status: 'completed', createdAt: new Date().toISOString() };
    db.payments.push(p);
    return json(res, 201, p);
  }

  json(res, 404, { error: 'Not found' });
};
