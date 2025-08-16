document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('addProductForm');
    const productList = document.getElementById('productList');
    const searchInput = document.getElementById('searchInput');
    let allProducts = []; // To store products for client-side search

    // Add a new product to Firestore
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const product = {
            name: document.getElementById('productName').value,
            price: Number(document.getElementById('price').value),
            offerPrice: Number(document.getElementById('offerPrice').value) || 0,
            code: document.getElementById('productCode').value,
            metaTitle: document.getElementById('metaTitle').value,
            metaDescription: document.getElementById('metaDescription').value,
            keywords: document.getElementById('keywords').value.split(',').map(k => k.trim()),
            ogPic: document.getElementById('ogPic').value,
            description: document.getElementById('productDescription').value,
            type: document.getElementById('type').value,
            quality: document.getElementById('quality').value,
            stock: Number(document.getElementById('stock').value),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            relatedProducts: document.getElementById('relatedProducts').value.split(',').map(c => c.trim()),
            tags: document.getElementById('tags').value.split(',').map(t => t.trim()),
            category: document.getElementById('category').value,
        };

        db.collection('products').add(product)
            .then(() => {
                alert('Product added successfully!');
                addProductForm.reset();
                fetchProducts(); // Refresh the list
            })
            .catch(error => console.error("Error adding product: ", error));
    });

    // Fetch all products from Firestore
    function fetchProducts() {
        db.collection('products').orderBy('createdAt', 'desc').get().then(snapshot => {
            allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            displayProducts(allProducts);
        });
    }

    // Display products in the table
    function displayProducts(products) {
        let html = '';
        products.forEach(p => {
            html += `
                <tr class="border-b">
                    <td class="py-2 px-4">${p.name}</td>
                    <td class="py-2 px-4">৳${p.offerPrice > 0 ? p.offerPrice : p.price}</td>
                    <td class="py-2 px-4">${p.stock}</td>
                    <td class="py-2 px-4">
                        <button class="text-blue-500 hover:underline" onclick="editProduct('${p.id}')">Edit</button>
                        <button class="text-red-500 hover:underline ml-2" onclick="deleteProduct('${p.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });
        productList.innerHTML = html;
    }
    
    // Search/filter products
    searchInput.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = allProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.code.toLowerCase().includes(searchTerm)
        );
        displayProducts(filteredProducts);
    });

    fetchProducts(); // Initial fetch
});

// Edit and Delete functions (global scope for onclick)
function editProduct(id) {
    alert(`Editing product with ID: ${id}. \n(Note: Edit functionality needs a modal/form to be implemented)`);
    // Logic: 1. Fetch product by ID. 2. Populate the form. 3. On submit, use db.collection('products').doc(id).update({...})
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        db.collection('products').doc(id).delete()
            .then(() => {
                alert('Product deleted successfully!');
                location.reload(); // Simple way to refresh list
            })
            .catch(error => console.error("Error removing product: ", error));
    }
                                                }
