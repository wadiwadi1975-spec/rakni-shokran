let currentUser = null;
let dashboardData = null;

// ===== AUTH =====
async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) return alert('Enter email and password');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('dashboardScreen').classList.add('active');
      document.getElementById('navUser').textContent = `${currentUser.name} (${currentUser.role})`;
      loadDashboard();
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (e) {
    alert('Connection error');
  }
}

function handleLogout() {
  currentUser = null;
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('dashboardScreen').classList.remove('active');
}

// ===== NAVIGATION =====
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const section = document.getElementById('section-' + name);
  if (section) section.classList.add('active');

  const btn = document.querySelector(`[data-section="${name}"]`);
  if (btn) btn.classList.add('active');

  if (name === 'floors') loadFloors();
  if (name === 'reservations') loadReservations();
  if (name === 'valet') loadValet();
  if (name === 'students') loadStudents();
  if (name === 'pricing') loadPricing();
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const res = await fetch('/api/dashboard');
    dashboardData = await res.json();
    renderStats(dashboardData);
    renderFloorChart(dashboardData.floors);
    renderLiveStatus(dashboardData);
  } catch (e) {
    console.error('Dashboard error:', e);
  }
}

function renderStats(data) {
  document.getElementById('statTotal').textContent = data.totalCapacity.toLocaleString();
  document.getElementById('statOccupied').textContent = data.totalOccupied.toLocaleString();
  document.getElementById('statAvailable').textContent = data.available.toLocaleString();
  document.getElementById('statRate').textContent = data.occupancyRate;
}

function renderFloorChart(floors) {
  const canvas = document.getElementById('floorChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const barWidth = 100;
  const gap = 40;
  const maxH = 200;
  const startX = (width - (floors.length * (barWidth + gap) - gap)) / 2;

  floors.forEach((f, i) => {
    const x = startX + i * (barWidth + gap);
    const pct = f.occupied / f.total;
    const barH = pct * maxH;

    // Background bar
    ctx.fillStyle = '#222';
    ctx.fillRect(x, 50, barWidth, maxH);

    // Fill bar
    const gradient = ctx.createLinearGradient(x, 50 + maxH - barH, x, 50 + maxH);
    gradient.addColorStop(0, '#C9A86A');
    gradient.addColorStop(1, '#B8963D');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 50 + maxH - barH, barWidth, barH);

    // Floor name
    ctx.fillStyle = '#C9A86A';
    ctx.font = '12px Cairo';
    ctx.textAlign = 'center';
    ctx.fillText(f.name, x + barWidth / 2, 50 + maxH + 20);

    // Percentage
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px Cairo';
    ctx.fillText(pct.toFixed(1) + '%', x + barWidth / 2, 45 + maxH - barH);

    // Count
    ctx.fillStyle = '#888';
    ctx.font = '11px Cairo';
    ctx.fillText(`${f.occupied}/${f.total}`, x + barWidth / 2, 50 + maxH + 38);
  });
}

function renderLiveStatus(data) {
  const el = document.getElementById('liveStatus');
  el.innerHTML = `
    <div class="live-item">
      <span class="live-label"><span class="live-dot"></span> Total Capacity</span>
      <span class="live-value">${data.totalCapacity.toLocaleString()}</span>
    </div>
    <div class="live-item">
      <span class="live-label"><span class="live-dot"></span> Occupied</span>
      <span class="live-value">${data.totalOccupied}</span>
    </div>
    <div class="live-item">
      <span class="live-label"><span class="live-dot"></span> Available</span>
      <span class="live-value">${data.available}</span>
    </div>
    <div class="live-item">
      <span class="live-label"><span class="live-dot"></span> Active Reservations</span>
      <span class="live-value">${data.activeReservations}</span>
    </div>
    <div class="live-item">
      <span class="live-label"><span class="live-dot"></span> Active Valets</span>
      <span class="live-value">${data.activeValets}</span>
    </div>
    <div class="live-item">
      <span class="live-label"><span class="live-dot"></span> Total Revenue</span>
      <span class="live-value">${data.totalRevenue.toLocaleString()} EGP</span>
    </div>
  `;
}

