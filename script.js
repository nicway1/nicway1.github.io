let currentLocation = null;
let currentFloor = null;
let selectedSeats = [];
let currentView = 'home';
let userLocation = null;
let currentRegion = 'all';
let currentSort = 'default';
const THEME_STORAGE_KEY = 'studyspace-theme';
let searchFilters = {
    date: null,
    time: null,
    duration: 2,
    pax: 1
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupThemeToggle();
    setupNavigation();
    loadUserData();
    populateTimeIntervals();
    setupAdvancedSearchToggle();
    setupSearch();
    setupFilters();
    displayLocations();
    setupModal();

    setInterval(simulateRealTimeUpdates, 30000);
}

function populateTimeIntervals() {
    const searchTimeSelect = document.getElementById('searchTime');
    if (!searchTimeSelect) return;

    // Generate time options in 30-minute intervals
    const timeOptions = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            timeOptions.push(timeString);
        }
    }

    // Populate the select element
    searchTimeSelect.innerHTML = timeOptions.map(time =>
        `<option value="${time}">${time}</option>`
    ).join('');

    // Set default to current time rounded to nearest 30-minute interval
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const roundedMinute = currentMinute < 30 ? '00' : '30';
    const defaultTime = `${String(currentHour).padStart(2, '0')}:${roundedMinute}`;
    searchTimeSelect.value = defaultTime;
}

function setupAdvancedSearchToggle() {
    const toggleBtn = document.getElementById('advancedSearchToggle');
    const content = document.getElementById('advancedSearchContent');
    const arrow = toggleBtn.querySelector('.toggle-arrow');

    if (!toggleBtn || !content) return;

    toggleBtn.addEventListener('click', () => {
        const isVisible = content.style.display !== 'none';

        if (isVisible) {
            content.style.display = 'none';
            arrow.textContent = '▼';
        } else {
            content.style.display = 'block';
            arrow.textContent = '▲';
        }
    });
}

function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) {
        return;
    }

    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = getStoredTheme();
    const initialTheme = storedTheme || (prefersDarkScheme.matches ? 'dark' : 'light');

    applyTheme(initialTheme);

    toggleBtn.addEventListener('click', () => {
        const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        applyTheme(nextTheme);
        setStoredTheme(nextTheme);
    });

    const handleSchemeChange = (event) => {
        if (!getStoredTheme()) {
            applyTheme(event.matches ? 'dark' : 'light');
        }
    };

    if (typeof prefersDarkScheme.addEventListener === 'function') {
        prefersDarkScheme.addEventListener('change', handleSchemeChange);
    } else if (typeof prefersDarkScheme.addListener === 'function') {
        prefersDarkScheme.addListener(handleSchemeChange);
    }
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    document.body.setAttribute('data-theme', theme);
    updateThemeToggleLabel(theme);
}

function updateThemeToggleLabel(theme) {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) {
        return;
    }

    if (theme === 'dark') {
        toggleBtn.textContent = '☀️';
        toggleBtn.setAttribute('aria-label', 'Switch to light mode');
        toggleBtn.setAttribute('title', 'Switch to light mode');
    } else {
        toggleBtn.textContent = '🌙';
        toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
        toggleBtn.setAttribute('title', 'Switch to dark mode');
    }
}

function getStoredTheme() {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
        return null;
    }
}

function setStoredTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        // Ignore storage errors (e.g., private browsing)
    }
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
    const searchPax = document.getElementById('searchPax');
    const searchBtn = document.querySelector('.search-btn');

    // Set default values
    const now = new Date();
    searchDate.value = now.toISOString().split('T')[0];

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
        const pax = parseInt(searchPax.value);

        // Store search filters for later use
        searchFilters = {
            date: selectedDate,
            time: selectedTime,
            duration: duration,
            pax: pax
        };

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
    searchPax.addEventListener('change', performSearch);

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

    // Setup facility filters with multi-select capability
    const filterButtons = document.querySelectorAll('.filter-btn');
    let activeFilters = [];

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            if (filter === 'all') {
                // Clear all filters
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilters = [];
                displayLocations();
            } else {
                // Toggle filter selection
                const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
                allBtn.classList.remove('active');

                if (btn.classList.contains('active')) {
                    // Remove filter
                    btn.classList.remove('active');
                    activeFilters = activeFilters.filter(f => f !== filter);
                } else {
                    // Add filter
                    btn.classList.add('active');
                    activeFilters.push(filter);
                }

                // Apply filters
                if (activeFilters.length === 0) {
                    displayLocations();
                } else {
                    const filteredLocations = studyLocations.filter(location =>
                        activeFilters.every(filter => location.facilities.includes(filter))
                    );
                    displayFilteredLocations(filteredLocations);
                }
            }
        });
    });

    // Setup region filters
    setupRegionFilters();

    // Setup sorting and location features
    setupSortingAndLocation();

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

