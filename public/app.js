let currentUser = null;

// ===== AUTH =====
async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return alert('أدخل البريد وكلمة المرور');
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    const data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('dashboardScreen').classList.add('active');
      document.getElementById('navUser').textContent = currentUser.name + ' (' + currentUser.role + ')';
      loadDashboard();
    } else {
      alert(data.error || 'خطأ في تسجيل الدخول');
    }
  } catch(e) { alert('خطأ في الاتصال بالخادم'); }
}

function handleLogout() {
  currentUser = null;
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboardScreen').classList.remove('active');
}

// ===== NAVIGATION =====
function show(name) {
  document.querySelectorAll('.sec').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.topbar-nav button[data-s]').forEach(b => b.classList.remove('active'));
  var sec = document.getElementById('sec-' + name);
  if (sec) sec.style.display = 'block';
  var btn = document.querySelector('[data-s="' + name + '"]');
  if (btn) btn.classList.add('active');
  if (name === 'floors') loadFloors();
  if (name === 'reservations') loadReservations();
  if (name === 'valet') loadValet();
  if (name === 'students') loadStudents();
  if (name === 'pricing') loadPricing();
}

// ===== MODALS =====
function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal').forEach(function(m) {
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('active'); });
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') document.querySelectorAll('.modal.active').forEach(function(m) { m.classList.remove('active'); });
  if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') handleLogin();
});

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    var res = await fetch('/api/dashboard');
    var d = await res.json();
    document.getElementById('sTotal').textContent = d.totalCapacity.toLocaleString();
    document.getElementById('sOccupied').textContent = d.totalOccupied.toLocaleString();
    document.getElementById('sAvailable').textContent = d.available.toLocaleString();
    document.getElementById('sRate').textContent = d.occupancyRate;
    renderChart(d.floors);
    renderLive(d);
  } catch(e) { console.error(e); }
}

function renderChart(floors) {
  var c = document.getElementById('floorChart');
  if (!c) return;
  var ctx = c.getContext('2d');
  var W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  var bw = 90, gap = 40, maxH = 200, sx = (W - (floors.length * (bw + gap) - gap)) / 2;
  floors.forEach(function(f, i) {
    var x = sx + i * (bw + gap), pct = f.occupied / f.total, bh = pct * maxH;
    ctx.fillStyle = '#222'; ctx.fillRect(x, 40, bw, maxH);
    var g = ctx.createLinearGradient(x, 40 + maxH - bh, x, 40 + maxH);
    g.addColorStop(0, '#C9A86A'); g.addColorStop(1, '#B8963D');
    ctx.fillStyle = g; ctx.fillRect(x, 40 + maxH - bh, bw, bh);
    ctx.fillStyle = '#C9A86A'; ctx.font = '11px Cairo'; ctx.textAlign = 'center';
    ctx.fillText(f.name, x + bw/2, 40 + maxH + 18);
    ctx.fillStyle = '#FFF'; ctx.font = 'bold 13px Cairo';
    ctx.fillText((pct*100).toFixed(1) + '%', x + bw/2, 35 + maxH - bh);
    ctx.fillStyle = '#888'; ctx.font = '10px Cairo';
    ctx.fillText(f.occupied + '/' + f.total, x + bw/2, 40 + maxH + 34);
  });
}

function renderLive(d) {
  var h = '<div class="live-item"><span class="live-lbl"><span class="live-dot"></span>إجمالي الطاقة</span><span class="live-val">' + d.totalCapacity.toLocaleString() + '</span></div>';
  h += '<div class="live-item"><span class="live-lbl"><span class="live-dot"></span>المشغولة</span><span class="live-val">' + d.totalOccupied + '</span></div>';
  h += '<div class="live-item"><span class="live-lbl"><span class="live-dot"></span>المتاحة</span><span class="live-val">' + d.available + '</span></div>';
  h += '<div class="live-item"><span class="live-lbl"><span class="live-dot"></span>الحجوزات النشطة</span><span class="live-val">' + d.activeReservations + '</span></div>';
  h += '<div class="live-item"><span class="live-lbl"><span class="live-dot"></span>السائقون النشطون</span><span class="live-val">' + d.activeValets + '</span></div>';
  h += '<div class="live-item"><span class="live-lbl"><span class="live-dot"></span>إجمالي الإيرادات</span><span class="live-val">' + d.totalRevenue.toLocaleString() + ' ج.م</span></div>';
  document.getElementById('liveStatus').innerHTML = h;
}

