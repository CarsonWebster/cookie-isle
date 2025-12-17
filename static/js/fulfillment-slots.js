/**
 * Cookie Isle - Fulfillment Slots Module
 * Handles fetching, rendering, and selection of calendar-based fulfillment time slots
 */

const FulfillmentSlots = (function () {
    "use strict";

    // Configuration (set from CHECKOUT_CONFIG)
    let config = {
        workerUrl: "",
        cookieLimit: 200,
        soldOutMessage: "Sold out for this date",
    };

    // State
    let allSlots = [];
    let selectedSlot = null;
    let currentType = "pickup";

    // DOM Elements
    const elIds = {
        slotsSection: "fulfillment-slots-section",
        loading: "slots-loading",
        error: "slots-error",
        empty: "slots-empty",
        container: "slots-container",
        retryBtn: "slots-retry-btn",
        slotIdInput: "fulfillment_slot_id",
        slotDateInput: "fulfillment_slot_date",
        slotStartInput: "fulfillment_slot_start",
        slotEndInput: "fulfillment_slot_end",
        slotError: "fulfillment_slot-error",
    };

    // Local storage key for order tracking (MVP capacity)
    const ORDER_STORAGE_KEY = "cookieisle_order_counts";

    /**
     * Initialize the slots module
     * @param {Object} checkoutConfig - Configuration from CHECKOUT_CONFIG
     * @param {string} initialType - Initial fulfillment type ("pickup" or "delivery")
     */
    function init(checkoutConfig, initialType) {
        config.workerUrl = checkoutConfig.calendarSlotsWorkerUrl || "";
        config.cookieLimit = checkoutConfig.dropWindowCookieLimit || 200;
        config.soldOutMessage =
            checkoutConfig.dropWindowSoldOutMessage || "Sold out for this date";
        currentType = initialType || "pickup";

        // Only initialize if worker URL is configured
        if (!config.workerUrl) {
            console.log("FulfillmentSlots: No worker URL configured");
            return;
        }

        attachEventListeners();
        fetchSlots();
    }

    /**
     * Attach event listeners
     */
    function attachEventListeners() {
        const retryBtn = document.getElementById(elIds.retryBtn);
        if (retryBtn) {
            retryBtn.addEventListener("click", fetchSlots);
        }
    }

    /**
     * Fetch slots from the calendar worker
     */
    async function fetchSlots() {
        if (!config.workerUrl) return;

        showLoading();

        try {
            const response = await fetch(config.workerUrl);
            const data = await response.json();

            if (data.success && data.slots && data.slots.length > 0) {
                allSlots = data.slots;
                renderSlots();
            } else if (data.slots && data.slots.length === 0) {
                showEmpty();
            } else {
                throw new Error(data.error || "Failed to load slots");
            }
        } catch (error) {
            console.error("Failed to fetch slots:", error);
            showError();
        }
    }

    /**
     * Show loading state
     */
    function showLoading() {
        setVisibility(elIds.loading, true);
        setVisibility(elIds.error, false);
        setVisibility(elIds.empty, false);
        setVisibility(elIds.container, false);
    }

    /**
     * Show error state
     */
    function showError() {
        setVisibility(elIds.loading, false);
        setVisibility(elIds.error, true);
        setVisibility(elIds.empty, false);
        setVisibility(elIds.container, false);
    }

    /**
     * Show empty state
     */
    function showEmpty() {
        setVisibility(elIds.loading, false);
        setVisibility(elIds.error, false);
        setVisibility(elIds.empty, true);
        setVisibility(elIds.container, false);
    }

    /**
     * Show slots container
     */
    function showContainer() {
        setVisibility(elIds.loading, false);
        setVisibility(elIds.error, false);
        setVisibility(elIds.empty, false);
        setVisibility(elIds.container, true);
    }

    /**
     * Helper to set element visibility
     */
    function setVisibility(id, visible) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = visible ? "" : "none";
        }
    }

    /**
     * Render slots filtered by current fulfillment type
     */
    function renderSlots() {
        const container = document.getElementById(elIds.container);
        if (!container) return;

        // Filter slots by current type
        const filteredSlots = allSlots.filter(function (slot) {
            return slot.type === currentType || slot.type === "both";
        });

        if (filteredSlots.length === 0) {
            showEmpty();
            return;
        }

        // Group slots by date
        const slotsByDate = groupSlotsByDate(filteredSlots);

        // Get order counts for capacity checking
        const orderCounts = getOrderCounts();

        // Build HTML
        let html = "";
        for (const date in slotsByDate) {
            const daySlots = slotsByDate[date];
            const firstSlot = daySlots[0];
            const dailyCount = orderCounts[date] || 0;
            const isSoldOut = dailyCount >= config.cookieLimit;

            html += renderDayGroup(date, firstSlot.dateFormatted, daySlots, isSoldOut);
        }

        container.innerHTML = html;
        showContainer();

        // Attach slot selection listeners
        attachSlotListeners();

        // Restore selection if valid
        restoreSelection();
    }

    /**
     * Group slots by LOCAL date (using startTimestamp)
     */
    function groupSlotsByDate(slots) {
        const groups = {};
        slots.forEach(function (slot) {
            // Use local date from the UTC timestamp
            const localDate = formatDateLocal(slot.startTimestamp);
            if (!groups[localDate]) {
                groups[localDate] = [];
            }
            groups[localDate].push(slot);
        });
        return groups;
    }

    /**
     * Render a day group with its slots
     */
    function renderDayGroup(date, dateFormatted, slots, isSoldOut) {
        let optionsHtml = "";

        slots.forEach(function (slot) {
            const slotType = slot.type === "both" ? currentType : slot.type;
            const soldOutClass = isSoldOut ? " sold-out" : "";

            // Format times in user's local timezone from UTC timestamps
            const localStartTime = formatTimeLocal(slot.startTimestamp);
            const localEndTime = formatTimeLocal(slot.endTimestamp);
            const localDate = formatDateLocal(slot.startTimestamp);

            optionsHtml += `
        <label class="slot-option${soldOutClass}">
          <input type="radio" 
                 name="fulfillment_slot" 
                 value="${escapeHtml(slot.id)}"
                 data-date="${escapeHtml(localDate)}"
                 data-start="${escapeHtml(localStartTime)}"
                 data-end="${escapeHtml(localEndTime)}"
                 data-start-timestamp="${escapeHtml(slot.startTimestamp)}"
                 data-end-timestamp="${escapeHtml(slot.endTimestamp)}"
                 ${isSoldOut ? "disabled" : ""}>
          <span class="slot-option-content">
            <span class="slot-time">${escapeHtml(localStartTime)} - ${escapeHtml(localEndTime)}</span>
            <span class="slot-type ${slotType}">${slotType}</span>
          </span>
        </label>
      `;
        });

        // Format the day header in local timezone too
        const headerDate = slots[0] ? formatDateHeaderLocal(slots[0].startTimestamp) : dateFormatted;

        return `
      <div class="slots-day-group" data-date="${escapeHtml(date)}">
        <h3 class="slots-day-header">${escapeHtml(headerDate)}</h3>
        <div class="slots-day-options">
          ${optionsHtml}
        </div>
        ${isSoldOut ? `<div class="slots-day-sold-out">${escapeHtml(config.soldOutMessage)}</div>` : ""}
      </div>
    `;
    }

    /**
     * Attach click listeners to slot radio buttons
     */
    function attachSlotListeners() {
        const radios = document.querySelectorAll('input[name="fulfillment_slot"]');
        radios.forEach(function (radio) {
            radio.addEventListener("change", handleSlotSelection);
        });
    }

    /**
     * Handle slot selection
     */
    function handleSlotSelection(e) {
        const radio = e.target;

        selectedSlot = {
            id: radio.value,
            date: radio.dataset.date,
            startTime: radio.dataset.start,
            endTime: radio.dataset.end,
            startTimestamp: radio.dataset.startTimestamp,
            endTimestamp: radio.dataset.endTimestamp,
        };

        // Update hidden inputs
        updateHiddenInputs();

        // Clear any slot error
        clearSlotError();
    }

    /**
     * Update hidden form inputs with selected slot data
     */
    function updateHiddenInputs() {
        if (!selectedSlot) return;

        const idInput = document.getElementById(elIds.slotIdInput);
        const dateInput = document.getElementById(elIds.slotDateInput);
        const startInput = document.getElementById(elIds.slotStartInput);
        const endInput = document.getElementById(elIds.slotEndInput);

        if (idInput) idInput.value = selectedSlot.id;
        if (dateInput) dateInput.value = selectedSlot.date;
        if (startInput) startInput.value = selectedSlot.startTimestamp;
        if (endInput) endInput.value = selectedSlot.endTimestamp;
    }

    /**
     * Restore previous selection if still valid
     */
    function restoreSelection() {
        if (!selectedSlot) return;

        const radio = document.querySelector(
            `input[name="fulfillment_slot"][value="${selectedSlot.id}"]`
        );
        if (radio && !radio.disabled) {
            radio.checked = true;
        } else {
            // Selection no longer valid
            selectedSlot = null;
            clearHiddenInputs();
        }
    }

    /**
     * Clear hidden inputs
     */
    function clearHiddenInputs() {
        const inputs = [
            elIds.slotIdInput,
            elIds.slotDateInput,
            elIds.slotStartInput,
            elIds.slotEndInput,
        ];
        inputs.forEach(function (id) {
            const input = document.getElementById(id);
            if (input) input.value = "";
        });
    }

    /**
     * Update the fulfillment type and re-render slots
     * @param {string} type - "pickup" or "delivery"
     */
    function setFulfillmentType(type) {
        if (type !== currentType) {
            currentType = type;
            selectedSlot = null;
            clearHiddenInputs();
            if (allSlots.length > 0) {
                renderSlots();
            }
        }
    }

    /**
     * Validate that a slot is selected
     * @returns {boolean} True if valid
     */
    function validate() {
        // If no worker URL, slots aren't required
        if (!config.workerUrl) return true;

        if (!selectedSlot) {
            showSlotError("Please select a pickup/delivery time");
            return false;
        }

        clearSlotError();
        return true;
    }

    /**
     * Show slot selection error
     */
    function showSlotError(message) {
        const errorEl = document.getElementById(elIds.slotError);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = "block";
        }
    }

    /**
     * Clear slot selection error
     */
    function clearSlotError() {
        const errorEl = document.getElementById(elIds.slotError);
        if (errorEl) {
            errorEl.textContent = "";
            errorEl.style.display = "none";
        }
    }

    /**
     * Get the selected slot data for order payload
     * @returns {Object|null} Selected slot data or null
     */
    function getSelectedSlot() {
        return selectedSlot;
    }

    /**
     * Record an order for capacity tracking (localStorage MVP)
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {number} cookieCount - Number of cookies ordered
     */
    function recordOrder(date, cookieCount) {
        const counts = getOrderCounts();
        counts[date] = (counts[date] || 0) + cookieCount;
        saveOrderCounts(counts);
    }

    /**
     * Get order counts from localStorage
     */
    function getOrderCounts() {
        try {
            const stored = localStorage.getItem(ORDER_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.warn("Failed to read order counts:", e);
            return {};
        }
    }

    /**
     * Save order counts to localStorage
     */
    function saveOrderCounts(counts) {
        try {
            localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(counts));
        } catch (e) {
            console.warn("Failed to save order counts:", e);
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format a UTC timestamp to local time (e.g., "9:00 AM")
     */
    function formatTimeLocal(isoTimestamp) {
        if (!isoTimestamp) return "";
        const date = new Date(isoTimestamp);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    /**
     * Format a UTC timestamp to local date (YYYY-MM-DD)
     */
    function formatDateLocal(isoTimestamp) {
        if (!isoTimestamp) return "";
        const date = new Date(isoTimestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    /**
     * Format a UTC timestamp to a display header (e.g., "Friday, December 19")
     */
    function formatDateHeaderLocal(isoTimestamp) {
        if (!isoTimestamp) return "";
        const date = new Date(isoTimestamp);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric"
        });
    }

    /**
     * Check if slots feature is enabled
     */
    function isEnabled() {
        return !!config.workerUrl;
    }

    // Public API
    return {
        init: init,
        setFulfillmentType: setFulfillmentType,
        validate: validate,
        getSelectedSlot: getSelectedSlot,
        recordOrder: recordOrder,
        isEnabled: isEnabled,
        refresh: fetchSlots,
    };
})();

// Make available globally
window.FulfillmentSlots = FulfillmentSlots;
