const getBusListApi = 'http://192.168.1.175:4500/api/bus';

// Hàm tải danh sách xe
async function loadBusList() {
  try {
    // Gửi yêu cầu GET để lấy danh sách xe
    const response = await fetch(getBusListApi);

    if (response.ok) {
      const result = await response.json();
      const buses = result.data.buses; // Lấy danh sách xe từ dữ liệu trả về

      // Hiển thị danh sách xe trong bảng
      const tableBody = document.getElementById('busTableBody');
      tableBody.innerHTML = ''; // Xóa nội dung cũ trong bảng

      buses.forEach((bus) => {
        const row = document.createElement('tr');

        // Tạo nội dung từng hàng
        row.innerHTML = `
          <td>${bus.busNumber}</td>
          <td>${bus.licensePlate}</td>
          <td>${bus.seatCapacity}</td>
          <td>${bus.busType}</td>
          <td>${bus.status}</td>
          <td>
            <button class="btn btn-warning btn-sm" onclick="editBus('${bus._id}')">Sửa</button>
            <button class="btn btn-danger btn-sm" onclick="deleteBus('${bus._id}')">Xóa</button>
          </td>
        `;

        // Thêm hàng vào bảng
        tableBody.appendChild(row);
      });
    } else {
      alert('Không thể tải danh sách xe!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Không thể kết nối đến server! Vui lòng kiểm tra lại.');
  }
}

// Hàm sửa xe (chuyển đến trang sửa xe)
function editBus(busId) {
  window.location.href = `/admin/manage_bus/edit_bus/edit_bus.html?id=${busId}`;
}

// Hàm xóa xe
async function deleteBus(busId) {
  if (confirm('Bạn có chắc chắn muốn xóa xe này không?')) {
    try {
      // Gửi yêu cầu DELETE đến API
      const deleteApi = `http://192.168.1.175:4500/api/bus/${busId}`;
      const response = await fetch(deleteApi, { method: 'DELETE' });

      if (response.ok) {
        alert('Xóa xe thành công!');
        loadBusList(); // Tải lại danh sách sau khi xóa
      } else {
        const error = await response.json();
        alert(`Xóa xe thất bại: ${error.message || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Không thể kết nối đến server!');
    }
  }
}

// Tải danh sách xe khi trang được tải
document.addEventListener('DOMContentLoaded', loadBusList);