// ===== FLOORS =====
async function loadFloors() {
  try {
    const res = await fetch('/api/dashboard');
    const data = await res.json();
    renderFloors(data.floors);
  } catch (e) {
    console.error('Floors error:', e);
  }
}

function renderFloors(floors) {
  const grid = document.getElementById('floorsGrid');
  grid.innerHTML = floors.map(f => {
    const pct = (f.occupied / f.total * 100).toFixed(1);
    const miniGrid = generateMiniGrid(f.id, f.occupied, f.total);
    return `
      <div class="floor-card">
        <div class="floor-header">
          <span class="floor-name">${f.name}</span>
          <span class="floor-count">Floor ${f.id}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${pct}%"></div>
        </div>
        <div class="floor-stats">
          <span>🚗 ${f.occupied} occupied</span>
          <span>✅ ${f.available} available</span>
          <span>📊 ${pct}%</span>
        </div>
        ${miniGrid}
      </div>
    `;
  }).join('');
}

function generateMiniGrid(floorId, occupied, total) {
  const sampleSize = 100;
  const spots = [];
  for (let i = 0; i < sampleSize; i++) {
    const isOccupied = i < Math.round(occupied / total * sampleSize);
    spots.push(`<div class="parking-spot ${isOccupied ? 'occupied' : 'empty'}" title="F${floorId}-S${i + 1}"></div>`);
  }
  return `<div class="parking-mini-grid">${spots.join('')}</div>`;
}

// ===== RESERVATIONS =====
async function loadReservations() {
  try {
    const res = await fetch('/api/reservations');
    const data = await res.json();
    renderReservations(data);
  } catch (e) {
    console.error('Reservations error:', e);
  }
}

function renderReservations(reservations) {
  const list = document.getElementById('reservationsList');
  if (reservations.length === 0) {
    list.innerHTML = '<p style="color: var(--gray); text-align: center; padding: 40px;">No reservations yet</p>';
    return;
  }
  list.innerHTML = reservations.map(r => `
    <div class="reservation-card">
      <div class="res-info">
        <h4>${r.vehiclePlate} · ${r.vehicleType}</h4>
        <p>Floor ${r.floor} · Slot ${r.slot} · ${r.subscription} · ${new Date(r.startTime).toLocaleDateString()}</p>
      </div>
      <span class="res-amount">${r.amount.toLocaleString()} EGP</span>
      <span class="res-badge ${r.status}">${r.status}</span>
    </div>
  `).join('');
}

function showNewReservation() {
  document.getElementById('reservationModal').classList.add('active');
}

async function createReservation() {
  const email = document.getElementById('resStudentEmail').value;
  const plate = document.getElementById('resPlate').value;
  const type = document.getElementById('resVehicleType').value;
  const floor = parseInt(document.getElementById('resFloor').value);
  const sub = document.getElementById('resSubscription').value;
  const pay = document.getElementById('resPayment').value;

  if (!email || !plate) return alert('Fill all required fields');

  try {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'manual',
        floor,
        vehiclePlate: plate,
        vehicleType: type,
        paymentMethod: pay,
        subscription: sub
      })
    });
    if (res.ok) {
      closeModal('reservationModal');
      loadReservations();
      loadDashboard();
      alert('Reservation created!');
    }
  } catch (e) {
    alert('Error creating reservation');
  }
}

