const CART_STORAGE_KEY = 'wristAuraCart';
const USER_STORAGE_KEY = 'wristAuraUser';

const filterState = {
    searchQuery: '',
    category: 'all'
};

function getCart() {
    try {
        const cartJson = localStorage.getItem(CART_STORAGE_KEY);
        return cartJson ? JSON.parse(cartJson) : [];
    } catch (e) {
        console.error("Error retrieving cart from localStorage:", e);
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error("Error saving cart to localStorage:", e);
    }
}

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
    
    if (event.target.closest('.add-to-cart-btn') && typeof toggleCartDrawer === 'function') {
        toggleCartDrawer(true);
    }
}

function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    renderCart();
    updateCartBadge();
}

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
        subtotalElement.textContent = `Rs. ${subtotal.toFixed(2)}`;
    }

    if (checkoutButton) {
        checkoutButton.disabled = totalItems === 0;
        checkoutButton.textContent = totalItems > 0 ? 'PROCEED TO CHECKOUT' : 'CART IS EMPTY';
    }
}

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
                    <p class="mb-0 small text-white-50">Rs. ${item.price.toFixed(2)}</p>
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

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const query = searchInput.value.trim().toLowerCase();
    
    if (document.title.includes('Wrist Aura | Luxury Timepieces')) {
        filterState.searchQuery = query;
        applyFilters();
    } else if (query) {
        toggleSearchBar(false);
        window.location.href = `home.html?search=${encodeURIComponent(query)}`;
    }
}

function filterByCategory(category) {
    if (typeof category !== 'string') return;
    
    filterState.category = category.toLowerCase();
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.category.toLowerCase() === filterState.category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    applyFilters();
}

function applyFilters() {
    const cardsContainer = document.getElementById('productGridContainer');
    if (!cardsContainer) return;

    const cards = cardsContainer.querySelectorAll('.product-card-column');
    const query = filterState.searchQuery;
    const category = filterState.category;
    let foundCount = 0;
    
    cards.forEach(col => {
        const title = col.dataset.productTitle || '';
        const keywords = col.dataset.productKeywords || '';
        const cardCategory = col.dataset.productCategory || '';
        
        const categoryMatch = (category === 'all' || cardCategory === category);
        
        const searchMatch = (query === '' || 
                             title.includes(query) || 
                             keywords.includes(query) ||
                             cardCategory.includes(query));
        
        if (categoryMatch && searchMatch) {
            col.style.display = 'block';
            foundCount++;
        } else {
            col.style.display = 'none';
        }
    });
    
    const featuredCollectionsHeading = document.querySelector('#featuredCollections h2');
    const previousMessage = document.getElementById('search-result-message');
    if (previousMessage) previousMessage.remove();

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
            
            if(query) {
                document.getElementById('searchBarContainer').scrollIntoView({ behavior: 'smooth' });
            }
        } else if (query === '' && category === 'all') {
             featuredCollectionsHeading.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

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

function checkLoginState() {
    try {
        const userJson = localStorage.getItem(USER_STORAGE_KEY);
        const user = userJson ? JSON.parse(userJson) : null;
        
        if (user && user.name && user.email) {
            showDashboardView(user);
        } else {
            showLoginView();
        }
    } catch (e) {
        console.error("Error checking login state:", e);
        showLoginView();
    }
}

function showLoginView() {
    const loginView = document.getElementById('loginFormView');
    const dashboardView = document.getElementById('dashboardView');
    
    if (loginView) loginView.style.display = 'block';
    if (dashboardView) dashboardView.style.display = 'none';
}

function showDashboardView(user) {
    const loginView = document.getElementById('loginFormView');
    const dashboardView = document.getElementById('dashboardView');
    const userInfoCard = document.getElementById('userInfoCard');

    if (dashboardView) {
        dashboardView.style.display = 'flex';
    }
    if (loginView) loginView.style.display = 'none';
    
    if (userInfoCard && user) {
        userInfoCard.innerHTML = `
            <h6 class="font-body fw-bold" style="color: var(--luxury-gold);">Welcome Back, ${escapeHTML(user.name)}!</h6>
            <p class="mb-0 text-white-50 small">${escapeHTML(user.email)}</p>
        `;
    }
}

function handleLogin(event) {
    event.preventDefault();
    const nameInput = document.getElementById('loginName');
    const emailInput = document.getElementById('loginEmail');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    
    if (name && email) {
        const user = { name: name, email: email };
        
        try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            showDashboardView(user);
            if (nameInput) nameInput.value = '';
            if (emailInput) emailInput.value = '';
        } catch (e) {
            console.error("Error saving user to localStorage:", e);
        }
    } else {
        console.warn("Name and Email are required.");
    }
}

