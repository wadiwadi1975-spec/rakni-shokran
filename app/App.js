import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Theme - Luxury Black + Metallic Gold + White
const COLORS = {
  black: '#0A0A0A',
  gold: '#C9A86A',
  goldDark: '#8C6A2A',
  white: '#FFFFFF',
  muted: '#9FB3A8',
  card: 'rgba(255,255,255,0.06)',
  border: 'rgba(201,168,106,0.35)',
};

const MOCK_CAR = { type: 'Toyota Corolla', plate: 'أ ب ج 1234', color: 'أبيض', status: 'متوقفة بأمان', spot: '2-145' };
const PARKING_BUILDING = {
  floors: [
    { id: '1', name: 'الطابق 1', capacity: 500, occupied: 420 },
    { id: '2', name: 'الطابق 2', capacity: 500, occupied: 380 },
    { id: '3', name: 'الطابق 3', capacity: 500, occupied: 210 },
    { id: '4', name: 'الطابق 4', capacity: 500, occupied: 95 },
  ],
  get total() { return 2000 },
  get occupied() { return this.floors.reduce((s,f)=>s+f.occupied,0) },
  get available() { return this.total - this.occupied },
  valetOnline: 6,
};

export default function App() {
  const [stage, setStage] = useState('splash'); // splash, auth, role, student, valet, admin
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [car, setCar] = useState(MOCK_CAR);
  const [requests, setRequests] = useState([]);
  const [floor, setFloor] = useState('2');
  const [spot, setSpot] = useState(null);

  useEffect(()=>{
    const t = setTimeout(()=> setStage('auth'), 1800);
    return ()=> clearTimeout(t);
  },[]);

  if (stage === 'splash') {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
        <Image source={require('./assets/logo.png')} style={styles.splashLogo} resizeMode="contain" />
        <Text style={styles.splashTitle}>RAKNI SHOKRAN</Text>
        <Text style={styles.splashSub}>SMART VALET & PARKING</Text>
        <Text style={styles.splashUni}>جامعة المستقبل</Text>
      </View>
    );
  }

  if (stage === 'auth') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image source={require('./assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>RAKNI SHOKRAN</Text>
          <Text style={styles.sub}>Smart Campus Valet Parking</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تسجيل الدخول</Text>
          <TextInput placeholder="البريد الجامعي / رقم الطالب" placeholderTextColor={COLORS.muted} style={styles.input} />
          <TextInput placeholder="كلمة المرور" placeholderTextColor={COLORS.muted} secureTextEntry style={styles.input} />
          <TouchableOpacity style={styles.btn} onPress={()=> setStage('role')}>
            <Text style={styles.btnText}>دخول</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=> setStage('role')}>
            <Text style={styles.link}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === 'role') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>اختر نوع الحساب</Text>
        <TouchableOpacity style={styles.roleCard} onPress={()=> { setRole('student'); setStage('addCar'); }}>
          <Text style={styles.roleEmoji}>🎓</Text>
          <Text style={styles.roleTitle}>طالب</Text>
          <Text style={styles.roleDesc}>طلب ركن واسترجاع السيارة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.roleCard} onPress={()=> { setRole('valet'); setStage('valet'); }}>
          <Text style={styles.roleEmoji}>🚗</Text>
          <Text style={styles.roleTitle}>Valet / سائق</Text>
          <Text style={styles.roleDesc}>استلام الطلبات وركن السيارات</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.roleCard} onPress={()=> { setRole('admin'); setStage('admin'); }}>
          <Text style={styles.roleEmoji}>🏢</Text>
          <Text style={styles.roleTitle}>الإدارة</Text>
          <Text style={styles.roleDesc}>لوحة تحكم الجامعة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (stage === 'addCar') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>تسجيل الطالب — بيانات السيارة</Text>
          <View style={styles.card}>
            <TextInput placeholder="البريد الجامعي (name@future.edu.eg)" placeholderTextColor={COLORS.muted} style={styles.input} />
            <TextInput placeholder="رمز OTP (جرب 123456)" placeholderTextColor={COLORS.muted} style={styles.input} />
            <TextInput placeholder="نوع السيارة (Toyota)" placeholderTextColor={COLORS.muted} style={styles.input} defaultValue={car.type} />
            <TextInput placeholder="الموديل (Corolla 2022)" placeholderTextColor={COLORS.muted} style={styles.input} />
            <TextInput placeholder="اللون (أبيض)" placeholderTextColor={COLORS.muted} style={styles.input} defaultValue={car.color} />
            <TextInput placeholder="رقم اللوحة" placeholderTextColor={COLORS.muted} style={styles.input} defaultValue={car.plate} />
            <TextInput placeholder="ملاحظات خاصة" placeholderTextColor={COLORS.muted} style={styles.input} />
            <Text style={[styles.info, {marginTop:8}]}>📷 صورة السيارة: (اختياري — سيتم التقاطها)</Text>
          </View>
          <TouchableOpacity style={styles.btn} onPress={()=> { setStage('student'); }}>
            <Text style={styles.btnText}>حفظ ومتابعة كطالب</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (stage === 'student') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.hello}>مرحباً أحمد 👋</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚗 سيارتك</Text>
            <Text style={styles.info}>السيارة: {car.type}</Text>
            <Text style={styles.info}>اللوحة: {car.plate}</Text>
            <Text style={styles.info}>الحالة: <Text style={{color:'#4ade80'}}>{car.status}</Text> — موقف {car.spot}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>مبنى المواقف — 4 طوابق × 500</Text>
            <Text style={styles.info}>🅿️ الإجمالي: {PARKING_BUILDING.total} — 🟢 متاحة: {PARKING_BUILDING.available} — 🔴 مشغولة: {PARKING_BUILDING.occupied}</Text>
            {PARKING_BUILDING.floors.map(f=>(
              <Text key={f.id} style={styles.info}>• {f.name}: {f.capacity - f.occupied} متاحة / {f.capacity} — {f.occupied} مشغولة</Text>
            ))}
            <Text style={styles.info}>👥 Valet متصل: {PARKING_BUILDING.valetOnline}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>خريطة الجامعة</Text>
            <Image source={{uri: 'https://staticmap.openstreetmap.de/staticmap.php?center=30.025,31.491&zoom=16&size=600x300&markers=30.025,31.491,red'}} style={{height:160, borderRadius:12, backgroundColor:'#222'}} />
            <Text style={styles.info}>جامعة المستقبل — نهاية شارع التسعين، القاهرة الجديدة</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>تكاليف الباركينج</Text>
            <Text style={styles.info}>• ساعة: 20 ج.م — يوم: 80 ج.م</Text>
            <Text style={styles.info}>• اشتراك شهري Student Pass: 499 ج.م (30 عملية Valet)</Text>
            <Text style={[styles.info, {color: COLORS.gold}]}>الدفع: شام كاش / سيريتل / MTN / بنكي / نقدي</Text>
          </View>
          <TouchableOpacity style={[styles.btn, {margin:16}]} onPress={()=> setStage('floorMap')}>
            <Text style={styles.btnText}>عرض خريطة المواقف واختيار الطابق</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, {margin:16, marginTop:0}]} onPress={()=> {
            const id = Date.now();
            setRequests([...requests, {id, status:'pending', from:'مبنى الهندسة', to:'2-145'}]);
            setStage('tracking');
          }}>
            <Text style={styles.btnText}>اطلب Valet فوراً</Text>
          </TouchableOpacity>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إضافة سيارة</Text>
            <TextInput placeholder="نوع السيارة" placeholderTextColor={COLORS.muted} style={styles.input} defaultValue={car.type} />
            <TextInput placeholder="رقم اللوحة" placeholderTextColor={COLORS.muted} style={styles.input} defaultValue={car.plate} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (stage === 'floorMap') {
    const f = PARKING_BUILDING.floors.find(x=>x.id===floor);
    const spots = Array.from({length: 500}, (_,i)=> {
      const n = i+1;
      const occupied = n <= f.occupied;
      const isSelected = spot===n;
      return {n, occupied, isSelected};
    });
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>خريطة مبنى المواقف</Text>
        <View style={{flexDirection:'row', gap:8, marginBottom:12}}>
          {PARKING_BUILDING.floors.map(fl=>(
            <TouchableOpacity key={fl.id} onPress={()=> {setFloor(fl.id); setSpot(null);}} style={[styles.stat, {flex:1, backgroundColor: floor===fl.id ? COLORS.gold : COLORS.card, borderColor: COLORS.gold}]}>
              <Text style={[styles.statNum, {color: floor===fl.id ? COLORS.black : COLORS.gold}]}>{fl.name}</Text>
              <Text style={[styles.statLabel, {color: floor===fl.id ? COLORS.black : COLORS.muted}]}>{fl.capacity - fl.occupied} متاح</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.info}>الطابق {f.name} — اختر موقفاً (أخضر متاح، أحمر مشغول، ذهبي اختيارك)</Text>
        <ScrollView style={{flex:1, marginTop:8}}>
          <View style={{flexDirection:'row', flexWrap:'wrap'}}>
            {spots.map(s=>(
              <TouchableOpacity key={s.n} disabled={s.occupied} onPress={()=> setSpot(s.n)} style={{width: 30, height: 22, margin:3, borderRadius:4, backgroundColor: s.isSelected ? COLORS.gold : s.occupied ? '#ef4444' : '#22c55e', opacity: s.occupied?0.5:1, alignItems:'center', justifyContent:'center'}}>
                <Text style={{fontSize:7, color: s.isSelected? COLORS.black : '#fff'}}>{s.n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <TouchableOpacity style={[styles.btn, {opacity: spot?1:0.5}]} disabled={!spot} onPress={()=> {
          const id = Date.now();
          const to = `${floor}-${spot}`;
          setCar({...car, spot: to});
          setRequests([...requests, {id, status:'pending', from:'مبنى الهندسة', to}]);
          setStage('tracking');
        }}>
          <Text style={styles.btnText}>{spot ? `تأكيد موقف ${floor}-${spot} وطلب Valet` : 'اختر موقفاً أولاً'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=> setStage('student')}><Text style={styles.link}>رجوع</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (stage === 'tracking') {
    const last = requests[requests.length-1];
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>تتبع طلبك</Text>
        <View style={styles.card}>
          <Text style={styles.info}>طلب #{last?.id?.toString().slice(-4)} — {last?.from} → {last?.to}</Text>
          <Text style={styles.step}>✓ تم إرسال الطلب</Text>
          <Text style={styles.step}>● في الطريق إليك — موظف الركن أحمد</Text>
          <Text style={styles.stepMuted}>○ تم الاستلام → ركن في A-24 → متوقفة بأمان</Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={()=> setStage('student')}>
          <Text style={styles.btnText}>طلب استرجاع السيارة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, {backgroundColor: COLORS.card, borderWidth:1, borderColor: COLORS.border}]} onPress={()=> setStage('student')}>
          <Text style={[styles.btnText, {color: COLORS.gold}]}>سجل العمليات</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (stage === 'valet') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>طلبات Valet</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>طلب #1042 — منذ 25 ثانية</Text>
          <Text style={styles.info}>📍 مبنى الهندسة</Text>
          <Text style={styles.info}>🚗 Toyota Corolla — أ ب ج 1234</Text>
          <TouchableOpacity style={styles.btn} onPress={()=> setStage('valet-progress')}>
            <Text style={styles.btnText}>قبول الطلب</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === 'valet-progress') {
    const [s, setS] = useState(0);
    const steps = ['في الطريق إلى الطالب','تم استلام السيارة','السيارة في موقف A-24','السيارة مؤمنة'];
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>حالة الطلب #1042</Text>
        <View style={styles.card}>
          {steps.map((st,i)=>(
            <Text key={i} style={i<=s ? styles.step : styles.stepMuted}>{i<=s ? '●' : '○'} {st}</Text>
          ))}
        </View>
        <TouchableOpacity style={styles.btn} onPress={()=> s<3 ? setS(s+1) : setStage('valet')}>
          <Text style={styles.btnText}>{s<3 ? 'التالي' : 'تم التسليم'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (stage === 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>Rakni Shokran — Admin</Text>
          <Text style={[styles.info, {textAlign:'center', marginBottom:10}]}>مبنى 4 طوابق × 500 — الإجمالي 2000</Text>
          <View style={styles.grid}>
            <View style={styles.stat}><Text style={styles.statNum}>{PARKING_BUILDING.occupied}</Text><Text style={styles.statLabel}>متوقفة حالياً</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>{PARKING_BUILDING.available}</Text><Text style={styles.statLabel}>متاحة</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>{PARKING_BUILDING.valetOnline}</Text><Text style={styles.statLabel}>Valet متصل</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>742</Text><Text style={styles.statLabel}>طلبات اليوم</Text></View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إشغال الطوابق</Text>
            {PARKING_BUILDING.floors.map(f=>(
              <Text key={f.id} style={styles.info}>{f.name}: {f.occupied}/500 ({Math.round(f.occupied/5)}%) — متاح {f.capacity - f.occupied}</Text>
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إدارة</Text>
            <Text style={styles.info}>• الطلاب • السائقين • المواقف • الطلبات Live • الإيرادات • التقارير</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  splash: { flex:1, backgroundColor: COLORS.black, alignItems:'center', justifyContent:'center' },
  splashLogo: { width:220, height:220 },
  splashTitle: { color: COLORS.gold, fontSize:28, fontWeight:'800', letterSpacing:3, marginTop:16 },
  splashSub: { color: COLORS.gold, fontSize:12, letterSpacing:2, opacity:0.8 },
  splashUni: { color: COLORS.white, marginTop:6, opacity:0.6 },
  container: { flex:1, backgroundColor: COLORS.black, padding:16 },
  header: { alignItems:'center', marginVertical:24 },
  logo: { width:90, height:90 },
  title: { color: COLORS.gold, fontSize:24, fontWeight:'800', textAlign:'center', marginTop:12 },
  sub: { color: COLORS.muted, textAlign:'center', marginTop:4 },
  hello: { color: COLORS.white, fontSize:20, fontWeight:'700', marginBottom:12 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth:1, borderRadius:18, padding:16, marginBottom:12 },
  cardTitle: { color: COLORS.gold, fontWeight:'700', marginBottom:8, fontSize:16 },
  info: { color: COLORS.white, marginVertical:2 },
  step: { color: COLORS.gold, marginVertical:4, fontWeight:'600' },
  stepMuted: { color: COLORS.muted, marginVertical:4 },
  input: { backgroundColor:'rgba(255,255,255,0.06)', borderColor: COLORS.border, borderWidth:1, borderRadius:12, padding:12, color: COLORS.white, marginVertical:6, textAlign:'right' },
  btn: { backgroundColor: COLORS.gold, padding:14, borderRadius:12, alignItems:'center', marginVertical:8 },
  btnText: { color: COLORS.black, fontWeight:'800', fontSize:16 },
  link: { color: COLORS.gold, textAlign:'center', marginTop:10 },
  roleCard: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth:1, borderRadius:18, padding:20, marginVertical:8, alignItems:'center' },
  roleEmoji: { fontSize:32 },
  roleTitle: { color: COLORS.gold, fontWeight:'800', fontSize:18, marginTop:6 },
  roleDesc: { color: COLORS.muted, fontSize:13, marginTop:4 },
  grid: { flexDirection:'row', flexWrap:'wrap', gap:10 },
  stat: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth:1, borderRadius:16, padding:16, width:'47%', alignItems:'center' },
  statNum: { color: COLORS.gold, fontSize:22, fontWeight:'800' },
  statLabel: { color: COLORS.muted, fontSize:12, marginTop:4 },
});
