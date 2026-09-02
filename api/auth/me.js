const { db, auth } = require('../db');
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
}
module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    const u = auth(req);
    if (!u) return res.status(401).json({ error: 'غير مصرح' });
    const { password, _token, ...safe } = u;
    return res.status(200).json(safe);
  }
  res.status(405).json({ error: 'Method not allowed' });
};
