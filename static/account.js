document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const loadingSpinner = document.getElementById('loading-spinner');
    const accountDashboard = document.getElementById('account-dashboard');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Authentication State Observer ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // User IS logged in. Let's fetch their data.
            console.log('User is logged in. UID:', user.uid);
            loadUserData(user);
        } else {
            // User is NOT logged in. Redirect to the login page.
            console.log('No user logged in. Redirecting to /login...');
            // We pass the current page as a redirect parameter.
            window.location.href = `/login?redirect=${window.location.pathname}`;
        }
    });

    /**
     * Fetches user data from Firestore and populates the dashboard.
     * @param {firebase.User} user - The authenticated user object.
     */
    function loadUserData(user) {
        const userRef = db.collection('users').doc(user.uid);
        
        userRef.get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                console.log('User data found:', userData);
                populateDashboard(userData);
                populateProfileForm(userData);
            } else {
                // This case is rare but possible if a user exists in Auth but not Firestore.
                console.warn('User document not found in Firestore. Using auth data.');
                populateDashboard({ name: user.displayName || user.email, email: user.email, walletBalance: 0 });
                populateProfileForm({ name: user.displayName, email: user.email, phoneNumber: '' });
            }
            
            // After populating user data, fetch their orders.
            return fetchUserOrders(user.uid);

        }).catch(error => {
            console.error("Error fetching user document:", error);
            // Even if there's an error, show the dashboard with partial data and an error message.
            showDashboard();
            document.getElementById('dashboard').innerHTML = '<p class="text-red-500">Could not load user profile.</p>';
        });
    }
    
    /**
     * Updates the UI with user's profile information.
     * @param {object} userData - The user's data object from Firestore.
     */
    function populateDashboard(userData) {
        document.getElementById('user-name-display').textContent = userData.name;
        document.getElementById('wallet-balance-display').textContent = `৳${userData.walletBalance || 0}`;
        showDashboard(); // <- This is the key to stopping the loading spinner.
    }
    
    /**
     * Fetches and displays the user's order history.
     * @param {string} userId - The UID of the current user.
     */
    function fetchUserOrders(userId) {
        const orderHistoryContainer = document.getElementById('order-history-container');
        
        db.collection('orders').where('userId', '==', userId).orderBy('orderDate', 'desc').get()
            .then(snapshot => {
                document.getElementById('total-orders-display').textContent = snapshot.size; // Update total order count
                
                if (snapshot.empty) {
                    orderHistoryContainer.innerHTML = '<p class="text-gray-500">You have no past orders.</p>';
                    return;
                }
                
                let tableHTML = `
                    <table class="min-w-full bg-white">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                `;
                snapshot.forEach(doc => {
                    const order = doc.data();
                    tableHTML += `
                        <tr>
                            <td class="py-3 px-3 text-sm font-mono text-gray-500">${doc.id.substring(0, 8)}...</td>
                            <td class="py-3 px-3">${order.productName}</td>
                            <td class="py-3 px-3 font-semibold">৳${order.price}</td>
                            <td class="py-3 px-3">
                                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipClass(order.status)}">
                                    ${order.status}
                                </span>
                            </td>
                        </tr>
                    `;
                });
                tableHTML += '</tbody></table>';
                orderHistoryContainer.innerHTML = tableHTML;
            })
            .catch(error => {
                console.error("Error fetching orders:", error);
                orderHistoryContainer.innerHTML = '<p class="text-red-500">Could not load order history.</p>';
            });
    }

    /**
     * Hides the spinner and shows the main dashboard content.
     */
    function showDashboard() {
        loadingSpinner.classList.add('hidden');
        accountDashboard.classList.remove('hidden');
    }

    // --- Tab Switching Logic ---
    const navButtons = document.querySelectorAll('.account-nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            
            // Update button styles
            navButtons.forEach(btn => btn.classList.remove('active-nav-btn'));
            button.classList.add('active-nav-btn');

            // Show/hide tab content
            tabContents.forEach(content => {
                if (content.id === targetId) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });

    // --- Profile Update Logic ---
    const profileUpdateForm = document.getElementById('profile-update-form');
    
    function populateProfileForm(userData) {
        document.getElementById('profile-name').value = userData.name || '';
        document.getElementById('profile-email').value = userData.email || '';
        document.getElementById('profile-phone').value = userData.phoneNumber || '';
    }

    profileUpdateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        
        const updatedData = {
            name: document.getElementById('profile-name').value,
            phoneNumber: document.getElementById('profile-phone').value,
        };

        db.collection('users').doc(user.uid).update(updatedData)
            .then(() => {
                alert('Profile updated successfully!');
                // Also update the display name on the dashboard
                document.getElementById('user-name-display').textContent = updatedData.name;
            })
            .catch(error => {
                alert('Error updating profile: ' + error.message);
                console.error("Profile update error:", error);
            });
    });

    // --- Logout Logic ---
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('User logged out successfully.');
            window.location.href = '/'; // Redirect to homepage after logout
        }).catch(error => {
            console.error('Logout Error:', error);
        });
    });
    
    /**
     * Helper function to get Tailwind CSS classes for order status chips.
     * @param {string} status - The order status string.
     * @returns {string} - The corresponding CSS classes.
     */
    function getStatusChipClass(status) {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Confirmed': return 'bg-blue-100 text-blue-800';
            case 'Shipped': return 'bg-indigo-100 text-indigo-800';
            case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
});
