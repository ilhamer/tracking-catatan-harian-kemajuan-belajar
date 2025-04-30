document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi variabel
    let currentUser = null;
    let activities = [];
    let progressChart = null;
    let subjectChart = null;
    
    // Elemen DOM
    const userNameElement = document.getElementById('userName');
    const todayMinutesElement = document.getElementById('todayMinutes');
    const weekMinutesElement = document.getElementById('weekMinutes');
    const activitiesBody = document.getElementById('activitiesBody');
    const addActivityBtn = document.getElementById('addActivityBtn');
    const activityModal = new bootstrap.Modal(document.getElementById('activityModal'));
    const activityForm = document.getElementById('activityForm');
    const saveActivityBtn = document.getElementById('saveActivityBtn');
    const modalTitle = document.getElementById('modalTitle');
    const activityIdInput = document.getElementById('activityId');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileForm = document.getElementById('profileForm');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const timeRangeSelect = document.getElementById('timeRangeSelect');
    
    // Format waktu
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Format tanggal
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    // Hitung total menit hari ini
    function calculateTodayMinutes() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayActivities = activities.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            activityDate.setHours(0, 0, 0, 0);
            return activityDate.getTime() === today.getTime();
        });
        
        const totalMinutes = todayActivities.reduce((sum, activity) => sum + parseInt(activity.duration), 0);
        todayMinutesElement.textContent = totalMinutes;
    }
    
    // Hitung total menit minggu ini
    function calculateWeekMinutes() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const weekActivities = activities.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            return activityDate >= startOfWeek;
        });
        
        const totalMinutes = weekActivities.reduce((sum, activity) => sum + parseInt(activity.duration), 0);
        weekMinutesElement.textContent = totalMinutes;
    }
    
    // Render tabel aktivitas
    function renderActivities() {
        activitiesBody.innerHTML = '';
        
        if (activities.length === 0) {
            activitiesBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        <i class="fas fa-book-open fa-2x mb-2"></i>
                        <p class="mb-0">Belum ada catatan belajar hari ini</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Urutkan berdasarkan waktu terbaru
        const sortedActivities = [...activities].sort((a, b) => b.timestamp - a.timestamp);
        
        // Ambil hanya aktivitas hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayActivities = sortedActivities.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            activityDate.setHours(0, 0, 0, 0);
            return activityDate.getTime() === today.getTime();
        });
        
        todayActivities.forEach(activity => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            row.innerHTML = `
                <td>${activity.subject}</td>
                <td>${activity.topic}</td>
                <td>${activity.duration}</td>
                <td>${activity.notes || '-'}</td>
                <td>${formatTime(activity.timestamp)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-activity" data-id="${activity.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-activity" data-id="${activity.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            activitiesBody.appendChild(row);
        });
        
        // Tambahkan event listener untuk tombol edit dan delete
        document.querySelectorAll('.edit-activity').forEach(btn => {
            btn.addEventListener('click', function() {
                const activityId = this.getAttribute('data-id');
                editActivity(activityId);
            });
        });
        
        document.querySelectorAll('.delete-activity').forEach(btn => {
            btn.addEventListener('click', function() {
                const activityId = this.getAttribute('data-id');
                deleteActivity(activityId);
            });
        });
        
        // Update statistik
        calculateTodayMinutes();
        calculateWeekMinutes();
        
        // Update chart
        updateCharts();
    }
    
    // Tambah aktivitas baru
    function addActivity() {
        modalTitle.textContent = 'Tambah Aktivitas Belajar';
        activityIdInput.value = '';
        activityForm.reset();
        activityModal.show();
    }
    
    // Edit aktivitas
    function editActivity(activityId) {
        const activity = activities.find(a => a.id === activityId);
        if (!activity) return;
        
        modalTitle.textContent = 'Edit Aktivitas Belajar';
        activityIdInput.value = activity.id;
        document.getElementById('subject').value = activity.subject;
        document.getElementById('topic').value = activity.topic;
        document.getElementById('duration').value = activity.duration;
        document.getElementById('notes').value = activity.notes || '';
        activityModal.show();
    }
    
    // Hapus aktivitas
    function deleteActivity(activityId) {
        if (confirm('Apakah Anda yakin ingin menghapus aktivitas ini?')) {
            database.ref(`activities/${currentUser.uid}/${activityId}`).remove()
                .then(() => {
                    showToast('Sukses', 'Aktivitas berhasil dihapus');
                })
                .catch(error => {
                    showToast('Error', 'Gagal menghapus aktivitas');
                    console.error(error);
                });
        }
    }
    
    // Simpan aktivitas
    function saveActivity() {
        const activityId = activityIdInput.value || Date.now().toString();
        const subject = document.getElementById('subject').value;
        const topic = document.getElementById('topic').value;
        const duration = document.getElementById('duration').value;
        const notes = document.getElementById('notes').value;
        
        if (!subject || !topic || !duration) {
            showToast('Error', 'Harap isi semua field yang wajib diisi');
            return;
        }
        
        const activityData = {
            id: activityId,
            subject,
            topic,
            duration,
            notes,
            timestamp: Date.now()
        };
        
        database.ref(`activities/${currentUser.uid}/${activityId}`).set(activityData)
            .then(() => {
                showToast('Sukses', 'Aktivitas berhasil disimpan');
                activityModal.hide();
            })
            .catch(error => {
                showToast('Error', 'Gagal menyimpan aktivitas');
                console.error(error);
            });
    }
    
    // Update chart progres
    function updateProgressChart(range = 'week') {
        const now = new Date();
        let labels = [];
        let data = [];
        
        if (range === 'week') {
            // Data 7 hari terakhir
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(now.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const dayActivities = activities.filter(activity => {
                    const activityDate = new Date(activity.timestamp);
                    activityDate.setHours(0, 0, 0, 0);
                    return activityDate.getTime() === date.getTime();
                });
                
                const totalMinutes = dayActivities.reduce((sum, activity) => sum + parseInt(activity.duration), 0);
                
                labels.push(date.toLocaleDateString('id-ID', { weekday: 'short' }));
                data.push(totalMinutes);
            }
        } else if (range === 'month') {
            // Data 30 hari terakhir
            for (let i = 29; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(now.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const dayActivities = activities.filter(activity => {
                    const activityDate = new Date(activity.timestamp);
                    activityDate.setHours(0, 0, 0, 0);
                    return activityDate.getTime() === date.getTime();
                });
                
                const totalMinutes = dayActivities.reduce((sum, activity) => sum + parseInt(activity.duration), 0);
                
                labels.push(date.getDate());
                data.push(totalMinutes);
            }
        } else if (range === 'year') {
            // Data 12 bulan terakhir
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(now.getMonth() - i);
                date.setDate(1);
                date.setHours(0, 0, 0, 0);
                
                const nextMonth = new Date(date);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                
                const monthActivities = activities.filter(activity => {
                    const activityDate = new Date(activity.timestamp);
                    return activityDate >= date && activityDate < nextMonth;
                });
                
                const totalMinutes = monthActivities.reduce((sum, activity) => sum + parseInt(activity.duration), 0);
                
                labels.push(date.toLocaleDateString('id-ID', { month: 'short' }));
                data.push(totalMinutes);
            }
        }
        
        if (progressChart) {
            progressChart.data.labels = labels;
            progressChart.data.datasets[0].data = data;
            progressChart.update();
        } else {
            const ctx = document.getElementById('progressChart').getContext('2d');
            progressChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Menit Belajar',
                        data: data,
                        backgroundColor: 'rgba(102, 126, 234, 0.7)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Menit'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: range === 'week' ? 'Hari' : range === 'month' ? 'Tanggal' : 'Bulan'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.parsed.y + ' menit';
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Update chart distribusi mata pelajaran
    function updateSubjectChart() {
        const subjectMap = {};
        
        activities.forEach(activity => {
            if (!subjectMap[activity.subject]) {
                subjectMap[activity.subject] = 0;
            }
            subjectMap[activity.subject] += parseInt(activity.duration);
        });
        
        const labels = Object.keys(subjectMap);
        const data = Object.values(subjectMap);
        
        const backgroundColors = [
            'rgba(102, 126, 234, 0.7)',
            'rgba(72, 187, 120, 0.7)',
            'rgba(237, 137, 54, 0.7)',
            'rgba(233, 75, 60, 0.7)',
            'rgba(155, 89, 182, 0.7)',
            'rgba(74, 172, 216, 0.7)',
            'rgba(241, 196, 15, 0.7)',
            'rgba(39, 174, 96, 0.7)',
            'rgba(211, 84, 0, 0.7)',
            'rgba(142, 68, 173, 0.7)'
        ];
        
        if (subjectChart) {
            subjectChart.data.labels = labels;
            subjectChart.data.datasets[0].data = data;
            subjectChart.update();
        } else {
            const ctx = document.getElementById('subjectChart').getContext('2d');
            subjectChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors.slice(0, labels.length),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw + ' menit';
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Update semua chart
    function updateCharts() {
        updateProgressChart(timeRangeSelect.value);
        updateSubjectChart();
    }
    
    // Edit profil
    function editProfile() {
        document.getElementById('editName').value = currentUser.displayName || '';
        document.getElementById('editEmail').value = currentUser.email;
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        profileModal.show();
    }
    
    // Simpan profil
    function saveProfile() {
        const name = document.getElementById('editName').value;
        const email = document.getElementById('editEmail').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!name || !email) {
            showToast('Error', 'Nama dan email wajib diisi');
            return;
        }
        
        if (newPassword && newPassword !== confirmPassword) {
            showToast('Error', 'Password baru dan konfirmasi tidak cocok');
            return;
        }
        
        // Update profile
        const promises = [];
        
        // Update display name di Firebase Auth
        if (name !== currentUser.displayName) {
            promises.push(currentUser.updateProfile({
                displayName: name
            }));
        }
        
        // Update email jika berubah
        if (email !== currentUser.email) {
            promises.push(currentUser.updateEmail(email));
        }
        
        // Update password jika diisi
        if (newPassword && currentPassword) {
            const credential = firebase.auth.EmailAuthProvider.credential(
                currentUser.email, 
                currentPassword
            );
            
            promises.push(
                currentUser.reauthenticateWithCredential(credential)
                    .then(() => currentUser.updatePassword(newPassword))
            );
        }
        
        // Update data user di database
        promises.push(
            database.ref(`users/${currentUser.uid}`).update({
                name: name,
                email: email
            })
        );
        
        Promise.all(promises)
            .then(() => {
                showToast('Sukses', 'Profil berhasil diperbarui');
                profileModal.hide();
                loadUserData();
            })
            .catch(error => {
                showToast('Error', getErrorMessage(error.code));
                console.error(error);
            });
    }
    
    // Logout
    function logout() {
        auth.signOut()
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch(error => {
                showToast('Error', 'Gagal logout');
                console.error(error);
            });
    }
    
    // Tampilkan toast notifikasi
    function showToast(title, message) {
        const toastEl = document.getElementById('authToast');
        if (!toastEl) {
            console.error('Toast element not found');
            return;
        }
        
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        
        if (toastTitle && toastMessage) {
            toastTitle.textContent = title;
            toastMessage.textContent = message;
            
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        } else {
            console.error('Toast title or message element not found');
        }
    }
    
    // Ambil pesan error
    function getErrorMessage(errorCode) {
        const messages = {
            'auth/invalid-email': 'Email tidak valid',
            'auth/user-disabled': 'Akun dinonaktifkan',
            'auth/user-not-found': 'Akun tidak ditemukan',
            'auth/wrong-password': 'Password salah',
            'auth/email-already-in-use': 'Email sudah digunakan',
            'auth/operation-not-allowed': 'Operasi tidak diizinkan',
            'auth/weak-password': 'Password terlalu lemah',
            'auth/requires-recent-login': 'Anda perlu login ulang untuk melakukan operasi ini'
        };
        
        return messages[errorCode] || 'Terjadi kesalahan. Silakan coba lagi.';
    }
    
    // Load data user
    function loadUserData() {
        database.ref(`users/${currentUser.uid}`).once('value')
            .then(snapshot => {
                const userData = snapshot.val();
                userNameElement.textContent = userData?.name || currentUser.displayName || 'Pengguna';
            })
            .catch(error => {
                console.error('Gagal memuat data user:', error);
            });
    }
    
    // Load data aktivitas
    function loadActivities() {
        database.ref(`activities/${currentUser.uid}`).on('value', snapshot => {
            activities = [];
            snapshot.forEach(childSnapshot => {
                activities.push(childSnapshot.val());
            });
            renderActivities();
        });
    }
    
    // Event listeners
    addActivityBtn.addEventListener('click', addActivity);
    saveActivityBtn.addEventListener('click', saveActivity);
    logoutBtn.addEventListener('click', logout);
    editProfileBtn.addEventListener('click', editProfile);
    saveProfileBtn.addEventListener('click', saveProfile);
    timeRangeSelect.addEventListener('change', () => updateProgressChart(timeRangeSelect.value));
    
    // Cek status auth
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            currentUser = user;
            loadUserData();
            loadActivities();
        }
    });
});