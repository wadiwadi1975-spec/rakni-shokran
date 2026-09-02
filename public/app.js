let user=null;

// ===== AUTH =====
async function handleLogin(){
  const e=document.getElementById('loginEmail').value,p=document.getElementById('loginPassword').value;
  if(!e||!p)return alert('أدخل البريد وكلمة المرور');
  try{
    const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e,password:p})});
    const d=await r.json();
    if(r.ok){user=d.user;document.getElementById('loginScreen').style.display='none';document.getElementById('dash').classList.add('on');document.getElementById('navUser').textContent=user.name+' ('+user.role+')';loadDash()}
    else alert(d.error||'خطأ');
  }catch(x){alert('خطأ في الاتصال')}
}
function logout(){user=null;document.getElementById('loginScreen').style.display='flex';document.getElementById('dash').classList.remove('on')}

// ===== NAV =====
function go(n){
  document.querySelectorAll('.sec').forEach(s=>s.style.display='none');
  document.querySelectorAll('.tb-nav button[data-s]').forEach(b=>b.classList.remove('on'));
  const s=document.getElementById('s-'+n);if(s)s.style.display='block';
  const b=document.querySelector('[data-s="'+n+'"]');if(b)b.classList.add('on');
  if(n==='floors')loadFloors();if(n==='reservations')loadRes();if(n==='valet')loadVL();if(n==='students')loadStd();if(n==='pricing')loadPrice();
}

// ===== MODAL =====
function openM(id){document.getElementById(id).classList.add('on')}
function closeM(id){document.getElementById(id).classList.remove('on')}
document.querySelectorAll('.modal').forEach(m=>{m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('on')})});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal.on').forEach(m=>m.classList.remove('on'));if(e.key==='Enter'&&document.getElementById('loginScreen').style.display!=='none')handleLogin()});

// ===== DASHBOARD =====
async function loadDash(){
  try{
    const r=await fetch('/api/dashboard');const d=await r.json();
    document.getElementById('sT').textContent=d.totalCapacity.toLocaleString();
    document.getElementById('sO').textContent=d.totalOccupied.toLocaleString();
    document.getElementById('sA').textContent=d.available.toLocaleString();
    document.getElementById('sR').textContent=d.occupancyRate;
    drawChart(d.floors);drawLive(d);
  }catch(e){console.error(e)}
}

function drawChart(floors){
  const c=document.getElementById('chart');if(!c)return;
  const x=c.getContext('2d'),W=c.width,H=c.height;
  x.clearRect(0,0,W,H);
  const bw=80,gap=35,mh=180,sx=(W-(floors.length*(bw+gap)-gap))/2;
  floors.forEach((f,i)=>{
    const px=sx+i*(bw+gap),pct=f.occupied/f.total,bh=pct*mh;
    x.fillStyle='#1F2937';x.fillRect(px,35,bw,mh);
    const g=x.createLinearGradient(px,35+mh-bh,px,35+mh);
    g.addColorStop(0,'#C9A86A');g.addColorStop(1,'#B8963D');
    x.fillStyle=g;x.fillRect(px,35+mh-bh,bw,bh);
    x.fillStyle='#C9A86A';x.font='10px Cairo';x.textAlign='center';
    x.fillText(f.name,px+bw/2,35+mh+16);
    x.fillStyle='#F9FAFB';x.font='bold 12px Cairo';
    x.fillText((pct*100).toFixed(1)+'%',px+bw/2,30+mh-bh);
    x.fillStyle='#9CA3AF';x.font='9px Cairo';
    x.fillText(f.occupied+'/'+f.total,px+bw/2,35+mh+30);
  });
}

function drawLive(d){
  const h=[
    ['الإجمالي',d.totalCapacity.toLocaleString()],
    ['المشغولة',d.totalOccupied],
    ['المتاحة',d.available],
    ['الحجوزات',d.activeReservations],
    ['السائقون',d.activeValets],
    ['الإيرادات',d.totalRevenue.toLocaleString()+' ج.م']
  ].map(([l,v])=>'<div class="li"><span class="li-l"><span class="dot"></span>'+l+'</span><span class="li-v">'+v+'</span></div>').join('');
  document.getElementById('live').innerHTML=h;
}

// ===== FLOORS =====
async function loadFloors(){
  try{const r=await fetch('/api/dashboard');const d=await r.json();renderFloors(d.floors)}catch(e){console.error(e)}
}
function renderFloors(floors){
  document.getElementById('floorsG').innerHTML=floors.map(f=>{
    const pct=(f.occupied/f.total*100).toFixed(1);
    let spots='';for(let i=0;i<100;i++){const o=i<Math.round(f.occupied/f.total*100);spots+='<div class="sp '+(o?'o':'e')+'" title="F'+f.id+'-S'+(i+1)+'"></div>'}
    return '<div class="fl"><div class="fl-h"><span class="fl-n">'+f.name+'</span><span class="fl-c">الطابق '+f.id+'</span></div><div class="bar"><div class="bar-f" style="width:'+pct+'%"></div></div><div class="fl-s"><span>🚗 '+f.occupied+' مشغولة</span><span>✅ '+f.available+' متاحة</span><span>📊 '+pct+'%</span></div><div class="mg">'+spots+'</div></div>';
  }).join('');
}

