// --- Step 1: Import necessary functions and services ---
// Import from your custom firebaseConfig.js file
import { 
    auth, 
    db, 
    doc, 
    getDoc, 
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    getDocs
} from './firebaseConfig.js';

// Import functions from the Firebase Auth SDK
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";


document.addEventListener('DOMContentLoaded', () => {
    // --- Step 2: DOM Element References ---
    const loadingSpinner = document.getElementById('loading-spinner');
    const accountDashboard = document.getElementById('account-dashboard');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameDisplay = document.getElementById('user-name-display');
    const walletBalanceDisplay = document.getElementById('wallet-balance-display');
    const totalOrdersDisplay = document.getElementById('total-orders-display');
    const orderHistoryContainer = document.getElementById('order-history-container');
    const profileUpdateForm = document.getElementById('profile-update-form');
    const profileNameInput = document.getElementById('profile-name');
    const profileEmailInput = document.getElementById('profile-email');
    const profilePhoneInput = document.getElementById('profile-phone');

    // --- Step 3: Authentication State Observer ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in, fetch all necessary data
            loadPageData(user);
        } else {
            // No user is logged in, redirect to login page
            const redirectUrl = encodeURIComponent(window.location.pathname);
            window.location.href = `/login?redirect=${redirectUrl}`;
        }
    });

    /**
     * Main function to load all data for the logged-in user.
     * @param {object} user - The Firebase user object.
     */
    async function loadPageData(user) {
        try {
            // Fetch user profile and orders in parallel for faster loading
            const [userData, orders] = await Promise.all([
                fetchUserProfile(user.uid),
                fetchUserOrders(user.uid)
            ]);

            // Populate the UI with the fetched data
            populateDashboard(userData, orders.length);
            populateProfileForm(userData);
            displayOrders(orders);

            // Hide spinner and show the dashboard
            loadingSpinner.classList.add('hidden');
            accountDashboard.classList.remove('hidden');

        } catch (error) {
            console.error("Error loading account page data:", error);
            loadingSpinner.innerHTML = '<p class="text-red-500">Failed to load account data.</p>';
        }
    }

    /**
     * Fetches a user's profile from Firestore.
     * @param {string} uid - The user's unique ID.
     * @returns {Promise<object>} - A promise that resolves with the user's data.
     */
    async function fetchUserProfile(uid) {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.warn("User document not found in Firestore.");
            // Return default data based on auth object if Firestore doc is missing
            return { name: auth.currentUser.displayName, email: auth.currentUser.email, walletBalance: 0, phoneNumber: '' };
        }
    }

    /**
     * Fetches a user's order history from Firestore.
     * @param {string} uid - The user's unique ID.
     * @returns {Promise<Array>} - A promise that resolves with an array of order objects.
     */
    async function fetchUserOrders(uid) {
        const ordersCol = collection(db, 'orders');
        const q = query(ordersCol, where("userId", "==", uid), orderBy("orderDate", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    // --- Step 4: UI Population Functions ---
    
    function populateDashboard(userData, orderCount) {
        userNameDisplay.textContent = userData.name || 'User';
        walletBalanceDisplay.textContent = `৳${userData.walletBalance || 0}`;
        totalOrdersDisplay.textContent = orderCount;
    }

    function populateProfileForm(userData) {
        profileNameInput.value = userData.name || '';
        profileEmailInput.value = userData.email || '';
        profilePhoneInput.value = userData.phoneNumber || '';
    }

    function displayOrders(orders) {
        if (orders.length === 0) {
            orderHistoryContainer.innerHTML = '<p class="text-gray-500 text-center py-4">You have no past orders.</p>';
            return;
        }

        const tableHTML = `
            <table class="min-w-full bg-white">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    ${orders.map(order => `
                        <tr>
                            <td class="py-3 px-3">${order.productName}</td>
                            <td class="py-3 px-3 font-semibold">৳${order.price}</td>
                            <td class="py-3 px-3">
                                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipClass(order.status)}">
                                    ${order.status}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
        orderHistoryContainer.innerHTML = tableHTML;
    }

    // --- Step 5: Event Handlers ---
    
    // Profile Update Form Submission
    profileUpdateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const updatedData = {
            name: profileNameInput.value,
            phoneNumber: profilePhoneInput.value,
        };

        const userRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userRef, updatedData);
            alert('Profile updated successfully!');
            userNameDisplay.textContent = updatedData.name; // Update display name instantly
        } catch (error) {
            alert('Error updating profile: ' + error.message);
            console.error("Profile update error:", error);
        }
    });

    // Logout Button
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '/';
        }).catch(error => {
            console.error('Logout Error:', error);
            alert('Failed to log out.');
        });
    });

    // Tab Switching Logic (remains the same as before)
    const navButtons = document.querySelectorAll('.account-nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            navButtons.forEach(btn => btn.classList.remove('active-nav-btn'));
            button.classList.add('active-nav-btn');
            tabContents.forEach(content => {
                content.id === targetId ? content.classList.remove('hidden') : content.classList.add('hidden');
            });
        });
    });

    // --- Step 6: Helper Functions ---
    function getStatusChipClass(status) {
        const statusClasses = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Confirmed': 'bg-blue-100 text-blue-800',
            'Shipped': 'bg-indigo-100 text-indigo-800',
            'Delivered': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800',
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    }
});
