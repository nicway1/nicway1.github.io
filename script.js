let currentLocation = null;
let selectedSeats = [];
let currentView = 'home';
let searchFilters = {
    date: null,
    time: null,
    duration: 2
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupSearch();
    setupFilters();
    displayLocations();
    setupModal();
    loadUserData();

    setInterval(simulateRealTimeUpdates, 30000);
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            navigateToPage(target);
        });
    });

    document.querySelector('.back-btn').addEventListener('click', () => {
        navigateToPage('home');
    });
}

function navigateToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    document.getElementById(pageId).classList.add('active');

    // Only try to set active nav link if it exists
    const navLink = document.querySelector(`[href="#${pageId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }

    currentView = pageId;

    if (pageId === 'bookings') {
        displayBookings();
    } else if (pageId === 'favorites') {
        displayFavorites();
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchDate = document.getElementById('searchDate');
    const searchTime = document.getElementById('searchTime');
    const searchDuration = document.getElementById('searchDuration');
    const searchBtn = document.querySelector('.search-btn');

    // Set default values
    const now = new Date();
    searchDate.value = now.toISOString().split('T')[0];
    searchTime.value = now.toTimeString().slice(0, 5);

    // Set min date to today
    searchDate.min = now.toISOString().split('T')[0];

    // Set max date to 30 days from now
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    searchDate.max = maxDate.toISOString().split('T')[0];

    function performSearch() {
        const query = searchInput.value.toLowerCase();
        const selectedDate = searchDate.value;
        const selectedTime = searchTime.value;
        const duration = parseInt(searchDuration.value);

        let filteredLocations = studyLocations.filter(location =>
            location.name.toLowerCase().includes(query) ||
            location.type.toLowerCase().includes(query) ||
            location.address.toLowerCase().includes(query)
        );

        // Filter by date/time availability if date and time are selected
        if (selectedDate && selectedTime) {
            filteredLocations = filteredLocations.map(location => {
                const availableSeatsForTime = getAvailableSeatsForDateTime(location, selectedDate, selectedTime, duration);
                return {
                    ...location,
                    availableSeats: availableSeatsForTime,
                    searchDateTime: new Date(`${selectedDate}T${selectedTime}`),
                    searchDuration: duration
                };
            });
        }

        displayFilteredLocations(filteredLocations);
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('input', performSearch);
    searchDate.addEventListener('change', performSearch);
    searchTime.addEventListener('change', performSearch);
    searchDuration.addEventListener('change', performSearch);

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Perform initial search with current values
    performSearch();
}

function setupFilters() {
    // Setup type filters
    const typeFilterButtons = document.querySelectorAll('.type-filter-btn');

    typeFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeFilterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const type = btn.dataset.type;
            if (type === 'all') {
                displayLocations();
            } else {
                const filteredLocations = filterLocationsByType(type);
                displayFilteredLocations(filteredLocations);
            }
        });
    });

    // Setup facility filters
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            if (filter === 'all') {
                displayLocations();
            } else {
                const filteredLocations = studyLocations.filter(location =>
                    location.facilities.includes(filter)
                );
                displayFilteredLocations(filteredLocations);
            }
        });
    });

    // Update counts
    updateTypeCounts();
}

function filterLocationsByType(type) {
    const typeMapping = {
        'library': ['Public Library', 'Regional Library', 'Reference Library'],
        'university': ['University Library', 'Arts Institution Library', 'International University Library'],
        'community': ['Community Centre']
    };

    const targetTypes = typeMapping[type];
    if (!targetTypes) return [];

    return studyLocations.filter(location =>
        targetTypes.includes(location.type)
    );
}

function updateTypeCounts() {
    const allCount = studyLocations.length;
    const libraryCount = filterLocationsByType('library').length;
    const universityCount = filterLocationsByType('university').length;
    const communityCount = filterLocationsByType('community').length;

    // Update count displays
    const allCountEl = document.getElementById('allCount');
    const libraryCountEl = document.getElementById('libraryCount');
    const universityCountEl = document.getElementById('universityCount');
    const communityCountEl = document.getElementById('communityCount');

    if (allCountEl) allCountEl.textContent = allCount;
    if (libraryCountEl) libraryCountEl.textContent = libraryCount;
    if (universityCountEl) universityCountEl.textContent = universityCount;
    if (communityCountEl) communityCountEl.textContent = communityCount;
}

function displayLocations() {
    displayFilteredLocations(studyLocations);
}

function displayFilteredLocations(locations) {
    const grid = document.getElementById('locationsGrid');

    if (locations.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No locations found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = locations.map(location => createLocationCard(location)).join('');

    grid.querySelectorAll('.location-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            viewLocationDetails(locations[index]);
        });
    });

    grid.querySelectorAll('.favorite-btn').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(locations[index].id);
        });
    });
}

function createLocationCard(location) {
    const isFavorite = favorites.includes(location.id);
    const crowdClass = `crowd-${location.crowdLevel}`;

    // Check if we're showing time-specific availability
    const isTimeSpecific = location.searchDateTime && location.searchDuration;
    const availabilityLabel = isTimeSpecific ? 'Available for search time' : 'Currently Available';

    let timeInfo = '';
    if (isTimeSpecific) {
        const dateStr = location.searchDateTime.toLocaleDateString();
        const timeStr = location.searchDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        timeInfo = `
            <div class="search-time-info">
                📅 ${dateStr} at ${timeStr} (${location.searchDuration}h)
            </div>
        `;
    }

    return `
        <div class="location-card fade-in" style="position: relative;">
            <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-location-id="${location.id}">
                ${isFavorite ? '❤️' : '🤍'}
            </button>
            <div class="location-image" style="background-image: url('${location.image}')"></div>
            <h3>${location.name}</h3>
            <p class="type">${location.type}</p>
            ${timeInfo}
            <div class="location-stats">
                <div class="stat">
                    <span class="stat-label">${availabilityLabel}</span>
                    <span class="stat-value">${location.availableSeats}/${location.totalSeats}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Crowd Level</span>
                    <span class="stat-value crowd-level ${crowdClass}">${location.crowdLevel}</span>
                </div>
            </div>
            <div class="facilities">
                ${location.facilities.map(facility => `
                    <span class="facility-icon">${getFacilityIcon(facility)} ${facility}</span>
                `).join('')}
            </div>
        </div>
    `;
}

function getFacilityIcon(facility) {
    const icons = {
        power: '🔌',
        wifi: '📶',
        aircon: '❄️',
        quiet: '🤫',
        group: '👥',
        window: '🪟',
        corner: '🏠'
    };
    return icons[facility] || '✓';
}

function viewLocationDetails(location) {
    currentLocation = location;

    // Clear any previous seat selections
    selectedSeats = [];

    document.getElementById('locationName').textContent = location.name;
    document.getElementById('locationAddress').textContent = location.address;
    document.getElementById('availableSeats').textContent = `${location.availableSeats}/${location.totalSeats}`;
    document.getElementById('crowdLevel').textContent = location.crowdLevel;
    document.getElementById('crowdLevel').className = `stat-value crowd-level crowd-${location.crowdLevel}`;

    generateSeatMap(location);
    setupBookingControls();

    navigateToPage('location-details');
}

function generateSeatMap(location) {
    const seatMap = document.getElementById('seatMap');

    seatMap.innerHTML = location.seats.map(seat => {
        let seatClass = seat.status === 'available' ? 'available' : 'occupied';

        // Add selected class if this seat is in selectedSeats array
        if (selectedSeats.includes(seat.id)) {
            seatClass += ' selected';
        }

        const icons = getSeatIcons(seat);

        return `
            <div class="seat ${seatClass}" data-seat-id="${seat.id}" ${seat.status === 'available' ? '' : 'style="cursor: not-allowed;"'}>
                <span class="seat-number">${seat.id}</span>
                <div class="seat-icons">${icons}</div>
            </div>
        `;
    }).join('');

    // Add click listeners to both available and selected seats
    seatMap.querySelectorAll('.seat').forEach(seatElement => {
        const seatId = parseInt(seatElement.dataset.seatId);
        const seat = location.seats.find(s => s.id === seatId);

        // Only add click listener if seat is available or already selected
        if (seat.status === 'available' || selectedSeats.includes(seatId)) {
            seatElement.addEventListener('click', () => {
                selectSeat(seatId);
            });
        }
    });
}

function getSeatIcons(seat) {
    let icons = '';
    if (seat.type === 'power') icons += '🔌';
    if (seat.position === 'window') icons += '🪟';
    if (seat.position === 'corner') icons += '🏠';
    return icons;
}

function selectSeat(seatId) {
    const groupSizeElement = document.getElementById('groupSize');
    if (!groupSizeElement) return;

    const groupSize = parseInt(groupSizeElement.value) || 1;
    const seatElement = document.querySelector(`[data-seat-id="${seatId}"]`);

    if (!seatElement) return;

    // Check if seat is already selected
    if (selectedSeats.includes(seatId)) {
        // Deselect the seat
        selectedSeats = selectedSeats.filter(id => id !== seatId);
        seatElement.classList.remove('selected');
    } else {
        // Check if we can add more seats
        if (selectedSeats.length < groupSize) {
            selectedSeats.push(seatId);
            seatElement.classList.add('selected');
        } else {
            // Remove oldest selection and add new one
            const oldestSeat = selectedSeats.shift();
            const oldestElement = document.querySelector(`[data-seat-id="${oldestSeat}"]`);
            if (oldestElement) {
                oldestElement.classList.remove('selected');
            }
            selectedSeats.push(seatId);
            seatElement.classList.add('selected');
        }
    }

    updateBookingButton();
}

function updateBookingButton() {
    const confirmBtn = document.getElementById('confirmBooking');
    const groupSizeElement = document.getElementById('groupSize');

    if (!confirmBtn || !groupSizeElement) {
        return;
    }

    const groupSize = parseInt(groupSizeElement.value) || 1;

    if (selectedSeats.length === groupSize) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = `Book ${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''}`;
    } else {
        confirmBtn.disabled = true;
        const remaining = groupSize - selectedSeats.length;
        confirmBtn.textContent = `Select ${remaining} More Seat${remaining > 1 ? 's' : ''}`;
    }
}

function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function setupBookingControls() {
    const bookingTime = document.getElementById('bookingTime');
    const confirmBtn = document.getElementById('confirmBooking');
    const clearBtn = document.getElementById('clearSelection');
    const groupSize = document.getElementById('groupSize');

    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);

    // Convert to local time string format for datetime-local input
    const minTime = formatDateTimeLocal(now);
    bookingTime.min = minTime;

    const maxTime = new Date();
    maxTime.setDate(maxTime.getDate() + 7);
    bookingTime.max = formatDateTimeLocal(maxTime);

    const defaultTime = formatDateTimeLocal(now);
    bookingTime.value = defaultTime;

    console.log('Setting booking time defaults:');
    console.log('Current time:', new Date());
    console.log('Time + 30 min:', now);
    console.log('Min time (formatted):', minTime);
    console.log('Default value set to:', defaultTime);
    console.log('Actual input value:', bookingTime.value);

    // Event listeners
    confirmBtn.addEventListener('click', makeBooking);
    clearBtn.addEventListener('click', clearSeatSelection);
    groupSize.addEventListener('change', handleGroupSizeChange);

    // Summary page event listeners
    const backToSeatsBtn = document.getElementById('backToSeats');
    const editBookingBtn = document.getElementById('editBooking');
    const confirmFinalBtn = document.getElementById('confirmFinalBooking');

    if (backToSeatsBtn) {
        backToSeatsBtn.addEventListener('click', () => {
            navigateToPage('location-details');
        });
    }

    if (editBookingBtn) {
        editBookingBtn.addEventListener('click', () => {
            navigateToPage('location-details');
        });
    }

    if (confirmFinalBtn) {
        confirmFinalBtn.addEventListener('click', confirmFinalBooking);
    }

    // Initialize button state
    updateBookingButton();
}

function clearSeatSelection() {
    selectedSeats.forEach(seatId => {
        document.querySelector(`[data-seat-id="${seatId}"]`).classList.remove('selected');
    });
    selectedSeats = [];
    updateBookingButton();
}

function handleGroupSizeChange() {
    const groupSize = parseInt(document.getElementById('groupSize').value);

    // If we have more selected seats than the new group size, remove excess
    while (selectedSeats.length > groupSize) {
        const removedSeat = selectedSeats.pop();
        document.querySelector(`[data-seat-id="${removedSeat}"]`).classList.remove('selected');
    }

    updateBookingButton();
}

function makeBooking() {
    if (selectedSeats.length === 0 || !currentLocation) {
        return;
    }

    const bookingTime = document.getElementById('bookingTime').value;
    const groupSize = parseInt(document.getElementById('groupSize').value);

    if (selectedSeats.length !== groupSize) {
        alert(`Please select exactly ${groupSize} seat${groupSize > 1 ? 's' : ''} for your group.`);
        return;
    }

    if (!bookingTime) {
        alert('Please select a date and time for your booking.');
        return;
    }

    // Show booking summary instead of directly booking
    showBookingSummary();
}

function showBookingSummary() {
    const bookingTime = document.getElementById('bookingTime').value;
    const bookingDuration = document.getElementById('bookingDuration');
    const duration = bookingDuration ? parseInt(bookingDuration.value) : 2;
    const groupSize = parseInt(document.getElementById('groupSize').value);

    // Populate summary page
    document.getElementById('summaryLocationName').textContent = currentLocation.name;
    document.getElementById('summaryLocationAddress').textContent = currentLocation.address;
    document.getElementById('summaryGroupSize').textContent = `${groupSize} ${groupSize === 1 ? 'person' : 'people'}`;

    // Populate seat details
    const seatsDetailsContainer = document.getElementById('summarySeatsDetails');
    const seatDetails = selectedSeats.map(seatId => {
        const seat = currentLocation.seats.find(s => s.id === seatId);
        const features = [];
        if (seat.type === 'power') features.push('⚡');
        if (seat.position === 'window') features.push('🪟');
        if (seat.position === 'corner') features.push('🏠');

        return `Seat ${seatId}${features.length > 0 ? ` ${features.join(' ')}` : ''}`;
    }).join(', ');
    seatsDetailsContainer.innerHTML = seatDetails;

    // Populate time details
    const bookingDateTime = new Date(bookingTime);
    const endDateTime = new Date(bookingDateTime.getTime() + duration * 60 * 60 * 1000);

    document.getElementById('summaryDate').textContent = bookingDateTime.toLocaleDateString();
    document.getElementById('summaryStartTime').textContent = bookingDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('summaryEndTime').textContent = endDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('summaryDuration').textContent = `${duration} hours`;

    // Populate facilities
    const facilityIcons = {
        power: '🔌',
        wifi: '📶', 
        aircon: '❄️',
        quiet: '🤫',
        group: '👥',
        window: '🪟',
        corner: '🏠'
    };

    const facilityNames = {
        power: 'Power outlets',
        wifi: 'WiFi',
        aircon: 'Air conditioning', 
        quiet: 'Quiet zone',
        group: 'Group study',
        window: 'Window seats',
        corner: 'Corner seats'
    };

    // Create facility tags
    const facilityTagsContainer = document.getElementById('facilityTags');
    const facilityTags = currentLocation.facilities.map(facility => {
        const icon = facilityIcons[facility] || '✓';
        const name = facilityNames[facility] || facility;
        return `<span class="facility-tag">${icon} ${name}</span>`;
    }).join('');
    
    facilityTagsContainer.innerHTML = facilityTags;
    
    // Set main facilities text
    document.getElementById('summaryFacilities').textContent = `${currentLocation.facilities.length} facilities available`;
    document.getElementById('summaryTotalSeats').textContent = selectedSeats.length;

    // Navigate to summary page
    navigateToPage('booking-summary');
}

function confirmFinalBooking() {
    const bookingTimeValue = document.getElementById('bookingTime').value;
    const bookingDuration = document.getElementById('bookingDuration');
    const duration = bookingDuration ? parseInt(bookingDuration.value) : 2;
    const groupSize = parseInt(document.getElementById('groupSize').value);

    console.log('Creating final booking:');
    console.log('Booking time input value:', bookingTimeValue);
    console.log('Current time:', new Date());

    const groupBookingId = Date.now();
    const groupBookings = [];

    selectedSeats.forEach((seatId, index) => {
        const seat = currentLocation.seats.find(s => s.id === seatId);

        const booking = {
            id: groupBookingId + index,
            groupId: groupBookingId,
            groupSize: groupSize,
            groupIndex: index + 1,
            locationId: currentLocation.id,
            locationName: currentLocation.name,
            seatId: seatId,
            seatType: seat.type,
            seatPosition: seat.position,
            dateTime: new Date(bookingTimeValue),
            duration: duration,
            bookedAt: new Date()
        };

        groupBookings.push(booking);
        bookings.push(booking);

        seat.status = 'occupied';
        currentLocation.availableSeats--;
    });

    console.log('Created bookings:', groupBookings);
    console.log('Total bookings array:', bookings);

    saveBookings(bookings);
    showGroupBookingConfirmation(groupBookings);
    generateSeatMap(currentLocation);

    selectedSeats = [];
    updateBookingButton();
}

function showBookingConfirmation(booking) {
    const modal = document.getElementById('confirmationModal');
    const details = document.getElementById('bookingDetails');

    const endTime = new Date(booking.dateTime.getTime() + booking.duration * 60 * 60 * 1000);

    details.innerHTML = `
        <p><strong>Location:</strong> ${booking.locationName}</p>
        <p><strong>Seat:</strong> ${booking.seatId} (${booking.seatType}${booking.seatPosition ? `, ${booking.seatPosition}` : ''})</p>
        <p><strong>Start Time:</strong> ${booking.dateTime.toLocaleString()}</p>
        <p><strong>End Time:</strong> ${endTime.toLocaleString()}</p>
        <p><strong>Duration:</strong> ${booking.duration} hours</p>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
    `;

    modal.style.display = 'block';
}

function showGroupBookingConfirmation(groupBookings) {
    const modal = document.getElementById('confirmationModal');
    const details = document.getElementById('bookingDetails');

    const firstBooking = groupBookings[0];
    const endTime = new Date(firstBooking.dateTime.getTime() + firstBooking.duration * 60 * 60 * 1000);

    let seatsInfo = groupBookings.map(booking =>
        `Seat ${booking.seatId} (${booking.seatType}${booking.seatPosition ? `, ${booking.seatPosition}` : ''})`
    ).join('<br>');

    details.innerHTML = `
        <p><strong>Group Booking Confirmed!</strong></p>
        <p><strong>Location:</strong> ${firstBooking.locationName}</p>
        <p><strong>Group Size:</strong> ${firstBooking.groupSize} people</p>
        <p><strong>Seats:</strong><br>${seatsInfo}</p>
        <p><strong>Start Time:</strong> ${firstBooking.dateTime.toLocaleString()}</p>
        <p><strong>End Time:</strong> ${endTime.toLocaleString()}</p>
        <p><strong>Duration:</strong> ${firstBooking.duration} hours</p>
        <p><strong>Group Booking ID:</strong> ${firstBooking.groupId}</p>
    `;

    modal.style.display = 'block';
}

function setupModal() {
    const modal = document.getElementById('confirmationModal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function closeModal() {
    document.getElementById('confirmationModal').style.display = 'none';
}

function viewMyBookings() {
    closeModal();
    navigateToPage('bookings');
}

function toggleFavorite(locationId) {
    const index = favorites.indexOf(locationId);

    if (index === -1) {
        favorites.push(locationId);
    } else {
        favorites.splice(index, 1);
    }

    saveFavorites(favorites);

    if (currentView === 'home') {
        displayLocations();
    } else if (currentView === 'favorites') {
        displayFavorites();
    }
}

function displayBookings() {
    const container = document.getElementById('bookingsList');
    const now = new Date();
    console.log('displayBookings called');
    console.log('Current bookings array:', bookings);
    console.log('Current time:', now);

    // Debug each booking's date
    bookings.forEach((booking, index) => {
        const bookingDate = new Date(booking.dateTime);
        console.log(`Booking ${index}: dateTime = ${booking.dateTime}, parsed = ${bookingDate}, is future? ${bookingDate > now}`);
    });

    const activeBookings = bookings.filter(booking => new Date(booking.dateTime) > now);
    console.log('Active bookings (future):', activeBookings);

    if (activeBookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No upcoming bookings</h3>
                <p>Book a study space to see your reservations here</p>
            </div>
        `;
        return;
    }

    // Group bookings by groupId for display
    const groupedBookings = {};
    const singleBookings = [];

    activeBookings.forEach(booking => {
        if (booking.groupId) {
            if (!groupedBookings[booking.groupId]) {
                groupedBookings[booking.groupId] = [];
            }
            groupedBookings[booking.groupId].push(booking);
        } else {
            singleBookings.push(booking);
        }
    });

    let bookingCards = [];

    // Add group booking cards
    Object.values(groupedBookings).forEach(group => {
        const firstBooking = group[0];
        const duration = firstBooking.duration || 2;
        const endTime = new Date(new Date(firstBooking.dateTime).getTime() + duration * 60 * 60 * 1000);
        const seatsInfo = group.map(b => `${b.seatId} (${b.seatType})`).join(', ');

        bookingCards.push(`
            <div class="booking-card group-booking fade-in">
                <h4>${firstBooking.locationName} <span class="group-badge">Group of ${firstBooking.groupSize}</span></h4>
                <div class="booking-details">
                    <p><strong>Seats:</strong> ${seatsInfo}</p>
                    <p><strong>Start:</strong> ${new Date(firstBooking.dateTime).toLocaleString()}</p>
                    <p><strong>End:</strong> ${endTime.toLocaleString()}</p>
                    <p><strong>Duration:</strong> ${duration} hours</p>
                    <p><strong>Group ID:</strong> ${firstBooking.groupId}</p>
                </div>
                <button class="cancel-btn" onclick="cancelGroupBooking(${firstBooking.groupId})">Cancel Group Booking</button>
            </div>
        `);
    });

    // Add single booking cards
    singleBookings.forEach(booking => {
        const duration = booking.duration || 2;
        const endTime = new Date(new Date(booking.dateTime).getTime() + duration * 60 * 60 * 1000);

        bookingCards.push(`
            <div class="booking-card fade-in">
                <h4>${booking.locationName}</h4>
                <div class="booking-details">
                    <p><strong>Seat:</strong> ${booking.seatId} (${booking.seatType}${booking.seatPosition ? `, ${booking.seatPosition}` : ''})</p>
                    <p><strong>Start:</strong> ${new Date(booking.dateTime).toLocaleString()}</p>
                    <p><strong>End:</strong> ${endTime.toLocaleString()}</p>
                    <p><strong>Duration:</strong> ${duration} hours</p>
                    <p><strong>Booking ID:</strong> ${booking.id}</p>
                </div>
                <button class="cancel-btn" onclick="cancelBooking(${booking.id})">Cancel Booking</button>
            </div>
        `);
    });

    container.innerHTML = bookingCards.join('');
}

