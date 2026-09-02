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
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
    user._token = 'tok_' + nextId();
    const { password: pw, _token, ...safe } = user;
    return res.status(200).json({ accessToken: user._token, user: safe });
  }
  res.status(405).json({ error: 'Method not allowed' });
};
