document.addEventListener('DOMContentLoaded', () => {
    const hotProductsGrid = document.getElementById('hot-products-grid');
    const newProductsGrid = document.getElementById('new-products-grid');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    // --- Event Listeners ---
    
    // Toggle mobile menu visibility
    menuToggleBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // --- Firebase Data Fetching ---

    /**
     * Creates an HTML string for a product card.
     * @param {object} product - The product data from Firestore.
     * @param {string} id - The document ID of the product.
     * @returns {string} - The HTML string for the product card.
     */
    function createProductCard(product, id) {
        const hasOffer = product.offerPrice > 0;
        const priceToShow = hasOffer ? product.offerPrice : product.price;

        return `
            <div class="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 group">
                <a href="/product/${id}" class="block">
                    <div class="relative">
                        <img src="${product.ogPic || 'https://via.placeholder.com/300'}" alt="${product.name}" class="w-full h-40 object-cover">
                        ${hasOffer ? `<span class="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SALE</span>` : ''}
                    </div>
                    <div class="p-4">
                        <h3 class="font-semibold text-gray-800 truncate" title="${product.name}">${product.name}</h3>
                        <div class="mt-2 flex items-baseline justify-between">
                            <div>
                                <span class="text-lg font-bold text-indigo-600">৳${priceToShow}</span>
                                ${hasOffer ? `<span class="text-sm text-gray-500 line-through ml-2">৳${product.price}</span>` : ''}
                            </div>
                        </div>
                        <button onclick="buyNow('${id}')" class="w-full bg-indigo-500 text-white py-2 rounded mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Buy Now
                        </button>
                    </div>
                </a>
            </div>
        `;
    }

    /**
     * Fetches products from Firestore and populates a grid.
     * @param {HTMLElement} gridElement - The grid container element.
     * @param {firebase.firestore.Query} query - The Firestore query to execute.
     */
    function loadProducts(gridElement, query) {
        query.get().then(snapshot => {
            if (snapshot.empty) {
                gridElement.innerHTML = '<p class="col-span-full text-center text-gray-500">No products found.</p>';
                return;
            }
            let html = '';
            snapshot.forEach(doc => {
                html += createProductCard(doc.data(), doc.id);
            });
            gridElement.innerHTML = html;
        }).catch(error => {
            console.error("Error fetching products: ", error);
            gridElement.innerHTML = '<p class="col-span-full text-center text-red-500">Failed to load products.</p>';
        });
    }

    // --- Initial Data Load ---

    // Load "Hot Products" (type == 'Popular'), limited to 20
    const hotProductsQuery = db.collection('products')
                               .where('type', '==', 'Popular')
                               .limit(20);
    loadProducts(hotProductsGrid, hotProductsQuery);

    // Load "New Products" (ordered by creation date), limited to 100
    const newProductsQuery = db.collection('products')
                               .orderBy('createdAt', 'desc')
                               .limit(100);
    loadProducts(newProductsGrid, newProductsQuery);
});

/**
 * Handles the "Buy Now" button click.
 * Prevents the link navigation and redirects to checkout.
 * @param {string} productId - The ID of the product to buy.
 */
function buyNow(productId) {
    event.preventDefault(); // Stop the <a> tag from navigating
    event.stopPropagation(); // Stop event bubbling
    console.log(`Redirecting to checkout for product: ${productId}`);
    window.location.href = `/checkout?productId=${productId}`;
                          }
