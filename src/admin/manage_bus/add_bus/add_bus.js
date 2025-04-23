import { fetchWithAuth } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";

document.querySelector('form').addEventListener('submit', async function(event) {
    event.preventDefault(); 
    
    const busNumber = document.getElementById('busNumber').value.trim();
    const licensePlate = document.getElementById('licensePlate').value.trim();
    const seatCapacity = parseInt(document.getElementById('seatCapacity').value.trim());
    const busType = document.getElementById('seatCapacity').value;
    const status = document.getElementById('status').value;

    // Kiểm tra tính hợp lệ của dữ liệu đầu vào
    if (!busNumber || !licensePlate || !seatCapacity) {
      customDialog.showAlert("Lỗi!","Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      // Gửi request đến API thêm xe
      const response = await fetchWithAuth('http://localhost:4500/api/bus', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          "busNumber": busNumber,
          "licensePlate": licensePlate,
          "seatCapacity": seatCapacity,
          "busType": busType,
          "status": status
        })
      });

      // Xử lý kết quả trả về
      if (response.ok) {
        const data = await response.json();
        customDialog.showAlert("Thành công!",`Thêm xe thành công! Số hiệu xe: ${busNumber || 'Không rõ'}`);
        document.querySelector('form').reset();  // Reset form
      } else {
        const error = await response.json();
        customDialog.showAlert("Lỗi!","Thêm xe thất bại: ${error.message || 'Có lỗi xảy ra'}");
      }
    } catch (error) {
      // Xử lý lỗi kết nối
      console.error('Error:', error);
      customDialog.showAlert("Lỗi!","Không thể kết nối đến server! Vui lòng kiểm tra lại kết nối.");
    }
  });