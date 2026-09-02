const crypto = require('crypto');
let _idSeq = 100;
function nextId() { return ++_idSeq; }
function genId() { return crypto.randomBytes(8).toString('hex'); }

const db = {
  users: [
    { id: 'u1', fullName: 'Admin', email: 'admin@rakni.com', password: 'admin123', role: 'ADMIN', phone: '01000000000', university: 'University of Future', branch: 'Cairo', createdAt: new Date().toISOString() },
    { id: 'u2', fullName: 'Ahmed Valet', email: 'valet@rakni.com', password: 'valet123', role: 'VALET', phone: '01100000000', rating: 5, totalJobs: 0, wallet: 0, createdAt: new Date().toISOString() },
    { id: 'u3', fullName: 'Sara Student', email: 'student@rakni.com', password: 'student123', role: 'STUDENT', phone: '01200000000', studentId: 'FU-2024-001', university: 'University of Future', branch: 'Cairo New Capital', createdAt: new Date().toISOString() }
  ],
  spots: (function(){
    const s=[];
    const floors=['A','B','C','D'];
    let id=1;
    for(let f=0;f<4;f++){for(let n=1;n<=250;n++){s.push({id:id++,floor:f+1,spotCode:floors[f]+'-'+String(n).padStart(2,'0'),status:'available'});}}
    return s;
  })(),
  vehicles: [
    { id: 1, userId: 'u3', plateNumber: 'ABC-1234', makeModel: 'Toyota Corolla', color: 'White', brand: 'Toyota' }
  ],
  orders: [
    { id: 1, userId: 'u3', spotId: 2, vehicleId: 1, status: 'PARKED', pickupLocation: 'Gate 3', createdAt: new Date().toISOString() }
  ],
  payments: [
    { id: 1, orderId: 1, userId: 'u3', amount: 50, method: 'KNET', status: 'completed', createdAt: new Date().toISOString() }
  ]
};

function auth(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  const token = h.slice(7);
  return db.users.find(u => u._token === token) || null;
}

module.exports = { db, auth, nextId, genId };