function handleLogout(event) {
    event.preventDefault();
    try {
        localStorage.removeItem(USER_STORAGE_KEY);
        showLoginView();
    } catch (e) {
        console.error("Error logging out:", e);
    }
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function(match) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match];
  });
}

function placeOrder() {
    const cart = getCart();
    if (cart.length === 0) return;

    toggleCartDrawer(false);
    
    if (orderPlacedModal) {
        orderPlacedModal.classList.add('show');
    }
    
    localStorage.removeItem(CART_STORAGE_KEY);
    renderCart();
    updateCartBadge();

    setTimeout(() => {
        if (orderPlacedModal) {
            orderPlacedModal.classList.remove('show');
        }
    }, 3000); 
}

function checkUrlForSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('search');
    
    if (query && document.title.includes('Wrist Aura | Luxury Timepieces')) {
        const decodedQuery = decodeURIComponent(query);
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = decodedQuery;
        
        filterState.searchQuery = decodedQuery.toLowerCase();
        applyFilters();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkUrlForSearchQuery();
    
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    updateCartBadge();
    checkLoginState();
    
    if (searchToggleButton && searchBarContainer) {
        searchToggleButton.addEventListener('click', () => {
            toggleSearchBar(!searchBarContainer.classList.contains('active'));
        });
    }

    const searchButton = searchBarContainer ? searchBarContainer.querySelector('.btn') : null;
    if (searchButton) {
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                performSearch();
            }
        });
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            filterByCategory(category);
        });
    });

    if (profileToggleButton && profileDrawer) profileToggleButton.addEventListener('click', () => toggleProfileDrawer(true));
    if (profileDrawerCloseButton && profileDrawer) profileDrawerCloseButton.addEventListener('click', () => toggleProfileDrawer(false));
    
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    if (cartToggleButton && cartDrawer) cartToggleButton.addEventListener('click', () => toggleCartDrawer(true));
    if (cartDrawerCloseButton && cartDrawer) cartDrawerCloseButton.addEventListener('click', () => toggleCartDrawer(false));
    
    if (profileDrawerBackdrop) {
        profileDrawerBackdrop.addEventListener('click', () => { 
            toggleProfileDrawer(false); 
            toggleCartDrawer(false); 
        });
    }

    if (checkoutButton) {
        checkoutButton.addEventListener('click', placeOrder);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (profileDrawer && profileDrawer.classList.contains('open')) toggleProfileDrawer(false);
            if (cartDrawer && cartDrawer.classList.contains('open')) toggleCartDrawer(false);
            if (searchBarContainer && searchBarContainer.classList.contains('active')) toggleSearchBar(false);
            if (orderPlacedModal && orderPlacedModal.classList.contains('show')) orderPlacedModal.classList.remove('show');
        }
    });

    document.querySelectorAll('img').forEach(img => {
        img.onerror = function() {
            const placeholderWidth = this.width > 0 ? this.width : 600;
            const placeholderHeight = this.height > 0 ? this.height : 400;
            this.src = `https://placehold.co/${placeholderWidth}x${placeholderHeight}/1E1E1E/D4AF37?text=Watch+Image`;
        };
    });
});
