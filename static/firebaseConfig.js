
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
l

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyD3F8gSkk6J9ChGRVB3_8DQP7FpBCl2T-w",
    authDomain: "anyshop-1f435.firebaseapp.com",
    projectId: "anyshop-1f435",
    storageBucket: "anyshop-1f435.firebasestorage.app",
    messagingSenderId: "710084687311",
    appId: "1:710084687311:web:5320f0c91b4fb3fe35ceba"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you'll need in other files
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
