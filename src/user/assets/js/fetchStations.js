const BASE_URL = 'http://localhost:4500/api';

function initializeStations() {
  const startPointSelect = document.getElementById('diemKhoiHanh');
  const endPointSelect = document.getElementById('diemDen');
  const form = document.querySelector('#search-ticket form');
  const departureDateInput = document.getElementById('ngayKhoiHanh');
  let stations = [];

  if (!startPointSelect || !endPointSelect || !form) {
    console.log('Không tìm thấy các phần tử form cần thiết');
    return;
  }

  const setCurrentDate = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Định dạng YYYY-MM-DD
    departureDateInput.value = formattedDate; // Đặt ngày hiện tại
    departureDateInput.min = formattedDate;   // Chỉ cho phép chọn từ hôm nay trở đi
  };

  // Gọi hàm ngay khi load
  setCurrentDate();

  const fetchStations = async () => {
    try {
      const response = await fetch(`${BASE_URL}/stations`);
      if (!response.ok) throw new Error('Không thể tải danh sách trạm');
      const data = await response.json();
      stations = data.data;
      populateStartPoint(stations);
    } catch (error) {
      console.error('Error fetching stations:', error);
      // Fallback với dữ liệu mẫu nếu API không hoạt động
      stations = [
        { _id: 'ht', name: 'Hà Tĩnh' },
        { _id: 'hn', name: 'Hà Nội' },
        { _id: 'dn', name: 'Đà Nẵng' },
        { _id: 'hcm', name: 'TP. Hồ Chí Minh' }
      ];
      populateStartPoint(stations);
    }
  };

  const populateStartPoint = (stations) => {
    startPointSelect.innerHTML = '<option selected disabled>Chọn Điểm Khởi Hành</option>';
    stations.forEach(station => {
      const option = document.createElement('option');
      option.value = station._id;
      option.textContent = station.name;
      startPointSelect.appendChild(option);
    });
    endPointSelect.disabled = true;
  };

  const populateEndPoint = (selectedStartPoint) => {
    endPointSelect.innerHTML = '<option selected disabled>Chọn Điểm Đến</option>';
    const availableEndPoints = stations.filter(
      station => station._id !== selectedStartPoint
    );
    
    if (availableEndPoints.length === 0) {
      endPointSelect.innerHTML = '<option selected disabled>Không có điểm đến khả dụng</option>';
      endPointSelect.disabled = true;
    } else {
      availableEndPoints.forEach(station => {
        const option = document.createElement('option');
        option.value = station._id;
        option.textContent = station.name;
        endPointSelect.appendChild(option);
      });
      endPointSelect.disabled = false;
    }
  };

  startPointSelect.addEventListener('change', (e) => {
    const selectedStartPoint = e.target.value;
    populateEndPoint(selectedStartPoint);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const startPointId = startPointSelect.value;
    const endPointId = endPointSelect.value;
    const departureDate = departureDateInput.value;

    // Lấy tên của điểm đi và điểm đến từ các option đã chọn
    const startPointName = startPointSelect.options[startPointSelect.selectedIndex].text;
    const endPointName = endPointSelect.options[endPointSelect.selectedIndex].text;

    if (!startPointId || !endPointId || !departureDate) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }

    if (startPointId === endPointId) {
        alert('Điểm khởi hành và điểm đến không được trùng nhau');
        return;
    }

    // In ra console để debug
    console.log("Dữ liệu tìm kiếm:", {
        startPointId, startPointName,
        endPointId, endPointName,
        departureDate
    });

    const queryString = `&startPointId=${encodeURIComponent(startPointId)}&startPointName=${encodeURIComponent(startPointName)}&endPointId=${encodeURIComponent(endPointId)}&endPointName=${encodeURIComponent(endPointName)}&departureDate=${encodeURIComponent(departureDate)}`;
    window.loadContent(`trip.html?page=trip.html${queryString}`);
  });

  // Gọi hàm fetchStations để lấy dữ liệu
  fetchStations();
}

// Đảm bảo hàm được gọi khi document ready
document.addEventListener('DOMContentLoaded', function() {
  // Kiểm tra xem đã ở trang home chưa
  if (document.getElementById('search-ticket')) {
    initializeStations();
  }
});