function setupRegionFilters() {
    const regionFilterButtons = document.querySelectorAll('.region-filter-btn');

    regionFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            regionFilterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentRegion = btn.dataset.region;
            applyAllFilters();
        });
    });
}

function setupSortingAndLocation() {
    const sortSelect = document.getElementById('sortSelect');
    const findNearbyBtn = document.getElementById('findNearbyBtn');

    // Setup sorting
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            applyAllFilters();
        });
    }

    // Setup location detection
    if (findNearbyBtn) {
        findNearbyBtn.addEventListener('click', () => {
            findNearbyLocations();
        });
    }
}

function applyAllFilters() {
    let filteredLocations = [...studyLocations];

    // Apply region filter
    if (currentRegion !== 'all') {
        filteredLocations = filteredLocations.filter(location =>
            location.region === currentRegion
        );
    }

    // Apply facility filters (existing logic)
    const activeFilterButtons = document.querySelectorAll('.filter-btn.active:not([data-filter="all"])');
    const facilityFilters = Array.from(activeFilterButtons).map(btn => btn.dataset.filter);

    if (facilityFilters.length > 0) {
        filteredLocations = filteredLocations.filter(location =>
            facilityFilters.every(filter => location.facilities.includes(filter))
        );
    }

    // Apply sorting
    filteredLocations = sortLocations(filteredLocations);

    displayFilteredLocations(filteredLocations);
}

function sortLocations(locations) {
    switch (currentSort) {
        case 'alphabetical':
            return locations.sort((a, b) => a.name.localeCompare(b.name));

        case 'availability':
            return locations.sort((a, b) => b.availableSeats - a.availableSeats);

        case 'distance':
            if (userLocation) {
                return locations.sort((a, b) => {
                    const distanceA = calculateDistance(userLocation, a.coordinates);
                    const distanceB = calculateDistance(userLocation, b.coordinates);
                    return distanceA - distanceB;
                });
            }
            return locations;

        default:
            return locations;
    }
}

function findNearbyLocations() {
    const findNearbyBtn = document.getElementById('findNearbyBtn');

    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
    }

    findNearbyBtn.disabled = true;
    findNearbyBtn.textContent = '📍 Finding...';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Switch to distance sorting
            currentSort = 'distance';
            document.getElementById('sortSelect').value = 'distance';

            // Apply filters with distance sorting
            applyAllFilters();

            findNearbyBtn.disabled = false;
            findNearbyBtn.textContent = '📍 Location Found';

            // Show success message
            setTimeout(() => {
                findNearbyBtn.textContent = '📍 Find Nearby';
            }, 3000);
        },
        (error) => {
            console.error('Error getting location:', error);

            // Use mock Singapore location (City Hall area)
            userLocation = {
                lat: 1.2941,
                lng: 103.8509
            };

            currentSort = 'distance';
            document.getElementById('sortSelect').value = 'distance';
            applyAllFilters();

            findNearbyBtn.disabled = false;
            findNearbyBtn.textContent = '📍 Using Mock Location';

            setTimeout(() => {
                findNearbyBtn.textContent = '📍 Find Nearby';
            }, 3000);
        }
    );
}

