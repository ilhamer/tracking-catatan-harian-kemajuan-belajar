document.addEventListener('DOMContentLoaded', function () {
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

    // Timer Variables
    let timer;
    let timeLeft = 1500; // 25 minutes in seconds
    let timerRunning = false;
    let timerEndSound;
    let initialTimeLeft = 1500; // Default 25 menit (dalam detik)

    // DOM Elements
    const timerDisplay = document.querySelector('.timer-text');
    const progressCircle = document.querySelector('.timer-progress');
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtn = document.getElementById('resetTimer');
    const timerPresets = document.querySelectorAll('.timer-preset');
    const customMinutesInput = document.getElementById('customMinutes');
    const setCustomTimeBtn = document.getElementById('setCustomTime');

    // Initialize Timer
    function initTimer() {
        updateTimerDisplay();
        setupTimerEvents();
    }



    // Update Timer Display
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update progress circle
        const circumference = 283;
        const totalTime = timerPresets[0].dataset.minutes * 60; // Default 25 minutes
        const offset = circumference - (timeLeft / totalTime) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }

    // Timer Events
    function setupTimerEvents() {
        // Start Timer
        startBtn.addEventListener('click', () => {
            if (!timerRunning) {
                timerRunning = true;
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                resetBtn.disabled = false;

                timer = setInterval(() => {
                    timeLeft--;
                    updateTimerDisplay();

                    if (timeLeft <= 0) {
                        timerComplete();
                    }
                }, 1000);
            }
        });

        // Pause Timer
        pauseBtn.addEventListener('click', () => {
            if (timerRunning) {
                clearInterval(timer);
                timerRunning = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            }
        });

        // Reset Timer
        resetBtn.addEventListener('click', () => {
            clearInterval(timer);
            timerRunning = false;

            // 1. Kembalikan ke waktu awal (bukan default 25m)
            timeLeft = initialTimeLeft; // ◀◀◀ PERUBAHAN PENTING

            // 2. Update tampilan timer
            updateTimerDisplay();

            // 3. Reset state tombol
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = true;

            // 4. Sembunyikan pesan durasi
            document.getElementById('timerCompletionMessage').classList.add('d-none');
            document.getElementById('timerCompletionMessage').classList.remove('show');

            // 5. Hentikan alarm visual & suara
            document.querySelector('.timer-display').classList.remove('alarm-active');
            timerEndSound.pause();
            timerEndSound.currentTime = 0;

            // 6. (Opsional) Kosongkan input custom jika ada
            document.getElementById('customMinutes').value = '';
        });
        // Preset Buttons
        timerPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                timeLeft = parseInt(preset.dataset.minutes) * 60;
                updateTimerDisplay();
                // Sembunyikan pesan saat memilih preset baru
                document.getElementById('timerCompletionMessage').classList.add('d-none');
                if (timerRunning) {
                    clearInterval(timer);
                    timerRunning = false;
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                }
            });
        });

        // Custom Time Input
        setCustomTimeBtn.addEventListener('click', () => {
            const minutes = parseInt(customMinutesInput.value);
            if (minutes && minutes > 0 && minutes <= 240) {
                initialTimeLeft = minutes * 60; // ✅ Simpan waktu awal custom
                timeLeft = initialTimeLeft; // Update timeLeft
                updateTimerDisplay();

                // Sembunyikan pesan durasi jika ada
                document.getElementById('timerCompletionMessage').classList.add('d-none');

                if (timerRunning) {
                    clearInterval(timer);
                    timerRunning = false;
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                }
            }
        });
    }

    // Timer Complete Handler
    function timerComplete() {
        clearInterval(timer);
        timerRunning = false;

        // ✅ Hitung durasi berdasarkan initialTimeLeft (support custom time)
        const totalSecondsUsed = initialTimeLeft - timeLeft;
        const minutesUsed = Math.max(1, Math.ceil(totalSecondsUsed / 60)); // Minimal 1 menit

        // Tampilkan pesan durasi
        const messageElement = document.getElementById('timerCompletionMessage');
        const durationDisplay = document.getElementById('durationDisplay');
        durationDisplay.textContent = minutesUsed; // ✅ Gunakan minutesUsed
        messageElement.classList.remove('d-none');
        messageElement.classList.add('show');

        // Alarm sound logic (unchanged)
        timerEndSound.volume = 1.0;
        timerEndSound.play().catch(e => {
            console.error("Alarm gagal berbunyi:", e);
            const alert = document.createElement('div');
            alert.className = 'alert alert-warning position-fixed top-0 start-50 translate-middle-x mt-3';
            alert.textContent = 'Waktu belajar telah habis!';
            document.body.appendChild(alert);
            setTimeout(() => alert.remove(), 3000);
        });

        // Visual alarm
        const timerDisplayElement = document.querySelector('.timer-display');
        timerDisplayElement.classList.add('alarm-active');

        // Auto-open modal dengan durasi yang konsisten
        setTimeout(() => {
            activityModal.show();
            document.getElementById('duration').value = minutesUsed; // ✅ Gunakan nilai yang sama
            document.getElementById('subject').focus();
        }, 1000);
    }

    function initAudio() {
        timerEndSound = new Audio('audio/mixkit-classic-alarm-995.wav');
        timerEndSound.preload = 'auto';

        // Unlock audio policy pada interaksi pertama
        document.body.addEventListener('click', function unlockAudio() {
            timerEndSound.volume = 0;
            timerEndSound.play().then(() => {
                timerEndSound.pause();
                timerEndSound.currentTime = 0;
            }).catch(e => console.log("Audio unlocked"));
            document.body.removeEventListener('click', unlockAudio);
        }, { once: true });
    }

    initAudio();
    initTimer()

    document.getElementById('addActivityBtn').addEventListener('click', () => {
        const minutes = Math.floor(timeLeft / 60);
        document.getElementById('duration').value = minutes;
    });

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
    // Render tabel aktivitas (menampilkan SEMUA data)
    function renderActivities() {
        activitiesBody.innerHTML = '';

        if (activities.length === 0) {
            activitiesBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="fas fa-book-open fa-2x mb-2"></i>
                    <p class="mb-0">Belum ada catatan belajar</p> <!-- Hapus "hari ini" -->
                </td>
            </tr>
        `;
            return;
        }

        // 1. HAPUS filter "hari ini" dan tampilkan semua data
        const sortedActivities = [...activities].sort((a, b) => b.timestamp - a.timestamp);

        sortedActivities.forEach(activity => {
            const row = document.createElement('tr');
            row.className = 'fade-in';

            // 2. Tambahkan kolom tanggal lengkap
            const activityDate = new Date(activity.timestamp);
            const isToday = activityDate.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);

            row.innerHTML = `
            <td>${activity.subject}</td>
            <td>${activity.topic} ${isToday ? '<span class="badge bg-primary ms-2">Hari Ini</span>' : ''}</td>
            <td>${activity.duration}</td>
            <td>${activity.notes || '-'}</td>
            <td>
                ${activityDate.toLocaleDateString('id-ID')} <!-- Tanggal -->
                ${formatTime(activity.timestamp)} <!-- Waktu -->
            </td>
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

        // 3. Update event listeners (tetap sama)
        document.querySelectorAll('.edit-activity').forEach(btn => {
            btn.addEventListener('click', function () {
                const activityId = this.getAttribute('data-id');
                editActivity(activityId);
            });
        });

        document.querySelectorAll('.delete-activity').forEach(btn => {
            btn.addEventListener('click', function () {
                const activityId = this.getAttribute('data-id');
                deleteActivity(activityId);
            });
        });

        // 4. Update statistik (tetap sama)
        calculateTodayMinutes();
        calculateWeekMinutes();
        updateCharts();
    }


    // 1. Fungsi Filter Berdasarkan Rentang Waktu
    function filterActivities(range) {
        const now = new Date();
        let filtered = [];

        switch (range) {
            case 'today':
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                filtered = activities.filter(a => new Date(a.timestamp) >= today);
                break;

            case 'week':
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                filtered = activities.filter(a => new Date(a.timestamp) >= oneWeekAgo);
                break;

            case 'month':
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(now.getMonth() - 1);
                filtered = activities.filter(a => new Date(a.timestamp) >= oneMonthAgo);
                break;

            default: // 'all'
                filtered = [...activities];
        }

        renderFilteredActivities(filtered);
    }

    // 2. Fungsi Render Hasil Filter
    function renderFilteredActivities(filteredActivities) {
        activitiesBody.innerHTML = '';

        if (filteredActivities.length === 0) {
            activitiesBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="fas fa-search me-2"></i>Tidak ada data yang sesuai filter
                </td>
            </tr>
        `;
            return;
        }

        filteredActivities.forEach(activity => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            row.innerHTML = `
            <td>${activity.subject}</td>
            <td>${activity.topic}</td>
            <td>${activity.duration}</td>
            <td>${activity.notes || '-'}</td>
            <td>${new Date(activity.timestamp).toLocaleDateString('id-ID')} ${formatTime(activity.timestamp)}</td>
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

        // Pasang event listeners setelah render selesai
        setTimeout(() => {
            document.querySelectorAll('.edit-activity').forEach(btn => {
                btn.addEventListener('click', function () {
                    editActivity(this.dataset.id);
                });
            });

            document.querySelectorAll('.delete-activity').forEach(btn => {
                btn.addEventListener('click', function () {
                    deleteActivity(this.dataset.id);
                });
            });
        }, 50);
    }

    // 3. Event Listener untuk Dropdown Filter
    document.getElementById('dateFilter')?.addEventListener('change', function () {
        filterActivities(this.value);
    });

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

    // Letakkan di bagian atas file (setelah deklarasi firebase)
    const subjects = [
        "Matematika",
        "Fisika",
        "Kimia",
        "Bahasa Indonesia",
        "Bahasa Inggris",
        "Bahasa Jepang",
        "Bahasa Korea",
        "Bahasa Jerman",
        "Pemrograman Web",
        "Struktur Data",
        "Basis Data",
        "Baca al Qur'an"
    ];

    function initSubjectDropdown() {
        const select = document.getElementById('subject');

        // Kosongkan dropdown
        select.innerHTML = '';

        // Tambahkan opsi default
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Pilih mata pelajaran";
        defaultOption.selected = true;
        defaultOption.disabled = true;
        select.appendChild(defaultOption);

        // Isi dropdown dari array subjects
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            select.appendChild(option);
        });

        // Tambahkan opsi "Lainnya"
        const otherOption = document.createElement('option');
        otherOption.value = "Lainnya";
        otherOption.textContent = "Lainnya";
        select.appendChild(otherOption);

        // Tambahkan di initSubjectDropdown() atau DOMContentLoaded
        document.getElementById('subject').addEventListener('change', function () {
            const customContainer = document.getElementById('customSubjectContainer');
            customContainer.style.display = this.value === "Lainnya" ? 'block' : 'none';
        });
    }

    initSubjectDropdown();

    // Simpan aktivitas
    function saveActivity() {
        const activityId = activityIdInput.value || Date.now().toString();
        // const subject = document.getElementById('subject').value;
        const topic = document.getElementById('topic').value;
        const duration = document.getElementById('duration').value;
        const notes = document.getElementById('notes').value;
        const subjectSelect = document.getElementById('subject');
        let subject = subjectSelect.value;

        if (!subject || !topic || !duration) {
            showToast('Error', 'Harap isi semua field yang wajib diisi');
            return;
        }

        // Handle custom subject
        // Handle custom subject
        if (subject === "Lainnya") {
            subject = document.getElementById('customSubject').value.trim() || "Lainnya"; // ◀ Tetap gunakan "Lainnya"
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
                // ▼▼▼ RESET FORM SETELAH SIMPAN ▼▼▼
                activityForm.reset(); // Reset semua field form
                document.getElementById('customSubjectContainer').style.display = 'none'; // Sembunyikan custom subject
                document.getElementById('subject').selectedIndex = 0; // Reset dropdown ke default
                // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


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
                                label: function (context) {
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

        // Warna yang lebih beragam dan menarik
        const backgroundColors = [
            'rgba(255, 99, 132, 0.7)',    // Merah
            'rgba(54, 162, 235, 0.7)',     // Biru
            'rgba(255, 206, 86, 0.7)',     // Kuning
            'rgba(75, 192, 192, 0.7)',     // Hijau
            'rgba(153, 102, 255, 0.7)',   // Ungu
            'rgba(255, 159, 64, 0.7)',     // Oranye
            'rgba(199, 199, 199, 0.7)',    // Abu-abu
            'rgba(83, 102, 255, 0.7)',     // Biru tua
            'rgba(40, 167, 69, 0.7)',      // Hijau tua
            'rgba(220, 53, 69, 0.7)',      // Merah tua
            'rgba(253, 126, 20, 0.7)',     // Oranye tua
            'rgba(111, 66, 193, 0.7)'      // Ungu tua
        ];

        // Jika ada lebih banyak mata pelajaran daripada warna, kita akan mengulang warna
        const finalColors = labels.map((_, index) =>
            backgroundColors[index % backgroundColors.length]
        );

        if (subjectChart) {
            subjectChart.data.labels = labels;
            subjectChart.data.datasets[0].data = data;
            subjectChart.data.datasets[0].backgroundColor = finalColors;
            subjectChart.update();
        } else {
            const ctx = document.getElementById('subjectChart').getContext('2d');
            subjectChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: finalColors,
                        borderWidth: 1,
                        borderColor: '#fff' // Border putih untuk kontras
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true, // Gunakan titik sebagai penanda
                                padding: 20
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.label + ': ' + context.raw + ' menit';
                                }
                            }
                        }
                    },
                    cutout: '60%' // Membuat donat lebih tipis
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
        // 1. Hapus listener sebelumnya jika ada
        const activitiesRef = database.ref(`activities/${currentUser.uid}`);
        activitiesRef.off(); // Membersihkan listener lama

        // 2. Pasang listener baru untuk update realtime
        activitiesRef
            .orderByChild('timestamp') // Urutkan berdasarkan timestamp
            .on('value', (snapshot) => {
                // 3. Reset array activities
                activities = [];

                // 4. Proses setiap data dari Firebase
                snapshot.forEach(childSnapshot => {
                    activities.push({
                        id: childSnapshot.key, // Simpan ID dokumen
                        ...childSnapshot.val() // Simpan semua data lainnya
                    });
                });

                // 5. Render ulang tabel
                renderActivities();
            }, (error) => {
                // 6. Handle error
                console.error("Error realtime listener:", error);
                showToast('Error', 'Gagal memuat data realtime', true);
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