document.querySelector('form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Ngăn chặn việc reload trang

    // Lấy giá trị từ form
    const busNumber = document.getElementById('busNumber').value.trim();
    const licensePlate = document.getElementById('licensePlate').value.trim();
    const driverName = document.getElementById('driverName').value.trim();
    const driverPhone = document.getElementById('driverPhone').value.trim();
    const seatCapacity = document.getElementById('seatCapacity').value.trim();
    const busType = document.getElementById('busType').value;
    const status = document.getElementById('status').value;

    // Kiểm tra tính hợp lệ của dữ liệu đầu vào
    if (!busNumber || !licensePlate || !driverName || !driverPhone || !seatCapacity) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      // Gửi request đến API thêm xe
      const response = await fetch('http://192.168.1.175:4500/api/bus', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          busNumber,
          licensePlate,
          driverName,
          driverPhone,
          seatCapacity,
          busType,
          status
        })
      });

      // Xử lý kết quả trả về
      if (response.ok) {
        const data = await response.json();
        alert(`Thêm xe thành công! Số hiệu xe: ${data.busNumber || 'Không rõ'}`);
        // Thực hiện hành động sau khi thêm xe thành công (ví dụ, xóa form hoặc chuyển hướng)
        document.querySelector('form').reset();  // Reset form
      } else {
        const error = await response.json();
        alert(`Thêm xe thất bại: ${error.message || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      // Xử lý lỗi kết nối
      console.error('Error:', error);
      alert('Không thể kết nối đến server! Vui lòng kiểm tra lại kết nối.');
    }
  });