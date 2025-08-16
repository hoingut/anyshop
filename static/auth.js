document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const showLogin = document.getElementById('show-login');
    const showSignup = document.getElementById('show-signup');
    const signupContainer = document.getElementById('signup-container');
    const loginContainer = document.getElementById('login-container');

    // Toggle between login and signup forms
    showLogin.addEventListener('click', () => {
        signupContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });
    showSignup.addEventListener('click', () => {
        loginContainer.classList.add('hidden');
        signupContainer.classList.remove('hidden');
    });

    // Signup with Email and Password
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Save user info to Firestore
                return db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: new Date(),
                    walletBalance: 0
                });
            })
            .then(() => {
                alert('Signup successful! Please login.');
                window.location.href = '/login';
            })
            .catch(error => alert(error.message));
    });

    // Login with Email and Password
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                alert('Login successful!');
                window.location.href = '/account'; // Redirect to account page
            })
            .catch(error => alert(error.message));
    });

    // Login with Google
    googleLoginBtn.addEventListener('click', () => {
        auth.signInWithPopup(googleProvider)
            .then(result => {
                const user = result.user;
                // Check if user is new, if so, save their data
                const userRef = db.collection('users').doc(user.uid);
                return userRef.get().then(doc => {
                    if (!doc.exists) {
                        userRef.set({
                            name: user.displayName,
                            email: user.email,
                            createdAt: new Date(),
                            walletBalance: 0
                        });
                    }
                });
            })
            .then(() => {
                alert('Google login successful!');
                window.location.href = '/account';
            })
            .catch(error => alert(error.message));
    });
});
