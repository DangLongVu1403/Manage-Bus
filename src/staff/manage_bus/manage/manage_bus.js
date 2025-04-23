import { fetchWithAuth } from "../../../utils.js";

async function loadBusList() {
  try {
    // Lấy danh sách xe từ API
    const response = await fetch('http://localhost:4500/api/bus');
    if (!response.ok) {
      alert('Không thể tải danh sách xe!');
      return;
    }

    const result = await response.json();
    const buses = result?.data?.buses || [];

    if (buses.length === 0) {
      alert('Không có dữ liệu xe.');
      return;
    }

    // Lấy giá trị tìm kiếm từ input
    const searchValue = document.getElementById('searchInput').value.trim().toLowerCase();

    // Lọc danh sách theo số xe hoặc biển số xe
    const filteredBuses = buses.filter(bus =>
      bus.busNumber.toLowerCase().includes(searchValue) ||
      bus.licensePlate.toLowerCase().includes(searchValue)
    );

    // Cập nhật bảng với dữ liệu đã lọc
    const tableBody = document.getElementById('busTableBody');
    tableBody.innerHTML = '';

    if (filteredBuses.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không tìm thấy kết quả.</td></tr>';
      return;
    }

    filteredBuses.forEach(bus => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${bus.busNumber}</td>
        <td>${bus.licensePlate}</td>
        <td>${bus.seatCapacity}</td>
        <td>${bus.seatCapacity === 42 ? bus.seatCapacity + ' giường' : bus.seatCapacity + ' phòng'}</td>
        <td>${bus.status}</td>
        <td></td>
      `;

      // Tạo nút "Sửa"
      const editButton = document.createElement('button');
      editButton.className = "btn btn-warning btn-sm";
      editButton.textContent = "Sửa";
      editButton.addEventListener("click", () => editBus(bus._id));

      // Tạo nút "Xóa"
      const deleteButton = document.createElement('button');
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.textContent = "Xóa";
      deleteButton.addEventListener("click", () => deleteBus(bus._id));

      // Thêm nút vào cùng một ô nhưng ngăn cách bằng khoảng trắng
      const buttonContainer = row.children[5];
      buttonContainer.appendChild(editButton);
      buttonContainer.appendChild(document.createTextNode(" \t")); // Khoảng trắng
      buttonContainer.appendChild(deleteButton);

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error:', error);
    alert('Không thể kết nối đến server! Vui lòng kiểm tra lại.');
  }
}

// Hàm sửa xe (chuyển đến trang sửa xe)
function editBus(busId) {
  window.location.href = `/BusManage/src/admin/manage_bus/edit_bus/edit_bus.html?id=${busId}`;
}

// Hàm xóa xe
async function deleteBus(busId) {
  if (confirm('Bạn có chắc chắn muốn xóa xe này không?')) {
    try {
      // Gửi yêu cầu DELETE đến API
      const deleteApi = `http://localhost:4500/api/bus/${busId}`;
      const response = await fetchWithAuth(deleteApi, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`
        }
      });

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
