const { db, auth, nextId } = require('../db');
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
}
module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json(db.spots);
  if (req.method === 'POST') {
    const body = req.body;
    const spot = { id: nextId(), floor: body.floor, spotCode: body.spotCode, status: body.status || 'available' };
    db.spots.push(spot);
    return res.status(201).json(spot);
  }
  res.status(405).json({ error: 'Method not allowed' });
};
