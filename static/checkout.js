// --- Step 1: Import necessary functions and services ---
import { auth, db, doc, getDoc, addDoc, collection, serverTimestamp } from './firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- Step 2: DOM Element References ---
    const getElement = (id) => document.getElementById(id);

    const loadingContainer = getElement('loading-container');
    const checkoutContainer = getElement('checkout-container');
    const placeOrderForm = getElement('place-order-form');
    const placeOrderBtn = getElement('place-order-btn');
    const productSummaryDiv = getElement('product-summary');
    const priceDetailsDiv = getElement('price-details');
    const applyCouponBtn = getElement('apply-coupon-btn');
    const couponStatusP = getElement('coupon-status');
    const successScreen = getElement('success-screen');
    const receiptDetailsDiv = getElement('receipt-details');
    const paymentOptions = getElement('payment-method-options');
    const paymentConfirmationSection = getElement('payment-confirmation-section');
    const paymentInstructions = getElement('payment-instructions');
    const transactionIdInput = getElement('transactionId');
    const senderNumberInput = getElement('senderNumber');

    // --- Step 3: Static Configuration and State Management ---
    const paymentAccounts = {
        bkash: "01700000000", // আপনার বিকাশ নম্বর দিন
        nagad: "01800000000"  // আপনার নগদ নম্বর দিন
    };
    
    const state = {
        user: null,
        product: null,
        productId: null,
        subtotal: 0,
        discount: 0,
        deliveryFee: 60, // Standard delivery fee
        total: 0,
    };

    // --- Step 4: Initialization - Check Auth and Load Data ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            state.user = user;
            const params = new URLSearchParams(window.location.search);
            state.productId = params.get('productId');
            if (state.productId) {
                loadCheckoutData();
            } else {
                showError("No product was selected for checkout. Please go back and choose a product.");
            }
        } else {
            // Redirect to login if not authenticated, preserving the product ID in the URL
            const redirectUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
            window.location.href = `/login?redirect=${redirectUrl}`;
        }
    });

    async function loadCheckoutData() {
        try {
            const productRef = doc(db, 'products', state.productId);
            const docSnap = await getDoc(productRef);
            if (!docSnap.exists()) throw new Error("The selected product could not be found.");

            state.product = docSnap.data();
            state.subtotal = state.product.offerPrice > 0 ? state.product.offerPrice : state.product.price;
            
            populateOrderSummary();
            updatePriceDetails();

            loadingContainer.classList.add('hidden');
            checkoutContainer.classList.remove('hidden');
        } catch (error) {
            showError(error.message);
        }
    }

    // --- Step 5: UI Update and Helper Functions ---
    function populateOrderSummary() {
        productSummaryDiv.innerHTML = `
            <img src="${state.product.ogPic || 'https://via.placeholder.com/100'}" alt="${state.product.name}" class="w-16 h-16 rounded-md object-cover">
            <div>
                <h3 class="font-semibold">${state.product.name}</h3>
                <p class="text-gray-600 text-sm">Price: ৳${state.subtotal.toFixed(2)}</p>
            </div>`;
    }

    function updatePriceDetails() {
        state.total = state.subtotal - state.discount + state.deliveryFee;
        priceDetailsDiv.innerHTML = `
            <div class="flex justify-between"><span class="text-gray-600">Subtotal</span><span>৳${state.subtotal.toFixed(2)}</span></div>
            <div class="flex justify-between text-green-600"><span >Discount</span><span>- ৳${state.discount.toFixed(2)}</span></div>
            <div class="flex justify-between"><span class="text-gray-600">Delivery Fee</span><span>৳${state.deliveryFee.toFixed(2)}</span></div>
            <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span >Total</span><span>৳${state.total.toFixed(2)}</span></div>`;
    }

    function showError(message) {
        loadingContainer.innerHTML = `<p class="text-red-500 font-semibold p-4 bg-red-100 rounded-md">${message}</p>`;
    }

    function showSuccessScreen(orderId, orderDetails) {
        checkoutContainer.classList.add('hidden');
        successScreen.innerHTML = `
            <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
            <h2 class="text-3xl font-bold">Order Placed Successfully!</h2>
            <p class="text-gray-600 mt-2">Your order is now pending confirmation. We will verify your payment and process it shortly.</p>
            <div class="mt-6 text-left border-t pt-4 bg-gray-50 p-4 rounded-md">
                <p><strong>Order ID:</strong> <span class="font-mono">${orderId}</span></p>
                <p><strong>Total Amount:</strong> <span class="font-bold">৳${orderDetails.priceDetails.total.toFixed(2)}</span></p>
            </div>
            <a href="/account" class="mt-8 inline-block bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-700">View Order History</a>
        `;
        successScreen.classList.remove('hidden');
    }

    // --- Step 6: Event Handlers ---
    applyCouponBtn.addEventListener('click', () => {
        const couponCode = document.getElementById('couponCode').value.toUpperCase();
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
            const amount = state.total;
            const accountNumber = paymentAccounts[selectedMethod];
            
            paymentInstructions.innerHTML = `
                <p class="font-semibold">Please send <strong>৳${amount.toFixed(2)}</strong> to this ${selectedMethod} personal number:</p>
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
            userId: state.user.uid,
            userEmail: state.user.email,
            productId: state.productId,
            productName: state.product.name,
            priceDetails: {
                subtotal: state.subtotal,
                discount: state.discount,
                deliveryFee: state.deliveryFee,
                total: state.total,
            },
            deliveryInfo: {
                name: document.getElementById('deliveryName').value,
                phone: document.getElementById('deliveryPhone').value,
                address: document.getElementById('deliveryAddress').value,
                city: document.getElementById('deliveryCity').value,
            },
            paymentMethod: selectedPaymentMethod,
            status: 'Pending',
            orderDate: serverTimestamp()
        };
        
        if (selectedPaymentMethod !== 'cod') {
            orderDetails.paymentDetails = {
                transactionId: transactionIdInput.value,
                senderNumber: senderNumberInput.value,
                accountNumber: paymentAccounts[selectedPaymentMethod],
                status: 'Unverified'
            };
        }
        
        try {
            const ordersCollection = collection(db, 'orders');
            const docRef = await addDoc(ordersCollection, orderDetails);
            showSuccessScreen(docRef.id, orderDetails);
        } catch (error) {
            console.error("Error writing document: ", error);
            alert("Failed to place order. Please try again.");
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = "Confirm Order";
        }
    });
});
