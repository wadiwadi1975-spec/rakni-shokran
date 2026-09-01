export const PILOT_STUDENTS = Array.from({length:50}, (_,i)=> ({
  id: `S${1000+i}`,
  name: `طالب ${i+1}`,
  email: `s${1000+i}@future.edu.eg`,
  car: { type: 'Toyota Corolla', model: '2022', color: 'أبيض', plate: `أ ب ج ${1000+i}`, spot: null }
}));

export const PILOT_VALET = [
  { id:'V01', name:'أحمد سامي', phone:'01012345678' },
  { id:'V02', name:'محمد عادل', phone:'01023456789' },
  { id:'V03', name:'يوسف خالد', phone:'01034567890' },
  { id:'V04', name:'سارة أحمد', phone:'01045678901' },
  { id:'V05', name:'عمر حسن', phone:'01056789012' },
  { id:'V06', name:'ليلى محمود', phone:'01067890123' },
];

export const PILOT_PARKING = {
  floors: [1,2,3,4].map(n=> ({ floor: n, capacity:500, occupied: n<=2 ? 380+ n*20 : 120 })),
};
