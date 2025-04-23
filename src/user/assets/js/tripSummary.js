import { fetchWithAuth, refreshAccessToken, logoutUser } from "../../../utils.js";
(function() {
    console.log('Bắt đầu thực thi tripSummary.js'); // Debug

    // Khai báo biến trong phạm vi IIFE
    let selectedPaymentMethod = null;
    let tripDetails = null;
    let selectedSeats = [];
    let validSeats = [];
    let totalRequested = 0;
    let totalBooked = 0;
    let userToken = localStorage.getItem('authToken') || '';
    let phone = localStorage.getItem('phone') || '';

    // Hàm khởi tạo
    function initializeTripSummary() {
        const urlParams = new URLSearchParams(window.location.search);
        console.log('URL params:', urlParams.toString()); // Debug

        const startPointName = urlParams.get('startPointName');
        const endPointName = urlParams.get('endPointName');
        const departureDate = urlParams.get('departureDate');
        const totalAmount = urlParams.get('totalAmount');
        const seatsString = urlParams.get('selectedSeats');
        const departureTime = urlParams.get('departureTime');
        const arriveTime = urlParams.get('arriveTime');
        const tripId = urlParams.get('tripId');
        const duration = urlParams.get('duration');

        tripDetails = { _id: tripId };

        if (departureDate) {
            const dateObj = new Date(departureDate);
            const formattedDate = dateObj.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const dateDisplay = document.querySelector('.date-display');
            if (dateDisplay) {
                dateDisplay.innerHTML = `<i class="far fa-calendar-alt"></i> Ngày khởi hành: ${formattedDate}`;
            }
        }

        if (startPointName) {
            const startLocation = document.querySelector('.location-container:first-child .location-text');
            if (startLocation) {
                startLocation.textContent = decodeURIComponent(startPointName);
            }
        }

        if (endPointName) {
            const endLocation = document.querySelector('.location-container:last-child .location-text');
            if (endLocation) {
                endLocation.textContent = decodeURIComponent(endPointName);
            }
        }

        if (departureTime) {
            const departureTimeDisplay = document.querySelector('.location-container:first-child .time-text');
            if (departureTimeDisplay) {
                departureTimeDisplay.textContent = departureTime;
            }
        }

        if (arriveTime) {
            const arriveTimeDisplay = document.querySelector('.location-container:last-child .time-text');
            if (arriveTimeDisplay) {
                arriveTimeDisplay.textContent = arriveTime;
            }
        }

        if (duration) {
            const durationDisplay = document.querySelector('.timing-text');
            if (durationDisplay) {
                durationDisplay.textContent = duration;
            }
        }

        if (seatsString) {
            try {
                const seats = JSON.parse(decodeURIComponent(seatsString));
                selectedSeats = seats;
                if (seats && seats.length > 0) {
                    const seatNumbers = seats.map(seat => seat.seatNumber);
                    const seatDisplay = document.querySelector('.seat-numbers');
                    if (seatDisplay) {
                        seatDisplay.textContent = seatNumbers.join(', ');
                    }
                }
            } catch (e) {
                console.error('Lỗi khi parse ghế từ URL:', e);
            }
        }

        if (totalAmount) {
            const totalDisplay = document.querySelector('.total-amount');
            if (totalDisplay) {
                totalDisplay.textContent = new Intl.NumberFormat('vi-VN').format(totalAmount) + ' VND';
            }
        }

        const firstPaymentMethod = document.querySelector('.payment-method-item');
        if (firstPaymentMethod) {
            firstPaymentMethod.classList.add('active');
            selectedPaymentMethod = firstPaymentMethod.getAttribute('data-id');
        }

        const paymentMethods = document.querySelectorAll('.payment-method-item');
        paymentMethods.forEach(item => {
            item.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                selectPaymentMethod(this, id);
            });
        });

        // Gắn sự kiện cho các nút
        attachEventListeners();
    }

    function showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    function hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    function showConfirmModal(message) {
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        if (modal && messageElement) {
            messageElement.textContent = message;
            modal.style.display = 'flex';
        }
    }

    function hideConfirmModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function selectPaymentMethod(element, id) {
        const paymentMethods = document.querySelectorAll('.payment-method-item');
        paymentMethods.forEach(item => item.classList.remove('active'));
        element.classList.add('active');
        selectedPaymentMethod = id;
    }

    async function cancelBooking() {
        hideConfirmModal();
        showLoading();
        try {
            const deletePromises = validSeats.map(ticketId =>
                fetchWithAuth(`http://localhost:4500/api/tickets/${ticketId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`,
                    },
                })
            );
            await Promise.all(deletePromises);
            hideLoading();
            alert('Đã hủy đặt vé');
            window.history.back();
        } catch (error) {
            console.error('Lỗi khi hủy đặt vé:', error);
            hideLoading();
            alert('Đã xảy ra lỗi khi hủy đặt vé');
        }
    }

    async function proceedPayment() {
        hideConfirmModal();
        showLoading();
        try {
            const paymentMethods = [
                { id: '1', code: "MOMO" },
                { id: '2', code: "VNPAY" }
            ];
            const selectedMethod = paymentMethods.find(
                method => method.id === selectedPaymentMethod
            );
            if (!selectedMethod) {
                alert('Phương thức thanh toán không hợp lệ');
                hideLoading();
                return;
            }
            const urlParams = new URLSearchParams(window.location.search);
            const totalAmount = urlParams.get('totalAmount');
            const adjustedAmount = (totalAmount / totalRequested) * totalBooked;
            const response = await fetch(`http://localhost:4500/api/payment/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: adjustedAmount,
                    orderId: validSeats.join('-'),
                    orderInfo: 'Thanh toán vé xe',
                    provider: selectedMethod.code,
                }),
            });
            const result = await response.json();
            if (result.success) {
                hideLoading();
                window.location.href = result.data.paymentUrl;
            } else {
                hideLoading();
                alert(result.message || 'Thanh toán thất bại');
            }
        } catch (error) {
            console.error('Lỗi khi thanh toán:', error);
            hideLoading();
            alert('Đã xảy ra lỗi khi thanh toán');
        }
    }

    function proceedToPayment(ticketIds, totalRequested, totalBooked) {
        validSeats = ticketIds.split('-');
        if (totalBooked < totalRequested) {
            const message = `Đã đặt thành công ${totalBooked}/${totalRequested} ghế. Tiếp tục thanh toán?`;
            showConfirmModal(message);
        } else {
            proceedPayment();
        }
    }

    async function confirmPayment() {
        if (!selectedPaymentMethod) {
            alert('Vui lòng chọn phương thức thanh toán!');
            return;
        }
        const confirmButton = document.getElementById('confirmButton');
        if (confirmButton) {
            confirmButton.disabled = true;
        }
        showLoading();
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const tripId = urlParams.get('tripId');
            const seatsString = urlParams.get('selectedSeats');
            let seatData = [];
            try {
                seatData = JSON.parse(decodeURIComponent(seatsString));
            } catch (e) {
                console.error('Lỗi khi parse ghế từ URL:', e);
                hideLoading();
                if (confirmButton) confirmButton.disabled = false;
                alert('Dữ liệu ghế không hợp lệ');
                return;
            }
            const seatIndices = seatData.map(seat => seat.index);
            const requestBody = {
                tripId: tripId,
                seatNumbers: seatIndices,
                phone: phone
            };
            const responseBook = await fetchWithAuth(`http://localhost:4500/api/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify(requestBody),
            });
            const checkResult = await responseBook.json();
            if (!checkResult.success) {
                hideLoading();
                if (confirmButton) confirmButton.disabled = false;
                alert('Kiểm tra ghế thất bại');
                return;
            }
            const { bookedSeats, failedSeats } = checkResult.data || { bookedSeats: [], failedSeats: [] };
            const validSeatIds = bookedSeats.map(item => item.ticketId).join('-');
            totalRequested = checkResult.data.totalRequested;
            totalBooked = checkResult.data.totalBooked;
            if (failedSeats.length > 0) {
                hideLoading();
                if (confirmButton) confirmButton.disabled = false;
                const message = `Một số ghế không khả dụng: ${failedSeats.join(', ')}. Bạn có muốn tiếp tục với các ghế còn lại?`;
                showConfirmModal(message);
            } else {
                hideLoading();
                if (confirmButton) confirmButton.disabled = false;
                proceedToPayment(validSeatIds, totalRequested, totalBooked);
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra ghế:', error);
            hideLoading();
            if (confirmButton) confirmButton.disabled = false;
            alert('Đã xảy ra lỗi. Vui lòng thử lại sau');
        }
    }

    function attachEventListeners() {
        const confirmButton = document.getElementById('confirmButton');
        if (confirmButton) {
            confirmButton.addEventListener('click', confirmPayment);
        }
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelBooking);
        }
        const confirmModalBtn = document.getElementById('confirmBtn');
        if (confirmModalBtn) {
            confirmModalBtn.addEventListener('click', proceedPayment);
        }
    }

    // Xuất hàm ra global scope
    window.initializeTripSummary = initializeTripSummary;
})();