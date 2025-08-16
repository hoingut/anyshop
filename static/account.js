document.addEventListener('DOMContentLoaded', () => {
    const userNameDisplay = document.getElementById('user-name');
    const walletBalanceDisplay = document.getElementById('wallet-balance');
    const orderHistoryContainer = document.getElementById('order-history');
    const logoutBtn = document.getElementById('logout-btn');

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in. Fetch their data.
            const userRef = db.collection('users').doc(user.uid);
            userRef.get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    userNameDisplay.textContent = userData.name;
                    walletBalanceDisplay.textContent = `৳${userData.walletBalance || 0}`;
                } else {
                    userNameDisplay.textContent = user.email;
                }
            });

            // Fetch user's order history
            db.collection('orders').where('userId', '==', user.uid).orderBy('orderDate', 'desc').get()
                .then(snapshot => {
                    if (snapshot.empty) {
                        orderHistoryContainer.innerHTML = '<p>You have no orders yet.</p>';
                        return;
                    }
                    let html = `
                        <table class="min-w-full bg-white">
                            <thead class="bg-gray-200">
                                <tr>
                                    <th class="py-2 px-4">Order ID</th>
                                    <th class="py-2 px-4">Product</th>
                                    <th class="py-2 px-4">Price</th>
                                    <th class="py-2 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    snapshot.forEach(doc => {
                        const order = doc.data();
                        html += `
                            <tr class="border-b">
                                <td class="py-2 px-4 text-sm">${doc.id}</td>
                                <td class="py-2 px-4">${order.productName}</td>
                                <td class="py-2 px-4">৳${order.price}</td>
                                <td class="py-2 px-4">
                                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}">
                                        ${order.status}
                                    </span>
                                </td>
                            </tr>
                        `;
                    });
                    html += '</tbody></table>';
                    orderHistoryContainer.innerHTML = html;
                });

        } else {
            // No user is signed in. Redirect to login.
            window.location.href = '/login';
        }
    });
    
    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            alert('You have been logged out.');
            window.location.href = '/';
        });
    });
});

function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'pending': return 'bg-yellow-200 text-yellow-800';
        case 'confirmed': return 'bg-blue-200 text-blue-800';
        case 'complete': return 'bg-green-200 text-green-800';
        case 'cancelled': return 'bg-red-200 text-red-800';
        default: return 'bg-gray-200 text-gray-800';
    }
                          }
