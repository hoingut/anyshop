// --- Step 1: Import necessary functions from Firebase SDKs ---

// Import services you need from your firebaseConfig.js file
import { auth, db, googleProvider } from './firebaseConfig.js';

// Import auth functions we will use from the SDK
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Import firestore functions we will use from the SDK
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Step 2: Main execution block after DOM is loaded ---

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const getElement = (id) => document.getElementById(id);
    
    const signupContainer = getElement('signup-container');
    const loginContainer = getElement('login-container');
    const showLoginLink = getElement('show-login');
    const showSignupLink = getElement('show-signup');
    const signupForm = getElement('signup-form');
    const loginForm = getElement('login-form');
    const googleLoginBtn = getElement('google-login-btn');
    const errorContainer = getElement('error-message-container');
    const errorText = getElement('error-text');

    // **IMPROVEMENT**: Guard clause to prevent errors if this script is loaded on the wrong page.
    if (!loginContainer || !signupContainer) {
        console.warn("Auth script loaded on a page without login/signup forms. Halting execution.");
        return; 
    }

    // --- UI Helper Functions ---

    const showLoading = (button) => {
        if (!button) return;
        button.disabled = true;
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.spinner');
        if (btnText) btnText.classList.add('hidden');
        if (spinner) spinner.classList.remove('hidden');
    };

    const hideLoading = (button) => {
        if (!button) return;
        button.disabled = false;
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.spinner');
        if (btnText) btnText.classList.remove('hidden');
        if (spinner) spinner.classList.add('hidden');
    };

    const displayError = (message) => {
        // **IMPROVEMENT**: A more robust and scalable error mapping using error codes.
        const errorMap = {
            "auth/wrong-password": "Incorrect password. Please try again.",
            "auth/user-not-found": "No account found with this email. Please sign up first.",
            "auth/email-already-in-use": "This email is already registered. Please login instead.",
            "auth/invalid-email": "Please enter a valid email address.",
            "auth/too-many-requests": "Access to this account has been temporarily disabled due to many failed login attempts. Try again later."
        };
        const errorCode = message.match(/auth\/[\w-]+/)?.[0];
        errorText.textContent = errorMap[errorCode] || message;
        errorContainer.classList.remove('hidden');
    };

    const clearError = () => {
        if (errorContainer) {
            errorContainer.classList.add('hidden');
            errorText.textContent = '';
        }
    };
    
    // Using CSS classes for transitions is often more efficient, but this JS approach is also fine.
    const switchForms = (show, hide) => {
        clearError();
        hide.classList.add('fade-out'); // Assuming you have a CSS class for this animation
        setTimeout(() => {
            hide.style.display = 'none'; // Use display:none for better accessibility
            show.style.display = 'block';
            setTimeout(() => {
                show.classList.remove('fade-out');
            }, 10);
        }, 300); // Should match your CSS transition duration
    };
    
    // --- Event Listeners for Form Toggling ---
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); switchForms(loginContainer, signupContainer); });
    if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); switchForms(signupContainer, loginContainer); });
    
    // --- Authentication Logic ---

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            // **IMPROVEMENT**: Use the form's own submit button reference
            const signupBtn = signupForm.querySelector('button[type="submit"]'); 
            showLoading(signupBtn);

            const name = getElement('signup-name').value;
            const email = getElement('signup-email').value;
            const password = getElement('signup-password').value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userDocRef = doc(db, 'users', userCredential.user.uid);
                
                await setDoc(userDocRef, {
                    name,
                    email,
                    createdAt: serverTimestamp(),
                    walletBalance: 0,
                    role: 'customer'
                });

                window.location.href = '/account';
            } catch (error) {
                console.error("Signup Error:", error);
                hideLoading(signupBtn);
                displayError(error.message);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            const loginBtn = loginForm.querySelector('button[type="submit"]');
            showLoading(loginBtn);

            const email = getElement('login-email').value;
            const password = getElement('login-password').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = '/account';
            } catch (error) {
                console.error("Login Error:", error);
                hideLoading(loginBtn);
                displayError(error.message);
            }
        });
    }

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            clearError();
            showLoading(googleLoginBtn);
            signInWithRedirect(auth, googleProvider);
        });
    }

    // --- Handle Redirect Result ---
    // **IMPROVEMENT**: Encapsulated in a named function for clarity and called once.
    async function handleAuthRedirect() {
        try {
            const result = await getRedirectResult(auth);
            if (result && result.user) {
                // Show a loading state to indicate processing before redirecting
                showLoading(googleLoginBtn || loginForm?.querySelector('button')); 
                
                const user = result.user;
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        name: user.displayName,
                        email: user.email,
                        createdAt: serverTimestamp(),
                        walletBalance: 0,
                        role: 'customer'
                    });
                }
                
                window.location.href = '/account';
            }
        } catch (error) {
            console.error("Redirect Error:", error);
            // Only show an error for critical issues, not if the user just cancelled.
            if (error.code !== 'auth/redirect-cancelled-by-user') {
                displayError(error.message);
            }
        } finally {
            // Ensure the loading spinner is hidden if no redirect occurred.
            hideLoading(googleLoginBtn);
        }
    }

    handleAuthRedirect();
});
