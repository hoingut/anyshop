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
    const getElement = (id) => document.getElementById(id);
    
    const loadingSpinner = getElement('loading-spinner');
    const accountDashboard = getElement('account-dashboard');
    const logoutBtn = getElement('logout-btn');
    const userNameDisplay = getElement('user-name-display');
    const walletBalanceDisplay = getElement('wallet-balance-display');
    const totalOrdersDisplay = getElement('total-orders-display');
    const orderHistoryContainer = getElement('order-history-container');
    const profileUpdateForm = getElement('profile-update-form');
    const profileNameInput = getElement('profile-name');
    const profileEmailInput = getElement('profile-email');
    const profilePhoneInput = getElement('profile-phone');

    // --- Step 3: Authentication State Observer (The Entry Point) ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in. Load the page data.
            loadPageData(user);
        } else {
            // User is NOT logged in. Redirect to the login page immediately.
            // This solves the "not redirecting" issue.
            const redirectUrl = encodeURIComponent(window.location.pathname);
            window.location.href = `/login?redirect=${redirectUrl}`;
        }
    });

    /**
     * Main function to load all data for the logged-in user.
     * Uses a try...catch...finally block to guarantee the loading spinner is handled.
     * @param {object} user - The Firebase user object.
     */
    async function loadPageData(user) {
        try {
            // Fetch user profile and orders in parallel for faster loading.
            const [userData, orders] = await Promise.all([
                fetchUserProfile(user.uid),
                fetchUserOrders(user.uid)
            ]);

            // If we reach here, data fetching was successful.
            // This solves the "data not showing" issue.
            populateDashboard(userData, orders.length);
            populateProfileForm(userData);
            displayOrders(orders);

        } catch (error) {
            // If any promise in Promise.all fails, this block catches the error.
            console.error("CRITICAL ERROR loading account page data:", error);
            accountDashboard.innerHTML = `<div class="bg-white p-6 rounded-lg shadow-md text-center"><h2 class="text-xl text-red-600 font-bold">Oops!</h2><p class="text-gray-700">Could not load your account details. Please check your connection and try again.</p></div>`;
        
        } finally {
            // THIS IS THE KEY FIX: This block always runs, regardless of success or error.
            // This solves the "loading spinner not disappearing" issue.
            loadingSpinner.classList.add('hidden');
            accountDashboard.classList.remove('hidden');
        }
    }

    // --- Step 4: Data Fetching Functions ---

    /** Fetches a user's profile from Firestore. */
    async function fetchUserProfile(uid) {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // This is a critical error and should be thrown to be caught by the main catch block.
            throw new Error("User profile not found in the database. Please contact support.");
        }
    }

    /** Fetches a user's order history from Firestore. */
    async function fetchUserOrders(uid) {
        const ordersCol = collection(db, 'orders');
        const q = query(ordersCol, where("userId", "==", uid), orderBy("orderDate", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    // --- Step 5: UI Population and Event Handlers ---
    
// account.js

    // account.js

// ... (ফাইলের উপরের অংশ আগের মতোই থাকবে)

function populateDashboard(userData, orderCount) {
    userNameDisplay.textContent = userData.name || 'Valued Customer';
    
    // --- THIS IS THE FIX ---
    // Check if walletBalance exists and is a number before calling toFixed().
    // If not, default to '0.00'.
    const balance = userData.walletBalance;
    walletBalanceDisplay.textContent = `৳${(typeof balance === 'number') ? balance.toFixed(2) : '0.00'}`;
    // ----------------------

    totalOrdersDisplay.textContent = orderCount;
}

// ... (ফাইলের বাকি অংশ আগের মতোই থাকবে)

    function populateProfileForm(userData) {
        profileNameInput.value = userData.name || '';
        profileEmailInput.value = userData.email || '';
        profilePhoneInput.value = userData.phoneNumber || '';
    }

    function displayOrders(orders) {
        if (orders.length === 0) {
            orderHistoryContainer.innerHTML = '<p class="text-gray-500 text-center py-4">You haven\'t placed any orders yet.</p>';
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
                            <td class="py-3 px-3 font-semibold">৳${order.price.toFixed(2)}</td>
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
            userNameDisplay.textContent = updatedData.name;
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        }
    });

    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '/';
        }).catch(error => {
            console.error('Logout Error:', error);
        });
    });

    // Tab Switching Logic
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

    function getStatusChipClass(status) {
        const statusClasses = {
            'Pending': 'bg-yellow-100 text-yellow-800', 'Confirmed': 'bg-blue-100 text-blue-800',
            'Shipped': 'bg-indigo-100 text-indigo-800', 'Delivered': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800',
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    }
});
