document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginCard = document.querySelector('.auth-card:first-of-type');
    const registerCard = document.getElementById('registerCard');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const authToast = new bootstrap.Toast(document.getElementById('authToast'));
    
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.input-group').querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Toggle between login and register forms
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginCard.style.display = 'none';
        registerCard.style.display = 'block';
        registerCard.classList.add('fade-in');
    });
    
    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerCard.style.display = 'none';
        loginCard.style.display = 'block';
        loginCard.classList.add('fade-in');
    });
    
    // Handle login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                showToast('Error', getErrorMessage(error.code));
            });
    });
    
    // Handle registration
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        
        if (password.length < 6) {
            showToast('Error', 'Password harus minimal 6 karakter');
            return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Simpan info user tambahan ke database
                return database.ref('users/' + userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
            })
            .then(() => {
                showToast('Sukses', 'Akun berhasil dibuat!');
                registerForm.reset();
                registerCard.style.display = 'none';
                loginCard.style.display = 'block';
            })
            .catch((error) => {
                showToast('Error', getErrorMessage(error.code));
            });
    });
    
    // Check auth state
    auth.onAuthStateChanged((user) => {
        if (user && window.location.pathname.endsWith('index.html')) {
            window.location.href = 'dashboard.html';
        }
    });
    
    // Helper functions
    function showToast(title, message) {
        document.getElementById('toastTitle').textContent = title;
        document.getElementById('toastMessage').textContent = message;
        authToast.show();
    }
    
    function getErrorMessage(errorCode) {
        const messages = {
            'auth/invalid-email': 'Email tidak valid',
            'auth/user-disabled': 'Akun dinonaktifkan',
            'auth/user-not-found': 'Akun tidak ditemukan',
            'auth/wrong-password': 'Password salah',
            'auth/email-already-in-use': 'Email sudah digunakan',
            'auth/operation-not-allowed': 'Operasi tidak diizinkan',
            'auth/weak-password': 'Password terlalu lemah'
        };
        
        return messages[errorCode] || 'Terjadi kesalahan. Silakan coba lagi.';
    }
});