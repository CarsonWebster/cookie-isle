/**
 * Shared formatting utilities for dates, times, and display values
 * These functions are safe to use in both server and client code
 */

/**
 * Format ISO date string to readable format
 * Example: "2026-01-16T10:30:00.000Z" -> "Jan 16, 2026, 10:30 AM"
 */
export function formatSubscribedDate(dateStr: string | null): string {
	if (!dateStr) return 'Unknown';

	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	} catch {
		return 'Invalid Date';
	}
}

/**
 * Format time string (HH:MM) to readable format
 * Example: "15:30" -> "3:30 PM"
 */
export function formatTime(timeString: string | null): string {
	if (!timeString) return '';

	try {
		const parts = timeString.split(':');
		if (parts.length !== 2) {
			return timeString;
		}

		const hours = parseInt(parts[0], 10);
		const minutes = parseInt(parts[1], 10);

		// Check if valid time values
		if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			return timeString;
		}

		const date = new Date(2000, 0, 1, hours, minutes);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
	} catch {
		return timeString;
	}
}

/**
 * Formats a date string (YYYY-MM-DD) to a human-readable format
 * Example: "2026-01-16" -> "Friday, January 16, 2026"
 */
export function formatFulfillmentDate(dateStr: string | null): string {
	if (!dateStr) return '';
	const date = new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}

/**
 * Formats a time range string (e.g., "10:00-12:00") to human-readable format
 * Example: "10:00-12:00" -> "10:00 AM - 12:00 PM"
 */
export function formatFulfillmentTime(timeStr: string | null): string {
	if (!timeStr) return '';

	const [start, end] = timeStr.split('-');
	if (!start || !end) return timeStr;

	const formatTimeValue = (time: string): string => {
		const [hours, minutes] = time.split(':').map(Number);
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
	};

	return `${formatTimeValue(start)} - ${formatTimeValue(end)}`;
}

/**
 * Formats a fulfillment type for display
 * Example: "pickup" -> "Pickup"
 */
export function formatFulfillmentType(type: string | null): string {
	if (!type) return '';
	return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Format ISO datetime string to readable format
 * Example: "2026-01-16T15:30:00" -> "Jan 16, 2026 at 3:30 PM"
 */
export function formatDateTime(isoString: string | null): string {
	if (!isoString) return 'N/A';

	try {
		const date = new Date(isoString);
		// Check if date is valid
		if (isNaN(date.getTime())) {
			return 'Invalid Date';
		}
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	} catch {
		return 'Invalid Date';
	}
}
