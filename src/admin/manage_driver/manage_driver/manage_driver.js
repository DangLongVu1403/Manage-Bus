import { fetchWithAuth } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";

let driverData = []; // Cache driver data

// Debounce function to limit search frequency
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

async function loadDriverList() {
  try {
    // Only fetch data if cache is empty
    if (driverData.length === 0) {
      const response = await fetch('http://localhost:4500/api/driver');
      if (!response.ok) {
        customDialog.showAlert("Lỗi!", "Không thể tải danh sách tài xế!");
        return;
      }

      const result = await response.json();
      driverData = result?.data?.drivers || [];

      if (driverData.length === 0) {
        customDialog.showAlert("Lỗi!", "Không có dữ liệu tài xế.");
        return;
      }
    }

    // Lấy giá trị tìm kiếm từ input
    const searchValue = document.getElementById('searchInput').value.trim().toLowerCase();

    // Lọc danh sách theo tên, số giấy phép, hoặc số điện thoại
    const filteredDrivers = driverData.filter(driver =>
      driver.name.toLowerCase().includes(searchValue) ||
      driver.licenseNumber.toLowerCase().includes(searchValue) ||
      driver.phone.toLowerCase().includes(searchValue)
    );

    // Cập nhật bảng với dữ liệu đã lọc
    const tableBody = document.getElementById('driverTableBody');
    tableBody.innerHTML = '';

    if (filteredDrivers.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy kết quả.</td></tr>';
      return;
    }

    filteredDrivers.forEach(driver => {
      const row = document.createElement('tr');
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

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error:', error);
    customDialog.showAlert("Lỗi!", "Không thể kết nối đến server! Vui lòng kiểm tra lại.");
  }
}

// Hàm sửa tài xế (chuyển đến trang sửa tài xế)
function editDriver(driverId) {
  window.location.href = `/BusManage/src/admin/manage_driver/edit_driver/edit_driver.html?id=${driverId}`;
}

// Hàm xóa tài xế
async function deleteDriver(driverId) {
  customDialog.showConfirm("Xác nhận!", "Bạn có chắc chắn muốn xóa tài xế này không?", async function(result) {
    if (!result) return;
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
        customDialog.showAlert("Thành công!", "Xóa tài xế thành công!");
        driverData = driverData.filter(driver => driver._id !== driverId); // Update cache
        loadDriverList(); // Tải lại danh sách sau khi xóa
      } else {
        const error = await response.json();
        customDialog.showAlert("Lỗi!", `Xóa tài xế thất bại: ${error.message || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      customDialog.showAlert("Lỗi!", "Không thể kết nối đến server!");
    }
  });
}

// Tải danh sách tài xế khi trang được tải và gắn sự kiện tìm kiếm
document.addEventListener('DOMContentLoaded', () => {
  loadDriverList();
  // Gắn sự kiện tìm kiếm với debounce
  document.getElementById('searchInput').addEventListener('input', debounce(loadDriverList, 300));
});