// ===== FLOORS =====
async function loadFloors() {
  try {
    var res = await fetch('/api/dashboard');
    var d = await res.json();
    renderFloors(d.floors);
  } catch(e) { console.error(e); }
}

function renderFloors(floors) {
  var g = document.getElementById('floorsGrid');
  g.innerHTML = floors.map(function(f) {
    var pct = (f.occupied / f.total * 100).toFixed(1);
    var spots = '';
    var n = 100;
    for (var i = 0; i < n; i++) {
      var occ = i < Math.round(f.occupied / f.total * n);
      spots += '<div class="spot ' + (occ ? 'o' : 'e') + '" title="F' + f.id + '-S' + (i+1) + '"></div>';
    }
    return '<div class="floor"><div class="floor-head"><span class="floor-name">' + f.name + '</span><span class="floor-cnt">الطابق ' + f.id + '</span></div><div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div><div class="floor-stats"><span>🚗 ' + f.occupied + ' مشغولة</span><span>✅ ' + f.available + ' متاحة</span><span>📊 ' + pct + '%</span></div><div class="mini-grid">' + spots + '</div></div>';
  }).join('');
}

// ===== RESERVATIONS =====
async function loadReservations() {
  try {
    var res = await fetch('/api/reservations');
    var d = await res.json();
    renderReservations(d);
  } catch(e) { console.error(e); }
}

function renderReservations(list) {
  var el = document.getElementById('reservationsList');
  if (!list.length) { el.innerHTML = '<p style="color:var(--gray);text-align:center;padding:40px">لا توجد حجوزات بعد</p>'; return; }
  var h = '<table class="tbl"><thead><tr><th>اللوحة</th><th>النوع</th><th>الطابق</th><th>الخطة</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>';
  list.forEach(function(r) {
    h += '<tr><td>' + r.vehiclePlate + '</td><td>' + r.vehicleType + '</td><td>' + r.floor + '</td><td>' + r.subscription + '</td><td class="gold-text">' + r.amount.toLocaleString() + ' ج.م</td><td><span class="badge ' + (r.status === 'active' ? 'badge-active' : 'badge-done') + '">' + (r.status === 'active' ? 'نشط' : 'مكتمل') + '</span></td><td>' + new Date(r.startTime).toLocaleDateString('ar-EG') + '</td></tr>';
  });
  h += '</tbody></table>';
  el.innerHTML = h;
}

async function createReservation() {
  var email = document.getElementById('resEmail').value;
  var plate = document.getElementById('resPlate').value;
  var type = document.getElementById('resVehicleType').value;
  var floor = parseInt(document.getElementById('resFloor').value);
  var sub = document.getElementById('resSubscription').value;
  var pay = document.getElementById('resPayment').value;
  if (!email || !plate) return alert('املأ جميع الحقول المطلوبة');
  try {
    var res = await fetch('/api/reservations', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({userId:'manual',floor:floor,vehiclePlate:plate,vehicleType:type,paymentMethod:pay,subscription:sub})
    });
    if (res.ok) { hideModal('reservationModal'); loadReservations(); loadDashboard(); alert('تم إنشاء الحجز بنجاح!'); }
  } catch(e) { alert('خطأ في إنشاء الحجز'); }
}

// ===== VALET =====
async function loadValet() {
  try {
    var res = await fetch('/api/valets');
    var d = await res.json();
    renderValet(d);
  } catch(e) { console.error(e); }
}