function calculateDistance(point1, point2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
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

    if (!locations || locations.length === 0) {
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

    // Add distance badge if user location is available and distance sorting is active
    let distanceBadge = '';
    if (userLocation && location.coordinates && currentSort === 'distance') {
        const distance = calculateDistance(userLocation, location.coordinates);
        distanceBadge = `<div class="distance-badge">${distance.toFixed(1)} km away</div>`;
    }

    // Add region badge
    let regionBadge = '';
    if (location.region) {
        const regionIcons = {
            'Central': '🏙️',
            'North': '⬆️',
            'East': '➡️',
            'West': '⬅️',
            'North-East': '↗️'
        };
        regionBadge = `<div class="region-badge">${regionIcons[location.region] || '📍'} ${location.region}</div>`;
    }

    return `
        <div class="location-card fade-in" style="position: relative;">
            <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-location-id="${location.id}">
                ${isFavorite ? '❤️' : '🤍'}
            </button>
            <div class="location-image" style="background-image: url('${location.image}')"></div>
            ${distanceBadge}
            ${regionBadge}
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
        corner: '🏠',
        wheelchair: '♿',
        accessible: '♿'
    };
    return icons[facility] || '✓';
}

function viewLocationDetails(location) {
    currentLocation = location;

    // Clear any previous seat selections
    selectedSeats = [];

    document.getElementById('locationName').textContent = location.name;
    document.getElementById('locationAddress').textContent = location.address;

    // Handle multi-floor libraries
    if (location.hasFloors && location.floors) {
        // Show total stats across all floors
        document.getElementById('availableSeats').textContent = `${location.availableSeats}/${location.totalSeats}`;
        document.getElementById('crowdLevel').textContent = location.crowdLevel;
        document.getElementById('crowdLevel').className = `stat-value crowd-level crowd-${location.crowdLevel}`;

        // Create floor selection UI
        createFloorSelector(location);

        // Default to first floor
        currentFloor = location.floors[0];
        generateFloorSeatMap(currentFloor);
    } else {
        // Regular single-floor location
        document.getElementById('availableSeats').textContent = `${location.availableSeats}/${location.totalSeats}`;
        document.getElementById('crowdLevel').textContent = location.crowdLevel;
        document.getElementById('crowdLevel').className = `stat-value crowd-level crowd-${location.crowdLevel}`;

        generateSeatMap(location);
    }

    setupBookingControls();
    preFillBookingControls();
    navigateToPage('location-details');
}

function preFillBookingControls() {
    // Pre-fill group size from search
    const groupSizeSelect = document.getElementById('groupSize');
    if (groupSizeSelect && searchFilters.pax) {
        groupSizeSelect.value = searchFilters.pax;
    }

    // Pre-fill date & time from search
    const bookingTimeInput = document.getElementById('bookingTime');
    if (bookingTimeInput && searchFilters.date && searchFilters.time) {
        const dateTimeValue = `${searchFilters.date}T${searchFilters.time}`;
        bookingTimeInput.value = dateTimeValue;
    }

    // Pre-fill duration from search
    const bookingDurationSelect = document.getElementById('bookingDuration');
    if (bookingDurationSelect && searchFilters.duration) {
        bookingDurationSelect.value = searchFilters.duration;
    }

    // Update the booking button
    updateBookingButton();
}

function createFloorSelector(location) {
    const seatMap = document.getElementById('seatMap');

    // Create floor selector UI
    const floorSelector = `
        <div class="floor-layout-container">
            <div class="floor-selector">
                <h3>Select Floor</h3>
                <div class="floor-buttons">
                    ${location.floors.map((floor, index) => `
                        <button class="floor-btn ${index === 0 ? 'active' : ''}" data-floor-index="${index}">
                            <div class="floor-info">
                                <span class="floor-name">${floor.floorName}</span>
                                <span class="floor-description">${floor.description}</span>
                                <span class="floor-availability">${floor.availableSeats}/${floor.totalSeats} available</span>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div id="floorSeatMap" class="floor-seat-map-wrapper">
                <!-- Floor seat map will be inserted here -->
            </div>
        </div>
    `;

    seatMap.innerHTML = floorSelector;

    // Add floor button listeners
    seatMap.querySelectorAll('.floor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const floorIndex = parseInt(btn.dataset.floorIndex);
            selectFloor(location, floorIndex);
        });
    });
}

