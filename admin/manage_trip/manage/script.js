document.addEventListener("DOMContentLoaded", function () {
    const datePicker = document.getElementById("datePicker");
    const tripTableBody = document.getElementById("tripTableBody");
    const errorMessage = document.getElementById("errorMessage");
  
    // Đặt ngày mặc định là hôm nay
    const today = new Date().toISOString().split("T")[0];
    datePicker.value = today;
  
    // Hàm lấy dữ liệu chuyến xe từ API
    async function fetchTrips(date) {
      try {
        const response = await fetch(`http://192.168.1.175:4500/api/trips/?time=${date}`);
        const result = await response.json();
  
        if (response.ok) {
          renderTrips(result.data.trips);
          errorMessage.innerText = ""; // Xóa thông báo lỗi
        } else {
          throw new Error(result.message || "Không thể tải dữ liệu chuyến xe.");
        }
      } catch (error) {
        errorMessage.innerText = error.message;
        tripTableBody.innerHTML = ""; // Xóa bảng nếu có lỗi
      }
    }
  
    // Hàm hiển thị dữ liệu chuyến xe
    async function renderTrips(trips) {
      tripTableBody.innerHTML = ""; // Xóa dữ liệu cũ
  
      for (const trip of trips) {
        const busLicensePlate = await fetchBusLicensePlate(trip.bus); // Lấy biển số xe từ ID bus
        const row = `
          <tr data-trip-id="${trip._id}">
            <td>${trip.startLocation}</td>
            <td>${trip.endLocation}</td>
            <td>${busLicensePlate || "Không có thông tin"}</td>
            <td>${formatDateTime(trip.departureTime)}</td>
            <td>${formatDateTime(trip.arriveTime)}</td>
            <td>${trip.price.toLocaleString()} VND</td>
            <td>${trip.availableSeats}</td>
            <td>
              <button class="btn btn-warning btn-sm btn-edit">Sửa</button>
              <button class="btn btn-danger btn-sm btn-delete">Xóa</button>
            </td>
          </tr>
        `;
        tripTableBody.innerHTML += row;
      }
  
      attachActionHandlers(); // Thêm sự kiện cho các nút Sửa và Xóa
    }
  
    // Hàm lấy biển số xe từ API bus
    async function fetchBusLicensePlate(busId) {
      try {
        const response = await fetch(`http://192.168.1.175:4500/api/bus/${busId}`);
        const result = await response.json();
  
        if (response.ok) {
          return result.data.licensePlate; // Trả về biển số
        } else {
          console.error(`Không tìm thấy bus với ID: ${busId}`);
          return null;
        }
      } catch (error) {
        console.error("Lỗi khi lấy biển số xe:", error);
        return null;
      }
    }
  
    // Hàm định dạng thời gian ISO -> DD/MM/YYYY HH:mm
    function formatDateTime(isoString) {
      const date = new Date(isoString);
      return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
    }
  
    // Thêm sự kiện cho các nút Sửa và Xóa
    function attachActionHandlers() {
      // Xử lý nút Sửa
      const editButtons = document.querySelectorAll(".btn-edit");
      editButtons.forEach(button => {
        button.addEventListener("click", function () {
          const tripId = this.closest("tr").dataset.tripId;
          editTrip(tripId);
        });
      });
  
      // Xử lý nút Xóa
      const deleteButtons = document.querySelectorAll(".btn-delete");
      deleteButtons.forEach(button => {
        button.addEventListener("click", function () {
          const tripId = this.closest("tr").dataset.tripId;
          deleteTrip(tripId);
        });
      });
    }
  
    // Hàm xử lý Sửa chuyến xe
    function editTrip(tripId) {
      window.location.href = `/admin/manage_trip/edit_trip/edit_trip.html?id=${tripId}`;
    }
  
    // Hàm xử lý Xóa chuyến xe
    async function deleteTrip(tripId) {
      const confirmDelete = confirm("Bạn có chắc chắn muốn xóa chuyến xe này?");
      if (confirmDelete) {
        try {
          const token = localStorage.getItem("authToken"); // Giả sử token được lưu trong localStorage

          if (!token) {
            responseMessage.innerText = "Lỗi: Không tìm thấy token.";
            responseMessage.style.color = "red";
            return;
          }
          const response = await fetch(`http://192.168.1.175:4500/api/trips/${tripId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // Thêm token vào header
            },
          });
  
          if (response.ok) {
            alert("Xóa chuyến xe thành công!");
            const selectedDate = datePicker.value; // Lấy ngày hiện tại
            fetchTrips(selectedDate); // Cập nhật lại bảng
          } else {
            const result = await response.json();
            alert(result.message || "Không thể xóa chuyến xe.");
          }
        } catch (error) {
          console.error("Lỗi khi xóa chuyến xe:", error);
          alert("Đã xảy ra lỗi, vui lòng thử lại.");
        }
      }
    }
  
    // Lắng nghe sự kiện thay đổi ngày
    datePicker.addEventListener("change", function () {
      const selectedDate = datePicker.value;
      fetchTrips(selectedDate);
    });
  
    // Lấy dữ liệu mặc định của hôm nay
    fetchTrips(today);
  });
  