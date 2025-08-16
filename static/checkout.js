document.addEventListener('DOMContentLoaded', () => {
    const deliveryForm = document.getElementById('delivery-form');
    const productSummary = document.getElementById('product-summary');
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId');
    let productData = null;

    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (!user) {
            alert('Please login to proceed to checkout.');
            window.location.href = `/login?redirect=/checkout?productId=${productId}`;
            return;
        }

        if (!productId) {
            productSummary.innerHTML = '<p class="text-red-500">No product selected for checkout.</p>';
            return;
        }

        // Fetch product details
        db.collection('products').doc(productId).get().then(doc => {
            if (doc.exists) {
                productData = { id: doc.id, ...doc.data() };
                const finalPrice = productData.offerPrice > 0 ? productData.offerPrice : productData.price;
                productSummary.innerHTML = `
                    <h3 class="text-xl font-bold">${productData.name}</h3>
                    <p class="text-2xl font-semibold mt-2">Price: ৳${finalPrice}</p>
                `;
            } else {
                productSummary.innerHTML = '<p class="text-red-500">Product not found.</p>';
            }
        });

        // Handle order submission
        deliveryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!productData) {
                alert('Cannot process order, product data is missing.');
                return;
            }

            const couponCode = document.getElementById('couponCode').value;
            let finalPrice = productData.offerPrice > 0 ? productData.offerPrice : productData.price;
            let discount = 0;

            if (couponCode === 'DISCOUNT10') { // Example coupon
                discount = finalPrice * 0.10;
                finalPrice -= discount;
            }

            const orderDetails = {
                userId: user.uid,
                userEmail: user.email,
                productId: productData.id,
                productName: productData.name,
                deliveryInfo: {
                    name: document.getElementById('deliveryName').value,
                    address: document.getElementById('deliveryAddress').value,
                    city: document.getElementById('deliveryCity').value,
                    phone: document.getElementById('deliveryPhone').value,
                },
                price: finalPrice,
                discountApplied: discount > 0,
                coupon: couponCode,
                status: 'Pending', // Initial status
                orderDate: new Date()
            };

            // Save order to Firestore
            db.collection('orders').add(orderDetails)
                .then(docRef => {
                    alert(`Order successful! Your Order ID is: ${docRef.id}`);
                    // Redirect to a success page or show receipt
                    document.body.innerHTML = `
                        <div class="text-center p-10">
                            <h1 class="text-3xl font-bold text-green-600">Order Placed Successfully!</h1>
                            <p class="mt-4">Your Order ID: <strong>${docRef.id}</strong></p>
                            <p>Product: ${orderDetails.productName}</p>
                            <p>Total Price: ৳${orderDetails.price}</p>
                            <p>Delivery to: ${orderDetails.deliveryInfo.name}, ${orderDetails.deliveryInfo.address}</p>
                            <button onclick="window.print()" class="mt-6 bg-indigo-600 text-white py-2 px-4 rounded">Download Receipt</button>
                        </div>
                    `;
                })
                .catch(error => console.error("Error creating order: ", error));
        });
    });
});
