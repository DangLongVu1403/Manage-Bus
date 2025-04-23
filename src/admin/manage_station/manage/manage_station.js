import { fetchWithAuth } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";

let stationData = []; // Cache station data

// Debounce function to limit search frequency
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

async function loadStationList() {
  try {
    // Only fetch data if cache is empty
    if (stationData.length === 0) {
      const response = await fetch('http://localhost:4500/api/stations');
      if (!response.ok) {
        customDialog.showAlert("Lỗi!", "Không thể tải danh sách bến xe!");
        return;
      }

      const result = await response.json();
      stationData = result?.data || [];

      if (stationData.length === 0) {
        customDialog.showAlert("Lỗi!", "Không có dữ liệu bến xe.");
        // Optional: Redirect to add station page
        // window.location.href = "/BusManage/src/admin/manage_station/add_station/add_station.html";
        return;
      }
    }

    // Lấy giá trị tìm kiếm từ input
    const searchValue = document.getElementById('searchInput').value.trim().toLowerCase();
    const searchNumber = parseFloat(searchValue); // Try converting to number for coordinates

    // Lọc danh sách theo tên, địa chỉ, vĩ độ, hoặc kinh độ
    const filteredStations = stationData.filter(station =>
      station.name.toLowerCase().includes(searchValue) ||
      station.address.toLowerCase().includes(searchValue) ||
      (!isNaN(searchNumber) && (
        station.coordinates.latitude.toString().includes(searchValue) ||
        station.coordinates.longitude.toString().includes(searchValue)
      ))
    );

    // Cập nhật bảng với dữ liệu đã lọc
    const tableBody = document.getElementById('stationTableBody');
    tableBody.innerHTML = '';

    if (filteredStations.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy kết quả.</td></tr>';
      return;
    }

    filteredStations.forEach(station => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${station.name}</td>
        <td>${station.address}</td>
        <td>${station.coordinates.latitude}</td>
        <td>${station.coordinates.longitude}</td>
        <td></td>
      `;

      // Tạo nút "Sửa"
      const editButton = document.createElement('button');
      editButton.className = "btn btn-warning btn-sm";
      editButton.textContent = "Sửa";
      editButton.addEventListener("click", () => editStation(station._id));

      // Tạo nút "Xóa"
      const deleteButton = document.createElement('button');
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.textContent = "Xóa";
      deleteButton.addEventListener("click", () => deleteStation(station._id));

      // Thêm nút vào cùng một ô nhưng ngăn cách bằng khoảng trắng
      const buttonContainer = row.children[4];
      buttonContainer.appendChild(editButton);
      buttonContainer.appendChild(document.createTextNode(" \t")); // Khoảng trắng
      buttonContainer.appendChild(deleteButton);

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error:', error);
    customDialog.showAlert("Lỗi!", "Không thể kết nối đến server! Vui lòng kiểm tra lại.");
  }
}

// Hàm sửa bến xe (chuyển đến trang sửa bến xe)
function editStation(stationId) {
  window.location.href = `/BusManage/src/admin/manage_station/edit_station/edit_station.html?id=${stationId}`;
}

// Hàm xóa bến xe
async function deleteStation(stationId) {
  customDialog.showConfirm("Xác nhận!", "Bạn có chắc chắn muốn xóa bến xe này không?", async function(result) {
    if (!result) return;
    try {
      // Gửi yêu cầu DELETE đến API
      const deleteApi = `http://localhost:4500/api/stations/${stationId}`;
      const response = await fetchWithAuth(deleteApi, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (response.ok) {
        customDialog.showAlert("Thành công!", "Xóa bến xe thành công!");
        stationData = stationData.filter(station => station._id !== stationId); // Update cache
        loadStationList(); // Tải lại danh sách sau khi xóa
      } else {
        const error = await response.json();
        customDialog.showAlert("Lỗi!", `Xóa bến xe thất bại: ${error.message || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      customDialog.showAlert("Lỗi!", "Không thể kết nối đến server!");
    }
  });
}

// Tải danh sách bến xe khi trang được tải và gắn sự kiện tìm kiếm
document.addEventListener('DOMContentLoaded', () => {
  loadStationList();
  // Gắn sự kiện tìm kiếm với debounce
  document.getElementById('searchInput').addEventListener('input', debounce(loadStationList, 300));
});