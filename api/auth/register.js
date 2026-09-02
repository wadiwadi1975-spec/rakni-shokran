const { db, nextId } = require('../db');
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
}
module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'POST') {
    const body = req.body;
    if (db.users.find(u => u.email === body.email)) return res.status(409).json({ error: 'البريد مسجل مسبقاً' });
    const user = { id: 'u' + nextId(), fullName: body.fullName || body.name, email: body.email, password: body.password, role: body.role || 'STUDENT', phone: body.phone || '', studentId: body.studentId || '', university: body.university || '', branch: body.branch || '', createdAt: new Date().toISOString() };
    db.users.push(user);
    user._token = 'tok_' + nextId();
    const { password, _token, ...safe } = user;
    return res.status(201).json({ accessToken: user._token, user: safe });
  }
  res.status(405).json({ error: 'Method not allowed' });
};