function renderValet(list) {
  var g = document.getElementById('valetGrid');
  if (!list.length) { g.innerHTML = '<p style="color:var(--gray);text-align:center;padding:40px">لا يوجد سائقون مسجلون</p>'; return; }
  g.innerHTML = list.map(function(v) {
    return '<div class="valet"><div class="valet-head"><span class="valet-name">' + v.name + '</span><span class="badge badge-active">متاح</span></div><div class="valet-stat"><div class="vs"><div class="vs-val">' + (v.totalJobs||0) + '</div><div class="vs-lbl">الرحلات</div></div><div class="vs"><div class="vs-val">' + (v.rating||5.0) + '</div><div class="vs-lbl">التقييم</div></div><div class="vs"><div class="vs-val">' + (v.wallet||0).toLocaleString() + '</div><div class="vs-lbl">المحفظة</div></div><div class="vs"><div class="vs-val" style="font-size:11px">' + v.phone + '</div><div class="vs-lbl">الهاتف</div></div></div></div>';
  }).join('');
}

// ===== STUDENTS =====
async function loadStudents() {
  try {
    var res = await fetch('/api/students');
    var d = await res.json();
    renderStudents(d);
  } catch(e) { console.error(e); }
}

function renderStudents(list) {
  var el = document.getElementById('studentsList');
  if (!list.length) { el.innerHTML = '<p style="color:var(--gray);text-align:center;padding:40px">لا يوجد طلاب مسجلون</p>'; return; }
  var h = '<table class="tbl"><thead><tr><th>الاسم</th><th>البريد</th><th>الهاتف</th><th>رقم الطالب</th><th>الطابق</th></tr></thead><tbody>';
  list.forEach(function(s) {
    h += '<tr><td>' + s.name + '</td><td>' + s.email + '</td><td>' + s.phone + '</td><td>' + (s.studentId||'-') + '</td><td><span class="badge badge-active">' + (s.floor||'-') + '</span></td></tr>';
  });
  h += '</tbody></table>';
  el.innerHTML = h;
}

async function registerStudent() {
  var name = document.getElementById('stdName').value;
  var email = document.getElementById('stdEmail').value;
  var phone = document.getElementById('stdPhone').value;
  var sid = document.getElementById('stdId').value;
  var pass = document.getElementById('stdPassword').value;
  if (!name || !email || !pass) return alert('املأ جميع الحقول المطلوبة');
  try {
    var res = await fetch('/api/auth/register', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name:name,email:email,phone:phone,studentId:sid,password:pass,role:'student'})
    });
    if (res.ok) { hideModal('studentModal'); loadStudents(); alert('تم تسجيل الطالب بنجاح!'); }
    else { var d = await res.json(); alert(d.error || 'خطأ في التسجيل'); }
  } catch(e) { alert('خطأ في التسجيل'); }
}

// ===== PRICING =====
async function loadPricing() {
  try {
    var res = await fetch('/api/pricing');
    var d = await res.json();
    renderPricing(d);
  } catch(e) { console.error(e); }
}

function renderPricing(p) {
  var plans = [
    {name:'ساعة', price:p.hourly, period:'لكل ساعة', key:'hourly'},
    {name:'أسبوعي', price:p.weekly, period:'أسبوعياً', key:'weekly'},
    {name:'شهري', price:p.monthly, period:'شهرياً', key:'monthly', feat:true},
    {name:'فصل', price:p.semester, period:'للفصل الدراسي', key:'semester'},
    {name:'سنوي', price:p.yearly, period:'سنوياً', key:'yearly'}
  ];
  document.getElementById('pricingGrid').innerHTML = plans.map(function(pl) {
    return '<div class="plan' + (pl.feat ? ' feat' : '') + '"><div class="plan-name">' + pl.name + '</div><div class="plan-price">' + pl.price.toLocaleString() + ' <span class="plan-curr">ج.م</span></div><div class="plan-period">' + pl.period + '</div></div>';
  }).join('');
}

setInterval(function() { if (currentUser) loadDashboard(); }, 30000);
