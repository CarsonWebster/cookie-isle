/**
 * Cookie Isle - Cart UI Module
 * Handles UI interactions for the shopping cart
 */

const CartUI = (function () {
  // Selectors
  const BADGE_SELECTOR = ".cart-badge";
  const ADD_TO_CART_SELECTOR = "[data-add-to-cart]";
  const TOAST_CONTAINER_ID = "cart-toast-container";
  const MAX_ORDER_MODAL_ID = "cart-max-order-modal";

  // Configuration (can be overridden via window.CART_CONFIG)
  const DEFAULT_MAX_QUANTITY = 50;

  /**
   * Initialize the cart UI
   */
  function init() {
    // Update badge on page load
    updateCartBadge();

    // Attach event listeners to all "Add to Cart" buttons
    attachAddToCartListeners();

    // Listen for cart updates from other tabs/operations
    window.addEventListener("cartUpdated", function () {
      updateCartBadge();
    });

    // Listen for storage events (for multi-tab support)
    window.addEventListener("storage", function (e) {
      if (e.key === "cookieisle_cart") {
        updateCartBadge();
      }
    });

    // Create toast container if it doesn't exist
    createToastContainer();

    // Create max order modal if it doesn't exist
    createMaxOrderModal();
  }

  /**
   * Get the max order quantity from config
   */
  function getMaxOrderQuantity() {
    if (window.CHECKOUT_CONFIG && window.CHECKOUT_CONFIG.maxOrderQuantity) {
      return window.CHECKOUT_CONFIG.maxOrderQuantity;
    }
    if (window.CART_CONFIG && window.CART_CONFIG.maxOrderQuantity) {
      return window.CART_CONFIG.maxOrderQuantity;
    }
    return DEFAULT_MAX_QUANTITY;
  }

  /**
   * Update all cart badges on the page
   */
  function updateCartBadge() {
    const badges = document.querySelectorAll(BADGE_SELECTOR);
    const count = CookieCart.getCartCount();

    badges.forEach(function (badge) {
      badge.textContent = count;

      if (count > 0) {
        badge.classList.add("has-items");
        badge.style.display = "";
      } else {
        badge.classList.remove("has-items");
        badge.style.display = "none";
      }
    });

    // Also update any cart total displays
    const totalDisplays = document.querySelectorAll(".cart-total-display");
    totalDisplays.forEach(function (el) {
      el.textContent = CookieCart.getCartTotalFormatted();
    });
  }

  /**
   * Attach click listeners to all "Add to Cart" buttons
   */
  function attachAddToCartListeners() {
    const buttons = document.querySelectorAll(ADD_TO_CART_SELECTOR);

    buttons.forEach(function (button) {
      button.addEventListener("click", handleAddToCart);
    });
  }

  /**
   * Handle "Add to Cart" button click
   * @param {Event} e - Click event
   */
  function handleAddToCart(e) {
    e.preventDefault();

    const button = e.currentTarget;
    const product = button.dataset.product;
    const priceCents = parseInt(button.dataset.priceCents, 10);
    const priceId = button.dataset.stripePriceId;

    if (!product || isNaN(priceCents)) {
      console.error("Invalid product data on Add to Cart button");
      return;
    }

    // Check max quantity before adding
    const currentCount = CookieCart.getCartCount();
    const maxQuantity = getMaxOrderQuantity();

    if (currentCount >= maxQuantity) {
      showMaxOrderModal();
      return;
    }

    // Add to cart
    CookieCart.addToCart(product, priceCents, 1, priceId);

    // Show feedback
    showAddedToast(product);

    // Animate button
    animateButton(button);
  }

  /**
   * Create the toast notification container
   */
  function createToastContainer() {
    if (document.getElementById(TOAST_CONTAINER_ID)) return;

    const container = document.createElement("div");
    container.id = TOAST_CONTAINER_ID;
    container.className = "cart-toast-container";
    document.body.appendChild(container);
  }

  /**
   * Create the max order modal (for non-checkout pages)
   */
  function createMaxOrderModal() {
    if (document.getElementById(MAX_ORDER_MODAL_ID)) return;

    const maxQty = getMaxOrderQuantity();
    const email =
      (window.CART_CONFIG && window.CART_CONFIG.contactEmail) ||
      (window.CHECKOUT_CONFIG && window.CHECKOUT_CONFIG.contactEmail) ||
      "";

    const modal = document.createElement("div");
    modal.id = MAX_ORDER_MODAL_ID;
    modal.className = "modal-overlay";
    modal.style.display = "none";
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-icon">🍪</div>
                <h2 class="modal-title">Large Order Request</h2>
                <p class="modal-message">For orders of more than ${maxQty} cookies, please contact us${email ? " at " + email : ""} to discuss your order.</p>
                <div class="modal-actions">
                    ${email ? `<a href="mailto:${email}?subject=Large Cookie Order Inquiry" class="btn btn-modal-primary">Contact Us</a>` : ""}
                    <button type="button" class="btn btn-modal-secondary" data-close-modal>Go Back</button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Attach close handlers
    const closeBtn = modal.querySelector("[data-close-modal]");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeMaxOrderModal);
    }
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeMaxOrderModal();
      }
    });
  }

  /**
   * Show max order modal
   */
  function showMaxOrderModal() {
    const modal = document.getElementById(MAX_ORDER_MODAL_ID);
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }

  /**
   * Close max order modal
   */
  function closeMaxOrderModal() {
    const modal = document.getElementById(MAX_ORDER_MODAL_ID);
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  /**
   * Show a toast notification when item is added
   * @param {string} product - Product name
   */
  function showAddedToast(product) {
    const container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.innerHTML = `
            <span class="cart-toast-icon">🍪</span>
            <span class="cart-toast-message"><strong>${escapeHtml(product)}</strong> added to cart!</span>
            <a href="/checkout/" class="cart-toast-link">View Cart</a>
        `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(function () {
      toast.classList.add("show");
    });

    // Remove after delay
    setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Animate the Add to Cart button on click
   * @param {HTMLElement} button - The button element
   */
  function animateButton(button) {
    const originalText = button.textContent;

    button.classList.add("added");
    button.textContent = "Added!";
    button.disabled = true;

    setTimeout(function () {
      button.classList.remove("added");
      button.textContent = originalText;
      button.disabled = false;
    }, 1000);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Re-attach listeners (useful after dynamic content load)
   */
  function refresh() {
    attachAddToCartListeners();
    updateCartBadge();
  }

  // Public API
  return {
    init: init,
    updateCartBadge: updateCartBadge,
    refresh: refresh,
    showAddedToast: showAddedToast,
    showMaxOrderModal: showMaxOrderModal,
    closeMaxOrderModal: closeMaxOrderModal,
    getMaxOrderQuantity: getMaxOrderQuantity,
  };
})();

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", CartUI.init);
} else {
  CartUI.init();
}

// Make available globally
window.CartUI = CartUI;
