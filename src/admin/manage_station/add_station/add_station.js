import { fetchWithAuth } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";

document.querySelector('form').addEventListener('submit', async function(event) {
    event.preventDefault(); 
    
    const stationName = document.getElementById('stationName').value.trim();
    const address = document.getElementById('address').value.trim();
    const latitude = parseFloat(document.getElementById('latitude').value.trim());
    const longitude = parseFloat(document.getElementById('longitude').value.trim());

    // Kiểm tra tính hợp lệ của dữ liệu đầu vào
    if (!stationName || !address || isNaN(latitude) || isNaN(longitude)) {
      customDialog.showAlert("Lỗi!", "Vui lòng nhập đầy đủ và đúng định dạng thông tin!");
      return;
    }

    try {
      // Gửi request đến API thêm bến xe
      const response = await fetchWithAuth('http://localhost:4500/api/stations', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          name: stationName,
          address: address,
          coordinates: {
            latitude: latitude,
            longitude: longitude
          }
        })
      });

      // Xử lý kết quả trả về
      if (response.ok) {
        const data = await response.json();
        customDialog.showAlert("Thành công!", `Thêm bến xe thành công! Tên bến: ${stationName || 'Không rõ'}`);
        document.querySelector('form').reset();  // Reset form
      } else {
        const error = await response.json();
        customDialog.showAlert("Lỗi!", `Thêm bến xe thất bại: ${error.message || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      // Xử lý lỗi kết nối
      console.error('Error:', error);
      customDialog.showAlert("Lỗi!", "Không thể kết nối đến server! Vui lòng kiểm tra lại kết nối.");
    }
});