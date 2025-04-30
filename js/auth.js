// Handle Login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Redirect ke dashboard
        window.location.href = 'dashboard.html';
      })
      .catch((error) => {
        alert('Login gagal: ' + error.message);
      });
  });
  
  // Handle Register
  document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Simpan data user tambahan
        return database.ref('users/' + userCredential.user.uid).set({
          name: name,
          email: email,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
      })
      .then(() => {
        alert('Registrasi berhasil! Silakan login.');
        document.getElementById('registerForm').reset();
      })
      .catch((error) => {
        alert('Registrasi gagal: ' + error.message);
      });
  });
  
  // Cek status login
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Jika sudah login, redirect ke dashboard
      window.location.href = 'dashboard.html';
    }
  });