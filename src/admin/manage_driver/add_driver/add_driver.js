import { fetchWithAuth } from "../../../utils.js";
import customDialog from "../../../dialog/dialog.js";

document.querySelector('form').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const licenseNumber = document.getElementById('licenseNumber').value.trim();
    const nameDriver = document.getElementById('nameDriver').value.trim();
    const phoneNumberDriver = document.getElementById('phoneNumberDriver').value;

    // Kiểm tra tính hợp lệ của dữ liệu đầu vào
    if (!licenseNumber || !nameDriver || !phoneNumberDriver) {
      customDialog.showAlert("Thông báo!","Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const response = await fetchWithAuth('http://localhost:4500/api/driver', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          "licenseNumber": licenseNumber,
          "name": nameDriver,
          "phone": phoneNumberDriver
        })
      });

      // Xử lý kết quả trả về
      if (response.ok) {
        const data = await response.json();
        customDialog.showAlert("Thành công!","Thêm tài xế  ${data.data.name || 'Không rõ'} thành công!");
        document.querySelector('form').reset();  // Reset form
      } else {
        const error = await response.json();
        customDialog.showAlert("Lỗi!","Thêm tài xế thất bại: ${error.message || 'Có lỗi xảy ra'}");
      }
    } catch (error) {
      // Xử lý lỗi kết nối
      console.error('Error:', error);
      customDialog.showAlert("Lỗi!","Không thể kết nối đến server! Vui lòng kiểm tra lại kết nối.");
    }
  });