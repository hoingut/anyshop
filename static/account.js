total - discount + deliveryFee;

        priceDetailsDiv.innerHTML = `
            <div class="flex justify-between"><span class="text-gray-600">Subtotal</span><span>৳${subtotal.toFixed(2)}</span></div>
            <div class="flex justify-between text-green-600"><span>Discount</span><span>- ৳${discount.toFixed(2)}</span></div>
            <div class="flex justify-between"><span class="text-gray-600">Delivery Fee</span><span>৳${deliveryFee.toFixed(2)}</span></div>
            <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span>৳${state.total.toFixed(2)}</span></div>`;
    }

    function showError(message) {
        loadingContainer.classList.remove('flex');
        loadingContainer.classList.add('block');
        loadingContainer.innerHTML = `<p class="text-red-500 font-semibold p-4 bg-red-100 rounded-md">${message}</p>`;
    }

    function showSuccessScreen(orderId, orderDetails) {
        checkoutContainer.classList.add('hidden');
        const totalPaid = Number(orderDetails.priceDetails.total) || 0;
        successScreen.innerHTML = `
            <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
            <h2 class="text-3xl font-bold">Order Placed Successfully!</h2>
            <p class="text-gray-600 mt-2">Your order is now pending confirmation. We will verify your payment and process it shortly.</p>
            <div class="mt-6 text-left border-t pt-4 bg-gray-50 p-4 rounded-md">
                <p><strong>Order ID:</strong> <span class="font-mono">${orderId}</span></p>
                <p><strong>Total Amount:</strong> <span class="font-bold">৳${totalPaid.toFixed(2)}</span></p>
            </div>
            <a href="/account" class="mt-8 inline-block bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-700">View Order History</a>
        `;
        successScreen.classList.remove('hidden');
    }

    // --- Step 6: Event Handlers ---
    applyCouponBtn.addEventListener('click', () => {
        const couponCode = getElement('couponCode').value.toUpperCase();
        if (couponCode === 'DISCOUNT10') {
            state.discount = state.subtotal * 0.10;
            couponStatusP.textContent = "Coupon 'DISCOUNT10' applied!";
            couponStatusP.className = "text-sm mt-2 text-green-600";
        } else {
            state.discount = 0;
            couponStatusP.textContent = "Invalid coupon code.";
            couponStatusP.className = "text-sm mt-2 text-red-500";
        }
        updatePriceDetails();
    });

    paymentOptions.addEventListener('change', (e) => {
        const selectedMethod = e.target.value;
        if (selectedMethod === 'bkash' || selectedMethod === 'nagad') {
            const accountNumber = paymentAccounts[selectedMethod];
            paymentInstructions.innerHTML = `
                <p class="font-semibold">Please send <strong>৳${state.total.toFixed(2)}</strong> to this ${selectedMethod} personal number:</p>
                <p class="text-2xl font-bold text-red-600 my-2">${accountNumber}</p>
                <p>After sending money, enter the Transaction ID and your sender number below.</p>
            `;
            transactionIdInput.required = true;
            senderNumberInput.required = true;
            paymentConfirmationSection.classList.remove('hidden');
        } else { // COD
            paymentConfirmationSection.classList.add('hidden');
            transactionIdInput.required = false;
            senderNumberInput.required = false;
        }
    });

    placeOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = "Processing...";

        const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        const orderDetails = {
            userId: state.user.uid, userEmail: state.user.email,
            productId: state.productId, productName: state.product.name,
            priceDetails: {
                subtotal: state.subtotal, discount: state.discount,
                deliveryFee: state.deliveryFee, total: state.total,
            },
            deliveryInfo: {
                name: getElement('deliveryName').value, phone: getElement('deliveryPhone').value,
                address: getElement('deliveryAddress').value, city: getElement('deliveryCity').value,
            },
            paymentMethod: selectedPaymentMethod, status: 'Pending',
            orderDate: serverTimestamp()
        };
        
        if (selectedPaymentMethod !== 'cod') {
            orderDetails.paymentDetails = {
                transactionId: transactionIdInput.value, senderNumber: senderNumberInput.value,
                accountNumber: paymentAccounts[selectedPaymentMethod], status: 'Unverified'
            };
        }
        
        try {
            const ordersCollection = collection(db, 'orders');
            const docRef = await addDoc(ordersCollection, orderDetails);
            showSuccessScreen(docRef.id, orderDetails);
        } catch (error) {
            console.error("Error placing order: ", error);
            alert("Failed to place order. Please try again.");
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = "Confirm Order";
        }
    });
});
// --- Step 1: Import all necessary functions and services from Firebase ---
import { auth, db, doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// --- Step 2: Main script execution block ---
// This ensures the script runs only after the entire HTML document is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is ready. Initializing AnyShop account page script.");

    // --- Step 3: Defensive DOM Element Selection ---
    // This helper function safely gets elements and provides clear error messages if an ID is missing.
    const getElement = (id, isCritical = true) => {
        const element = document.getElementById(id);
        if (!element && isCritical) {
            // This is your best debugging tool! It will tell you EXACTLY which ID is missing from your HTML.
            console.error(`FATAL ERROR: A critical HTML element with id "${id}" was not found.`);
        } else if (!element) {
            console.warn(`Warning: A non-critical HTML element with id "${id}" was not found.`);
        }
        return element;
    };

    // Get all necessary elements. Check your browser console for any "FATAL ERROR" messages after this.
    const loadingSpinner = getElement('loading-spinner');
    const accountDashboard = getElement('account-dashboard');
    const logoutBtn = getElement('logout-btn');
    const userNameDisplay = getElement('user-name-display');
    const walletBalanceDisplay = getElement('wallet-balance-display');
    const totalOrdersDisplay = getElement('total-orders-display');
    const orderHistoryContainer = getElement('order-history-container');
    const profileUpdateForm = getElement('profile-update-form');

    // --- Step 4: Guard Clause ---
    // If the most critical elements for the page to function are missing, stop the script.
    if (!loadingSpinner || !accountDashboard) {
        console.error("Script halted because essential page elements ('loading-spinner' or 'account-dashboard') are missing.");
        return;
    }

    // --- Step 5: Authentication Observer (The Core Logic) ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadPageData(user);
        } else {
            const redirectUrl = encodeURIComponent(window.location.pathname);
            window.location.href = `/login?redirect=${redirectUrl}`;
        }
    });

    /**
     * Main function to load all data for the logged-in user with robust error handling.
     * @param {object} user - The Firebase user object.
     */
    async function loadPageData(user) {
        try {
            const [userData, orders] = await Promise.all([
                fetchUserProfile(user.uid),
                fetchUserOrders(user.uid)
            ]);

            populateDashboard(userData, orders.length);
            populateProfileForm(userData);
            displayOrders(orders);

        } catch (error) {
            console.error("CRITICAL ERROR while loading account page data:", error);
            if (accountDashboard) {
                accountDashboard.innerHTML = `
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <h2 class="text-xl text-red-600 font-bold">Oops! Something went wrong.</h2>
                        <p class="text-gray-700 mt-2">Could not load your account details. Please try refreshing the page.</p>
                        <p class="text-xs text-gray-500 mt-4">Error: ${error.message}</p>
                    </div>`;
            }
        } finally {
            // This block ALWAYS runs, ensuring the UI state is correct after loading.
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            if (accountDashboard) accountDashboard.classList.remove('hidden');
        }
    }

    // --- Data Fetching Functions ---
    async function fetchUserProfile(uid) {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            throw new Error("Your user profile was not found in our database. Please contact support.");
        }
    }

    async function fetchUserOrders(uid) {
        const q = query(collection(db, 'orders'), where("userId", "==", uid), orderBy("orderDate", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    // --- UI Population Functions ---
    function populateDashboard(userData, orderCount) {
        if (userNameDisplay) userNameDisplay.textContent = userData.name || 'Valued Customer';
        if (walletBalanceDisplay) {
            const balance = userData.walletBalance;
            walletBalanceDisplay.textContent = `৳${(typeof balance === 'number') ? balance.toFixed(2) : '0.00'}`;
        }
        if (totalOrdersDisplay) totalOrdersDisplay.textContent = orderCount;
    }

    function populateProfileForm(userData) {
        const nameInput = getElement('profile-name', false);
        const emailInput = getElement('profile-email', false);
        const phoneInput = getElement('profile-phone', false);

        if (nameInput) nameInput.value = userData.name || '';
        if (emailInput) emailInput.value = userData.email || '';
        if (phoneInput) phoneInput.value = userData.phoneNumber || '';
    }

    function displayOrders(orders) {
        if (!orderHistoryContainer) return;
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
                    ${orders.map(order => {
                        const price = order.priceDetails?.total;
                        const formattedPrice = (typeof price === 'number') ? price.toFixed(2) : 'N/A';
                        
                        return `
                        <tr>
                            <td class="py-3 px-3">${order.productName}</td>
                            <td class="py-3 px-3 font-semibold">৳${formattedPrice}</td>
                            <td class="py-3 px-3">
                                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipClass(order.status)}">
                                    ${order.status}
                                </span>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>`;
        orderHistoryContainer.innerHTML = tableHTML;
    }

    // --- Event Listeners Setup ---
    if (profileUpdateForm) {
        profileUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;

            const updatedData = {
                name: getElement('profile-name').value,
                phoneNumber: getElement('profile-phone').value,
            };

            const userRef = doc(db, 'users', user.uid);
            try {
                await updateDoc(userRef, updatedData);
                alert('Profile updated successfully!');
                if (userNameDisplay) userNameDisplay.textContent = updatedData.name;
            } catch (error) {
                alert('Error updating profile: ' + error.message);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).catch(error => console.error('Logout Error:', error));
        });
    }

    const navButtons = document.querySelectorAll('.account-nav-btn');
    if (navButtons.length > 0) {
        const tabContents = document.querySelectorAll('.tab-content');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                navButtons.forEach(btn => btn.classList.remove('active-nav-btn'));
                button.classList.add('active-nav-btn');
                tabContents.forEach(content => {
                    if (content) {
                       content.id === targetId ? content.classList.remove('hidden') : content.classList.add('hidden');
                    }
                });
            });
        });
    }
});

// Helper function for order status styling
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
