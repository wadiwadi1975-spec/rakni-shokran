const { db } = require('../db');
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','PATCH,OPTIONS');
}
module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'PATCH') {
    const { id } = req.query;
    const body = req.body;
    const spot = db.spots.find(s => String(s.id) === String(id));
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    spot.status = body.status;
    if (body.userId) spot.userId = body.userId;
    return res.status(200).json(spot);
  }
  res.status(405).json({ error: 'Method not allowed' });
};
