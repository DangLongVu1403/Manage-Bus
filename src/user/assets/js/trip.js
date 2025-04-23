// Avoid duplicate style declaration by using a unique variable name
// and ensure the script is properly loaded with the trip functionality

// First let's define the BASE_URL if it doesn't exist
if (typeof BASE_URL === 'undefined') {
    const BASE_URL = 'http://localhost:4500/api';
}

// Function to initialize the trip search and seat selection functionality
function initializeTripSearch() {
    // Lấy thông tin từ URL
    const fetchQueryParams = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            startPointId : urlParams.get('startPointId'),
            startPointName : urlParams.get('startPointName'),
            endPointId : urlParams.get('endPointId'),
            endPointName : urlParams.get('endPointName'),
            departureDate : urlParams.get('departureDate')
        };
    };

    const populateSearchForm = (startPointId, startPointName, endPointId, endPointName, departureDate) => {
        const diemKhoiHanh = document.getElementById('diemKhoiHanh');
        const diemDen = document.getElementById('diemDen');
        const ngayKhoiHanh = document.getElementById('ngayKhoiHanh');

        const addOptionIfNotExists = (selectElement, value, text) => {
            if (!selectElement) return;
            let exists = false;
            for (let i = 0; i < selectElement.options.length; i++) {
                if (selectElement.options[i].value === value) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                const newOption = new Option(text, value);
                selectElement.add(newOption);
            }
            selectElement.value = value;
        };

        if (diemKhoiHanh && startPointId && startPointName) {
            addOptionIfNotExists(diemKhoiHanh, startPointId, startPointName);
        }
        if (diemDen && endPointId && endPointName) {
            addOptionIfNotExists(diemDen, endPointId, endPointName);
        }
        if (ngayKhoiHanh && departureDate) {
            ngayKhoiHanh.value = departureDate;
        }
    };

    let allTrips = []; // Lưu trữ tất cả các chuyến xe để lọc

    const fetchTrips = async (startPointId, endPointId, departureDate) => {
        const tripListElement = document.getElementById('tripList');
        const loadingElement = document.getElementById('loadingIndicator');

        if (!tripListElement) {
            console.error('Không tìm thấy phần tử tripList');
            return;
        }

        try {
            if (loadingElement) {
                loadingElement.style.display = 'block';
            }

            const formattedDate = departureDate + 'T00:00:00Z';
            const response = await fetch(`${BASE_URL}/trips/?startLocation=${startPointId}&endLocation=${endPointId}&time=${formattedDate}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const result = await response.json();
            const trips = result.data.trips || [];

            allTrips = trips.map(trip => {
                const departureDateTime = new Date(trip.departureTime);
                const arriveDateTime = new Date(trip.arriveTime);
                const departureTime = departureDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const arriveTime = arriveDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const duration = `${trip.estimatedTravelTime.hours}h ${trip.estimatedTravelTime.minutes} phút`;

                return {
                    id: trip._id,
                    busType: `Giường nằm ${trip.bus.seatCapacity} chỗ`,
                    departureTime,
                    arriveTime,
                    duration,
                    price: trip.price,
                    availableSeats: trip.availableSeats,
                    startPoint: trip.startLocation.name,
                    endPoint: trip.endLocation.name,
                    features: ['Wifi', 'Nước uống', 'Điều hòa']
                };
            });

            applyFilters();

        } catch (error) {
            console.error('Lỗi khi lấy danh sách chuyến xe:', error);
            tripListElement.innerHTML = `
                <div class="alert alert-danger">
                    Đã xảy ra lỗi khi tải danh sách chuyến xe. Vui lòng thử lại sau.
                </div>
            `;
        } finally {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    };

    const displayTrips = (trips) => {
        const tripListElement = document.getElementById('tripList');
        if (!tripListElement) {
            console.error('Không tìm thấy phần tử tripList để hiển thị chuyến xe');
            return;
        }

        if (!Array.isArray(trips) || trips.length === 0) {
            tripListElement.innerHTML = `
                <div class="alert alert-info">
                    Không tìm thấy chuyến xe nào phù hợp với yêu cầu của bạn.
                </div>
            `;
            return;
        }

        const html = trips.map(trip => {
            const formattedPrice = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(trip.price).replace('₫', 'đ');
            const seatCapacity = trip.busType.match(/\d+/)[0] || '42';

            return `
                <div class="card mb-3 trip-item">
                    <div class="card-body">
                        <div class="trip-content">
                            <div class="trip-info">
                                <div class="trip-route">
                                    <div class="trip-time-point">
                                        <span class="fw-bold fs-5">${trip.departureTime}</span><br>
                                        <small>${trip.startPoint}</small>
                                    </div>
                                    <div class="trip-duration">
                                        <small>${trip.duration}</small><br>
                                        <i class="fa fa-arrow-right text-muted"></i>
                                    </div>
                                    <div class="trip-time-point">
                                        <span class="fw-bold fs-5">${trip.arriveTime}</span><br>
                                        <small>${trip.endPoint}</small>
                                    </div>
                                </div>
                                <div class="trip-features">
                                    <div class="feature-item">
                                        <i class="fa fa-wifi me-1 text-muted"></i>
                                        <span class="text-muted">${seatCapacity} Giường nằm</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="text-muted">Còn ${trip.availableSeats} chỗ</span>
                                    </div>
                                </div>
                            </div>
                            <div class="trip-action">
                                <div class="price">
                                    <span class="fw-bold fs-4 text-danger">${formattedPrice}</span>
                                </div>
                                <button class="btn btn-success" onclick="bookTrip('${trip.id}')">
                                    Chọn chỗ ngồi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        tripListElement.innerHTML = html;
    };

    const applyFilters = () => {
        let filteredTrips = [...allTrips];

        const timeRangeElement = document.getElementById('filterTimeRange');
        if (timeRangeElement) {
            const timeRange = timeRangeElement.value;
            filteredTrips = filteredTrips.filter(trip => {
                const [hours] = trip.departureTime.split(':').map(Number);
                return hours >= Number(timeRange);
            });
        }

        const priceRangeElement = document.getElementById('filterPriceRange');
        if (priceRangeElement) {
            const priceRange = priceRangeElement.value;
            filteredTrips = filteredTrips.filter(trip => trip.price >= Number(priceRange));
        }

        const seatsRangeElement = document.getElementById('filterSeatsRange');
        if (seatsRangeElement) {
            const seatsRange = seatsRangeElement.value;
            filteredTrips = filteredTrips.filter(trip => trip.availableSeats >= Number(seatsRange));
        }

        displayTrips(filteredTrips);
    };

    const setupFiltersAndSort = () => {
        const timeRange = document.getElementById('filterTimeRange');
        const priceRange = document.getElementById('filterPriceRange');
        const seatsRange = document.getElementById('filterSeatsRange');

        if (timeRange) timeRange.addEventListener('input', applyFilters);
        if (priceRange) priceRange.addEventListener('input', applyFilters);
        if (seatsRange) seatsRange.addEventListener('input', applyFilters);

        const sortButtons = document.querySelectorAll('.sort-options .btn-link');
        sortButtons.forEach(button => {
            button.addEventListener('click', function() {
                sortButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                const sortType = this.id;
                let sortedTrips = [...allTrips];
                
                if (sortType === 'sortByTime') {
                    sortedTrips.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
                } else if (sortType === 'sortByPriceAsc') {
                    sortedTrips.sort((a, b) => a.price - b.price);
                } else if (sortType === 'sortByPriceDesc') {
                    sortedTrips.sort((a, b) => b.price - a.price);
                }
                
                displayTrips(sortedTrips);
            });
        });
    };

    // Add CSS for the trip layout
    const tripStyleElement = document.createElement('style');
    tripStyleElement.textContent = `
        .trip-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .trip-info { flex: 1; }
        .trip-route { display: flex; align-items: center; margin-bottom: 10px; }
        .trip-time-point { flex: 1; }
        .trip-duration { text-align: center; margin: 0 15px; }
        .trip-features { display: flex; gap: 20px; }
        .trip-action { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        @media (max-width: 768px) {
            .trip-content { flex-direction: column; align-items: stretch; }
            .trip-action { margin-top: 15px; align-items: stretch; }
        }
    `;
    document.head.appendChild(tripStyleElement);

    // Add CSS for the seat selection modal
    const seatStyleElement = document.createElement('style');
    seatStyleElement.textContent = `
        .seat-map { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .seat { width: 100%; height: 50px; display: flex; justify-content: center; align-items: center; border-radius: 5px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
        .seat-available { background-color: #f8f9fa; border: 1px solid #dee2e6; }
        .seat-available:hover { background-color: #e9ecef; }
        .seat-booked { background-color: #dee2e6; color: #6c757d; cursor: not-allowed; }
        .seat-unavailable { background-color: #f1f1f1; color: #aaa; cursor: not-allowed; }
        .seat-selected { background-color: #28a745; color: white; border: 1px solid #28a745; }
        .seat-example { width: 20px; height: 20px; border-radius: 3px; }
    `;
    document.head.appendChild(seatStyleElement);

    // Khởi tạo
    const { startPointId, startPointName, endPointId, endPointName, departureDate } = fetchQueryParams();
    setTimeout(() => {
        populateSearchForm(startPointId, startPointName, endPointId, endPointName, departureDate);
    }, 100);
    fetchTrips(startPointId, endPointId, departureDate);
    setupFiltersAndSort();
}

// Add the bookTrip function to handle seat selection
window.bookTrip = (tripId) => {
    fetchTripDetailsAndOpenSeatSelection(tripId);
};

// Function to fetch trip details and open seat selection
async function fetchTripDetailsAndOpenSeatSelection(tripId) {
    try {
        const loadingElement = document.createElement('div');
        loadingElement.id = 'loadingSeatSelection';
        loadingElement.className = 'position-fixed top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex justify-content-center align-items-center';
        loadingElement.style.zIndex = '1050';
        loadingElement.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
                <p>Đang tải thông tin chỗ ngồi...</p>
            </div>
        `;
        document.body.appendChild(loadingElement);

        const baseUrl = window.BASE_URL || 'http://localhost:4500/api';
        const response = await fetch(`${baseUrl}/trips/${tripId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        const tripDetails = result.data;
        
        loadingElement.remove();
        renderSeatSelectionUI(tripDetails);
    } catch (error) {
        console.error('Lỗi khi tải thông tin chuyến xe:', error);
        alert('Đã xảy ra lỗi khi tải thông tin chỗ ngồi. Vui lòng thử lại sau.');
        
        const loadingElement = document.getElementById('loadingSeatSelection');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
}

// Khai báo selectedSeats ở cấp độ toàn cục dưới dạng mảng các đối tượng
let selectedSeats = [];

// Function to render the seat selection UI
function renderSeatSelectionUI(tripDetails) {
    const totalSeats = tripDetails.bus.seatCapacity;
    const bookedPhoneNumbers = tripDetails.bookedPhoneNumbers || [];
    const seats = generateSeatData(totalSeats, bookedPhoneNumbers);
    
    const seatSelectionModal = document.createElement('div');
    seatSelectionModal.id = 'seatSelectionModal';
    seatSelectionModal.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
    seatSelectionModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    seatSelectionModal.style.zIndex = '1050';
    
    const formattedPrice = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(tripDetails.price).replace('₫', 'đ');
    
    const departureDateTime = new Date(tripDetails.departureTime);
    const arriveDateTime = new Date(tripDetails.arriveTime);
    const departureTime = departureDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const arriveTime = arriveDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    seatSelectionModal.innerHTML = `
        <div class="bg-white rounded p-4" style="width: 900px; max-width: 95%; max-height: 90vh; overflow-y: auto;">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Giường nằm ${totalSeats} chỗ (Có WC)</h4>
                <h4 class="text-danger">${formattedPrice}</h4>
            </div>
            <div class="mb-3">
                <div class="d-flex align-items-center mb-2">
                    <i class="fa fa-circle me-2" style="color: #6c757d;"></i>
                    <span>${departureTime} • ${tripDetails.startLocation.name}</span>
                </div>
                <div class="ms-2 ps-2 border-start border-2 py-1">
                    <span class="text-muted">${tripDetails.estimatedTravelTime.hours}h${tripDetails.estimatedTravelTime.minutes}m</span>
                </div>
                <div class="d-flex align-items-center">
                    <i class="fa fa-circle me-2" style="color: #6c757d;"></i>
                    <span>${arriveTime} • ${tripDetails.endLocation.name}</span>
                </div>
            </div>
            <div class="d-flex justify-content-center mb-3">
                <div class="me-4">
                    <div class="d-flex align-items-center mb-2">
                        <div class="seat-example seat-available me-2"></div>
                        <span>Còn trống</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="seat-example seat-selected me-2"></div>
                        <span>Đang chọn</span>
                    </div>
                </div>
                <div>
                    <div class="d-flex align-items-center mb-2">
                        <div class="seat-example seat-unavailable me-2"></div>
                        <span>Ghế không bán</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="seat-example seat-booked me-2"></div>
                        <span>Đã đặt</span>
                    </div>
                </div>
            </div>
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5 class="text-center">Tầng dưới</h5>
                    <div id="lowerFloorSeats" class="seat-map p-3 border rounded"></div>
                </div>
                <div class="col-md-6">
                    <h5 class="text-center">Tầng trên</h5>
                    <div id="upperFloorSeats" class="seat-map p-3 border rounded"></div>
                </div>
            </div>
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <p class="mb-0">Số ghế: <span id="selectedSeatsCount">Vui lòng chọn ít nhất 1 chỗ ngồi</span></p>
                    <p class="mb-0">Tổng cộng: <span id="totalPrice" class="fw-bold">0 đ</span></p>
                </div>
                <div>
                    <button id="closeSelectionBtn" class="btn btn-outline-secondary me-2">Đóng lại</button>
                    <button id="continueSelectionBtn" class="btn btn-primary" disabled>Tiếp tục</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(seatSelectionModal);
    
    renderSeats(seats, tripDetails.price);
    
    document.getElementById('closeSelectionBtn').addEventListener('click', () => {
        seatSelectionModal.remove();
    });
    
    document.getElementById('continueSelectionBtn').addEventListener('click', () => {
        console.log("Selected seats:", selectedSeats);
        proceedToPassengerInfo(tripDetails, selectedSeats);
        seatSelectionModal.remove();
    });
}

// Function to generate seat data based on bus capacity
function generateSeatData(totalSeats, bookedPhoneNumbers) {
    const seatsData = [];
    
    let seatsPerFloor = totalSeats / 2;
    let numColumns = 3;
    let numRows = Math.ceil(seatsPerFloor / numColumns);
    
    if (totalSeats === 20) {
        seatsPerFloor = 10;
        numColumns = 2;
        numRows = 5;
    } else if (totalSeats === 36) {
        seatsPerFloor = 18;
        numColumns = 3;
        numRows = 6;
    } else if (totalSeats === 42) {
        seatsPerFloor = 21;
        numColumns = 3;
        numRows = 7;
    }
    
    if (totalSeats === 20) {
        const floor1Indices = [0, 1, 4, 5, 8, 9, 12, 13, 16, 17];
        const floor2Indices = [2, 3, 6, 7, 10, 11, 14, 15, 18, 19];
        
        for (let i = 0; i < totalSeats; i++) {
            let floor, floorSeatIndex;
            if (floor1Indices.includes(i)) {
                floor = 1;
                floorSeatIndex = floor1Indices.indexOf(i);
            } else {
                floor = 2;
                floorSeatIndex = floor2Indices.indexOf(i);
            }
            
            const row = Math.floor(floorSeatIndex / numColumns) + 1;
            const col = floorSeatIndex % numColumns;
            const colLabel = String.fromCharCode(65 + col);
            const seatNumber = `${colLabel}${row}-T${floor}`;
            
            const isBooked = bookedPhoneNumbers[i] !== null && bookedPhoneNumbers[i] !== "";
            
            seatsData.push({
                seatNumber,
                isBooked,
                floor,
                index: i
            });
        }
    } else {
        for (let i = 0; i < totalSeats; i++) {
            const groupIndex = Math.floor(i / 6);
            const positionInGroup = i % 6;
            const floor = positionInGroup < 3 ? 1 : 2;
            
            const floorSeatIndex = floor === 1
                ? Math.floor(i / 6) * 3 + (i % 3)
                : Math.floor((i - 3) / 6) * 3 + ((i - 3) % 3);
            const row = Math.floor(floorSeatIndex / numColumns) + 1;
            const col = floorSeatIndex % numColumns;
            const colLabel = String.fromCharCode(67 - col);
            const seatNumber = `${colLabel}${row}-T${floor}`;
            
            const isBooked = bookedPhoneNumbers[i] !== null && bookedPhoneNumbers[i] !== "";
            
            seatsData.push({
                seatNumber,
                isBooked,
                floor,
                index: i
            });
        }
    }
    
    return seatsData;
}

// Function to render seats
function renderSeats(seats, price) {
    const lowerFloorContainer = document.getElementById('lowerFloorSeats');
    const upperFloorContainer = document.getElementById('upperFloorSeats');
    
    lowerFloorContainer.innerHTML = '';
    upperFloorContainer.innerHTML = '';
    
    const totalSeats = seats.length;
    let numColumns = 3;
    if (totalSeats === 20) {
        numColumns = 2;
    } else if (totalSeats === 36 || totalSeats === 42) {
        numColumns = 3;
    }

    lowerFloorContainer.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
    upperFloorContainer.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
    
    selectedSeats = []; // Reset khi render lại
    
    seats.forEach(seat => {
        const seatElement = document.createElement('div');
        seatElement.className = `seat ${seat.isBooked ? 'seat-booked' : 'seat-available'}`;
        seatElement.textContent = seat.seatNumber;
        seatElement.dataset.seatNumber = seat.seatNumber;
        seatElement.dataset.index = seat.index;
        
        if (!seat.isBooked) {
            seatElement.addEventListener('click', function() {
                const seatNumber = this.dataset.seatNumber;
                const seatIndex = parseInt(this.dataset.index);
                
                if (this.classList.contains('seat-selected')) {
                    this.classList.remove('seat-selected');
                    this.classList.add('seat-available');
                    const index = selectedSeats.findIndex(s => s.seatNumber === seatNumber);
                    if (index > -1) {
                        selectedSeats.splice(index, 1);
                    }
                } else {
                    if (selectedSeats.length < 3) {
                        this.classList.remove('seat-available');
                        this.classList.add('seat-selected');
                        selectedSeats.push({ seatNumber, index: seatIndex });
                    } else {
                        alert('Bạn chỉ có thể chọn tối đa 3 ghế!');
                    }
                }
                updateSelectedSeatsInfo(selectedSeats, price);
            });
        }
        
        if (seat.floor === 1) {
            lowerFloorContainer.appendChild(seatElement);
        } else {
            upperFloorContainer.appendChild(seatElement);
        }
    });

    updateSelectedSeatsInfo(selectedSeats, price);
}

// Function to update selected seats information
function updateSelectedSeatsInfo(selectedSeats, price) {
    const selectedSeatsCountElement = document.getElementById('selectedSeatsCount');
    const totalPriceElement = document.getElementById('totalPrice');
    const continueButton = document.getElementById('continueSelectionBtn');
    
    if (selectedSeats.length === 0) {
        selectedSeatsCountElement.textContent = 'Vui lòng chọn ít nhất 1 chỗ ngồi';
        totalPriceElement.textContent = '0 đ';
        continueButton.disabled = true;
    } else {
        const seatNumbers = selectedSeats.map(seat => seat.seatNumber).join(', ');
        selectedSeatsCountElement.textContent = seatNumbers;
        
        const total = selectedSeats.length * price;
        const formattedTotal = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(total).replace('₫', 'đ');
        
        totalPriceElement.textContent = formattedTotal;
        continueButton.disabled = false;
    }
    console.log("Selected seats with indices:", selectedSeats);
}

function proceedToPassengerInfo(tripDetails, selectedSeats) {
    const validSeats = selectedSeats.filter(seat => 
        seat.seatNumber !== undefined && 
        seat.seatNumber !== null && 
        seat.seatNumber !== '' && 
        seat.index !== undefined
    );
    
    if (validSeats.length === 0) {
        alert('Vui lòng chọn ít nhất một ghế hợp lệ!');
        return;
    }

    sessionStorage.setItem('selectedTrip', JSON.stringify(tripDetails));
    sessionStorage.setItem('selectedSeats', JSON.stringify(validSeats));
    
    const totalAmount = tripDetails.price * validSeats.length;
    const departureDate = new Date(tripDetails.departureTime).toISOString().split('T')[0];
    
    // Định dạng departureTime và arriveTime theo định dạng thời gian địa phương để truyền vào URL
    const departureDateTime = new Date(tripDetails.departureTime);
    const arriveDateTime = new Date(tripDetails.arriveTime);
    const departureTime = departureDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const arriveTime = arriveDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const duration = `${tripDetails.estimatedTravelTime.hours} giờ ${tripDetails.estimatedTravelTime.minutes} phút`;
    
    const queryString = `?tripId=${encodeURIComponent(tripDetails._id)}` +
                        `&startPointId=${encodeURIComponent(tripDetails.startLocation._id)}` +
                        `&startPointName=${encodeURIComponent(tripDetails.startLocation.name)}` +
                        `&endPointId=${encodeURIComponent(tripDetails.endLocation._id)}` +
                        `&endPointName=${encodeURIComponent(tripDetails.endLocation.name)}` +
                        `&departureDate=${encodeURIComponent(departureDate)}` +
                        `&departureTime=${encodeURIComponent(departureTime)}` +
                        `&arriveTime=${encodeURIComponent(arriveTime)}` +
                        `&duration=${encodeURIComponent(duration)}` +
                        `&selectedSeats=${encodeURIComponent(JSON.stringify(validSeats))}` +
                        `&totalAmount=${encodeURIComponent(totalAmount)}`;
    
    window.loadContent(`tripSummary.html${queryString}`);
}

document.addEventListener('DOMContentLoaded', initializeTripSearch);