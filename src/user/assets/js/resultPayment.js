import { fetchWithAuth } from "../../../utils.js";
// Hàm lấy tham số từ URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Hàm hiển thị loading
function toggleLoading(show) {
    document.getElementById('loading-overlay').classList.toggle('active', show);
}

// Hàm cập nhật trạng thái vé
async function updatePaymentStatus(ticketIds, paymentMethod = 'UNKNOWN') {
    try {
        // Giả sử token được lưu trong localStorage
        const token = localStorage.getItem('authToken'); // Thay bằng cách lấy token thực tế
        if (!token) {
            throw new Error('Không tìm thấy thông tin xác thực');
        }

        toggleLoading(true);

        // Gửi yêu cầu cập nhật cho từng ticketId
        const updatePromises = ticketIds.map((ticketId) =>
            fetchWithAuth(`http://localhost:4500/api/tickets/update/${ticketId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    paymentStatus: 'paid',
                    paymentMethod: paymentMethod,
                }),
            }).then((response) => {
                if (!response.ok) {
                    throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
                }
                return response.json();
            })
        );

        const responses = await Promise.all(updatePromises);
        toggleLoading(false);
        return responses;
    } catch (error) {
        toggleLoading(false);
        console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
        throw error;
    }
}

// Hàm xử lý giao diện và logic
async function handlePaymentResult() {
    const success = getQueryParam('success') === 'true';
    const orderId = getQueryParam('orderId');
    const message = decodeURIComponent(getQueryParam('message') || '');

    const paymentIcon = document.getElementById('payment-icon');
    const paymentMessage = document.getElementById('payment-message');
    const paymentDetails = document.getElementById('payment-details');
    const paymentButton = document.getElementById('payment-button');

    if (success) {
        paymentIcon.innerHTML = '✅';
        paymentIcon.classList.add('icon-success');
        paymentMessage.textContent = 'Thanh toán thành công!';
        paymentDetails.textContent = `Mã đơn hàng: ${orderId}. ${message} Đang chuyển hướng sau 3 giây...`;
        paymentButton.style.display = 'none';

        // Giả sử orderId chứa danh sách ticketIds, phân tách bằng "-"
        const ticketIds = orderId.split('-');
        try {
            await updatePaymentStatus(ticketIds, 'UNKNOWN'); // Thay 'UNKNOWN' bằng phương thức thực tế nếu có
            // Chuyển hướng sau 3 giây
            setTimeout(() => {
                window.location.href = '/BusManage/src/user/index.html'; // Thay bằng URL màn hình mong muốn
            }, 3000);
        } catch (error) {
            paymentMessage.textContent = 'Lỗi khi cập nhật vé!';
            paymentDetails.textContent = 'Vui lòng liên hệ hỗ trợ.';
            paymentButton.textContent = 'Quay lại';
            paymentButton.classList.remove('btn-success');
            paymentButton.classList.add('btn-warning');
        }
    } else {
        paymentIcon.innerHTML = '❌';
        paymentIcon.classList.add('icon-failure');
        paymentMessage.textContent = 'Thanh toán thất bại!';
        paymentDetails.textContent = message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        paymentButton.textContent = 'Thử lại';
        paymentButton.classList.add('btn-danger');
        paymentButton.href = '/BusManage/src/user/payment.html'; // Trang thanh toán
    }
}

// Chạy khi trang tải
document.addEventListener('DOMContentLoaded', handlePaymentResult);