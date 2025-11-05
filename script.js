// --- Configuration & Cart Storage ---
const CART_STORAGE_KEY = 'wristAuraCart';

// --- Global Filter State ---
// Holds the current state of filters on the home page
const filterState = {
    searchQuery: '',
    category: 'all'
};

// --- Cart Logic ---

/** Retrieves the current cart from local storage. */
function getCart() {
    try {
        const cartJson = localStorage.getItem(CART_STORAGE_KEY);
        return cartJson ? JSON.parse(cartJson) : [];
    } catch (e) {
        console.error("Error retrieving cart from localStorage:", e);
        return [];
    }
}

/** Saves the cart to local storage. */
function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error("Error saving cart to localStorage:", e);
    }
}

/**
 * Adds an item to the cart or increments its quantity.
 * @param {Event} event The click event or mock event object.
 */
function addToCart(event) {
    const button = event.target.closest('.add-to-cart-btn') || event.target.closest('[data-product-id]');
    if (!button) return;

    const id = button.dataset.productId;
    const name = button.dataset.productName;
    const price = parseFloat(button.dataset.productPrice);
    const image = button.dataset.productImg;

    if (!id || !name || isNaN(price)) {
        console.error("Missing product data for adding to cart.");
        return;
    }

    let cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id === id);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }

    saveCart(cart);
    renderCart();
    updateCartBadge();
    
    // Open the cart drawer after initial add
    if (event.target.closest('.add-to-cart-btn') && typeof toggleCartDrawer === 'function') {
        toggleCartDrawer(true);
    }
}

/** Removes an item completely from the cart. */
function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    renderCart();
    updateCartBadge();
}

/** Decrements the quantity of an item in the cart. */
function decrementQuantity(id) {
    let cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id === id);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity -= 1;
        if (cart[existingItemIndex].quantity <= 0) {
            cart.splice(existingItemIndex, 1);
        }
        saveCart(cart);
        renderCart();
        updateCartBadge();
    }
}

/** Updates the cart badge count and subtotal. */
function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const badge = document.getElementById('cartBadge');
    const subtotalElement = document.getElementById('cartSubtotal');
    const checkoutButton = document.getElementById('checkoutButton');
    
    if (badge) {
        badge.textContent = totalItems > 99 ? '99+' : totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    if (subtotalElement) {
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }

    if (checkoutButton) {
        checkoutButton.disabled = totalItems === 0;
        checkoutButton.textContent = totalItems > 0 ? 'PROCEED TO CHECKOUT' : 'CART IS EMPTY';
    }
}