function selectFloor(location, floorIndex) {
    currentFloor = location.floors[floorIndex];

    // Update active floor button
    document.querySelectorAll('.floor-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-floor-index="${floorIndex}"]`).classList.add('active');

    // Clear seat selection when changing floors
    selectedSeats = [];

    // Generate seat map for selected floor
    generateFloorSeatMap(currentFloor);

    // Update booking button
    updateBookingButton();
}

function generateFloorSeatMap(floor) {
    const floorSeatMapContainer = document.getElementById('floorSeatMap');

    let seatMapHTML = '';

    // Determine layout type and generate appropriate HTML
    if (floor.layoutType === 'grid') {
        // Layout 1: Grid layout with 4 rows of 6 seats
        seatMapHTML = generateGridLayout(floor.seats);
    } else if (floor.layoutType === 'lounge') {
        // Layout 2: Lounge layout with sofas
        seatMapHTML = generateLoungeLayout(floor.seats);
    } else if (floor.layoutType === 'multimedia') {
        // Layout 3: Multimedia layout
        seatMapHTML = generateMultimediaLayout(floor.seats);
    } else {
        // Default grid layout
        seatMapHTML = generateDefaultSeatMap(floor.seats);
    }

    const floorMapHTML = `
        <div class="floor-header">
            <h4>${floor.floorName}</h4>
            <p>${floor.description}</p>
            <div class="floor-image">
                <img src="${floor.image}" alt="${floor.floorName}" style="width: 100%; max-width: 400px; height: 200px; object-fit: cover; border-radius: 8px;">
            </div>
        </div>
        ${seatMapHTML}
    `;

    floorSeatMapContainer.innerHTML = floorMapHTML;

    // Add click listeners to seats
    floorSeatMapContainer.querySelectorAll('.seat').forEach(seatElement => {
        const seatId = seatElement.dataset.seatId;
        const seat = floor.seats.find(s => s.id === seatId);

        // Only add click listener if seat is available or already selected
        if (seat && (seat.status === 'available' || selectedSeats.includes(seatId))) {
            seatElement.addEventListener('click', () => {
                selectSeat(seatId);
            });
        }
    });
}

function generateGridLayout(seats) {
    // S51-S74: 4 rows of 6 seats with tables
    const rows = [
        seats.slice(0, 6),   // S51-S56
        seats.slice(6, 12),  // S57-S62
        seats.slice(12, 18), // S63-S68
        seats.slice(18, 24)  // S69-S74
    ];

    return `
        <div class="seat-map layout-grid" id="actualSeatMap">
            ${rows.map(row => `
                <div class="furniture-row">
                    <div class="table"></div>
                    ${row.map(seat => generateSeatHTML(seat)).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

function generateLoungeLayout(seats) {
    // S33-S43: Two lounge sections with sofas
    return `
        <div class="seat-map layout-lounge" id="actualSeatMap">
            <div class="lounge-container">
                <div class="lounge-section">
                    <div class="furniture-row">
                        <div class="table"></div>
                        ${seats.slice(0, 3).map(seat => generateSeatHTML(seat)).join('')}
                    </div>
                    <div class="sofa-element">
                        <div class="sofa-label">Sofa</div>
                    </div>
                    <div class="furniture-row">
                        <div class="table"></div>
                        ${seats.slice(3, 6).map(seat => generateSeatHTML(seat)).join('')}
                    </div>
                </div>
                <div class="lounge-section">
                    <div class="furniture-row">
                        <div class="table"></div>
                        ${seats.slice(6, 8).map(seat => generateSeatHTML(seat)).join('')}
                    </div>
                    <div class="sofa-element">
                        <div class="sofa-label">Sofa</div>
                    </div>
                    <div class="furniture-row">
                        <div class="table"></div>
                        ${seats.slice(8, 11).map(seat => generateSeatHTML(seat)).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateMultimediaLayout(seats) {
    // S134-S157: 4 rows of 6 seats with multimedia label
    const rows = [
        seats.slice(0, 6),   // S134-S139
        seats.slice(6, 12),  // S140-S145
        seats.slice(12, 18), // S146-S151
        seats.slice(18, 24)  // S152-S157
    ];

    return `
        <div class="seat-map layout-multimedia" id="actualSeatMap">
            <div class="multimedia-label">Multimedia</div>
            ${rows.map(row => `
                <div class="furniture-row">
                    <div class="table"></div>
                    ${row.map(seat => generateSeatHTML(seat)).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

function generateSeatHTML(seat) {
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
}

function generateDefaultSeatMap(seats) {
    return `
        <div class="seat-map" id="actualSeatMap">
            ${seats.map(seat => generateSeatHTML(seat)).join('')}
        </div>
    `;
}

function generateSeatMap(location) {
    const seatMap = document.getElementById('seatMap');

    seatMap.innerHTML = location.seats.map(seat => {
        let seatClass = seat.status === 'available' ? 'available' : 'occupied';

        // Check for premium seats (seats with both power and corner position, or corner seats in premium locations)
        if (seat.type === 'power' && seat.position === 'corner') {
            seatClass += ' premium';
        }

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

    // Find the seat in current location or floor
    let seat = null;
    if (currentFloor) {
        seat = currentFloor.seats.find(s => s.id === seatId);
    } else if (currentLocation) {
        seat = currentLocation.seats.find(s => s.id === seatId);
    }

    if (!seat) return;

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
    let locationName = currentLocation.name;
    if (currentFloor) {
        locationName += ` - ${currentFloor.floorName}`;
    }
    document.getElementById('summaryLocationName').textContent = locationName;
    document.getElementById('summaryLocationAddress').textContent = currentLocation.address;
    document.getElementById('summaryGroupSize').textContent = `${groupSize} ${groupSize === 1 ? 'person' : 'people'}`;

    // Populate seat details
    const seatsDetailsContainer = document.getElementById('summarySeatsDetails');
    const seatDetails = selectedSeats.map(seatId => {
        // Find seat in either currentFloor (for multi-floor) or currentLocation (for single-floor)
        let seat = null;
        if (currentFloor) {
            seat = currentFloor.seats.find(s => s.id === seatId);
        } else if (currentLocation) {
            seat = currentLocation.seats.find(s => s.id === seatId);
        }

        if (!seat) return `Seat ${seatId}`;

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
        corner: '🏠',
        wheelchair: '♿'
    };

    const facilityNames = {
        power: 'Power outlets',
        wifi: 'WiFi',
        aircon: 'Air conditioning',
        quiet: 'Quiet zone',
        group: 'Group study',
        window: 'Window seats',
        corner: 'Corner seats',
        wheelchair: 'Wheelchair accessible'
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
        // Find seat in either currentFloor (for multi-floor) or currentLocation (for single-floor)
        let seat = null;
        if (currentFloor) {
            seat = currentFloor.seats.find(s => s.id === seatId);
        } else if (currentLocation) {
            seat = currentLocation.seats.find(s => s.id === seatId);
        }

        let locationName = currentLocation.name;
        if (currentFloor) {
            locationName += ` - ${currentFloor.floorName}`;
        }

        const booking = {
            id: groupBookingId + index,
            groupId: groupBookingId,
            groupSize: groupSize,
            groupIndex: index + 1,
            locationId: currentLocation.id,
            locationName: locationName,
            floorId: currentFloor ? currentFloor.floorNumber : null,
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
    if (bookings && bookings.length > 0) {
        bookings.forEach((booking, index) => {
            const bookingDate = new Date(booking.dateTime);
            console.log(`Booking ${index}: dateTime = ${booking.dateTime}, parsed = ${bookingDate}, is future? ${bookingDate > now}`);
        });
    }

    const activeBookings = bookings ? bookings.filter(booking => new Date(booking.dateTime) > now) : [];
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

    // Debug logging
    console.log('getAvailableSeatsForDateTime called for location:', location.name);
    console.log('hasFloors:', location.hasFloors);
    console.log('floors:', location.floors);
    console.log('seats:', location.seats);

    // Count seats that are not booked during the requested time period
    let availableCount = 0;

    // Handle multi-floor libraries
    let allSeats = [];
    if (location.hasFloors && location.floors && Array.isArray(location.floors)) {
        // Collect all seats from all floors
        location.floors.forEach(floor => {
            if (floor && floor.seats && Array.isArray(floor.seats)) {
                allSeats = allSeats.concat(floor.seats);
            }
        });
    } else if (location.seats && Array.isArray(location.seats)) {
        // Regular single-floor location
        allSeats = location.seats;
    }

    // Safety check for allSeats
    if (!Array.isArray(allSeats)) {
        return 0;
    }

    allSeats.forEach(seat => {
        let isAvailable = true;

        // Check against existing bookings
        if (bookings && bookings.length > 0) {
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
        }

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
    if (!studyLocations || studyLocations.length === 0) {
        return;
    }

    studyLocations.forEach(location => {
        // Skip multi-floor libraries as they don't have direct seats
        if (location.hasFloors || !location.seats) {
            return;
        }

        if (Math.random() < 0.3) {
            const availableSeats = location.seats.filter(s => s.status === 'available');
            const occupiedSeats = location.seats.filter(s => s.status === 'occupied');

            if (Math.random() < 0.5 && availableSeats.length > 0) {
                const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
                randomSeat.status = 'occupied';
                location.availableSeats--;
            } else if (occupiedSeats.length > 0) {
                const isBookedSeat = occupiedSeats.some(seat =>
                    bookings && bookings.some(booking =>
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