// ===== VALET =====
async function loadValet() {
  try {
    const [reqRes, valetsRes] = await Promise.all([
      fetch('/api/valet/pickup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => ({ json: () => [] })),
      fetch('/api/valets')
    ]);
    const valets = await valetsRes.json();
    renderValet(valets);
  } catch (e) {
    console.error('Valet error:', e);
  }
}

function renderValet(valets) {
  const grid = document.getElementById('valetRequests');
  if (valets.length === 0) {
    grid.innerHTML = '<p style="color: var(--gray); text-align: center; padding: 40px;">No valets registered</p>';
    return;
  }
  grid.innerHTML = valets.map(v => `
    <div class="valet-card">
      <div class="valet-header">
        <span class="valet-name">${v.name}</span>
        <span class="valet-status available">Available</span>
      </div>
      <div class="valet-stats">
        <div class="valet-stat">
          <div class="valet-stat-value">${v.totalJobs || 0}</div>
          <div class="valet-stat-label">Total Jobs</div>
        </div>
        <div class="valet-stat">
          <div class="valet-stat-value">${v.rating || 5.0}</div>
          <div class="valet-stat-label">Rating</div>
        </div>
        <div class="valet-stat">
          <div class="valet-stat-value">${(v.wallet || 0).toLocaleString()}</div>
          <div class="valet-stat-label">Wallet (EGP)</div>
        </div>
        <div class="valet-stat">
          <div class="valet-stat-value">📱</div>
          <div class="valet-stat-label">${v.phone}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== STUDENTS =====
async function loadStudents() {
  try {
    const res = await fetch('/api/students');
    const data = await res.json();
    renderStudents(data);
  } catch (e) {
    console.error('Students error:', e);
  }
}

function renderStudents(students) {
  const list = document.getElementById('studentsList');
  if (students.length === 0) {
    list.innerHTML = '<p style="color: var(--gray); text-align: center; padding: 40px;">No students registered</p>';
    return;
  }
  list.innerHTML = students.map(s => `
    <div class="student-card">
      <div class="student-info">
        <h4>${s.name}</h4>
        <p>${s.email} · ${s.phone} · ID: ${s.studentId || 'N/A'}</p>
      </div>
      <span class="student-floor">Floor ${s.floor || '-'}</span>
    </div>
  `).join('');
}

function showNewStudent() {
  document.getElementById('studentModal').classList.add('active');
}

async function registerStudent() {
  const name = document.getElementById('stdName').value;
  const email = document.getElementById('stdEmail').value;
  const phone = document.getElementById('stdPhone').value;
  const studentId = document.getElementById('stdId').value;
  const password = document.getElementById('stdPassword').value;

  if (!name || !email || !password) return alert('Fill all required fields');

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, studentId, password, role: 'student' })
    });
    if (res.ok) {
      closeModal('studentModal');
      loadStudents();
      alert('Student registered!');
    } else {
      const data = await res.json();
      alert(data.error || 'Registration failed');
    }
  } catch (e) {
    alert('Error registering student');
  }
}

// ===== PRICING =====
async function loadPricing() {
  try {
    const res = await fetch('/api/pricing');
    const data = await res.json();
    renderPricing(data);
  } catch (e) {
    console.error('Pricing error:', e);
  }
}

function renderPricing(pricing) {
  const plans = [
    { name: 'Hourly', price: pricing.hourly, period: 'per hour', key: 'hourly' },
    { name: 'Weekly', price: pricing.weekly, period: 'per week', key: 'weekly' },
    { name: 'Monthly', price: pricing.monthly, period: 'per month', key: 'monthly', featured: true },
    { name: 'Semester', price: pricing.semester, period: 'per semester', key: 'semester' },
    { name: 'Yearly', price: pricing.yearly, period: 'per year', key: 'yearly' }
  ];

  const grid = document.getElementById('pricingGrid');
  grid.innerHTML = plans.map(p => `
    <div class="pricing-card ${p.featured ? 'featured' : ''}">
      <div class="pricing-name">${p.name}</div>
      <div class="pricing-price">${p.price.toLocaleString()} <span class="pricing-currency">EGP</span></div>
      <div class="pricing-period">${p.period}</div>
    </div>
  `).join('');
}

// ===== MODALS =====
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close modal on backdrop click
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) m.classList.remove('active');
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
  }
  if (e.key === 'Enter' && document.getElementById('loginScreen').classList.contains('active')) {
    handleLogin();
  }
});

// Auto-refresh every 30 seconds
setInterval(() => {
  if (currentUser) loadDashboard();
}, 30000);
