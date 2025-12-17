/**
 * Cookie Isle - Checkout Page Module
 * Handles cart display, pickup/delivery toggle, quantity controls,
 * address validation, ZIP code validation, and order submission
 */

(function () {
  "use strict";

  // Configuration from Hugo (set in template)
  const CONFIG = window.CHECKOUT_CONFIG || {
    workerUrl: "",
    allowedZips: ["92118"],
    maxOrderQuantity: 50,
    maxOrderMessage: "For orders of more than 50 cookies, please contact us.",
    contactEmail: "",
    pickupEnabled: true,
    deliveryEnabled: true,
    calendarSlotsWorkerUrl: "",
    dropWindowCookieLimit: 200,
    dropWindowSoldOutMessage: "Sold out for this date",
    taxRate: 0.0775,
    smallOrderFeeThreshold: 10,
    promoCodes: {},
  };

  // DOM Elements
  const elements = {
    cartEmpty: null,
    cartContents: null,
    cartItemsList: null,
    cartTotal: null,
    cartSubtotal: null,
    cartTax: null,
    cartTax: null,
    cartDiscountRow: null,
    cartDiscount: null,
    cartFeeRow: null,
    cartFee: null,
    feeNote: null,
    promoInput: null,
    promoBtn: null,
    promoMessage: null,
    cartCount: null,
    cartFee: null,
    feeNote: null,
    cartCount: null,
    checkoutForm: null,
    checkoutSubmitBtn: null,
    checkoutSuccess: null,
    checkoutError: null,
    orderSummary: null,
    formErrors: null,
    retryBtn: null,
    fulfillmentToggle: null,
    fulfillmentOptions: null,
    fulfillmentTypeInput: null,
    deliveryAddressSection: null,
    zipWarning: null,
    maxOrderWarning: null,
    maxOrderModal: null,
    maxOrderModalClose: null,
    zipErrorModal: null,
    zipModalPickup: null,
    zipModalClose: null,
  };

  // Form field IDs for customer info
  const CUSTOMER_FIELDS = ["first_name", "last_name", "email", "phone"];

  // Address field IDs (for delivery)
  const ADDRESS_FIELDS = ["street_address", "city", "state", "zip_code"];

  // Email regex pattern
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ZIP code regex (5 digits or 5+4 format)
  const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

  // Current fulfillment type
  let currentFulfillment = CONFIG.pickupEnabled ? "pickup" : "delivery";

  // Track if ZIP is valid for delivery
  let isZipValid = true;

  // Active promo code
  let activePromo = null;

  /**
   * Initialize the checkout page
   */
  function init() {
    cacheElements();
    renderCart();
    attachEventListeners();
    checkMaxQuantityWarning();

    // Initialize fulfillment slots if available
    if (window.FulfillmentSlots) {
      FulfillmentSlots.init(CONFIG, currentFulfillment);
    }
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    elements.cartEmpty = document.getElementById("cart-empty");
    elements.cartContents = document.getElementById("cart-contents");
    elements.cartItemsList = document.getElementById("cart-items-list");
    elements.cartTotal = document.getElementById("cart-total");
    elements.cartSubtotal = document.getElementById("cart-subtotal");
    elements.cartTax = document.getElementById("cart-tax");
    elements.cartDiscountRow = document.getElementById("cart-discount-row");
    elements.cartDiscount = document.getElementById("cart-discount");
    elements.cartFeeRow = document.getElementById("cart-fee-row");
    elements.cartFee = document.getElementById("cart-fee");
    elements.feeNote = document.getElementById("fee-note");
    elements.promoInput = document.getElementById("promo-input");
    elements.promoBtn = document.getElementById("apply-promo-btn");
    elements.promoMessage = document.getElementById("promo-message");
    elements.cartCount = document.getElementById("cart-count");
    elements.checkoutForm = document.getElementById("checkout-form");
    elements.checkoutSubmitBtn = document.getElementById("checkout-submit-btn");
    elements.checkoutSuccess = document.getElementById("checkout-success");
    elements.checkoutError = document.getElementById("checkout-error");
    elements.orderSummary = document.getElementById("order-summary");
    elements.formErrors = document.getElementById("form-errors");
    elements.retryBtn = document.getElementById("checkout-retry");
    elements.fulfillmentToggle = document.querySelector(".fulfillment-toggle");
    elements.fulfillmentOptions = document.querySelectorAll(
      ".fulfillment-option",
    );
    elements.fulfillmentTypeInput = document.getElementById("fulfillment_type");
    elements.deliveryAddressSection = document.getElementById(
      "delivery-address-section",
    );
    elements.zipWarning = document.getElementById("zip-warning");
    elements.maxOrderWarning = document.getElementById("max-order-warning");
    elements.maxOrderModal = document.getElementById("max-order-modal");
    elements.maxOrderModalClose = document.getElementById(
      "max-order-modal-close",
    );
    elements.zipErrorModal = document.getElementById("zip-error-modal");
    elements.zipModalPickup = document.getElementById("zip-modal-pickup");
    elements.zipModalClose = document.getElementById("zip-modal-close");
  }

  /**
   * Attach all event listeners
   */
  function attachEventListeners() {
    // Form submission
    if (elements.checkoutForm) {
      elements.checkoutForm.addEventListener("submit", handleSubmit);
    }

    // Retry button
    if (elements.retryBtn) {
      elements.retryBtn.addEventListener("click", handleRetry);
    }

    // Fulfillment toggle
    if (elements.fulfillmentOptions) {
      elements.fulfillmentOptions.forEach(function (option) {
        option.addEventListener("click", handleFulfillmentChange);
      });
    }

    // ZIP code validation on blur
    const zipInput = document.getElementById("zip_code");
    if (zipInput) {
      zipInput.addEventListener("blur", validateZipCode);
      zipInput.addEventListener("input", clearZipWarning);
    }

    // Modal close buttons
    if (elements.maxOrderModalClose) {
      elements.maxOrderModalClose.addEventListener("click", closeMaxOrderModal);
    }
    if (elements.zipModalPickup) {
      elements.zipModalPickup.addEventListener("click", switchToPickup);
    }
    if (elements.zipModalClose) {
      elements.zipModalClose.addEventListener("click", closeZipModal);
    }

    // Close modals on overlay click
    if (elements.maxOrderModal) {
      elements.maxOrderModal.addEventListener("click", function (e) {
        if (e.target === elements.maxOrderModal) {
          closeMaxOrderModal();
        }
      });
    }
    if (elements.zipErrorModal) {
      elements.zipErrorModal.addEventListener("click", function (e) {
        if (e.target === elements.zipErrorModal) {
          closeZipModal();
        }
      });
    }

    // Cart updates
    window.addEventListener("cartUpdated", function () {
      renderCart();
      checkMaxQuantityWarning();
    });

    // Promo code button
    if (elements.promoBtn) {
      elements.promoBtn.addEventListener("click", handleApplyPromo);
    }
  }

  /**
   * Handle fulfillment type change (pickup/delivery)
   */
  function handleFulfillmentChange(e) {
    const button = e.currentTarget;
    const newFulfillment = button.dataset.fulfillment;

    if (newFulfillment === currentFulfillment) return;

    // Update active states
    elements.fulfillmentOptions.forEach(function (opt) {
      opt.classList.remove("active");
      opt.setAttribute("aria-pressed", "false");
    });
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");

    // Update hidden input
    if (elements.fulfillmentTypeInput) {
      elements.fulfillmentTypeInput.value = newFulfillment;
    }

    currentFulfillment = newFulfillment;

    // Show/hide delivery address section
    if (elements.deliveryAddressSection) {
      if (newFulfillment === "delivery") {
        elements.deliveryAddressSection.style.display = "block";
        // Animate in
        elements.deliveryAddressSection.classList.add("show");
      } else {
        elements.deliveryAddressSection.classList.remove("show");
        elements.deliveryAddressSection.style.display = "none";
        // Clear any ZIP warnings
        clearZipWarning();
        isZipValid = true;
      }
    }

    // Update fulfillment slots to show relevant times
    if (window.FulfillmentSlots) {
      FulfillmentSlots.setFulfillmentType(newFulfillment);
    }
  }

  /**
   * Handle Promo Code Application
   */
  function handleApplyPromo() {
    if (!elements.promoInput) return;

    const rawCode = elements.promoInput.value.trim();
    const lookupCode = rawCode.toLowerCase();
    const messageEl = elements.promoMessage;

    if (!rawCode) {
        if (messageEl) {
            messageEl.textContent = "Please enter a code.";
            messageEl.style.display = "block";
            messageEl.style.color = "#d63384";
        }
        return;
    }

    // Lookup using lowercase code (Hugo params keys are lowercased)
    if (CONFIG.promoCodes && CONFIG.promoCodes[lookupCode]) {
        // Valid code
        const promoData = CONFIG.promoCodes[lookupCode];
        
        activePromo = {
            code: rawCode.toUpperCase(), // Store nicely formatted code
            type: promoData.type,
            value: Number(promoData.value) // Ensure number
        };
        
        if (messageEl) {
            messageEl.textContent = `Code ${activePromo.code} applied!`;
            messageEl.style.display = "block";
            messageEl.style.color = "#2A9D8F";
        }
        
        updateCartTotal();
    } else {
        // Invalid code
        activePromo = null;
        if (messageEl) {
            messageEl.textContent = "Invalid promo code.";
            messageEl.style.display = "block";
            messageEl.style.color = "#d63384";
        }
        updateCartTotal();
    }
  }

  /**
   * Validate ZIP code against allowed list
   */
  function validateZipCode() {
    const zipInput = document.getElementById("zip_code");
    if (!zipInput) return true;

    const zipValue = zipInput.value.trim();

    // Skip if empty (will be caught by required validation)
    if (!zipValue) {
      isZipValid = true;
      return true;
    }

    // Validate format first
    if (!ZIP_REGEX.test(zipValue)) {
      showFieldError("zip_code", "Please enter a valid ZIP code");
      isZipValid = false;
      return false;
    }

    // Extract 5-digit ZIP (ignore +4)
    const zip5 = zipValue.substring(0, 5);

    // Check against allowed list
    if (!CONFIG.allowedZips.includes(zip5)) {
      isZipValid = false;
      showZipWarning();
      return false;
    }

    isZipValid = true;
    hideZipWarning();
    return true;
  }

  /**
   * Show ZIP code warning
   */
  function showZipWarning() {
    if (elements.zipWarning) {
      elements.zipWarning.style.display = "block";
    }
  }

  /**
   * Hide ZIP code warning
   */
  function hideZipWarning() {
    if (elements.zipWarning) {
      elements.zipWarning.style.display = "none";
    }
  }

  /**
   * Clear ZIP warning on input
   */
  function clearZipWarning() {
    hideZipWarning();
    clearFieldError("zip_code");
  }

  /**
   * Show ZIP error modal
   */
  function showZipErrorModal() {
    if (elements.zipErrorModal) {
      elements.zipErrorModal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }

  /**
   * Close ZIP error modal
   */
  function closeZipModal() {
    if (elements.zipErrorModal) {
      elements.zipErrorModal.style.display = "none";
      document.body.style.overflow = "";
    }
    // Focus the ZIP input
    const zipInput = document.getElementById("zip_code");
    if (zipInput) {
      zipInput.focus();
    }
  }

  /**
   * Switch to pickup from ZIP modal
   */
  function switchToPickup() {
    closeZipModal();

    // Find and click the pickup option
    const pickupOption = document.querySelector('[data-fulfillment="pickup"]');
    if (pickupOption) {
      pickupOption.click();
    }
  }

  /**
   * Check if cart exceeds max quantity and show warning
   */
  function checkMaxQuantityWarning() {
    if (!window.CookieCart) return;

    const count = CookieCart.getCartCount();
    const maxQty = CONFIG.maxOrderQuantity;

    if (count > maxQty && elements.maxOrderWarning) {
      const message =
        CONFIG.maxOrderMessage ||
        `For orders of more than ${maxQty} cookies, please contact us at ${CONFIG.contactEmail} to discuss.`;

      const messageEl =
        elements.maxOrderWarning.querySelector(".warning-message");
      if (messageEl) {
        messageEl.textContent = message;
      }
      elements.maxOrderWarning.style.display = "flex";
    } else if (elements.maxOrderWarning) {
      elements.maxOrderWarning.style.display = "none";
    }

    // Update button states based on max quantity
    updateQuantityButtonStates();
  }

  /**
   * Update quantity button states (disable + if at max)
   */
  function updateQuantityButtonStates() {
    if (!window.CookieCart) return;

    const count = CookieCart.getCartCount();
    const maxQty = CONFIG.maxOrderQuantity;
    const atMax = count >= maxQty;

    // Disable all + buttons if at max
    const increaseBtns = document.querySelectorAll(".qty-increase");
    increaseBtns.forEach(function (btn) {
      btn.disabled = atMax;
      if (atMax) {
        btn.setAttribute("title", `Maximum ${maxQty} cookies per order`);
      } else {
        btn.removeAttribute("title");
      }
    });
  }

  /**
   * Show max order modal
   */
  function showMaxOrderModal() {
    if (elements.maxOrderModal) {
      elements.maxOrderModal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }

  /**
   * Close max order modal
   */
  function closeMaxOrderModal() {
    if (elements.maxOrderModal) {
      elements.maxOrderModal.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  /**
   * Render the cart contents
   */
  function renderCart() {
    if (!window.CookieCart) {
      console.error("CookieCart not loaded");
      return;
    }

    const cart = CookieCart.getCart();

    if (cart.length === 0) {
      showEmptyState();
    } else {
      showCartContents(cart);
    }
  }

  /**
   * Show empty cart state
   */
  function showEmptyState() {
    if (elements.cartEmpty) elements.cartEmpty.style.display = "block";
    if (elements.cartContents) elements.cartContents.style.display = "none";
    if (elements.checkoutSuccess)
      elements.checkoutSuccess.style.display = "none";
    if (elements.checkoutError) elements.checkoutError.style.display = "none";
  }

  /**
   * Show cart contents
   */
  function showCartContents(cart) {
    if (elements.cartEmpty) elements.cartEmpty.style.display = "none";
    if (elements.cartContents) elements.cartContents.style.display = "block";
    if (elements.checkoutSuccess)
      elements.checkoutSuccess.style.display = "none";
    if (elements.checkoutError) elements.checkoutError.style.display = "none";

    renderCartItems(cart);
    updateCartTotal();
    updateCartCount();
  }

  /**
   * Render individual cart items
   */
  function renderCartItems(cart) {
    if (!elements.cartItemsList) return;

    const count = CookieCart.getCartCount();
    const atMax = count >= CONFIG.maxOrderQuantity;

    elements.cartItemsList.innerHTML = cart
      .map(function (item) {
        const itemTotal = item.price_cents * item.qty;
        return `
                <div class="cart-item" data-product="${escapeHtml(item.product)}">
                    <div class="cart-item-product">
                        <span class="cart-item-name">${escapeHtml(item.product)}</span>
                    </div>
                    <div class="cart-item-price">
                        ${CookieCart.formatPrice(item.price_cents)}
                    </div>
                    <div class="cart-item-quantity">
                        <button type="button" class="qty-btn qty-decrease" data-product="${escapeHtml(item.product)}" aria-label="Decrease quantity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <span class="qty-value">${item.qty}</span>
                        <button type="button" class="qty-btn qty-increase" data-product="${escapeHtml(item.product)}" aria-label="Increase quantity" ${atMax ? 'disabled title="Maximum ' + CONFIG.maxOrderQuantity + ' cookies per order"' : ""}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="cart-item-total">
                        ${CookieCart.formatPrice(itemTotal)}
                    </div>
                    <div class="cart-item-remove">
                        <button type="button" class="remove-btn" data-product="${escapeHtml(item.product)}" aria-label="Remove ${escapeHtml(item.product)} from cart">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");

    attachQuantityListeners();
  }

  /**
   * Attach event listeners to quantity and remove buttons
   */
  function attachQuantityListeners() {
    // Decrease buttons
    const decreaseBtns =
      elements.cartItemsList.querySelectorAll(".qty-decrease");
    decreaseBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const product = this.dataset.product;
        CookieCart.decrementQuantity(product);
        renderCart();
        checkMaxQuantityWarning();
      });
    });

    // Increase buttons
    const increaseBtns =
      elements.cartItemsList.querySelectorAll(".qty-increase");
    increaseBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        // Check if we're at max
        const count = CookieCart.getCartCount();
        if (count >= CONFIG.maxOrderQuantity) {
          showMaxOrderModal();
          return;
        }

        const product = this.dataset.product;
        CookieCart.incrementQuantity(product);
        renderCart();
        checkMaxQuantityWarning();
      });
    });

    // Remove buttons
    const removeBtns = elements.cartItemsList.querySelectorAll(".remove-btn");
    removeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const product = this.dataset.product;
        CookieCart.removeFromCart(product);
        renderCart();
        checkMaxQuantityWarning();
      });
    });
  }

  function updateCartTotal() {
    const subtotalCents = CookieCart.getCartTotalCents();
    const subtotal = subtotalCents / 100;

    // Calculate Discount
    let discount = 0;
    if (activePromo && subtotal > 0) {
        if (activePromo.type === 'flat') {
            discount = activePromo.value;
        } else if (activePromo.type === 'percent') {
            discount = subtotal * (activePromo.value / 100);
        }
        // Cap discount at subtotal
        if (discount > subtotal) discount = subtotal;
    }

    const taxableSubtotal = Math.max(0, subtotal - discount);
    const tax = taxableSubtotal * CONFIG.taxRate;
    
    let fee = 0;
    // Apply fee if taxable subtotal is greater than 0 but less than threshold
    if (taxableSubtotal > 0 && taxableSubtotal < CONFIG.smallOrderFeeThreshold) {
        // Fee is 3% of (taxableSubtotal + tax) + $0.30
        fee = ((taxableSubtotal + tax) * 0.03) + 0.30;
    }

    const total = taxableSubtotal + tax + fee;

    // Format currency helper
    const fmt = (n) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(n);

    if (elements.cartSubtotal) {
      elements.cartSubtotal.textContent = fmt(subtotal);
    }
    
    // Handle Discount Display
    if (elements.cartDiscountRow) {
        if (discount > 0) {
            elements.cartDiscountRow.style.display = "flex";
            if (elements.cartDiscount) elements.cartDiscount.textContent = "-" + fmt(discount);
        } else {
            elements.cartDiscountRow.style.display = "none";
        }
    }

    if (elements.cartTax) {
      elements.cartTax.textContent = fmt(tax);
    }
    
    // Handle Fee Display
    if (fee > 0) {
        if (elements.cartFeeRow) elements.cartFeeRow.style.display = "flex";
        if (elements.cartFee) elements.cartFee.textContent = fmt(fee);
        if (elements.feeNote) elements.feeNote.style.display = "block";
    } else {
        if (elements.cartFeeRow) elements.cartFeeRow.style.display = "none";
        if (elements.feeNote) elements.feeNote.style.display = "none";
    }

    if (elements.cartTotal) {
      elements.cartTotal.textContent = fmt(total);
    }
  }

  /**
   * Update the cart count display
   */
  function updateCartCount() {
    if (elements.cartCount) {
      elements.cartCount.textContent = CookieCart.getCartCount();
    }
  }

  /**
   * Handle form submission
   */
  function handleSubmit(e) {
    e.preventDefault();

    // Clear previous errors
    clearFormErrors();

    // Validate cart is not empty
    if (CookieCart.isEmpty()) {
      showFormError("Your cart is empty. Please add some cookies first!");
      return;
    }

    // Check max quantity
    const count = CookieCart.getCartCount();
    if (count > CONFIG.maxOrderQuantity) {
      showMaxOrderModal();
      return;
    }

    // Validate customer fields
    const customerValidation = validateCustomerFields();
    if (!customerValidation.valid) {
      displayFieldErrors(customerValidation.errors);
      return;
    }

    // Validate delivery address if delivery is selected
    if (currentFulfillment === "delivery") {
      const addressValidation = validateAddressFields();
      if (!addressValidation.valid) {
        displayFieldErrors(addressValidation.errors);
        return;
      }

      // Validate ZIP code
      if (!validateZipCode()) {
        showZipErrorModal();
        return;
      }
    }

    // Validate fulfillment slot selection
    if (window.FulfillmentSlots && FulfillmentSlots.isEnabled()) {
      if (!FulfillmentSlots.validate()) {
        return;
      }
    }

    // Disable submit button
    setSubmitLoading(true);

    // Build order payload
    const orderPayload = buildOrderPayload();

    // Submit order
    submitOrder(orderPayload);
  }

  /**
   * Validate customer form fields
   */
  function validateCustomerFields() {
    const errors = {};

    // First name
    const firstName = document.getElementById("first_name").value.trim();
    if (!firstName) {
      errors.first_name = "First name is required";
    }

    // Last name
    const lastName = document.getElementById("last_name").value.trim();
    if (!lastName) {
      errors.last_name = "Last name is required";
    }

    // Email
    const email = document.getElementById("email").value.trim();
    if (!email) {
      errors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone
    const phone = document.getElementById("phone").value.trim();
    if (!phone) {
      errors.phone = "Phone number is required";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
    };
  }

  /**
   * Validate address fields (for delivery)
   */
  function validateAddressFields() {
    const errors = {};

    // Street address
    const streetAddress = document
      .getElementById("street_address")
      .value.trim();
    if (!streetAddress) {
      errors.street_address = "Street address is required";
    }

    // City
    const city = document.getElementById("city").value.trim();
    if (!city) {
      errors.city = "City is required";
    }

    // State
    const state = document.getElementById("state").value.trim();
    if (!state) {
      errors.state = "State is required";
    }

    // ZIP code
    const zipCode = document.getElementById("zip_code").value.trim();
    if (!zipCode) {
      errors.zip_code = "ZIP code is required";
    } else if (!ZIP_REGEX.test(zipCode)) {
      errors.zip_code = "Please enter a valid ZIP code";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
    };
  }

  /**
   * Display field-specific errors
   */
  function displayFieldErrors(errors) {
    for (const field in errors) {
      showFieldError(field, errors[field]);
    }

    // Focus first error field
    const firstErrorField = Object.keys(errors)[0];
    const firstInput = document.getElementById(firstErrorField);
    if (firstInput) {
      firstInput.focus();
    }
  }

  /**
   * Show error for a specific field
   */
  function showFieldError(field, message) {
    const errorEl = document.getElementById(field + "-error");
    const inputEl = document.getElementById(field);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    }

    if (inputEl) {
      inputEl.classList.add("input-error");
      inputEl.setAttribute("aria-invalid", "true");
    }
  }

  /**
   * Clear error for a specific field
   */
  function clearFieldError(field) {
    const errorEl = document.getElementById(field + "-error");
    const inputEl = document.getElementById(field);

    if (errorEl) {
      errorEl.textContent = "";
      errorEl.style.display = "none";
    }

    if (inputEl) {
      inputEl.classList.remove("input-error");
      inputEl.removeAttribute("aria-invalid");
    }
  }

  /**
   * Clear all form errors
   */
  function clearFormErrors() {
    const allFields = [...CUSTOMER_FIELDS, ...ADDRESS_FIELDS, "apt_unit"];

    allFields.forEach(function (field) {
      clearFieldError(field);
    });

    if (elements.formErrors) {
      elements.formErrors.style.display = "none";
      elements.formErrors.textContent = "";
    }
  }

  /**
   * Show a general form error
   */
  function showFormError(message) {
    if (elements.formErrors) {
      elements.formErrors.textContent = message;
      elements.formErrors.style.display = "block";
    }
  }

  /**
   * Set submit button loading state
   */
  function setSubmitLoading(loading) {
    if (elements.checkoutSubmitBtn) {
      elements.checkoutSubmitBtn.disabled = loading;
      elements.checkoutSubmitBtn.textContent = loading
        ? "Processing..."
        : "Place Order";
    }
  }

  /**
   * Build order payload for submission
   */
  function buildOrderPayload() {
    const cart = CookieCart.getCart();
    const order = cart.map(function (item) {
      return {
        product: item.product,
        qty: item.qty,
        price: item.price_cents / 100,
      };
    });

    // Calculate amounts including fee
    const subtotal = CookieCart.getCartTotalCents() / 100;
    
    // Re-calculate Logic for Payload (Mirror updateCartTotal)
    let discount = 0;
    if (activePromo && subtotal > 0) {
        if (activePromo.type === 'flat') {
            discount = activePromo.value;
        } else if (activePromo.type === 'percent') {
            discount = subtotal * (activePromo.value / 100);
        }
        if (discount > subtotal) discount = subtotal;
    }
    
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const tax = taxableSubtotal * CONFIG.taxRate;
    
    let fee = 0;
    if (taxableSubtotal > 0 && taxableSubtotal < CONFIG.smallOrderFeeThreshold) {
        fee = ((taxableSubtotal + tax) * 0.03) + 0.30;
    }
    const total = taxableSubtotal + tax + fee;

    // Create a FormData object from the checkout form
    const checkoutForm = document.getElementById("checkout-form");
    const formData = new FormData(checkoutForm);

    const payload = {
      customer: {
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
      },
      fulfillment: {
        type: currentFulfillment,
      },
      order: order,
      subtotal: subtotal,
      promo_code: activePromo ? activePromo.code : null,
      discount: discount,
      tax: tax,
      fee: fee,
      total: total,
      submitted_at: new Date().toISOString(),
    };

    // Add delivery address if delivery is selected
    if (currentFulfillment === "delivery") {
      payload.fulfillment.address = {
        street: document.getElementById("street_address").value.trim(),
        apt_unit: document.getElementById("apt_unit").value.trim(),
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value.trim(),
        zip: document.getElementById("zip_code").value.trim(),
      };
    }

    // Add fulfillment slot if selected
    if (window.FulfillmentSlots && FulfillmentSlots.isEnabled()) {
      const selectedSlot = FulfillmentSlots.getSelectedSlot();
      if (selectedSlot) {
        payload.fulfillment.slot = {
          id: selectedSlot.id,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        };
      }
    }

    return payload;
  }

  /**
   * Submit the order
   */
  function submitOrder(orderPayload) {
    // Log the order payload (for development/testing)
    console.log("Order Payload:", JSON.stringify(orderPayload, null, 2));

    const workerUrl = CONFIG.workerUrl;

    if (workerUrl) {
      // Real submission to Cloudflare Worker
      fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(function (data) {
          if (data.success) {
            handleOrderSuccess(orderPayload);
          } else {
            handleOrderError(data.error || "Order submission failed");
          }
        })
        .catch(function (error) {
          console.error("Order submission error:", error);
          handleOrderError(error.message);
        });
    } else {
      // Simulate success for development (no worker URL configured)
      console.log("No worker URL configured - simulating successful order");
      setTimeout(function () {
        handleOrderSuccess(orderPayload);
      }, 1000);
    }
  }

  /**
   * Handle successful order submission
   */
  function handleOrderSuccess(orderPayload) {
    setSubmitLoading(false);

    // Hide cart contents
    if (elements.cartContents) elements.cartContents.style.display = "none";
    if (elements.cartEmpty) elements.cartEmpty.style.display = "none";
    if (elements.checkoutError) elements.checkoutError.style.display = "none";

    // Show success state
    if (elements.checkoutSuccess) {
      elements.checkoutSuccess.style.display = "block";
    }

    // Render order summary
    renderOrderSummary(orderPayload);

    // Clear the cart
    CookieCart.clearCart();

    // Record order for capacity tracking (localStorage MVP)
    if (window.FulfillmentSlots && FulfillmentSlots.isEnabled()) {
      const slot = orderPayload.fulfillment.slot;
      if (slot && slot.date) {
        const cookieCount = orderPayload.order.reduce(function (sum, item) {
          return sum + item.qty;
        }, 0);
        FulfillmentSlots.recordOrder(slot.date, cookieCount);
      }
    }

    // Update cart badge
    if (window.CartUI) {
      CartUI.updateCartBadge();
    }
  }

  /**
   * Render the order summary after successful submission
   */
  function renderOrderSummary(orderPayload) {
    if (!elements.orderSummary) return;

    const itemsHtml = orderPayload.order
      .map(function (item) {
        return `
                <div class="order-summary-item">
                    <span class="order-summary-item-name">${escapeHtml(item.product)} × ${item.qty}</span>
                    <span class="order-summary-item-price">$${(item.price * item.qty).toFixed(2)}</span>
                </div>
            `;
      })
      .join("");

    let fulfillmentHtml = "";
    if (orderPayload.fulfillment.type === "delivery") {
      const addr = orderPayload.fulfillment.address;
      fulfillmentHtml = `
                <p><strong>Delivery to:</strong></p>
                <p>${escapeHtml(addr.street)}${addr.apt_unit ? ", " + escapeHtml(addr.apt_unit) : ""}<br>
                ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} ${escapeHtml(addr.zip)}</p>
            `;
    } else {
      fulfillmentHtml = `<p><strong>Pickup</strong></p>`;
    }

    elements.orderSummary.innerHTML = `
            <div class="order-summary-details">
                <p><strong>Name:</strong> ${escapeHtml(orderPayload.customer.first_name)} ${escapeHtml(orderPayload.customer.last_name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(orderPayload.customer.email)}</p>
                <p><strong>Phone:</strong> ${escapeHtml(orderPayload.customer.phone)}</p>
                ${fulfillmentHtml}
            </div>
            <div class="order-summary-items">
                <h3>Order Items</h3>
                ${itemsHtml}
                <div class="order-summary-total">
                    <strong>Total:</strong> $${orderPayload.total.toFixed(2)}
                </div>
            </div>
        `;
  }

  /**
   * Handle order submission error
   */
  function handleOrderError(errorMessage) {
    setSubmitLoading(false);

    console.error("Order error:", errorMessage);

    // Hide other states
    if (elements.cartContents) elements.cartContents.style.display = "none";
    if (elements.cartEmpty) elements.cartEmpty.style.display = "none";
    if (elements.checkoutSuccess)
      elements.checkoutSuccess.style.display = "none";

    // Show error state
    if (elements.checkoutError) {
      elements.checkoutError.style.display = "block";
    }
  }

  /**
   * Handle retry button click
   */
  function handleRetry() {
    renderCart();
    checkMaxQuantityWarning();
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
