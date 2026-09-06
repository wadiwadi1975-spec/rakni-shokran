const { db, parkingDurationMinutes } = require('../../../db');
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
}
module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'POST') {
    const { id } = req.query;
    const body = req.body;
    const order = db.orders.find(o => String(o.id) === String(id));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = body.status;
    if (body.spotId) order.spotId = body.spotId;
    const now = new Date().toISOString();
    if (body.status === 'PARKED' && !order.parkingStartedAt) order.parkingStartedAt = now;
    if (['COMPLETED', 'CANCELLED'].includes(body.status)) {
      order.parkingEndedAt = now;
      order.parkingDurationMinutes = parkingDurationMinutes(order, new Date(now).getTime());
      if (body.status === 'COMPLETED') order.completedAt = now;
      const spot = db.spots.find(s => s.id === order.spotId);
      if (spot) spot.status = 'available';
    }
    return res.status(200).json({ ...order, parkingDurationMinutes: parkingDurationMinutes(order) });
  }
  res.status(405).json({ error: 'Method not allowed' });
};