function displayFavorites() {
    const container = document.getElementById('favoritesList');
    const favoriteLocations = studyLocations.filter(location => favorites.includes(location.id));

    if (favoriteLocations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No favorite locations</h3>
                <p>Add locations to your favorites by clicking the heart icon</p>
            </div>
        `;
        return;
    }

    container.innerHTML = favoriteLocations.map(location => createLocationCard(location)).join('');

    container.querySelectorAll('.location-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            viewLocationDetails(favoriteLocations[index]);
        });
    });

    container.querySelectorAll('.favorite-btn').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(favoriteLocations[index].id);
        });
    });
}

function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return;

    const booking = bookings[bookingIndex];
    const location = studyLocations.find(l => l.id === booking.locationId);

    if (location) {
        const seat = location.seats.find(s => s.id === booking.seatId);
        if (seat) {
            seat.status = 'available';
            location.availableSeats++;
        }
    }

    bookings.splice(bookingIndex, 1);
    saveBookings(bookings);

    displayBookings();
}

function cancelGroupBooking(groupId) {
    if (!confirm('Are you sure you want to cancel this entire group booking?')) return;

    const groupBookings = bookings.filter(b => b.groupId === groupId);

    if (groupBookings.length === 0) return;

    groupBookings.forEach(booking => {
        const location = studyLocations.find(l => l.id === booking.locationId);

        if (location) {
            const seat = location.seats.find(s => s.id === booking.seatId);
            if (seat) {
                seat.status = 'available';
                location.availableSeats++;
            }
        }
    });

    // Remove all bookings with this groupId
    for (let i = bookings.length - 1; i >= 0; i--) {
        if (bookings[i].groupId === groupId) {
            bookings.splice(i, 1);
        }
    }

    saveBookings(bookings);
    displayBookings();
}

function loadUserData() {
    bookings = loadBookings();
    favorites = loadFavorites();
}

function getAvailableSeatsForDateTime(location, date, time, durationHours) {
    const searchDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(searchDateTime.getTime() + durationHours * 60 * 60 * 1000);

    // Count seats that are not booked during the requested time period
    let availableCount = 0;

    location.seats.forEach(seat => {
        let isAvailable = true;

        // Check against existing bookings
        bookings.forEach(booking => {
            if (booking.locationId === location.id && booking.seatId === seat.id) {
                const bookingStart = new Date(booking.dateTime);
                // Use the actual booking duration or default to 2 hours
                const duration = booking.duration || 2;
                const bookingEnd = new Date(bookingStart.getTime() + duration * 60 * 60 * 1000);

                // Check if the search time period overlaps with this booking
                if (searchDateTime < bookingEnd && endDateTime > bookingStart) {
                    isAvailable = false;
                }
            }
        });

        // For current time or future times, also check current status
        const now = new Date();
        if (searchDateTime <= now && seat.status === 'occupied') {
            isAvailable = false;
        }

        if (isAvailable) {
            availableCount++;
        }
    });

    return availableCount;
}

function isSearchingWithDateTime() {
    const searchDate = document.getElementById('searchDate');
    const searchTime = document.getElementById('searchTime');
    return searchDate && searchTime && searchDate.value && searchTime.value;
}

function simulateRealTimeUpdates() {
    studyLocations.forEach(location => {
        if (Math.random() < 0.3) {
            const availableSeats = location.seats.filter(s => s.status === 'available');
            const occupiedSeats = location.seats.filter(s => s.status === 'occupied');

            if (Math.random() < 0.5 && availableSeats.length > 0) {
                const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
                randomSeat.status = 'occupied';
                location.availableSeats--;
            } else if (occupiedSeats.length > 0) {
                const isBookedSeat = occupiedSeats.some(seat =>
                    bookings.some(booking =>
                        booking.locationId === location.id &&
                        booking.seatId === seat.id
                    )
                );

                if (!isBookedSeat) {
                    const randomSeat = occupiedSeats[Math.floor(Math.random() * occupiedSeats.length)];
                    randomSeat.status = 'available';
                    location.availableSeats++;
                }
            }

            const totalSeats = location.seats.length;
            const occupiedCount = totalSeats - location.availableSeats;
            const occupancyRate = occupiedCount / totalSeats;

            if (occupancyRate < 0.4) {
                location.crowdLevel = 'low';
            } else if (occupancyRate < 0.7) {
                location.crowdLevel = 'moderate';
            } else {
                location.crowdLevel = 'high';
            }
        }
    });

    if (currentView === 'home') {
        displayLocations();
    } else if (currentView === 'location-details' && currentLocation) {
        const updatedLocation = studyLocations.find(l => l.id === currentLocation.id);
        if (updatedLocation) {
            document.getElementById('availableSeats').textContent = `${updatedLocation.availableSeats}/${updatedLocation.totalSeats}`;
            document.getElementById('crowdLevel').textContent = updatedLocation.crowdLevel;
            document.getElementById('crowdLevel').className = `stat-value crowd-level crowd-${updatedLocation.crowdLevel}`;

            currentLocation = updatedLocation;
            generateSeatMap(currentLocation);
        }
    }
}