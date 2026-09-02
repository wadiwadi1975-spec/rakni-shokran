const { db, nextId } = require('../db');
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');
}
module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    const enriched = db.vehicles.map(v => {
      const user = db.users.find(u => u.id === v.userId) || null;
      return { ...v, userName: user?.fullName || '' };
    });
    return res.status(200).json(enriched);
  }
  if (req.method === 'POST') {
    const body = req.body;
    const v = { id: nextId(), userId: body.userId, plateNumber: body.plateNumber || body.plate, makeModel: body.makeModel || body.brand, color: body.color || '', brand: body.brand || '' };
    db.vehicles.push(v);
    return res.status(201).json(v);
  }
  res.status(405).json({ error: 'Method not allowed' });
};
