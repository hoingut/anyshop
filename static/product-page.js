document.addEventListener('DOMContentLoaded', () => {
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const productDetailsContainer = document.getElementById('product-details');
    const productImageSection = document.getElementById('product-image-section');
    const productInfoSection = document.getElementById('product-info-section');
    
    // Get product ID from the URL path (e.g., /product/PRODUCT_ID)
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    if (!productId) {
        displayError('Invalid product ID in URL.');
        return;
    }

    // Reference to the specific product document in Firestore
    const productRef = db.collection('products').doc(productId);

    productRef.get().then(doc => {
        if (doc.exists) {
            const product = doc.data();
            displayProductDetails(product, productId);
        } else {
            displayError('Sorry, this product could not be found.');
        }
    }).catch(error => {
        console.error("Error fetching product:", error);
        displayError('There was an error loading the product.');
    });

    /**
     * Hides the skeleton and displays the product details.
     * @param {object} product - The product data from Firestore.
     * @param {string} productId - The ID of the product.
     */
    function displayProductDetails(product, productId) {
        // --- Update Meta Tags for SEO ---
        document.title = product.metaTitle || `${product.name} - AnyShop`;
        document.getElementById('meta-description').setAttribute('content', product.metaDescription || `Buy ${product.name} at a great price on AnyShop.`);
        document.getElementById('og-title').setAttribute('content', product.metaTitle || product.name);
        document.getElementById('og-description').setAttribute('content', product.metaDescription || `Buy ${product.name} at a great price on AnyShop.`);
        document.getElementById('og-image').setAttribute('content', product.ogPic || '');

        // --- Populate Product Image Section ---
        productImageSection.innerHTML = `
            <img src="${product.ogPic || 'https://via.placeholder.com/600x600'}" alt="${product.name}" class="w-full h-auto max-h-96 object-contain rounded-lg shadow-md">
        `;

        // --- Populate Product Info Section ---
        const hasOffer = product.offerPrice > 0;
        const finalPrice = hasOffer ? product.offerPrice : product.price;

        productInfoSection.innerHTML = `
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900">${product.name}</h1>
            <div class="mt-4 mb-6">
                <span class="text-4xl font-bold text-indigo-600">৳${finalPrice}</span>
                ${hasOffer ? `<span class="text-xl text-gray-500 line-through ml-4">৳${product.price}</span>` : ''}
            </div>
            <div class="text-sm text-gray-600 mb-4">
                <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
                <p><strong>Stock:</strong> <span class="${product.stock > 0 ? 'text-green-600' : 'text-red-600'} font-semibold">${product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}</span></p>
                <p><strong>Product Code:</strong> ${product.code || 'N/A'}</p>
            </div>
            <div class="prose max-w-none text-gray-700 mb-8">
                <p>${product.description || 'No description available.'}</p>
            </div>
            <button id="buy-now-btn" class="w-full bg-indigo-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition duration-300 flex items-center justify-center" ${product.stock === 0 ? 'disabled' : ''}>
                <i class="fas fa-shopping-cart mr-2"></i>
                ${product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
            </button>
        `;
        
        // Hide skeleton and show details
        loadingSkeleton.classList.add('hidden');
        productDetailsContainer.classList.remove('hidden');

        // Add event listener for the "Buy Now" button
        document.getElementById('buy-now-btn').addEventListener('click', () => {
            handleBuyNow(productId);
        });
    }

    /**
     * Displays an error message in the product container.
     * @param {string} message - The error message to display.
     */
    function displayError(message) {
        const productContainer = document.getElementById('product-container');
        productContainer.innerHTML = `
            <div class="text-center py-10">
                <h2 class="text-2xl font-bold text-red-600">Oops! Something went wrong.</h2>
                <p class="text-gray-600 mt-2">${message}</p>
                <a href="/" class="mt-6 inline-block bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-700">Go to Homepage</a>
            </div>
        `;
    }

    /**
     * Handles the logic for the "Buy Now" button click.
     * @param {string} productId - The ID of the product.
     */
    function handleBuyNow(productId) {
        auth.onAuthStateChanged(user => {
            if (user) {
                // If user is logged in, redirect to checkout
                window.location.href = `/checkout?productId=${productId}`;
            } else {
                // If not logged in, show an alert and redirect to login page
                // We pass the current page as a redirect URL so the user comes back here after logging in
                alert('Please log in to continue with your purchase.');
                const redirectUrl = encodeURIComponent(window.location.pathname);
                window.location.href = `/login?redirect=${redirectUrl}`;
            }
        });
    }
});
