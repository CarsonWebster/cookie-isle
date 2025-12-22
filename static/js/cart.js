/**
 * Cookie Isle - Shopping Cart Core Module
 * Handles all cart operations using localStorage
 */

const CookieCart = (function () {
  const STORAGE_KEY = "cookieisle_cart";
  const CART_VERSION = "1.0";

  // In-memory fallback when localStorage is unavailable
  let memoryCart = [];
  let storageAvailable = null;

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  function isStorageAvailable() {
    if (storageAvailable !== null) {
      return storageAvailable;
    }

    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      storageAvailable = true;
      return true;
    } catch (e) {
      console.warn(
        "localStorage not available, using in-memory cart:",
        e.message,
      );
      storageAvailable = false;
      return false;
    }
  }

  /**
   * Get the current cart from localStorage
   * @returns {Array} Array of cart items
   */
  function getCart() {
    if (!isStorageAvailable()) {
      return memoryCart;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const data = JSON.parse(stored);
      // Version check for future migrations
      if (data.version !== CART_VERSION) {
        // Handle migration if needed in future
        return data.items || [];
      }
      return data.items || [];
    } catch (e) {
      console.error("Error reading cart from localStorage:", e);
      return memoryCart;
    }
  }

  /**
   * Save the cart to localStorage
   * @param {Array} cart - Array of cart items
   */
  function saveCart(cart) {
    // Always update memory cart as backup
    memoryCart = cart;

    if (!isStorageAvailable()) {
      // Still dispatch event even without localStorage
      window.dispatchEvent(
        new CustomEvent("cartUpdated", { detail: { cart } }),
      );
      return;
    }

    try {
      const data = {
        version: CART_VERSION,
        items: cart,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Dispatch custom event for UI updates
      window.dispatchEvent(
        new CustomEvent("cartUpdated", { detail: { cart } }),
      );
    } catch (e) {
      console.error("Error saving cart to localStorage:", e);
      // Event still dispatched for in-memory cart updates
      window.dispatchEvent(
        new CustomEvent("cartUpdated", { detail: { cart } }),
      );
    }
  }

  /**
   * Add an item to the cart or update quantity if exists
   * @param {string} product - Product name
   * @param {number} priceCents - Price in cents (integer)
   * @param {number} qty - Quantity to add (default 1)
   * @param {string} priceId - Stripe Price ID (optional)
   * @returns {Array} Updated cart
   */
  function addToCart(product, priceCents, qty = 1, priceId = null) {
    const cart = getCart();
    const existingIndex = cart.findIndex((item) => item.product === product);

    if (existingIndex > -1) {
      // Update existing item quantity
      cart[existingIndex].qty += qty;
      // Update price ID if provided and missing
      if (priceId && !cart[existingIndex].price_id) {
        cart[existingIndex].price_id = priceId;
      }
    } else {
      // Add new item
      cart.push({
        product: product,
        price_cents: priceCents,
        qty: qty,
        price_id: priceId
      });
    }

    saveCart(cart);
    return cart;
  }

  /**
   * Remove an item from the cart entirely
   * @param {string} product - Product name to remove
   * @returns {Array} Updated cart
   */
  function removeFromCart(product) {
    let cart = getCart();
    cart = cart.filter((item) => item.product !== product);
    saveCart(cart);
    return cart;
  }

  /**
   * Update the quantity of a specific item
   * @param {string} product - Product name
   * @param {number} qty - New quantity (removes item if <= 0)
   * @returns {Array} Updated cart
   */
  function updateQuantity(product, qty) {
    if (qty <= 0) {
      return removeFromCart(product);
    }

    const cart = getCart();
    const item = cart.find((item) => item.product === product);

    if (item) {
      item.qty = qty;
      saveCart(cart);
    }

    return cart;
  }

  /**
   * Increment quantity by 1
   * @param {string} product - Product name
   * @returns {Array} Updated cart
   */
  function incrementQuantity(product) {
    const cart = getCart();
    const item = cart.find((item) => item.product === product);

    if (item) {
      item.qty += 1;
      saveCart(cart);
    }

    return cart;
  }

  /**
   * Decrement quantity by 1 (removes if reaches 0)
   * @param {string} product - Product name
   * @returns {Array} Updated cart
   */
  function decrementQuantity(product) {
    const cart = getCart();
    const item = cart.find((item) => item.product === product);

    if (item) {
      if (item.qty <= 1) {
        return removeFromCart(product);
      }
      item.qty -= 1;
      saveCart(cart);
    }

    return cart;
  }

  /**
   * Get total price in cents
   * @returns {number} Total price in cents
   */
  function getCartTotalCents() {
    const cart = getCart();
    return cart.reduce((total, item) => {
      return total + item.price_cents * item.qty;
    }, 0);
  }

  /**
   * Get total price formatted as dollars
   * @returns {string} Formatted price string (e.g., "$12.50")
   */
  function getCartTotalFormatted() {
    const cents = getCartTotalCents();
    return formatPrice(cents);
  }

  /**
   * Get total number of items in cart
   * @returns {number} Total item count
   */
  function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.qty, 0);
  }

  /**
   * Check if cart is empty
   * @returns {boolean} True if cart is empty
   */
  function isEmpty() {
    return getCart().length === 0;
  }

  /**
   * Clear all items from the cart
   */
  function clearCart() {
    saveCart([]);
  }

  /**
   * Format price from cents to display string
   * @param {number} cents - Price in cents
   * @returns {string} Formatted price (e.g., "$3.50")
   */
  function formatPrice(cents) {
    const dollars = cents / 100;
    return "$" + dollars.toFixed(2);
  }

  /**
   * Get cart item by product name
   * @param {string} product - Product name
   * @returns {Object|null} Cart item or null if not found
   */
  function getItem(product) {
    const cart = getCart();
    return cart.find((item) => item.product === product) || null;
  }

  /**
   * Build order payload for submission
   * @param {Object} customer - Customer information
   * @returns {Object} Order payload ready for API submission
   */
  function buildOrderPayload(customer) {
    const cart = getCart();
    const order = cart.map((item) => ({
      product: item.product,
      qty: item.qty,
      price: item.price_cents / 100,
    }));

    return {
      customer: {
        first_name: customer.firstName || "",
        last_name: customer.lastName || "",
        email: customer.email || "",
        phone: customer.phone || "",
      },
      order: order,
      total: getCartTotalCents() / 100,
      submitted_at: new Date().toISOString(),
    };
  }

  // Public API
  return {
    getCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    getCartTotalCents,
    getCartTotalFormatted,
    getCartCount,
    isEmpty,
    clearCart,
    formatPrice,
    getItem,
    buildOrderPayload,
    isStorageAvailable,
  };
})();

// Make available globally
window.CookieCart = CookieCart;
