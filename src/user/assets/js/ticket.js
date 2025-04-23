// ticket.js
import { fetchWithAuth } from "../../../utils.js";
const BASE_URL = 'http://localhost:4500/api';

// Khởi tạo quản lý vé
function initializeTicketManagement() {
  // Các hàm tiện ích
  // ------------------------------------
  
  // Hàm lấy token từ localStorage
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || '';
  };

  // Hàm định dạng thời gian
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Hàm định dạng ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Hàm định dạng giá tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  // Hàm định dạng số ghế
  const formatSeatNumber = (seatNumber, seatCapacity) => {
    return { seatNumber: `A${seatNumber.toString().padStart(2, '0')}` };
  };

  // Hàm chuyển đổi trạng thái vé thành CSS class
  const getHeaderClass = (status, paymentStatus) => {
    if (status === 'cancelled') return 'cancelled';
    if (status === 'used') return 'used';
    if (status === 'booked' && paymentStatus === 'pending') return 'pending';
    return '';
  };

  // Hàm chuyển đổi trạng thái vé thành icon và text
  const getStatusBadge = (status, paymentStatus) => {
    if (status === 'cancelled') {
      return '<i class="fas fa-times-circle"></i> Đã hủy';
    } else if (status === 'used') {
      return '<i class="fas fa-check-double"></i> Đã sử dụng';
    } else if (status === 'booked') {
      if (paymentStatus === 'pending') {
        return '<i class="fas fa-clock"></i> Chờ thanh toán';
      } else {
        return '<i class="fas fa-check-circle"></i> Đã xác nhận';
      }
    }
    return '<i class="fas fa-question-circle"></i> Không xác định';
  };

  // Hàm tạo mã đặt vé
  const generateBookingCode = (id) => {
    return id; // Trả về trực tiếp ticket._id
  };

  // Hàm tạo các tính năng xe
  const getBusFeatures = (busType) => {
    const features = [
      '<div class="feature-tag"><i class="fas fa-wifi"></i> WiFi</div>',
      '<div class="feature-tag"><i class="fas fa-snowflake"></i> Máy lạnh</div>',
    ];
    if (busType === 'limousine' || busType === 'premium' || !busType) {
      features.push('<div class="feature-tag"><i class="fas fa-utensils"></i> Bữa nhẹ</div>');
      features.push('<div class="feature-tag"><i class="fas fa-toilet"></i> Toilet</div>');
      features.push('<div class="feature-tag"><i class="fas fa-plug"></i> Ổ cắm điện</div>');
    }
    return features.join('');
  };

  // Tạo giao diện người dùng
  // ------------------------------------
  
  // Hàm tạo HTML cho một vé
  const createTicketHTML = (ticket) => {
    const bookingCode = generateBookingCode(ticket._id);
    const bookingDate = new Date().toLocaleDateString('vi-VN');
    const headerClass = getHeaderClass(ticket.status, ticket.paymentStatus);
    const statusBadge = getStatusBadge(ticket.status, ticket.paymentStatus);
    
    let seatDisplay = 'N/A';
    try {
      seatDisplay = formatSeatNumber(ticket.seatNumber, ticket.trip?.bus?.seatCapacity).seatNumber;
    } catch (error) {
      console.warn(`Invalid seat number for ticket ${ticket._id}:`, error);
    }
    
    const ticketPrice = ticket.trip.price
    
    return `
      <div class="ticket-card" data-ticket-id="${ticket._id}">
        <div class="ticket-header ${headerClass}">
          <div class="booking-info">
            Mã đặt vé: <strong>${bookingCode}</strong> | Ngày đặt: ${bookingDate}
          </div>
          <span class="status-badge">${statusBadge}</span>
        </div>
        <div class="ticket-body">
          <div class="route-info">
            <div class="location">
              <div class="location-name">${ticket.trip?.startLocation?.name || 'N/A'}</div>
              <div class="location-type">Điểm khởi hành</div>
            </div>
            <div class="route-arrow">
              <i class="fas fa-arrow-right"></i>
            </div>
            <div class="location">
              <div class="location-name">${ticket.trip?.endLocation?.name || 'N/A'}</div>
              <div class="location-type">Điểm đến</div>
            </div>
          </div>
          <div class="travel-info">
            <div class="info-group">
              <div class="info-label">Ngày khởi hành</div>
              <div class="info-value">${formatDate(ticket.trip?.departureTime) || 'N/A'}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Giờ khởi hành</div>
              <div class="info-value">${formatTime(ticket.trip?.arriveTime) || 'N/A'}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Số ghế</div>
              <div class="info-value">${seatDisplay}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Biển số xe</div>
              <div class="info-value">${ticket.trip?.bus?.licensePlate || 'N/A'}</div>
            </div>
          </div>
          ${getBusFeatures(ticket.trip?.bus?.type)}
          ${ticket.paymentStatus === 'pending' ? `
          <div class="alert alert-warning mt-3 mb-0">
            <i class="fas fa-exclamation-triangle me-2"></i>Vui lòng thanh toán trước 
            ${new Date(new Date().setDate(new Date().getDate() + 2)).toLocaleDateString('vi-VN')} - 23:59. 
            Sau thời gian này đặt vé sẽ tự động bị hủy.
          </div>
          ` : ''}
        </div>
        <div class="ticket-footer">
          <div class="ticket-actions">
            ${ticket.status === 'booked' && ticket.paymentStatus === 'pending' ? `
              <button class="btn btn-primary btn-sm pay-btn" data-ticket-id="${ticket._id}">
                <i class="fas fa-credit-card me-1"></i> Thanh toán ngay
              </button>
              <button class="btn btn-outline-danger btn-sm cancel-btn" data-ticket-id="${ticket._id}">
                <i class="fas fa-times-circle me-1"></i> Hủy vé
              </button>
            ` : ticket.status === 'used' ? `
              <button class="btn btn-outline-primary btn-sm detail-btn" data-ticket-id="${ticket._id}">
                <i class="fas fa-eye me-1"></i> Chi tiết
              </button>
              <button class="btn btn-outline-success btn-sm review-btn" data-ticket-id="${ticket._id}">
                <i class="fas fa-star me-1"></i> Đánh giá
              </button>
            ` : `
              <button class="btn btn-outline-primary btn-sm detail-btn" data-ticket-id="${ticket._id}">
                <i class="fas fa-eye me-1"></i> Chi tiết
              </button>
              <button class="btn btn-outline-secondary btn-sm print-btn" data-ticket-id="${ticket._id}">
                <i class="fas fa-print me-1"></i> In vé
              </button>
            `}
          </div>
          <div class="price-info">
            <div class="price-label">Tổng tiền</div>
            <div class="price-value">${formatCurrency(ticketPrice)}</div>
          </div>
        </div>
      </div>
    `;
  };

  // Hàm tạo giao diện trống
  const createEmptyState = (message, icon = 'ticket-alt') => {
    return `
      <div class="empty-state">
        <i class="fas fa-${icon} mb-3"></i>
        <p>${message}</p>
        <button class="btn btn-outline-primary refresh-btn">
          <i class="fas fa-sync-alt me-2"></i> Làm mới
        </button>
      </div>
    `;
  };

  // Tương tác với API
  // ------------------------------------
  
  // Hà SAFM lấy danh sách vé từ API
  const fetchTickets = async () => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/tickets/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        return data.tickets || [];
      } else {
        alert('Không thể tải dữ liệu vé: ' + data.message);
        return [];
      }
    } catch (error) {
      alert('Không thể kết nối đến server. Vui lòng thử lại sau.');
      return [];
    }
  };

  // Hiển thị và xử lý danh sách vé
  // ------------------------------------
  
  // Hàm hiển thị danh sách vé
  const renderTickets = (tickets, searchTerm = '') => {
    const containers = {
      all: document.getElementById('all'),
      booked: document.getElementById('booked'),
      pending: document.getElementById('pending'),
      used: document.getElementById('used'),
      cancelled: document.getElementById('cancelled'),
    };

    // Nếu không có vé
    if (!tickets || tickets.length === 0) {
      containers.all.innerHTML = createEmptyState('Bạn chưa có vé nào. Hãy đặt vé để bắt đầu hành trình!', 'ticket-alt');
      containers.booked.innerHTML = createEmptyState('Không có vé nào đã xác nhận.', 'check-circle');
      containers.pending.innerHTML = createEmptyState('Không có vé nào đang chờ thanh toán.', 'clock');
      containers.used.innerHTML = createEmptyState('Không có vé nào đã sử dụng.', 'check-double');
      containers.cancelled.innerHTML = createEmptyState('Không có vé nào đã hủy.', 'times-circle');
      return;
    }

    // Lọc vé theo tìm kiếm
    const filteredTickets = searchTerm
      ? tickets.filter(ticket =>
          (ticket.trip?.startLocation?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ticket.trip?.endLocation?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          generateBookingCode(ticket._id).toLowerCase().includes(searchTerm.toLowerCase())
        )
      : tickets;

    // Lọc vé theo trạng thái
    const bookedTickets = filteredTickets.filter(ticket => ticket.status === 'booked' && ticket.paymentStatus === 'paid');
    const pendingTickets = filteredTickets.filter(ticket => ticket.status === 'booked' && ticket.paymentStatus === 'pending');
    const usedTickets = filteredTickets.filter(ticket => ticket.status === 'used');
    const cancelledTickets = filteredTickets.filter(ticket => ticket.status === 'cancelled');

    // Hiển thị vé
    containers.all.innerHTML = filteredTickets.length > 0
      ? filteredTickets.map(createTicketHTML).join('')
      : createEmptyState('Không tìm thấy vé phù hợp.', 'search');
    containers.booked.innerHTML = bookedTickets.length > 0
      ? bookedTickets.map(createTicketHTML).join('')
      : createEmptyState('Không có vé nào đã xác nhận.', 'check-circle');
    containers.pending.innerHTML = pendingTickets.length > 0
      ? pendingTickets.map(createTicketHTML).join('')
      : createEmptyState('Không có vé nào đang chờ thanh toán.', 'clock');
    containers.used.innerHTML = usedTickets.length > 0
      ? usedTickets.map(createTicketHTML).join('')
      : createEmptyState('Không có vé nào đã sử dụng.', 'check-double');
    containers.cancelled.innerHTML = cancelledTickets.length > 0
      ? cancelledTickets.map(createTicketHTML).join('')
      : createEmptyState('Không có vé nào đã hủy.', 'times-circle');
      
    // Thiết lập các sự kiện sau khi render
    setupActionButtons();
  };

  // Cập nhật và làm mới
  // ------------------------------------
  
  // Hàm làm mới dữ liệu
  const onRefresh = async () => {
    const refreshButtons = document.querySelectorAll('.refresh-btn');
    refreshButtons.forEach(btn => btn.classList.add('disabled'));
    const tickets = await fetchTickets();
    renderTickets(tickets, document.getElementById('searchInput').value);
    refreshButtons.forEach(btn => btn.classList.remove('disabled'));
  };

  // Xử lý sự kiện
  // ------------------------------------
  
  // Hàm xử lý sự kiện nút hành động
  const setupActionButtons = () => {
    document.querySelectorAll('.ticket-card').forEach(card => {
      const ticketId = card.getAttribute('data-ticket-id');

      // Xử lý nút Chi tiết
      card.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          window.location.href = `/ticket-detail.html?id=${ticketId}`;
        });
      });

      // Xử lý nút Thanh toán (giả lập)
      card.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          alert(`Chuyển hướng đến trang thanh toán cho vé ID: ${ticketId}`);
          // Thêm logic chuyển hướng đến cổng thanh toán
        });
      });

      // Xử lý nút Hủy vé (giả lập)
      card.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Bạn có chắc muốn hủy vé này?')) {
            try {
              const response = await fetchWithAuth(`${BASE_URL}/tickets/${ticketId}/cancel`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${getAuthToken()}`,
                },
              });
              const data = await response.json();
              if (data.success) {
                alert('Hủy vé thành công!');
                onRefresh();
              } else {
                alert('Hủy vé thất bại: ' + data.message);
              }
            } catch (error) {
              alert('Lỗi khi hủy vé: ' + error.message);
            }
          }
        });
      });

      // Xử lý nút Đánh giá (giả lập)
      card.querySelectorAll('.review-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          alert(`Mở form đánh giá cho vé ID: ${ticketId}`);
          // Thêm logic mở form đánh giá
        });
      });

      // Xử lý nút In vé (giả lập)
      card.querySelectorAll('.print-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          alert(`In vé ID: ${ticketId}`);
          // Thêm logic in vé
        });
      });
    });
  };
  
  // Thiết lập sự kiện cho các tab
  const setupTabEvents = () => {
    document.querySelectorAll('#ticketTabs .nav-link').forEach(tab => {
      tab.addEventListener('shown.bs.tab', () => {
        setupActionButtons();
      });
    });
  };
  
  // Thiết lập sự kiện tìm kiếm
  const setupSearchEvent = (tickets) => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderTickets(tickets, searchInput.value);
      });
    }
  };
  
  // Thiết lập sự kiện làm mới
  const setupRefreshEvent = () => {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.refresh-btn')) {
        onRefresh();
      }
    });
  };

  // Khởi tạo chính
  // ------------------------------------
  
  // Khởi tạo tất cả
  const initialize = async () => {
    // Lấy và hiển thị vé
    const tickets = await fetchTickets();
    renderTickets(tickets);

    // Thiết lập các sự kiện
    setupSearchEvent(tickets);
    setupRefreshEvent();
    setupTabEvents();
  };

  // Chạy hàm khởi tạo
  initialize();
}

// Gắn hàm vào window để mã HTML có thể gọi
window.initializeTicketManagement = initializeTicketManagement;

// Thực thi khi trang được tải (tùy chọn, có thể giữ hoặc xóa nếu không cần)
document.addEventListener('DOMContentLoaded', initializeTicketManagement);