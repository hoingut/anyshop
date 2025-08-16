// --- Step 1: Import necessary functions from Firebase SDKs ---

// Import services you need from your firebaseConfig.js file
import { auth, db, googleProvider } from './firebaseConfig.js';

// Import auth functions we will use
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged // Optional: to check login status on page load
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Import firestore functions we will use
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";


// --- Step 2: Add event listener to run code after the DOM is loaded ---

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const signupContainer = document.getElementById('signup-container');
    const loginContainer = document.getElementById('login-container');
    const showLoginLink = document.getElementById('show-login');
    const showSignupLink = document.getElementById('show-signup');

    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const googleLoginBtn = document.getElementById('google-login-btn');

    const errorContainer = document.getElementById('error-message-container');
    const errorText = document.getElementById('error-text');

    // --- UI Helper Functions for Debugging & User Experience ---

    const showLoading = (button) => {
        button.disabled = true;
        button.querySelector('.btn-text').classList.add('hidden');
        button.querySelector('.spinner').classList.remove('hidden');
    };

    const hideLoading = (button) => {
        button.disabled = false;
        button.querySelector('.btn-text').classList.remove('hidden');
        button.querySelector('.spinner').classList.add('hidden');
    };

    const displayError = (message) => {
        let friendlyMessage = message;
        if (message.includes("auth/wrong-password")) {
            friendlyMessage = "Incorrect password. Please try again.";
        } else if (message.includes("auth/user-not-found")) {
            friendlyMessage = "No account found with this email. Please sign up first.";
        } else if (message.includes("auth/email-already-in-use")) {
            friendlyMessage = "This email is already registered. Please login instead.";
        } else if (message.includes("auth/invalid-email")) {
            friendlyMessage = "Please enter a valid email address.";
        }

        errorText.textContent = friendlyMessage;
        errorContainer.classList.remove('hidden');
    };

    const clearError = () => {
        errorContainer.classList.add('hidden');
        errorText.textContent = '';
    };
    
    const switchForms = (show, hide) => {
        clearError();
        hide.classList.add('fade-out');
        setTimeout(() => {
            hide.classList.add('hidden-absolute');
            show.classList.remove('hidden-absolute');
            setTimeout(() => {
                show.classList.remove('fade-out');
            }, 50);
        }, 400);
    };

    // --- Event Listeners for Form Toggling ---
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForms(loginContainer, signupContainer);
    });

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForms(signupContainer, loginContainer);
    });

    // --- Authentication Logic ---

    // Signup with Email
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();
        const signupBtn = document.getElementById('signup-btn');
        showLoading(signupBtn);

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create a reference to the new user's document
            const userDocRef = doc(db, 'users', user.uid);
            
            // Set the document with user data
            await setDoc(userDocRef, {
                name: name,
                email: email,
                createdAt: serverTimestamp(), // Use server timestamp
                walletBalance: 0,
                role: 'customer' // Default role for new users
            });

            window.location.href = '/account'; // Redirect on success
        } catch (error) {
            hideLoading(signupBtn);
            displayError(error.message);
        }
    });

    // Login with Email
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();
        const loginBtn = document.getElementById('login-btn');
        showLoading(loginBtn);

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = '/account'; // Redirect on success
        } catch (error) {
            hideLoading(loginBtn);
            displayError(error.message);
        }
    });

    // Google Login (No-Popup Method)
    googleLoginBtn.addEventListener('click', () => {
        clearError();
        showLoading(googleLoginBtn);
        signInWithRedirect(auth, googleProvider);
    });

    // --- Handle Redirect Result from Google ---
    // This part of the code runs every time the page loads to check if
    // the user is coming back from a Google sign-in redirect.
    (async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result && result.user) {
                // User has successfully signed in via redirect.
                const user = result.user;
                const userDocRef = doc(db, 'users', user.uid);
                
                // Check if the user document already exists
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // If user is new, create their profile in Firestore
                    await setDoc(userDocRef, {
                        name: user.displayName,
                        email: user.email,
                        createdAt: serverTimestamp(),
                        walletBalance: 0,
                        role: 'customer'
                    });
                }
                
                // Redirect to the account page
                window.location.href = '/account';
            } else {
                 // No redirect result, hide loading spinner on Google button if it's visible
                 const googleBtn = document.getElementById('google-login-btn');
                 if(googleBtn) hideLoading(googleBtn);
            }
        } catch (error) {
            // Handle errors from the redirect.
            const googleBtn = document.getElementById('google-login-btn');
            if(googleBtn) hideLoading(googleBtn);
            displayError(error.message);
        }
    })();
});
