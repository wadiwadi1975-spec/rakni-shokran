const { db, auth, nextId, planPrices } = require('../db');
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
    const legacyPlan = body.billingType === 'monthly' ? 'MONTHLY' : body.billingType === 'annual' ? 'ANNUAL' : 'DAILY';
    const plan = planPrices[body.plan] ? body.plan : legacyPlan;
    const p = { id: nextId(), orderId: body.orderId, userId: u?.id || order?.userId, amount: planPrices[plan], plan, method: body.paymentMethod || body.method || 'KNET', billingType: plan.toLowerCase(), status: 'completed', createdAt: new Date().toISOString() };
    db.payments.push(p);
    return res.status(201).json(p);
  }
  res.status(405).json({ error: 'Method not allowed' });
};
