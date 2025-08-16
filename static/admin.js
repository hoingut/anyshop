document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const addProductForm = document.getElementById('addProductForm');
    const productList = document.getElementById('productList');
    const orderList = document.getElementById('orderList');
    const searchInput = document.getElementById('searchInput');
    const formTitle = document.getElementById('form-title');
    const productIdToEdit = document.getElementById('productIdToEdit');
    const clearFormBtn = document.getElementById('clear-form-btn');
    
    // --- Tab Switching Logic ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all buttons and hide all content
            tabButtons.forEach(btn => btn.classList.remove('active-tab'));
            tabContents.forEach(content => content.classList.add('hidden'));

            // Activate the clicked button and show its content
            button.classList.add('active-tab');
            const targetContentId = button.getAttribute('data-target');
            document.getElementById(targetContentId).classList.remove('hidden');
        });
    });

    let allProducts = []; // To store products for client-side search

    // --- Product Management Logic ---

    // Function to handle form submission (for both adding and updating)
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('productName').value,
            price: Number(document.getElementById('price').value),
            offerPrice: Number(document.getElementById('offerPrice').value) || 0,
            code: document.getElementById('productCode').value.toUpperCase(),
            stock: Number(document.getElementById('stock').value),
            ogPic: document.getElementById('ogPic').value,
            description: document.getElementById('productDescription').value,
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            metaTitle: document.getElementById('metaTitle').value,
            keywords: document.getElementById('keywords').value.split(',').map(k => k.trim()),
            metaDescription: document.getElementById('metaDescription').value,
        };

        const editId = productIdToEdit.value;

        if (editId) {
            // Update existing product
            db.collection('products').doc(editId).update(productData)
                .then(() => {
                    alert('Product updated successfully!');
                    clearForm();
                    fetchProducts();
                })
                .catch(error => console.error("Error updating product: ", error));
        } else {
            // Add new product
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            db.collection('products').add(productData)
                .then(() => {
                    alert('Product added successfully!');
                    clearForm();
                    fetchProducts();
                })
                .catch(error => console.error("Error adding product: ", error));
        }
    });

    // Function to fetch all products from Firestore
    function fetchProducts() {
        db.collection('products').orderBy('createdAt', 'desc').get().then(snapshot => {
            allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            displayProducts(allProducts);
        }).catch(error => console.error("Error fetching products:", error));
    }

    // Function to display products in the table
    function displayProducts(products) {
        let html = '';
        products.forEach(p => {
            const priceDisplay = p.offerPrice > 0 ? `৳${p.offerPrice} <s class="text-gray-400">৳${p.price}</s>` : `৳${p.price}`;
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="py-3 px-4">${p.name}</td>
                    <td class="py-3 px-4">${priceDisplay}</td>
                    <td class="py-3 px-4">${p.stock}</td>
                    <td class="py-3 px-4"><span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">${p.type}</span></td>
                    <td class="py-3 px-4">
                        <button class="text-indigo-600 hover:underline" onclick="editProduct('${p.id}')">Edit</button>
                        <button class="text-red-600 hover:underline ml-2" onclick="deleteProduct('${p.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });
        productList.innerHTML = html;
    }

    // Search/filter products logic
    searchInput.addEventListener('keyup', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredProducts = allProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.code.toLowerCase().includes(searchTerm)
        );
        displayProducts(filteredProducts);
    });
    
    // --- Order Management Logic ---
    function fetchOrders() {
        db.collection('orders').orderBy('orderDate', 'desc').get().then(snapshot => {
            let html = '';
            snapshot.forEach(doc => {
                const order = doc.data();
                const statusOptions = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
                const selectOptions = statusOptions.map(status => 
                    `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>`
                ).join('');

                html += `
                    <tr class="hover:bg-gray-50">
                        <td class="py-3 px-4 text-sm">${doc.id}</td>
                        <td class="py-3 px-4">${order.deliveryInfo.name}<br><span class="text-xs text-gray-500">${order.userEmail}</span></td>
                        <td class="py-3 px-4">${order.productName}</td>
                        <td class="py-3 px-4">৳${order.price}</td>
                        <td class="py-3 px-4">
                            <select class="p-1 border rounded-md" onchange="updateOrderStatus('${doc.id}', this.value)">
                                ${selectOptions}
                            </select>
                        </td>
                    </tr>
                `;
            });
            orderList.innerHTML = html;
        }).catch(error => console.error("Error fetching orders:", error));
    }
    
    // Clear form button logic
    clearFormBtn.addEventListener('click', clearForm);

    // Initial data load
    fetchProducts();
    fetchOrders();
});


// --- Global Functions (accessible via onclick) ---

/**
 * Populates the form with a product's data for editing.
 * @param {string} id - The Firestore document ID of the product.
 */
function editProduct(id) {
    db.collection('products').doc(id).get().then(doc => {
        if (doc.exists) {
            const p = doc.data();
            document.getElementById('productName').value = p.name || '';
            document.getElementById('price').value = p.price || '';
            document.getElementById('offerPrice').value = p.offerPrice || '';
            document.getElementById('productCode').value = p.code || '';
            document.getElementById('stock').value = p.stock || '';
            document.getElementById('ogPic').value = p.ogPic || '';
            document.getElementById('productDescription').value = p.description || '';
            document.getElementById('type').value = p.type || 'Normal';
            document.getElementById('category').value = p.category || '';
            document.getElementById('metaTitle').value = p.metaTitle || '';
            document.getElementById('keywords').value = (p.keywords || []).join(', ');
            document.getElementById('metaDescription').value = p.metaDescription || '';

            document.getElementById('productIdToEdit').value = id;
            document.getElementById('form-title').innerText = 'Edit Product';
            window.scrollTo(0, 0); // Scroll to the top to see the form
        }
    }).catch(error => console.error("Error getting product for edit:", error));
}


/**
 * Deletes a product from Firestore.
 * @param {string} id - The Firestore document ID of the product.
 */
function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        db.collection('products').doc(id).delete()
            .then(() => {
                alert('Product deleted successfully!');
                location.reload(); // Simple way to refresh list
            })
            .catch(error => console.error("Error deleting product: ", error));
    }
}

/**
 * Updates the status of an order in Firestore.
 * @param {string} orderId - The Firestore document ID of the order.
 * @param {string} newStatus - The new status value.
 */
function updateOrderStatus(orderId, newStatus) {
    db.collection('orders').doc(orderId).update({ status: newStatus })
        .then(() => {
            console.log(`Order ${orderId} status updated to ${newStatus}`);
            // Optionally, show a small success message
        })
        .catch(error => console.error("Error updating order status:", error));
}

/**
 * Clears the product form and resets it for adding a new product.
 */
function clearForm() {
    document.getElementById('addProductForm').reset();
    document.getElementById('productIdToEdit').value = '';
    document.getElementById('form-title').innerText = 'Add New Product';
            }
