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
    const enriched = db.orders.map(o => {
      const vehicle = db.vehicles.find(v => v.id === o.vehicleId) || null;
      const spot = db.spots.find(s => s.id === o.spotId) || null;
      const user = db.users.find(u => u.id === o.userId) || null;
      return { ...o, vehicle, spot, userName: user?.fullName || '' };
    });
    return res.status(200).json(enriched);
  }
  if (req.method === 'POST') {
    const body = req.body;
    const u = auth(req);
    const order = { id: nextId(), userId: u?.id || body.userId, spotId: body.spotId, vehicleId: body.vehicleId, status: body.status || 'REQUESTED', pickupLocation: body.pickupLocation || '', createdAt: new Date().toISOString() };
    db.orders.push(order);
    return res.status(201).json(order);
  }
  res.status(405).json({ error: 'Method not allowed' });
};
