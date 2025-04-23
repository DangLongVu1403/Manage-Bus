import { fetchWithAuth, refreshAccessToken, logoutUser } from "../../../utils.js";

async function loadDriverList() {
  try {
    const response = await fetch('http://localhost:4500/api/driver');

    if (response.ok) {
      const result = await response.json();

      // Kiểm tra xem dữ liệu có chứa drivers không
      const drivers = result?.data?.drivers;

      if (!drivers || drivers.length === 0) {
        alert('Không có dữ liệu tài xế.');
        return;
      }

      // Hiển thị danh sách tài xế trong bảng
      const tableBody = document.getElementById('driverTableBody');
      tableBody.innerHTML = ''; // Xóa nội dung cũ trong bảng

      drivers.forEach((driver) => {
        const row = document.createElement('tr');

        // Tạo cột dữ liệu
        row.innerHTML = `
          <td>${driver.name}</td>
          <td>${driver.licenseNumber}</td>
          <td>${driver.phone}</td>
          <td></td>
          <td></td>
        `;

        // Tạo nút "Sửa"
        const editButton = document.createElement('button');
        editButton.className = "btn btn-warning btn-sm";
        editButton.textContent = "Sửa";
        editButton.addEventListener("click", () => editDriver(driver._id));

        // Tạo nút "Xóa"
        const deleteButton = document.createElement('button');
        deleteButton.className = "btn btn-danger btn-sm";
        deleteButton.textContent = "Xóa";
        deleteButton.addEventListener("click", () => deleteDriver(driver._id));

        // Gán nút vào các ô cột
        row.children[3].appendChild(editButton);
        row.children[4].appendChild(deleteButton);

        // Thêm hàng vào bảng
        tableBody.appendChild(row);
      });
    } else {
      alert('Không thể tải danh sách tài xế!');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Không thể kết nối đến server! Vui lòng kiểm tra lại.');
  }
}

// Hàm sửa tài xế (chuyển đến trang sửa tài xế)
function editDriver(driverId) {
  window.location.href = `/BusManage/src/admin/manage_driver/edit_driver/edit_driver.html?id=${driverId}`;
}

// Hàm xóa tài xế
async function deleteDriver(driverId) {
  if (confirm('Bạn có chắc chắn muốn xóa tài xế này không?')) {
    try {
      // Gửi yêu cầu DELETE đến API
      const deleteApi = `http://localhost:4500/api/driver/${driverId}`;
      const response = await fetchWithAuth(deleteApi, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (response.ok) {
        alert('Xóa tài xế thành công!');
        loadDriverList();
      } else {
        const error = await response.json();
        alert(`Xóa tài xế thất bại: ${error.message || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Không thể kết nối đến server!');
    }
  }
}

// Tải danh sách tài xế khi trang được tải
document.addEventListener('DOMContentLoaded', loadDriverList);
