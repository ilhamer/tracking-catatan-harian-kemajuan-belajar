// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAlCoyrcaExmSHoLduwp6n4B03GzelbqEU",
    authDomain: "website-tracking-kegiatan-rtn.firebaseapp.com",
    databaseURL: "https://website-tracking-kegiatan-rtn-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "website-tracking-kegiatan-rtn",
    storageBucket: "website-tracking-kegiatan-rtn.appspot.com",
    messagingSenderId: "1018112650749",
    appId: "1:1018112650749:web:9090d1f34294b53b1e3d94"
  };
  
  // Inisialisasi Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  const auth = firebase.auth();
  const database = firebase.database();