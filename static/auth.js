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

    
    // --- UI Helper Functions for Debugging ---

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
        // Firebase এরর মেসেজগুলোকে আরও ব্যবহারকারী-বান্ধব করা
        let friendlyMessage = message;
        if (message.includes("auth/wrong-password")) {
            friendlyMessage = "Incorrect password. Please try again.";
        } else if (message.includes("auth/user-not-found")) {
            friendlyMessage = "No account found with this email. Please sign up first.";
        } else if (message.includes("auth/email-already-in-use")) {
            friendlyMessage = "This email is already registered. Please login instead.";
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
            }, 50); // Short delay to trigger transition
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
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError();
        const signupBtn = document.getElementById('signup-btn');
        showLoading(signupBtn);

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                return db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    walletBalance: 0,
                    role: 'customer' // Default role
                });
            })
            .then(() => window.location.href = '/account')
            .catch(error => {
                hideLoading(signupBtn);
                displayError(error.message);
            });
    });

    // Login with Email
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearError();
        const loginBtn = document.getElementById('login-btn');
        showLoading(loginBtn);

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => window.location.href = '/account')
            .catch(error => {
                hideLoading(loginBtn);
                displayError(error.message);
            });
    });

    // Google Login (No-Popup Method)
    googleLoginBtn.addEventListener('click', () => {
        clearError();
        showLoading(googleLoginBtn);
        // This will redirect the user to Google's sign-in page
        auth.signInWithRedirect(googleProvider);
    });

    // Check for redirect result when the page loads
    auth.getRedirectResult()
        .then(result => {
            if (result.user) {
                // User has successfully signed in via redirect.
                const user = result.user;
                const userRef = db.collection('users').doc(user.uid);

                return userRef.get().then(doc => {
                    if (!doc.exists) { // If user is new, create a profile
                        return userRef.set({
                            name: user.displayName,
                            email: user.email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            walletBalance: 0,
                            role: 'customer'
                        });
                    }
                }).then(() => {
                    window.location.href = '/account'; // Redirect to account page
                });
            } else {
                // This will run on normal page load when there's no redirect.
                // We can hide any potential loading indicators here if needed.
                hideLoading(googleLoginBtn); 
            }
        })
        .catch(error => {
            hideLoading(googleLoginBtn);
            displayError(error.message);
        });
});
