// Variabel global untuk chart
let progressChart;

// Fungsi untuk memformat tanggal
function formatDate(dateString) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Fungsi untuk memformat tanggal ke YYYY-MM-DD
function formatDateInput(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fungsi untuk logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
});

// Cek status login
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = 'index.html';
  } else {
    // Set tanggal default ke hari ini
    document.getElementById('activityDate').value = formatDateInput(new Date());
    
    // Load data
    loadTodayActivities();
    loadAllActivities();
    loadChartData();
  }
});

// Handle form tambah kegiatan
document.getElementById('activityForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const user = auth.currentUser;
  if (!user) return;
  
  const activityName = document.getElementById('activityName').value;
  const activityDuration = parseFloat(document.getElementById('activityDuration').value);
  const activityDate = document.getElementById('activityDate').value;
  
  // Simpan ke Firebase
  database.ref('activities/' + user.uid).push().set({
    name: activityName,
    duration: activityDuration,
    date: activityDate,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  })
  .then(() => {
    alert('Kegiatan berhasil disimpan!');
    document.getElementById('activityForm').reset();
    document.getElementById('activityDate').value = formatDateInput(new Date());
    
    // Refresh data
    loadTodayActivities();
    loadAllActivities();
    loadChartData();
  })
  .catch((error) => {
    alert('Gagal menyimpan kegiatan: ' + error.message);
  });
});

// Fungsi untuk memuat kegiatan hari ini
function loadTodayActivities() {
  const user = auth.currentUser;
  if (!user) return;
  
  const today = formatDateInput(new Date());
  const activitiesRef = database.ref('activities/' + user.uid)
    .orderByChild('date')
    .equalTo(today);
  
  activitiesRef.on('value', (snapshot) => {
    const activities = snapshot.val() || {};
    const todayActivitiesEl = document.getElementById('todayActivities');
    const todayTotalEl = document.getElementById('todayTotal');
    
    let total = 0;
    let html = '';
    
    Object.keys(activities).forEach((key) => {
      const activity = activities[key];
      total += activity.duration;
      
      html += `
        <div class="d-flex justify-content-between mb-2">
          <span>${activity.name}</span>
          <span class="fw-bold">${activity.duration} jam</span>
        </div>
      `;
    });
    
    todayTotalEl.textContent = total.toFixed(1);
    todayActivitiesEl.innerHTML = html || '<p class="text-muted text-center">Belum ada kegiatan hari ini</p>';
  });
}

// Fungsi untuk memuat semua kegiatan
function loadAllActivities() {
  const user = auth.currentUser;
  if (!user) return;
  
  const activitiesRef = database.ref('activities/' + user.uid).orderByChild('createdAt');
  const activityTableEl = document.getElementById('activityTable');
  
  activitiesRef.on('value', (snapshot) => {
    const activities = snapshot.val() || {};
    let html = '';
    
    Object.keys(activities).forEach((key) => {
      const activity = activities[key];
      
      html += `
        <tr>
          <td>${formatDate(activity.date)}</td>
          <td>${activity.name}</td>
          <td>${activity.duration}</td>
          <td>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${key}">Hapus</button>
          </td>
        </tr>
      `;
    });
    
    activityTableEl.innerHTML = html || '<tr><td colspan="4" class="text-center">Belum ada kegiatan</td></tr>';
    
    // Tambahkan event listener untuk tombol hapus
    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const activityId = e.target.getAttribute('data-id');
        if (confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) {
          database.ref('activities/' + user.uid + '/' + activityId).remove()
            .then(() => {
              loadTodayActivities();
              loadChartData();
            });
        }
      });
    });
  });
}

// Fungsi untuk memuat data chart
function loadChartData() {
  const user = auth.currentUser;
  if (!user) return;
  
  const activitiesRef = database.ref('activities/' + user.uid);
  
  activitiesRef.on('value', (snapshot) => {
    const activities = snapshot.val() || {};
    const dataByDate = {};
    
    // Kelompokkan data berdasarkan tanggal
    Object.keys(activities).forEach((key) => {
      const activity = activities[key];
      if (!dataByDate[activity.date]) {
        dataByDate[activity.date] = 0;
      }
      dataByDate[activity.date] += activity.duration;
    });
    
    // Urutkan berdasarkan tanggal
    const sortedDates = Object.keys(dataByDate).sort();
    const labels = sortedDates.map(date => formatDate(date));
    const data = sortedDates.map(date => dataByDate[date]);
    
    // Update chart
    updateChart(labels, data);
  });
}

// Fungsi untuk membuat/mengupdate chart
function updateChart(labels, data) {
  const ctx = document.getElementById('progressChart').getContext('2d');
  
  if (progressChart) {
    progressChart.data.labels = labels;
    progressChart.data.datasets[0].data = data;
    progressChart.update();
  } else {
    progressChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Jam Belajar',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Progress Belajar Harian',
            font: {
              size: 16
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Jam Belajar'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Tanggal'
            }
          }
        }
      }
    });
  }
}