const { db, auth, nextId } = require('../db');
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
}
module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    const enriched = db.payments.map(p => {
      const order = db.orders.find(o => o.id === p.orderId) || null;
      const vehicle = order ? db.vehicles.find(v => v.id === order.vehicleId) || null : null;
      return { ...p, order, vehicle, plateNumber: vehicle?.plateNumber || '' };
    });
    return res.status(200).json(enriched);
  }
  if (req.method === 'POST') {
    const body = req.body;
    const u = auth(req);
    const order = db.orders.find(o => o.id === body.orderId) || null;
    const p = { id: nextId(), orderId: body.orderId, userId: u?.id || order?.userId, amount: 50, method: body.paymentMethod || body.method || 'KNET', status: 'completed', createdAt: new Date().toISOString() };
    db.payments.push(p);
    return res.status(201).json(p);
  }
  res.status(405).json({ error: 'Method not allowed' });
};
