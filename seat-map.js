// Seat selection state management
let selectedSeats = [];
let seatData = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSeatMap();
    setupEventListeners();
    simulateOccupiedSeats();
});

/**
 * Initialize the seat map by collecting all seats and setting up their initial state
 */
function initializeSeatMap() {
    const allSeats = document.querySelectorAll('.seat');

    allSeats.forEach(seat => {
        const seatId = seat.getAttribute('data-seat');

        // Store seat information
        seatData[seatId] = {
            element: seat,
            status: seat.classList.contains('occupied') ? 'occupied' : 'available',
            selected: false
        };

        // Add click event listener to each seat
        seat.addEventListener('click', function() {
            handleSeatClick(seatId);
        });
    });

    updateSelectedSeatsDisplay();
}

/**
 * Handle seat click events
 */
function handleSeatClick(seatId) {
    const seat = seatData[seatId];

    if (!seat) {
        console.error('Seat not found:', seatId);
        return;
    }

    // Cannot select occupied seats
    if (seat.status === 'occupied') {
        showNotification('This seat is already occupied and cannot be selected.', 'error');
        return;
    }

    // Toggle seat selection
    if (seat.selected) {
        // Deselect the seat
        deselectSeat(seatId);
    } else {
        // Select the seat
        selectSeat(seatId);
    }

    updateSelectedSeatsDisplay();
    updateConfirmButton();
}

/**
 * Select a seat
 */
function selectSeat(seatId) {
    const seat = seatData[seatId];

    if (!seat || seat.status !== 'available') {
        return;
    }

    // Update state
    seat.selected = true;
    seat.element.classList.add('selected');
    seat.element.classList.remove('available');

    // Add to selected seats array
    if (!selectedSeats.includes(seatId)) {
        selectedSeats.push(seatId);
    }

    showNotification(`Seat ${seatId} selected!`, 'success');
}

/**
 * Deselect a seat
 */
function deselectSeat(seatId) {
    const seat = seatData[seatId];

    if (!seat) {
        return;
    }

    // Update state
    seat.selected = false;
    seat.element.classList.remove('selected');
    seat.element.classList.add('available');

    // Remove from selected seats array
    selectedSeats = selectedSeats.filter(id => id !== seatId);

    showNotification(`Seat ${seatId} deselected.`, 'info');
}

/**
 * Clear all selected seats
 */
function clearAllSelections() {
    // Create a copy of the array to avoid modification during iteration
    const seatsToDeselect = [...selectedSeats];

    seatsToDeselect.forEach(seatId => {
        deselectSeat(seatId);
    });

    selectedSeats = [];
    updateSelectedSeatsDisplay();
    updateConfirmButton();

    showNotification('All selections cleared.', 'info');
}

/**
 * Update the selected seats display
 */
function updateSelectedSeatsDisplay() {
    const display = document.getElementById('selectedSeatsDisplay');

    if (selectedSeats.length === 0) {
        display.textContent = 'None';
        display.style.color = '#0d47a1';
    } else {
        display.textContent = selectedSeats.sort().join(', ');
        display.style.color = '#2e7d32';
    }
}

/**
 * Update the confirm button state
 */
function updateConfirmButton() {
    const confirmBtn = document.getElementById('confirmBooking');

    if (selectedSeats.length > 0) {
        confirmBtn.disabled = false;
    } else {
        confirmBtn.disabled = true;
    }
}

/**
 * Simulate some occupied seats for demonstration
 */
function simulateOccupiedSeats() {
    // Define some seats to be marked as occupied
    const occupiedSeatIds = [
        'S52', 'S58', 'S64', 'S70',  // Layout 1
        'S34', 'S40',                 // Layout 2
        'S137', 'S143', 'S149', 'S155' // Layout 3
    ];

    occupiedSeatIds.forEach(seatId => {
        const seat = seatData[seatId];
        if (seat) {
            seat.status = 'occupied';
            seat.element.classList.remove('available');
            seat.element.classList.add('occupied');
        }
    });
}

/**
 * Setup event listeners for buttons
 */
function setupEventListeners() {
    // Clear selection button
    const clearBtn = document.getElementById('clearSelection');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllSelections);
    }

    // Confirm booking button
    const confirmBtn = document.getElementById('confirmBooking');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleConfirmBooking);
    }
}

/**
 * Handle confirm booking action
 */
function handleConfirmBooking() {
    if (selectedSeats.length === 0) {
        showNotification('Please select at least one seat.', 'error');
        return;
    }

    // Create booking summary
    const bookingSummary = `
        <strong>Booking Confirmed!</strong><br><br>
        <strong>Selected Seats:</strong> ${selectedSeats.sort().join(', ')}<br>
        <strong>Total Seats:</strong> ${selectedSeats.length}<br><br>
        Your seats have been successfully reserved.
    `;

    // Show confirmation
    if (confirm(`Confirm booking for ${selectedSeats.length} seat(s)?\n\nSeats: ${selectedSeats.sort().join(', ')}`)) {
        showNotification('Booking confirmed successfully!', 'success');

        // Mark selected seats as occupied
        selectedSeats.forEach(seatId => {
            const seat = seatData[seatId];
            if (seat) {
                seat.status = 'occupied';
                seat.selected = false;
                seat.element.classList.remove('selected', 'available');
                seat.element.classList.add('occupied');
            }
        });

        // Clear selection
        selectedSeats = [];
        updateSelectedSeatsDisplay();
        updateConfirmButton();
    }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notificationContainer = document.getElementById('notificationContainer');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Set background color based on type
    let bgColor;
    let textColor = 'white';
    switch(type) {
        case 'success':
            bgColor = '#4caf50';
            break;
        case 'error':
            bgColor = '#f44336';
            break;
        case 'info':
            bgColor = '#2196f3';
            break;
        default:
            bgColor = '#757575';
    }

    notification.style.cssText = `
        background: ${bgColor};
        color: ${textColor};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
        cursor: pointer;
    `;

    notification.textContent = message;

    // Add click to dismiss
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    });

    // Add to container
    notificationContainer.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

/**
 * Utility function to get seat statistics
 */
function getSeatStatistics() {
    const stats = {
        total: Object.keys(seatData).length,
        available: 0,
        occupied: 0,
        selected: selectedSeats.length
    };

    Object.values(seatData).forEach(seat => {
        if (seat.status === 'available' && !seat.selected) {
            stats.available++;
        } else if (seat.status === 'occupied') {
            stats.occupied++;
        }
    });

    return stats;
}

// Log initial statistics
console.log('Seat Map Initialized');
console.log('Statistics:', getSeatStatistics());
