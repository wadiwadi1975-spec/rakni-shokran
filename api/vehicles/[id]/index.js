const { db } = require('../../db');
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','DELETE,OPTIONS');
}
module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'DELETE') {
    const { id } = req.query;
    db.vehicles = db.vehicles.filter(v => String(v.id) !== String(id));
    return res.status(200).json({ ok: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
};
