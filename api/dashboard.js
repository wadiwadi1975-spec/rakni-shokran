const { db } = require('../db');
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
}
module.exports = (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    const totalSpots = db.spots.length;
    const occupied = db.spots.filter(s => s.status === 'occupied').length;
    const available = db.spots.filter(s => s.status === 'available').length;
    const activeOrders = db.orders.filter(o => !['COMPLETED','CANCELLED'].includes(o.status)).length;
    const completedOrders = db.orders.filter(o => o.status === 'COMPLETED').length;
    const totalRevenue = db.payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
    const floors = [1,2,3,4].map(f => {
      const fSpots = db.spots.filter(s => s.floor === f);
      return { id: f, name: ['الطابق الأرضي (A)','الطابق الأول (B)','الطابق الثاني (C)','الطابق الثالث (D)'][f-1], total: fSpots.length, occupied: fSpots.filter(s => s.status === 'occupied').length, available: fSpots.filter(s => s.status === 'available').length };
    });
    return res.status(200).json({ totalSpots, occupiedSpots: occupied, availableSpots: available, activeOrders, completedOrders, totalRevenue, floors, activeValets: db.users.filter(u => u.role === 'VALET').length, totalStudents: db.users.filter(u => u.role === 'STUDENT').length });
  }
  res.status(405).json({ error: 'Method not allowed' });
};
