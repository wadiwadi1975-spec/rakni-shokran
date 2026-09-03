const crypto = require('crypto');
let _idSeq = 100;
function nextId() { return ++_idSeq; }
function genId() { return crypto.randomBytes(8).toString('hex'); }

const db = {
  users: [
    { id: 'u1', fullName: 'Admin', email: 'admin@rakni.com', password: 'admin123', role: 'ADMIN', phone: '01000000000', university: 'University of Future', branch: 'Cairo', createdAt: new Date().toISOString() },
    { id: 'u2', fullName: 'Ahmed Valet', email: 'valet@rakni.com', password: 'valet123', role: 'VALET', phone: '01100000000', rating: 5, totalJobs: 0, wallet: 0, createdAt: new Date().toISOString() },
    { id: 'u3', fullName: 'خالد وادي', email: 'student@rakni.com', password: 'student123', role: 'STUDENT', phone: '01200000000', studentId: 'FU-2024-001', university: 'University of Future', branch: 'Cairo New Capital', createdAt: new Date().toISOString() }
  ],
  spots: (function(){
    const s=[];
    const floors=['A','B','C','D'];
    let id=1;
    for(let f=0;f<4;f++){for(let n=1;n<=250;n++){s.push({id:id++,floor:f+1,spotCode:floors[f]+'-'+String(n).padStart(2,'0'),status:'available'});}}
    return s;
  })(),
  vehicles: [
    { id: 1, userId: 'u3', plateNumber: 'ABC-1234', makeModel: 'Toyota Corolla', color: 'White', brand: 'Toyota' },
    { id: 2, userId: 'u3', plateNumber: 'XYZ-5678', makeModel: 'Honda Civic', color: 'Black', brand: 'Honda' },
    { id: 3, userId: 'u3', plateNumber: 'KWT-1122', makeModel: 'Hyundai Elantra', color: 'Silver', brand: 'Hyundai' },
    { id: 4, userId: 'u3', plateNumber: 'KWT-3344', makeModel: 'Kia Sportage', color: 'Red', brand: 'Kia' },
    { id: 5, userId: 'u3', plateNumber: 'EGY-9988', makeModel: 'Nissan Sunny', color: 'White', brand: 'Nissan' },
    { id: 6, userId: 'u3', plateNumber: 'MNC-4455', makeModel: 'Mitsubishi Lancer', color: 'Grey', brand: 'Mitsubishi' },
    { id: 7, userId: 'u3', plateNumber: 'CHV-7766', makeModel: 'Chevrolet Malibu', color: 'Blue', brand: 'Chevrolet' },
    { id: 8, userId: 'u3', plateNumber: 'FRD-2233', makeModel: 'Ford Focus', color: 'White', brand: 'Ford' },
    { id: 9, userId: 'u3', plateNumber: 'VW-8899', makeModel: 'Volkswagen Golf', color: 'Black', brand: 'Volkswagen' },
    { id: 10, userId: 'u3', plateNumber: 'BMW-1010', makeModel: 'BMW 320i', color: 'Silver', brand: 'BMW' },
    { id: 11, userId: 'u3', plateNumber: 'MBZ-2020', makeModel: 'Mercedes C200', color: 'Black', brand: 'Mercedes' },
    { id: 12, userId: 'u3', plateNumber: 'AUD-3030', makeModel: 'Audi A4', color: 'White', brand: 'Audi' },
    { id: 13, userId: 'u3', plateNumber: 'LEX-4040', makeModel: 'Lexus ES 350', color: 'Beige', brand: 'Lexus' },
    { id: 14, userId: 'u3', plateNumber: 'MZD-5151', makeModel: 'Mazda 3', color: 'Red', brand: 'Mazda' },
    { id: 15, userId: 'u3', plateNumber: 'SUZ-6262', makeModel: 'Suzuki Swift', color: 'Yellow', brand: 'Suzuki' },
    { id: 16, userId: 'u3', plateNumber: 'PEU-7373', makeModel: 'Peugeot 3008', color: 'Blue', brand: 'Peugeot' },
    { id: 17, userId: 'u3', plateNumber: 'REN-8484', makeModel: 'Renault Duster', color: 'White', brand: 'Renault' },
    { id: 18, userId: 'u3', plateNumber: 'JEP-9595', makeModel: 'Jeep Cherokee', color: 'Green', brand: 'Jeep' },
    { id: 19, userId: 'u3', plateNumber: 'SKD-1212', makeModel: 'Skoda Octavia', color: 'Grey', brand: 'Skoda' },
    { id: 20, userId: 'u3', plateNumber: 'MG-3434', makeModel: 'MG ZS', color: 'Red', brand: 'MG' }
  ],
  orders: [
    { id: 1, userId: 'u3', spotId: 2, vehicleId: 1, status: 'PARKED', pickupLocation: 'Gate 3', createdAt: new Date().toISOString() },
    { id: 2, userId: 'u3', spotId: 15, vehicleId: 2, status: 'REQUESTED', pickupLocation: 'Gate 1', createdAt: new Date().toISOString() },
    { id: 3, userId: 'u3', spotId: 23, vehicleId: 3, status: 'VALET_ASSIGNED', pickupLocation: 'Gate 2', createdAt: new Date().toISOString() },
    { id: 4, userId: 'u3', spotId: 34, vehicleId: 4, status: 'RECEIVED', pickupLocation: 'Gate 3', createdAt: new Date().toISOString() },
    { id: 5, userId: 'u3', spotId: 45, vehicleId: 5, status: 'RETRIEVING', pickupLocation: 'Gate 1', createdAt: new Date().toISOString() },
    { id: 6, userId: 'u3', spotId: 56, vehicleId: 6, status: 'COMPLETED', pickupLocation: 'Gate 2', createdAt: new Date(Date.now()-86400000).toISOString(), completedAt: new Date().toISOString() },
    { id: 7, userId: 'u3', spotId: 67, vehicleId: 7, status: 'PARKED', pickupLocation: 'Gate 3', createdAt: new Date().toISOString() },
    { id: 8, userId: 'u3', spotId: 78, vehicleId: 8, status: 'REQUESTED', pickupLocation: 'Gate 1', createdAt: new Date().toISOString() },
    { id: 9, userId: 'u3', spotId: 89, vehicleId: 9, status: 'PARKED', pickupLocation: 'Gate 2', createdAt: new Date().toISOString() },
    { id: 10, userId: 'u3', spotId: 90, vehicleId: 10, status: 'RETRIEVAL_REQUESTED', pickupLocation: 'Gate 3', createdAt: new Date().toISOString() }
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