// ===== RESERVATIONS =====
async function loadRes(){
  try{const r=await fetch('/api/reservations');const d=await r.json();renderRes(d)}catch(e){console.error(e)}
}
function renderRes(list){
  const el=document.getElementById('resList');
  if(!list.length){el.innerHTML='<div class="empty">لا توجد حجوزات بعد</div>';return}
  let h='<table class="tbl"><thead><tr><th>اللوحة</th><th>النوع</th><th>الطابق</th><th>الخطة</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>';
  list.forEach(r=>{
    h+='<tr><td>'+r.vehiclePlate+'</td><td>'+r.vehicleType+'</td><td>'+r.floor+'</td><td>'+r.subscription+'</td><td class="gold">'+r.amount.toLocaleString()+' ج.م</td><td><span class="pill '+(r.status==='active'?'pill-g':'pill-r')+'">'+(r.status==='active'?'نشط':'مكتمل')+'</span></td><td>'+new Date(r.startTime).toLocaleDateString('ar-EG')+'</td></tr>';
  });
  el.innerHTML=h+'</tbody></table>';
}

async function createRes(){
  const email=document.getElementById('rEmail').value,plate=document.getElementById('rPlate').value;
  const type=document.getElementById('rType').value,floor=+document.getElementById('rFloor').value;
  const sub=document.getElementById('rSub').value,pay=document.getElementById('rPay').value;
  if(!email||!plate)return alert('املأ الحقول المطلوبة');
  try{
    const r=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:'manual',floor,vehiclePlate:plate,vehicleType:type,paymentMethod:pay,subscription:sub})});
    if(r.ok){closeM('resM');loadRes();loadDash();alert('تم الحجز بنجاح!')}
  }catch(e){alert('خطأ')}
}

// ===== VALET =====
async function loadVL(){
  try{const r=await fetch('/api/valets');const d=await r.json();renderVL(d)}catch(e){console.error(e)}
}
function renderVL(list){
  const g=document.getElementById('vlG');
  if(!list.length){g.innerHTML='<div class="empty">لا يوجد سائقون</div>';return}
  g.innerHTML=list.map(v=>'<div class="vl"><div class="vl-h"><span class="vl-n">'+v.name+'</span><span class="pill pill-g">متاح</span></div><div class="vl-g"><div class="vs"><div class="vs-v">'+(v.totalJobs||0)+'</div><div class="vs-l">الرحلات</div></div><div class="vs"><div class="vs-v">'+(v.rating||5.0)+'</div><div class="vs-l">التقييم</div></div><div class="vs"><div class="vs-v">'+(v.wallet||0).toLocaleString()+'</div><div class="vs-l">المحفظة</div></div><div class="vs"><div class="vs-v" style="font-size:10px">'+v.phone+'</div><div class="vs-l">الهاتف</div></div></div></div>').join('');
}

// ===== STUDENTS =====
async function loadStd(){
  try{const r=await fetch('/api/students');const d=await r.json();renderStd(d)}catch(e){console.error(e)}
}
function renderStd(list){
  const el=document.getElementById('stdList');
  if(!list.length){el.innerHTML='<div class="empty">لا يوجد طلاب</div>';return}
  let h='<table class="tbl"><thead><tr><th>الاسم</th><th>البريد</th><th>الهاتف</th><th>رقم الطالب</th><th>الطابق</th></tr></thead><tbody>';
  list.forEach(s=>{h+='<tr><td>'+s.name+'</td><td>'+s.email+'</td><td>'+s.phone+'</td><td>'+(s.studentId||'-')+'</td><td><span class="pill pill-y">'+(s.floor||'-')+'</span></td></tr>'});
  el.innerHTML=h+'</tbody></table>';
}

async function regStd(){
  const n=document.getElementById('stN').value,e=document.getElementById('stE').value;
  const p=document.getElementById('stP').value,i=document.getElementById('stI').value;
  const w=document.getElementById('stW').value;
  if(!n||!e||!w)return alert('املأ الحقول المطلوبة');
  try{
    const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,email:e,phone:p,studentId:i,password:w,role:'student'})});
    if(r.ok){closeM('stdM');loadStd();alert('تم التسجيل!')}
    else{const d=await r.json();alert(d.error||'خطأ')}
  }catch(e){alert('خطأ')}
}

// ===== PRICING =====
async function loadPrice(){
  try{const r=await fetch('/api/pricing');const d=await r.json();renderPrice(d)}catch(e){console.error(e)}
}
function renderPrice(p){
  const plans=[
    {n:'ساعة',p:p.hourly,d:'لكل ساعة'},
    {n:'أسبوعي',p:p.weekly,d:'أسبوعياً'},
    {n:'شهري',p:p.monthly,d:'شهرياً',f:1},
    {n:'فصل',p:p.semester,d:'للفصل'},
    {n:'سنوي',p:p.yearly,d:'سنوياً'}
  ];
  document.getElementById('planG').innerHTML=plans.map(pl=>'<div class="pl'+(pl.f?' feat':'')+'"><div class="pl-n">'+pl.n+'</div><div class="pl-p">'+pl.p.toLocaleString()+' <span class="pl-c">ج.م</span></div><div class="pl-d">'+pl.d+'</div></div>').join('');
}

setInterval(()=>{if(user)loadDash()},30000);