/** Renders the cart contents into the cart drawer. */
function renderCart() {
    const cart = getCart();
    const cartBody = document.getElementById('cartItemsContainer');
    const cartEmptyState = document.getElementById('cartEmptyState');
    
    if (!cartBody) return; 

    cartBody.innerHTML = '';
    
    if (cart.length === 0) {
        if (cartEmptyState) cartEmptyState.style.display = 'block';
        return;
    }

    if (cartEmptyState) cartEmptyState.style.display = 'none';

    cart.forEach(item => {
        const itemHtml = `
            <div class="d-flex align-items-center py-3 border-bottom border-secondary border-opacity-25 cart-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="rounded me-3" 
                     style="width: 60px; height: 60px; object-fit: cover;"
                     onerror="this.onerror=null;this.src='https://placehold.co/60x60/1E1E1E/D4AF37?text=Watch'">
                <div class="flex-grow-1">
                    <h6 class="mb-0 text-white">${item.name}</h6>
                    <p class="mb-0 small text-white-50">$${item.price.toFixed(2)}</p>
                </div>
                <div class="d-flex align-items-center ms-3">
                    <button class="btn btn-sm text-white-50 p-1" onclick="decrementQuantity('${item.id}')" aria-label="Decrease quantity">
                        <i class="bi bi-dash-square"></i>
                    </button>
                    <span class="mx-2">${item.quantity}</span>
                    <button class="btn btn-sm text-white-50 p-1 add-to-cart-btn" 
                            onclick="addToCart(event)" 
                            data-product-id="${item.id}"
                            data-product-name="${item.name}"
                            data-product-price="${item.price.toFixed(2)}"
                            data-product-img="${item.image}"
                            aria-label="Increase quantity">
                        <i class="bi bi-plus-square"></i>
                    </button>
                    <button class="btn btn-sm text-danger remove ms-2" onclick="removeFromCart('${item.id}')" aria-label="Remove item">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        cartBody.insertAdjacentHTML('beforeend', itemHtml);
    });
}

// --- Search/Filter Logic for Home Page ---

/**
 * Handles the search input. 
 * Redirects to home page if not on it, or applies filters if on home page.
 */
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const query = searchInput.value.trim().toLowerCase();
    
    // Only proceed with client-side filtering if on home page
    if (document.title.includes('Wrist Aura | Luxury Timepieces')) {
        filterState.searchQuery = query;
        applyFilters();
    } else if (query) {
        // Redirect to home.html with the query parameter if on a collection page
        toggleSearchBar(false);
        window.location.href = `home.html?search=${encodeURIComponent(query)}`;
    }
}

/**
 * Handles the category filter button clicks.
 * @param {string} category - The category to filter by (e.g., 'all', 'chronograph').
 */
function filterByCategory(category) {
    if (typeof category !== 'string') return;
    
    filterState.category = category.toLowerCase();
    
    // Update active button state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.category.toLowerCase() === filterState.category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    applyFilters();
}

/**
 * The main filter function. 
 * Reads from filterState and shows/hides product cards on the home page.
 */
function applyFilters() {
    const cardsContainer = document.getElementById('productGridContainer');
    if (!cardsContainer) return; // Only run on home page

    const cards = cardsContainer.querySelectorAll('.product-card-column');
    const query = filterState.searchQuery;
    const category = filterState.category;
    let foundCount = 0;
    
    cards.forEach(col => {
        const title = col.dataset.productTitle || '';
        const keywords = col.dataset.productKeywords || '';
        const cardCategory = col.dataset.productCategory || '';
        
        // Category Check
        const categoryMatch = (category === 'all' || cardCategory === category);
        
        // Search Query Check
        const searchMatch = (query === '' || 
                             title.includes(query) || 
                             keywords.includes(query) ||
                             cardCategory.includes(query)); // Also check category in search
        
        // Final visibility
        if (categoryMatch && searchMatch) {
            col.style.display = 'block';
            foundCount++;
        } else {
            col.style.display = 'none';
        }
    });
    
    // Display search results message
    const featuredCollectionsHeading = document.querySelector('#featuredCollections h2');
    const previousMessage = document.getElementById('search-result-message');
    if (previousMessage) previousMessage.remove(); // Clear old message

    if (featuredCollectionsHeading) {
        const message = document.createElement('div');
        message.id = 'search-result-message';
        message.className = 'container text-center mb-4';
        
        let messageText = '';
        
        if (query && category === 'all') {
            messageText = foundCount > 0 
                ? `Showing ${foundCount} results for: <strong>"${query}"</strong>`
                : `No results found for: <strong>"${query}"</strong>`;
        } else if (!query && category !== 'all') {
            messageText = `Showing ${foundCount} results in <strong>${category.replace(/-/g, ' ')}</strong>`;
        } else if (query && category !== 'all') {
            messageText = foundCount > 0 
                ? `Showing ${foundCount} results for <strong>"${query}"</strong> in <strong>${category.replace(/-/g, ' ')}</strong>`
                : `No results found for <strong>"${query}"</strong> in <strong>${category.replace(/-/g, ' ')}</strong>`;
        }

        if (messageText) {
            message.innerHTML = `<p class="lead fw-light" style="color: var(--luxury-gold);">${messageText}</p>`;
            featuredCollectionsHeading.parentNode.insertBefore(message, featuredCollectionsHeading.nextSibling);
            
            // Scroll to the results area if a query or filter was entered
            if(query) { // Only scroll if search was used
                document.getElementById('searchBarContainer').scrollIntoView({ behavior: 'smooth' });
            }
        } else if (query === '' && category === 'all') {
             // If filters are cleared, scroll back to top of section
             featuredCollectionsHeading.scrollIntoView({ behavior: 'smooth' });
        }
    }
}


// --- Drawer and Utility Control Logic ---

// Get DOM references (Note: these assume the elements exist in the linked HTML files)
const searchToggleButton = document.getElementById('searchToggleButton');
const searchBarContainer = document.getElementById('searchBarContainer');
const profileToggleButton = document.getElementById('profileToggleButton');
const profileDrawer = document.getElementById('profileDrawer');
const profileDrawerCloseButton = document.getElementById('profileDrawerCloseButton');
const profileDrawerBackdrop = document.getElementById('profileDrawerBackdrop');
const cartToggleButton = document.getElementById('cartToggleButton');
const cartDrawer = document.getElementById('cartDrawer');
const cartDrawerCloseButton = document.getElementById('cartDrawerCloseButton');
const orderPlacedModal = document.getElementById('orderPlacedModal');
const checkoutButton = document.getElementById('checkoutButton');


function toggleProfileDrawer(show) {
    if (show) {
        profileDrawer.classList.add('open');
        profileDrawerBackdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';
        if (cartDrawer && cartDrawer.classList.contains('open')) toggleCartDrawer(false);
        if (searchBarContainer && searchBarContainer.classList.contains('active')) toggleSearchBar(false);
    } else {
        profileDrawer.classList.remove('open');
        if (!cartDrawer || !cartDrawer.classList.contains('open')) {
            profileDrawerBackdrop.classList.remove('visible');
            document.body.style.overflow = '';
        }
    }
}

function toggleCartDrawer(show) {
    if (show) {
        // Ensure cart is rendered before opening
        renderCart();
        updateCartBadge(); 
        
        cartDrawer.classList.add('open');
        profileDrawerBackdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';
        if (profileDrawer && profileDrawer.classList.contains('open')) toggleProfileDrawer(false);
        if (searchBarContainer && searchBarContainer.classList.contains('active')) toggleSearchBar(false);
    } else {
        cartDrawer.classList.remove('open');
        if (!profileDrawer || !profileDrawer.classList.contains('open')) {
            profileDrawerBackdrop.classList.remove('visible');
            document.body.style.overflow = '';
        }
    }
}

function toggleSearchBar(show) {
    if (show) {
        searchBarContainer.classList.add('active');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) setTimeout(() => searchInput.focus(), 100); 
        toggleProfileDrawer(false);
        toggleCartDrawer(false);
    } else {
        searchBarContainer.classList.remove('active');
    }
}

// --- Order Placement Logic ---
function placeOrder() {
    const cart = getCart();
    if (cart.length === 0) return;

    // 1. Close cart drawer
    toggleCartDrawer(false);
    
    // 2. Show confirmation modal
    if (orderPlacedModal) {
        orderPlacedModal.classList.add('show');
    }
    
    // 3. Clear cart (frontend only)
    localStorage.removeItem(CART_STORAGE_KEY);
    renderCart(); // Clear UI
    updateCartBadge(); // Update badge

    // 4. Hide modal after 3 seconds
    setTimeout(() => {
        if (orderPlacedModal) {
            orderPlacedModal.classList.remove('show');
        }
    }, 3000); 
}

// --- Home Page Search Results Display ---
function checkUrlForSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('search');
    
    if (query && document.title.includes('Wrist Aura | Luxury Timepieces')) {
        // Only run on the home page
        const decodedQuery = decodeURIComponent(query);
        // Set the input field value and immediately perform the filter
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = decodedQuery;
        
        filterState.searchQuery = decodedQuery.toLowerCase();
        applyFilters(); // Use the main filter function
    }
}


// --- Event Listeners and Initializers ---

document.addEventListener('DOMContentLoaded', () => {
    // Check if on home page and filter based on URL query parameter
    checkUrlForSearchQuery();
    
    // Set the current year in the footer (If the element exists)
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    // Initial UI updates
    updateCartBadge();
    
    // Wire up search toggle
    if (searchToggleButton && searchBarContainer) {
        searchToggleButton.addEventListener('click', () => {
            toggleSearchBar(!searchBarContainer.classList.contains('active'));
        });
    }

    // Wire up the SEARCH BUTTON (magnifying glass)
    const searchButton = searchBarContainer ? searchBarContainer.querySelector('.btn') : null;
    if (searchButton) {
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
    }
    
    // Wire up the ENTER key on the input field
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent accidental form submission/page reload
                performSearch();
            }
        });
    }
    
    // Wire up FILTER BUTTONS (Home Page only)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            filterByCategory(category);
        });
    });


    // Wire up Profile drawer controls
    if (profileToggleButton && profileDrawer) profileToggleButton.addEventListener('click', () => toggleProfileDrawer(true));
    if (profileDrawerCloseButton && profileDrawer) profileDrawerCloseButton.addEventListener('click', () => toggleProfileDrawer(false));
    
    // Wire up Cart drawer controls
    if (cartToggleButton && cartDrawer) cartToggleButton.addEventListener('click', () => toggleCartDrawer(true));
    if (cartDrawerCloseButton && cartDrawer) cartDrawerCloseButton.addEventListener('click', () => toggleCartDrawer(false));
    
    // Wire up shared backdrop click
    if (profileDrawerBackdrop) {
        profileDrawerBackdrop.addEventListener('click', () => { 
            toggleProfileDrawer(false); 
            toggleCartDrawer(false); 
        });
    }

    // Wire up checkout button
    if (checkoutButton) {
        checkoutButton.addEventListener('click', placeOrder);
    }

    // Close on escape key press
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (profileDrawer && profileDrawer.classList.contains('open')) toggleProfileDrawer(false);
            if (cartDrawer && cartDrawer.classList.contains('open')) toggleCartDrawer(false);
            if (searchBarContainer && searchBarContainer.classList.contains('active')) toggleSearchBar(false);
            if (orderPlacedModal && orderPlacedModal.classList.contains('show')) orderPlacedModal.classList.remove('show');
        }
    });

    // Placeholder images fallbacks
    document.querySelectorAll('img').forEach(img => {
        img.onerror = function() {
            this.src = `https://placehold.co/${this.width || 600}x${this.height || 400}/1E1E1E/D4AF37?text=Watch+Image`;
        };
    });
});